from pydantic import BaseModel


class WeatherPredictRequest(BaseModel):
    latitude: float
    longitude: float
    date: str
