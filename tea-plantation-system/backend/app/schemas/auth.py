from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    estate_name: str
    district: str
    latitude: float
    longitude: float
    cultivar_type: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
