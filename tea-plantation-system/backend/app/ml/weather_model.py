def predict_weather(model, features, label_encoder=None) -> dict:
    if model is None:
        return {"category": "unknown", "confidence": 0.0}
    pred_idx = model.predict(features)[0]
    category = label_encoder.inverse_transform([pred_idx])[0] if label_encoder else str(pred_idx)
    return {"category": category, "confidence": 1.0}
