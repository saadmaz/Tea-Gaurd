import os
from collections import defaultdict
from datetime import datetime, timezone
from hmac import compare_digest

import requests
from flask import Flask, flash, redirect, render_template, request, session, url_for
from sqlalchemy import create_engine, text

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dashboard-dev-secret")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/teaplantation")

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    return _engine


def db_fetchall(query: str, params: dict = None):
    try:
        with get_engine().connect() as conn:
            result = conn.execute(text(query), params or {})
            cols = result.keys()
            return [dict(zip(cols, row)) for row in result]
    except Exception as exc:
        app.logger.error("DB error: %s", exc)
        return []


def db_execute(query: str, params: dict = None) -> bool:
    try:
        with get_engine().begin() as conn:
            conn.execute(text(query), params or {})
        return True
    except Exception as exc:
        app.logger.error("DB error: %s", exc)
        return False


def require_admin():
    if not session.get("admin_logged_in"):
        return redirect(url_for("login"))
    return None


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        email = request.form.get("email", "")
        password = request.form.get("password", "")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@tea.lk")
        admin_password = os.getenv("ADMIN_PASSWORD", "")
        if compare_digest(email, admin_email) and compare_digest(password, admin_password):
            session["admin_logged_in"] = True
            return redirect(url_for("users"))
        error = "Invalid credentials."
    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ── Root ──────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return redirect(url_for("users"))


# ── Users ─────────────────────────────────────────────────────────────────────

@app.route("/users")
def users():
    guard = require_admin()
    if guard:
        return guard

    rows = db_fetchall("""
        SELECT u.id, u.email, u.full_name, u.role, u.is_active,
               u.created_at, e.name AS estate_name, e.district
        FROM users u
        LEFT JOIN estates e ON e.id = u.estate_id
        ORDER BY u.created_at DESC
    """)
    return render_template("users.html", users=rows)


@app.post("/users/<uid>/deactivate")
def deactivate_user(uid):
    guard = require_admin()
    if guard:
        return guard
    db_execute(
        "UPDATE users SET is_active = NOT is_active WHERE id = :uid",
        {"uid": uid},
    )
    flash("User status updated.", "success")
    return redirect(url_for("users"))


# ── Devices ───────────────────────────────────────────────────────────────────

@app.route("/devices")
def devices():
    guard = require_admin()
    if guard:
        return guard

    rows = db_fetchall("""
        SELECT sr.device_id,
               COUNT(*) AS reading_count,
               MAX(sr.created_at) AS last_seen,
               AVG(sr.nitrogen) AS avg_n,
               AVG(sr.phosphorus) AS avg_p,
               AVG(sr.potassium) AS avg_k,
               AVG(sr.ph_level) AS avg_ph,
               e.name AS estate_name
        FROM sensor_readings sr
        LEFT JOIN estates e ON e.id = sr.estate_id
        GROUP BY sr.device_id, e.name
        ORDER BY last_seen DESC
    """)
    return render_template("devices.html", devices=rows)


# ── Audit Log ─────────────────────────────────────────────────────────────────

@app.route("/audit")
def audit():
    guard = require_admin()
    if guard:
        return guard

    page = max(1, int(request.args.get("page", 1)))
    page_size = 50
    offset = (page - 1) * page_size

    logs = db_fetchall("""
        SELECT al.id, al.action, al.endpoint, al.ip_address, al.created_at,
               u.email AS user_email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT :limit OFFSET :offset
    """, {"limit": page_size, "offset": offset})

    total_rows = db_fetchall("SELECT COUNT(*) AS cnt FROM audit_logs")
    total = total_rows[0]["cnt"] if total_rows else 0
    total_pages = max(1, (total + page_size - 1) // page_size)

    return render_template("audit_log.html", logs=logs, page=page, total_pages=total_pages)


# ── Model Stats ───────────────────────────────────────────────────────────────

MODEL_FILES = [
    "weather_gbc.pkl",
    "weather_scaler.pkl",
    "fertilizer_type_gbc.pkl",
    "fertilizer_amount_models.pkl",
    "disease_resnet50.keras",
    "pest_cnn.keras",
]

MODEL_ARTIFACTS_PATH = os.getenv("MODEL_ARTIFACTS_PATH", "/app/ml/model_artifacts")


def _model_info(filename: str) -> dict:
    path = os.path.join(MODEL_ARTIFACTS_PATH, filename)
    if os.path.exists(path):
        size_bytes = os.path.getsize(path)
        mtime = datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc)
        return {
            "name": filename,
            "file_size": f"{size_bytes / 1024 / 1024:.2f} MB",
            "load_status": "present",
            "last_modified": mtime.strftime("%Y-%m-%d %H:%M UTC"),
        }
    return {
        "name": filename,
        "file_size": "—",
        "load_status": "missing",
        "last_modified": "—",
    }


@app.route("/models")
def models():
    guard = require_admin()
    if guard:
        return guard

    model_rows = [_model_info(f) for f in MODEL_FILES]

    # Also hit the backend health endpoint if available
    backend_health = None
    try:
        resp = requests.get(f"{BACKEND_URL}/api/v1/health", timeout=2)
        if resp.ok:
            backend_health = resp.json()
    except Exception:
        pass

    return render_template("model_stats.html", models=model_rows, backend_health=backend_health)


# ── Map Overview ──────────────────────────────────────────────────────────────

@app.route("/map")
def map_view():
    guard = require_admin()
    if guard:
        return guard

    rows = db_fetchall("""
        SELECT d.id, d.detection_type, d.result_label, d.confidence,
               d.damage_pct, d.latitude, d.longitude, d.created_at,
               e.name AS estate_name
        FROM detections d
        LEFT JOIN estates e ON e.id = d.estate_id
        WHERE d.latitude IS NOT NULL
        ORDER BY d.created_at DESC
        LIMIT 500
    """)

    estates = db_fetchall("""
        SELECT id, name, district, latitude, longitude FROM estates
    """)

    return render_template("map_overview.html", markers=rows, estates=estates)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=os.getenv("ENV") == "development")
