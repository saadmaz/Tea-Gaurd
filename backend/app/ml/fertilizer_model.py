import logging

logger = logging.getLogger(__name__)


def predict_fertilizer_type(model, features, encoders=None) -> str:
    if model is None:
        logger.warning("WARNING: fertilizer_type_model not loaded. Returning stub response.")
        return "balanced_npk"
    label = model.predict(features)[0]
    return str(label)


def predict_fertilizer_amount(models: dict | None, fertilizer_type: str, features) -> float:
    if not models or fertilizer_type not in models:
        logger.warning("WARNING: fertilizer_amount_models not loaded. Returning stub response.")
        return 120.0
    return float(models[fertilizer_type].predict(features)[0])
