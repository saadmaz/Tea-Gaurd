import logging
import numpy as np

logger = logging.getLogger(__name__)

CLASSES = ["infested", "not_infested"]


def predict_pest(model, audio_array):
    if model is None:
        logger.warning("WARNING: pest_model not loaded. Returning stub response.")
        return {"label": "not_infested", "confidence": 0.91}
    probs = model.predict(audio_array, verbose=0)[0]
    idx = int(np.argmax(probs))
    return {"label": CLASSES[idx], "confidence": float(probs[idx])}
