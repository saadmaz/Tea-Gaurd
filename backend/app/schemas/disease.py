from pydantic import BaseModel


class DiseaseResult(BaseModel):
    label: str
    confidence: float
