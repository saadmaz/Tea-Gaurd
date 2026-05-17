import numpy as np

CLASSES = ["infested", "not_infested"]


def predict_pest(model, audio_array):
    if model is None:
        return {"label": "not_infested", "confidence": 0.0}
    probs = model.predict(audio_array, verbose=0)[0]
    idx = int(np.argmax(probs))
    return {"label": CLASSES[idx], "confidence": float(probs[idx])}
