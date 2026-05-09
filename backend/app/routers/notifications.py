"""
Роутер для работы с уведомлениями
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, date, timedelta

from ..models import Notification, NotificationType
from ..database import get_db, generate_id
from ..auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Уведомления"])


async def generate_notifications_for_reader(reader_id: str, db) -> List[dict]:
    """Генерация уведомлений для читателя на основе его выдач"""
    today = date.today()
    notifications = []
    
    # Получаем активные выдачи читателя
    cursor = await db.execute("""
        SELECT 
            l.loan_id,
            l.due_date,
            b.title as book_title
        FROM loans l
        JOIN books b ON l.book_code = b.book_code
        WHERE l.reader_id = ? AND l.return_date IS NULL
    """, (reader_id,))
    
    rows = await cursor.fetchall()
    
    for row in rows:
        due_date = date.fromisoformat(row["due_date"])
        days_until_due = (due_date - today).days
        book_title = row["book_title"]
        loan_id = row["loan_id"]
        
        notification = None
        
        if days_until_due < 0:
            # Просрочка
            notification = {
                "type": NotificationType.OVERDUE,
                "title": "⚠️ Просрочка возврата",
                "message": f"Книга «{book_title}» просрочена на {abs(days_until_due)} дней!",
                "priority": "high"
            }
        elif days_until_due == 0:
            # Сегодня последний день
            notification = {
                "type": NotificationType.ONE_DAY,
                "title": "🔔 Сегодня срок возврата",
                "message": f"Сегодня последний день сдачи книги «{book_title}»",
                "priority": "high"
            }
        elif days_until_due == 1:
            # Завтра
            notification = {
                "type": NotificationType.ONE_DAY,
                "title": "📅 Завтра срок возврата",
                "message": f"Завтра нужно вернуть книгу «{book_title}»",
                "priority": "medium"
            }
        elif days_until_due <= 3:
            # 2-3 дня
            notification = {
                "type": NotificationType.THREE_DAYS,
                "title": "📆 Скоро срок возврата",
                "message": f"Через {days_until_due} дня нужно вернуть книгу «{book_title}»",
                "priority": "medium"
            }
        elif days_until_due <= 7:
            # Неделя
            notification = {
                "type": NotificationType.WEEK_BEFORE,
                "title": "📚 Напоминание о возврате",
                "message": f"Через {days_until_due} дней нужно вернуть книгу «{book_title}»",
                "priority": "low"
            }
        
        if notification:
            notifications.append({
                "loan_id": loan_id,
                "book_title": book_title,
                "due_date": due_date.isoformat(),
                "days_until_due": days_until_due,
                **notification
            })
    
    # Сортируем по приоритету
    priority_order = {"high": 0, "medium": 1, "low": 2}
    notifications.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 3))
    
    return notifications


@router.get("/my", response_model=List[Notification])
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    """Получить мои уведомления"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        # Для библиотекарей и админов показываем системные уведомления
        if current_user["role"] in ["admin", "librarian"]:
            db = await get_db()
            try:
                # Получаем уведомления из журнала
                cursor = await db.execute("""
                    SELECT * FROM notifications 
                    WHERE reader_id = 'SYSTEM' 
                    ORDER BY created_at DESC 
                    LIMIT 50
                """)
                rows = await cursor.fetchall()
                
                return [Notification(
                    notification_id=row["notification_id"],
                    reader_id=row["reader_id"],
                    loan_id=row["loan_id"],
                    type=row["type"],
                    title=row["title"],
                    message=row["message"],
                    book_title=row["book_title"],
                    due_date=date.fromisoformat(row["due_date"]),
                    days_until_due=row["days_until_due"],
                    is_read=bool(row["is_read"]),
                    created_at=datetime.fromisoformat(row["created_at"])
                ) for row in rows]
            finally:
                await db.close()
        return []
    
    db = await get_db()
    try:
        # Генерируем уведомления динамически
        notifications_data = await generate_notifications_for_reader(reader_id, db)
        
        # Получаем сохранённые уведомления для определения статуса is_read
        cursor = await db.execute(
            "SELECT loan_id, is_read FROM notifications WHERE reader_id = ?",
            (reader_id,)
        )
        read_status = {row["loan_id"]: bool(row["is_read"]) for row in await cursor.fetchall()}
        
        now = datetime.now()
        notifications = []
        
        for data in notifications_data:
            notification_id = f"NTF_{reader_id}_{data['loan_id']}"
            
            notifications.append(Notification(
                notification_id=notification_id,
                reader_id=reader_id,
                loan_id=data["loan_id"],
                type=data["type"],
                title=data["title"],
                message=data["message"],
                book_title=data["book_title"],
                due_date=date.fromisoformat(data["due_date"]),
                days_until_due=data["days_until_due"],
                is_read=read_status.get(data["loan_id"], False),
                created_at=now
            ))
        
        return notifications
    finally:
        await db.close()


@router.post("/{notification_id}/read")
async def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Пометить уведомление как прочитанное"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        raise HTTPException(status_code=403, detail="Доступно только для читателей")
    
    # Извлекаем loan_id из notification_id
    parts = notification_id.split("_")
    if len(parts) >= 3:
        loan_id = parts[2]
    else:
        raise HTTPException(status_code=400, detail="Неверный формат ID уведомления")
    
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        
        # Проверяем, есть ли запись
        cursor = await db.execute(
            "SELECT notification_id FROM notifications WHERE reader_id = ? AND loan_id = ?",
            (reader_id, loan_id)
        )
        existing = await cursor.fetchone()
        
        if existing:
            await db.execute(
                "UPDATE notifications SET is_read = 1 WHERE reader_id = ? AND loan_id = ?",
                (reader_id, loan_id)
            )
        else:
            # Создаём запись
            await db.execute("""
                INSERT INTO notifications (notification_id, reader_id, loan_id, type, title, message, book_title, due_date, days_until_due, is_read, created_at)
                VALUES (?, ?, ?, 'read_marker', '', '', '', ?, 0, 1, ?)
            """, (notification_id, reader_id, loan_id, date.today().isoformat(), now))
        
        await db.commit()
        
        return {"message": "Уведомление помечено как прочитанное"}
    finally:
        await db.close()


@router.post("/read-all")
async def mark_all_notifications_as_read(current_user: dict = Depends(get_current_user)):
    """Пометить все уведомления как прочитанные"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        raise HTTPException(status_code=403, detail="Доступно только для читателей")
    
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        today = date.today().isoformat()
        
        # Получаем все активные выдачи
        cursor = await db.execute(
            "SELECT loan_id FROM loans WHERE reader_id = ? AND return_date IS NULL",
            (reader_id,)
        )
        loans = await cursor.fetchall()
        
        for loan in loans:
            loan_id = loan["loan_id"]
            notification_id = f"NTF_{reader_id}_{loan_id}"
            
            cursor = await db.execute(
                "SELECT notification_id FROM notifications WHERE reader_id = ? AND loan_id = ?",
                (reader_id, loan_id)
            )
            existing = await cursor.fetchone()
            
            if existing:
                await db.execute(
                    "UPDATE notifications SET is_read = 1 WHERE reader_id = ? AND loan_id = ?",
                    (reader_id, loan_id)
                )
            else:
                await db.execute("""
                    INSERT INTO notifications (notification_id, reader_id, loan_id, type, title, message, book_title, due_date, days_until_due, is_read, created_at)
                    VALUES (?, ?, ?, 'read_marker', '', '', '', ?, 0, 1, ?)
                """, (notification_id, reader_id, loan_id, today, now))
        
        await db.commit()
        
        return {"message": "Все уведомления помечены как прочитанные"}
    finally:
        await db.close()


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Получить количество непрочитанных уведомлений"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        return {"count": 0}
    
    db = await get_db()
    try:
        notifications = await generate_notifications_for_reader(reader_id, db)
        
        cursor = await db.execute(
            "SELECT loan_id FROM notifications WHERE reader_id = ? AND is_read = 1",
            (reader_id,)
        )
        read_loans = {row["loan_id"] for row in await cursor.fetchall()}
        
        unread_count = sum(1 for n in notifications if n["loan_id"] not in read_loans)
        
        return {"count": unread_count}
    finally:
        await db.close()
