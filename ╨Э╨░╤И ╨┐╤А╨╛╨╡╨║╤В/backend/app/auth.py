"""
Аутентификация и авторизация
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.hash import bcrypt
import aiosqlite

from .database import get_db
from .models import UserRole, TokenData

# Конфигурация JWT
SECRET_KEY = "your-secret-key-change-in-production-библиотека-абис-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 часа

security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return bcrypt.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return bcrypt.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Декодирование JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            return None
        return TokenData(username=username, role=UserRole(role))
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        raise credentials_exception
    
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (token_data.username,)
        )
        user = await cursor.fetchone()
        
        if user is None:
            raise credentials_exception
        
        return dict(user)
    finally:
        await db.close()


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Получение активного пользователя"""
    if not current_user.get("is_active"):
        raise HTTPException(status_code=400, detail="Неактивный пользователь")
    return current_user


def require_roles(*roles: UserRole):
    """Декоратор для проверки ролей"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = UserRole(current_user["role"])
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав доступа"
            )
        return current_user
    return role_checker


# Зависимости для разных ролей
require_admin = require_roles(UserRole.ADMIN)
require_librarian = require_roles(UserRole.ADMIN, UserRole.LIBRARIAN)
require_any_role = require_roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.READER)
