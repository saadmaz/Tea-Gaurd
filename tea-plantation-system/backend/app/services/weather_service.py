from app.ml.weather_model import predict_weather
from app.preprocessing.tabular_pipeline import preprocess_weather
from app.services.google_weather import fetch_weather


def get_weather_prediction(app_state, latitude: float, longitude: float, date_str: str):
    raw = fetch_weather(latitude, longitude, date_str)
    features = preprocess_weather(raw, getattr(app_state, "weather_scaler", None), getattr(app_state, "weather_label_encoder", None))
    pred = predict_weather(getattr(app_state, "weather_model", None), features, getattr(app_state, "weather_label_encoder", None))
    rain_warning = raw["precipitation"] >= 15
    return {
        "weather_category": pred["category"],
        "rain_warning": rain_warning,
        "raw_params": raw,
        "fertilizer_safe": not rain_warning,
    }
