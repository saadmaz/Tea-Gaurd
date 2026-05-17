def predict_fertilizer_type(model, features, encoders=None):
    if model is None:
        return "balanced_npk"
    label = model.predict(features)[0]
    return str(label)


def predict_fertilizer_amount(models: dict | None, fertilizer_type: str, features):
    if not models or fertilizer_type not in models:
        return 100.0
    return float(models[fertilizer_type].predict(features)[0])
