from fastapi import FastAPI

from app.api.v1 import auth, weather, fertilizer, disease, pest, sensor, detections, map as map_router
from app.core.database import Base, engine
from app.ml.model_loader import load_models

app = FastAPI(title="Tea Plantation Smart Monitoring API")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    load_models(app)


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(fertilizer.router, prefix="/api/v1/fertilizer", tags=["fertilizer"])
app.include_router(disease.router, prefix="/api/v1/disease", tags=["disease"])
app.include_router(pest.router, prefix="/api/v1/pest", tags=["pest"])
app.include_router(sensor.router, prefix="/api/v1/sensor", tags=["sensor"])
app.include_router(detections.router, prefix="/api/v1/detections", tags=["detections"])
app.include_router(map_router.router, prefix="/api/v1/map", tags=["map"])
