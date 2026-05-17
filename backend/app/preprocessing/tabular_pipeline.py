import numpy as np


def preprocess_weather(raw_params: dict, scaler, encoder=None) -> np.ndarray:
    features = np.array([
        raw_params["precipitation"],
        raw_params["temp_max"],
        raw_params["temp_min"],
        raw_params["humidity_day"],
        raw_params["humidity_night"],
        raw_params["wind_speed"],
    ]).reshape(1, -1)
    return scaler.transform(features) if scaler else features


def preprocess_fertilizer(inputs: dict, encoders: dict | None) -> np.ndarray:
    plant_type = inputs["plant_type"]
    weather_condition = inputs["weather_condition"]
    if encoders:
        plant_type = encoders["plant_type"].transform([plant_type])[0]
        weather_condition = encoders["weather_condition"].transform([weather_condition])[0]
    return np.array([
        inputs["nitrogen"],
        inputs["phosphorus"],
        inputs["potassium"],
        inputs["ph_level"],
        plant_type,
        weather_condition,
    ]).reshape(1, -1)
