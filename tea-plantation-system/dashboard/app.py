import os
from hmac import compare_digest
from collections import defaultdict

import requests
from flask import Flask, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dashboard-secret')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')


def require_admin():
    return session.get('admin_logged_in') is True


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if compare_digest(request.form.get('email', ''), os.getenv('ADMIN_EMAIL', '')) and compare_digest(request.form.get('password', ''), os.getenv('ADMIN_PASSWORD', '')):
            session['admin_logged_in'] = True
            return redirect(url_for('users'))
    return '''<html><body><h3>Admin Login</h3><form method="post"><input name="email" placeholder="Email"/><input type="password" name="password" placeholder="Password"/><button>Login</button></form></body></html>'''


@app.route('/')
def home():
    return redirect(url_for('users'))


@app.route('/users')
def users():
    if not require_admin():
        return redirect(url_for('login'))
    return render_template('users.html', users=[])


@app.post('/users/<id>/deactivate')
def deactivate_user(id):
    if not require_admin():
        return redirect(url_for('login'))
    return redirect(url_for('users'))


@app.route('/devices')
def devices():
    if not require_admin():
        return redirect(url_for('login'))
    grouped = defaultdict(list)
    return render_template('devices.html', grouped=grouped)


@app.route('/audit')
def audit():
    if not require_admin():
        return redirect(url_for('login'))
    return render_template('audit_log.html', logs=[])


@app.route('/models')
def models():
    if not require_admin():
        return redirect(url_for('login'))
    model_rows = [
        {'name': 'weather_gbc.pkl', 'file_size': 'unknown', 'load_status': 'pending', 'last_used': '-'},
        {'name': 'fertilizer_type_gbc.pkl', 'file_size': 'unknown', 'load_status': 'pending', 'last_used': '-'},
        {'name': 'disease_resnet50.keras', 'file_size': 'unknown', 'load_status': 'pending', 'last_used': '-'},
        {'name': 'pest_cnn.keras', 'file_size': 'unknown', 'load_status': 'pending', 'last_used': '-'},
    ]
    return render_template('model_stats.html', models=model_rows)


@app.route('/map')
def map_view():
    if not require_admin():
        return redirect(url_for('login'))
    markers = []
    try:
        resp = requests.get(f'{BACKEND_URL}/api/v1/map/markers', timeout=3)
        if resp.ok:
            markers = resp.json().get('data', [])
    except Exception:
        markers = []
    return render_template('map_overview.html', markers=markers)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
