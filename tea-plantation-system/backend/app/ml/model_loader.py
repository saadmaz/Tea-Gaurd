import logging
from pathlib import Path

import joblib
import tensorflow as tf

from app.core.config import settings

logger = logging.getLogger(__name__)


MODEL_FILES = {
    "weather_model": "weather_gbc.pkl",
    "weather_scaler": "weather_scaler.pkl",
    "weather_label_encoder": "weather_label_encoder.pkl",
    "fertilizer_type_model": "fertilizer_type_gbc.pkl",
    "fertilizer_amount_models": "fertilizer_amount_models.pkl",
    "fertilizer_encoders": "fertilizer_encoders.pkl",
    "disease_model": "disease_resnet50.keras",
    "pest_model": "pest_cnn.keras",
    "damage_maskrcnn": "damage_maskrcnn.pkl",
}


def _load_local_model(path: Path):
    if not path.exists():
        logger.warning("Missing model artifact: %s", path)
        return None
    if path.suffix == ".keras":
        return tf.keras.models.load_model(path)
    return joblib.load(path)


def load_models(app):
    base = Path("/app/ml/model_artifacts")
    if not base.exists():
        base = Path(__file__).resolve().parent / "model_artifacts"

    for state_key, filename in MODEL_FILES.items():
        setattr(app.state, state_key, _load_local_model(base / filename))
