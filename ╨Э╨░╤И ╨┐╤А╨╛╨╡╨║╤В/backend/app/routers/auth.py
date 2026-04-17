"""
Роутер аутентификации
"""
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from ..models import LoginRequest, Token, User
from ..database import get_db
from ..auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["Аутентификация"])


@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """Авторизация пользователя"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (request.username,)
        )
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )
        
        user_dict = dict(user)
        
        if not verify_password(request.password, user_dict["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )
        
        # Создаём токен
        access_token = create_access_token(
            data={"sub": user_dict["username"], "role": user_dict["role"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return Token(access_token=access_token)
    finally:
        await db.close()


@router.get("/me", response_model=dict)
async def get_me(credentials: str = None):
    """Получить информацию о текущем пользователе"""
    from ..auth import get_current_user, security
    from fastapi import Depends
    
    # Это упрощённая версия, в реальности используется Depends
    pass


@router.post("/logout")
async def logout():
    """Выход из системы (клиент должен удалить токен)"""
    return {"message": "Выход выполнен успешно"}
