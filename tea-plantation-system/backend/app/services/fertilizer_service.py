from datetime import date, timedelta

from app.ml.fertilizer_model import predict_fertilizer_amount, predict_fertilizer_type
from app.preprocessing.tabular_pipeline import preprocess_fertilizer


def recommend_fertilizer(app_state, payload: dict, weather_condition: str, rain_warning: bool):
    if rain_warning:
        return {
            "application_safe": False,
            "fertilizer_type": "defer",
            "quantity_kg_ha": 0.0,
            "weather_condition": weather_condition,
            "recommended_date": str(date.today() + timedelta(days=3)),
            "reasoning": {
                "nitrogen_status": "optimal",
                "phosphorus_status": "optimal",
                "potassium_status": "optimal",
                "ph_status": "check_after_rain",
                "weather_factor": "heavy_rain_predicted",
            },
        }

    encoded = preprocess_fertilizer({**payload, "weather_condition": weather_condition}, getattr(app_state, "fertilizer_encoders", None))
    fertilizer_type = predict_fertilizer_type(getattr(app_state, "fertilizer_type_model", None), encoded)
    quantity = predict_fertilizer_amount(getattr(app_state, "fertilizer_amount_models", None), fertilizer_type, encoded)

    def status(v, lo, hi):
        return "low" if v < lo else ("high" if v > hi else "optimal")

    return {
        "application_safe": True,
        "fertilizer_type": fertilizer_type,
        "quantity_kg_ha": quantity,
        "weather_condition": weather_condition,
        "reasoning": {
            "nitrogen_status": status(payload["nitrogen"], 20, 40),
            "phosphorus_status": status(payload["phosphorus"], 10, 25),
            "potassium_status": status(payload["potassium"], 80, 200),
            "ph_status": status(payload["ph_level"], 4.5, 6.0),
            "weather_factor": weather_condition,
        },
    }
