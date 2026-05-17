import numpy as np

CLASSES = ["healthy", "nutrient_deficiency", "stem_branch_canker", "tea_blister_blight"]


def predict_disease(model, image_array):
    if model is None:
        return {"label": "healthy", "confidence": 0.0, "class_probabilities": {c: 0.0 for c in CLASSES}}
    probs = model.predict(image_array, verbose=0)[0]
    idx = int(np.argmax(probs))
    return {
        "label": CLASSES[idx],
        "confidence": float(probs[idx]),
        "class_probabilities": {c: float(probs[i]) for i, c in enumerate(CLASSES)},
    }
