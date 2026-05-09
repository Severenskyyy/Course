"""
Библиотека АБИС - FastAPI Backend
Система учёта выдач и просрочек

Основные функции:
- Каталог книг, читатели, выдачи/возвраты
- Бронирование книг (на 24 часа, повтор через 3 дня)
- Отчёт "Просрочки" с KPI показателями
- Уведомления для читателей
- Импорт/экспорт CSV (интеграция с 1С)
- Журнал изменений (аудит)

Роли:
- admin: полный доступ
- librarian: операции с книгами/выдачами
- reader: просмотр своих выдач и бронирование
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import init_db, seed_demo_data
from .auth import get_current_user

# Импорт роутеров
from .routers import auth, books, readers, loans, reservations, reports, notifications, import_export


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: инициализация БД при старте"""
    print("🚀 Запуск Библиотеки АБИС...")
    await init_db()
    await seed_demo_data()
    print("✅ База данных инициализирована")
    yield
    print("👋 Остановка сервера...")


app = FastAPI(
    title="Библиотека АБИС",
    description="""
## Автоматизированная библиотечно-информационная система

### Функциональность:
- 📚 **Каталог книг** - управление фондом библиотеки
- 👥 **Читатели** - учёт читателей по группам
- 📖 **Выдачи/Возвраты** - полный цикл работы с книгами
- 🔖 **Бронирование** - резервирование книг на 24 часа
- 📊 **Отчёты** - просрочки, KPI, ТОП читателей/книг
- 🔔 **Уведомления** - напоминания о сроках возврата
- 📤 **Импорт/Экспорт** - интеграция с 1С через CSV

### Роли пользователей:
- **Администратор** - полный доступ, импорт/экспорт
- **Библиотекарь** - операции с книгами и выдачами
- **Читатель** - просмотр своих выдач, бронирование

### KPI:
- Доля просроченных выдач ≤ 15%
- Средняя/медианная просрочка
- Оборачиваемость фонда
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(readers.router, prefix="/api")
app.include_router(loans.router, prefix="/api")
app.include_router(reservations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(import_export.router, prefix="/api")


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "name": "Библиотека АБИС",
        "version": "1.0.0",
        "description": "Автоматизированная библиотечно-информационная система",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/health")
async def health_check():
    """Проверка работоспособности API"""
    from .database import get_db
    try:
        db = await get_db()
        cursor = await db.execute("SELECT COUNT(*) FROM books")
        count = (await cursor.fetchone())[0]
        await db.close()
        return {
            "status": "healthy",
            "database": "connected",
            "books_count": count
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/api/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return {
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "reader_id": current_user.get("reader_id")
    }


# Для запуска: uvicorn backend.app.main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
