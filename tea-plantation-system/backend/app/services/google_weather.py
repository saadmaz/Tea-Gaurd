from datetime import datetime, timedelta

import requests

_cache: dict = {}


def fetch_weather(latitude, longitude, date_str) -> dict:
    key = (round(latitude, 4), round(longitude, 4), date_str)
    now = datetime.utcnow()
    cached = _cache.get(key)
    if cached and cached["expires"] > now:
        return cached["data"]

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max",
        "hourly": "relativehumidity_2m",
        "timezone": "Asia/Colombo",
        "start_date": date_str,
        "end_date": date_str,
    }
    res = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=20)
    res.raise_for_status()
    payload = res.json()

    hourly_h = payload.get("hourly", {}).get("relativehumidity_2m", [])
    times = payload.get("hourly", {}).get("time", [])
    day_vals, night_vals = [], []
    for t, h in zip(times, hourly_h):
        hour = int(t.split("T")[1].split(":")[0])
        (day_vals if 6 <= hour < 18 else night_vals).append(h)

    data = {
        "precipitation": payload["daily"]["precipitation_sum"][0],
        "temp_max": payload["daily"]["temperature_2m_max"][0],
        "temp_min": payload["daily"]["temperature_2m_min"][0],
        "humidity_day": sum(day_vals) / max(len(day_vals), 1),
        "humidity_night": sum(night_vals) / max(len(night_vals), 1),
        "wind_speed": payload["daily"]["windspeed_10m_max"][0],
    }
    _cache[key] = {"expires": now + timedelta(hours=1), "data": data}
    return data
