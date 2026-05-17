import logging

logger = logging.getLogger(__name__)


def predict_weather(model, features, label_encoder=None) -> dict:
    if model is None:
        logger.warning("WARNING: weather_model not loaded. Returning stub response.")
        return {"category": "partly_cloudy", "confidence": 0.0}
    pred_idx = model.predict(features)[0]
    proba = model.predict_proba(features)[0]
    confidence = float(proba.max())
    category = label_encoder.inverse_transform([pred_idx])[0] if label_encoder else str(pred_idx)
    return {"category": category, "confidence": confidence}
