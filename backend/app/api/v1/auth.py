from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import envelope, get_current_user, get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.estate import Estate
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest

router = APIRouter()


@router.post('/register')
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail='Email already exists')
    estate = Estate(
        name=payload.estate_name,
        district=payload.district,
        latitude=payload.latitude,
        longitude=payload.longitude,
        cultivar_type=payload.cultivar_type,
    )
    db.add(estate)
    db.flush()
    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        estate_id=estate.id,
    )
    db.add(user)
    db.commit()
    token = create_access_token(str(user.id))
    return envelope('success', {'token': token, 'user_id': str(user.id), 'estate_id': str(estate.id)}, None)


@router.post('/login')
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token(str(user.id))
    return envelope('success', {'token': token, 'user': {'id': str(user.id), 'email': user.email, 'role': user.role.value, 'estate_id': str(user.estate_id)}}, None)


@router.post('/refresh')
def refresh(user: User = Depends(get_current_user)):
    return envelope('success', {'token': create_access_token(str(user.id))}, None)
