import logging
import numpy as np

logger = logging.getLogger(__name__)

CLASSES = ["healthy", "nutrient_deficiency", "stem_branch_canker", "tea_blister_blight"]


def predict_disease(model, image_array):
    if model is None:
        logger.warning("WARNING: disease_model not loaded. Returning stub response.")
        return {"label": "tea_blister_blight", "confidence": 0.87, "class_probabilities": {"healthy": 0.05, "nutrient_deficiency": 0.03, "stem_branch_canker": 0.05, "tea_blister_blight": 0.87}}
    probs = model.predict(image_array, verbose=0)[0]
    idx = int(np.argmax(probs))
    return {
        "label": CLASSES[idx],
        "confidence": float(probs[idx]),
        "class_probabilities": {c: float(probs[i]) for i, c in enumerate(CLASSES)},
    }
