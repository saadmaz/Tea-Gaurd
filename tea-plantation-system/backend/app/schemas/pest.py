from pydantic import BaseModel


class PestResult(BaseModel):
    label: str
    confidence: float
