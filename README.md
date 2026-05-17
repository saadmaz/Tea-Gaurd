# Tea Plantation Smart Monitoring System

A precision agriculture platform integrating IoT sensor data, deep learning inference, a REST API backend, an admin dashboard, and a React Native mobile app.

---

## Architecture

```
/tea-plantation-system
├── backend/          ← FastAPI (port 8000)
├── dashboard/        ← Flask admin (port 5001)
├── mobile/           ← React Native (TypeScript)
├── firmware/         ← ESP32 Arduino firmware
└── ml_training/      ← Jupyter notebooks for model training
```

---

## Local Development Setup

### Prerequisites
- Docker Desktop
- Node.js 18+
- React Native dev environment (Android Studio / Xcode)
- Python 3.11 (for running notebooks)

### 1 — Clone and configure environment

```bash
cp .env.example .env
# Edit .env: set SECRET_KEY, ADMIN_PASSWORD
```

Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2 — Start all services

```bash
docker compose up --build
```

Services start in order:
- **PostgreSQL** on port 5432
- **LocalStack** (S3 mock) on port 4566
- **`localstack-init`** creates the 3 S3 buckets automatically
- **FastAPI backend** on http://localhost:8000
- **Flask dashboard** on http://localhost:5001

### 3 — Run database migrations

The backend runs `Base.metadata.create_all()` automatically on startup.

To run Alembic migrations manually:
```bash
cd backend
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/tea_guard \
  alembic upgrade head
```

### 4 — Run the mobile app

```bash
cd mobile
npm install
npx react-native run-android   # or run-ios
```

The app expects the backend at `http://10.0.2.2:8000` (Android emulator localhost).
Change `BACKEND_URL` in `mobile/.env` for a real device.

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

All responses use envelope format:
```json
{ "status": "success", "data": {}, "error": null, "timestamp": "ISO8601" }
```

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account + estate |
| POST | `/auth/login` | — | Get JWT |
| POST | `/auth/refresh` | JWT | Refresh token |
| POST | `/weather/predict` | JWT | Weather forecast + category |
| POST | `/fertilizer/recommend` | JWT | Fertilizer recommendation |
| POST | `/disease/detect` | JWT | Image-based disease detection |
| POST | `/pest/detect` | JWT | Audio-based pest detection |
| POST | `/sensor/upload` | JWT | IoT sensor data ingestion |
| GET  | `/sensor/latest` | JWT | Latest sensor reading |
| GET  | `/detections/history` | JWT | Paginated detection history |
| GET  | `/detections/{id}` | JWT | Single detection detail |
| GET  | `/map/markers` | JWT | GeoJSON markers for map |
| GET  | `/health` | — | Backend health check |

---

## Admin Dashboard

Access: http://localhost:5001  
Login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

Pages:
- `/users` — List all users, toggle active status
- `/devices` — IoT device sensor summary
- `/audit` — Paginated audit log
- `/models` — ML model artifact health
- `/map` — All estate detection markers (Leaflet map)

---

## Adding Real ML Models

After training with the notebooks in `ml_training/`:

1. Copy artifacts to `backend/app/ml/model_artifacts/`:
   ```
   weather_gbc.pkl
   weather_scaler.pkl
   weather_label_encoder.pkl
   fertilizer_type_gbc.pkl
   fertilizer_amount_models.pkl
   fertilizer_encoders.pkl
   disease_resnet50.keras
   pest_cnn.keras
   ```

2. Or upload to S3 `model-artifacts` bucket and set `MODEL_ARTIFACTS_PATH` in env.

3. Restart the backend — models are loaded at startup. Without artifacts, all ML endpoints return stub responses (structurally valid fake data with a warning log).

---

## Training Notebooks

| Notebook | Model | Algorithm | Input |
|----------|-------|-----------|-------|
| `weather_model.ipynb` | Weather classification | GradientBoostingClassifier | precipitation, temp, humidity, wind |
| `fertilizer_model.ipynb` | Fertilizer type + quantity | GBC + LinearRegression | N, P, K, pH, plant type, weather |
| `disease_model.ipynb` | 4-class disease detection | ResNet50 (fine-tuned) | 416×416 leaf images |
| `pest_audio_model.ipynb` | Pest presence detection | CNN | Mel-spectrogram of 3s audio |

Replace synthetic data sections marked `# REPLACE WITH REAL DATA` with your dataset paths.

---

## ESP32 Firmware

Edit `firmware/soil_sensor/config.h` with your Wi-Fi credentials, backend URL, and device JWT.

Sensor reads every 30 minutes → POST to `/api/v1/sensor/upload`.

The `readNitrogen()`, `readPhosphorus()`, `readPotassium()` functions are stubs — replace with calibrated sensor code for your hardware (comments in the file explain the calibration approach).

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | 32-char random string for JWT signing |
| `ALGORITHM` | No | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime (default: 1440 = 24h) |
| `AWS_REGION` | No | AWS region (default: ap-south-1) |
| `AWS_ACCESS_KEY_ID` | Yes | AWS key (use `test` for LocalStack) |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret (use `test` for LocalStack) |
| `S3_ENDPOINT_URL` | Dev only | LocalStack URL (leave blank for real AWS) |
| `S3_RAW_UPLOADS_BUCKET` | No | Raw upload bucket (default: raw-uploads) |
| `S3_PROCESSED_BUCKET` | No | Annotated image bucket (default: processed-outputs) |
| `S3_MODEL_BUCKET` | No | Model artifacts bucket (default: model-artifacts) |
| `ADMIN_EMAIL` | Yes | Admin dashboard login email |
| `ADMIN_PASSWORD` | Yes | Admin dashboard login password |
| `BACKEND_URL` | Dashboard | URL of FastAPI backend |
| `ENV` | No | `development` or `production` |
