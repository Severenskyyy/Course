"""
Роутер для работы с бронированиями
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from datetime import datetime, timedelta

from ..models import Reservation, ReservationCreate, ReservationWithDetails
from ..database import get_db, generate_id
from ..auth import get_current_user, require_librarian

router = APIRouter(prefix="/reservations", tags=["Бронирования"])


# Константы бронирования
RESERVATION_DURATION_HOURS = 24  # Бронь на 24 часа
RESERVATION_COOLDOWN_DAYS = 3    # Повторное бронирование через 3 дня


@router.get("/", response_model=List[ReservationWithDetails])
async def get_all_reservations(
    active_only: bool = Query(True, description="Только активные"),
    current_user: dict = Depends(require_librarian)
):
    """Получить все бронирования (для библиотекарей)"""
    db = await get_db()
    try:
        query = """
            SELECT 
                res.*,
                b.title as book_title,
                b.author as book_author,
                r.fio as reader_fio
            FROM reservations res
            JOIN books b ON res.book_code = b.book_code
            JOIN readers r ON res.reader_id = r.reader_id
        """
        
        if active_only:
            now = datetime.now().isoformat()
            query += f" WHERE res.is_active = 1 AND res.expires_at > '{now}'"
        
        query += " ORDER BY res.reserved_at DESC"
        
        cursor = await db.execute(query)
        rows = await cursor.fetchall()
        
        return [ReservationWithDetails(
            reservation_id=row["reservation_id"],
            reader_id=row["reader_id"],
            book_code=row["book_code"],
            reserved_at=datetime.fromisoformat(row["reserved_at"]),
            expires_at=datetime.fromisoformat(row["expires_at"]),
            is_active=bool(row["is_active"]),
            book_title=row["book_title"],
            book_author=row["book_author"]
        ) for row in rows]
    finally:
        await db.close()


@router.get("/my", response_model=List[ReservationWithDetails])
async def get_my_reservations(current_user: dict = Depends(get_current_user)):
    """Получить мои бронирования (для читателей)"""
    reader_id = current_user.get("reader_id")
    if not reader_id:
        return []
    
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        
        cursor = await db.execute("""
            SELECT 
                res.*,
                b.title as book_title,
                b.author as book_author
            FROM reservations res
            JOIN books b ON res.book_code = b.book_code
            WHERE res.reader_id = ? AND res.is_active = 1 AND res.expires_at > ?
            ORDER BY res.reserved_at DESC
        """, (reader_id, now))
        
        rows = await cursor.fetchall()
        
        return [ReservationWithDetails(
            reservation_id=row["reservation_id"],
            reader_id=row["reader_id"],
            book_code=row["book_code"],
            reserved_at=datetime.fromisoformat(row["reserved_at"]),
            expires_at=datetime.fromisoformat(row["expires_at"]),
            is_active=bool(row["is_active"]),
            book_title=row["book_title"],
            book_author=row["book_author"]
        ) for row in rows]
    finally:
        await db.close()


@router.get("/can-reserve/{book_code}")
async def can_reserve_book(book_code: str, current_user: dict = Depends(get_current_user)):
    """Проверить, может ли пользователь забронировать книгу"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        return {"can_reserve": False, "reason": "Бронирование доступно только для читателей"}
    
    db = await get_db()
    try:
        # Проверяем существование книги
        cursor = await db.execute("SELECT is_available FROM books WHERE book_code = ?", (book_code,))
        book = await cursor.fetchone()
        
        if not book:
            return {"can_reserve": False, "reason": "Книга не найдена"}
        
        if book["is_available"]:
            return {"can_reserve": False, "reason": "Книга доступна, можно взять без бронирования"}
        
        now = datetime.now()
        
        # Проверяем активную бронь на эту книгу
        cursor = await db.execute("""
            SELECT reservation_id FROM reservations 
            WHERE book_code = ? AND is_active = 1 AND expires_at > ?
        """, (book_code, now.isoformat()))
        
        if await cursor.fetchone():
            return {"can_reserve": False, "reason": "Книга уже забронирована другим читателем"}
        
        # Проверяем cooldown (3 дня после последнего бронирования этой книги)
        cooldown_date = (now - timedelta(days=RESERVATION_COOLDOWN_DAYS)).isoformat()
        
        cursor = await db.execute("""
            SELECT reserved_at FROM reservations 
            WHERE book_code = ? AND reader_id = ? AND reserved_at > ?
            ORDER BY reserved_at DESC
            LIMIT 1
        """, (book_code, reader_id, cooldown_date))
        
        last_reservation = await cursor.fetchone()
        if last_reservation:
            last_date = datetime.fromisoformat(last_reservation["reserved_at"])
            days_left = RESERVATION_COOLDOWN_DAYS - (now - last_date).days
            return {
                "can_reserve": False, 
                "reason": f"Повторное бронирование возможно через {days_left} дн."
            }
        
        return {"can_reserve": True}
    finally:
        await db.close()


@router.post("/", response_model=Reservation)
async def create_reservation(
    reservation: ReservationCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Забронировать книгу"""
    reader_id = current_user.get("reader_id")
    
    if not reader_id:
        raise HTTPException(status_code=403, detail="Бронирование доступно только для читателей")
    
    # Проверяем возможность бронирования
    can_reserve = await can_reserve_book(reservation.book_code, current_user)
    if not can_reserve["can_reserve"]:
        raise HTTPException(status_code=400, detail=can_reserve["reason"])
    
    db = await get_db()
    try:
        now = datetime.now()
        expires_at = now + timedelta(hours=RESERVATION_DURATION_HOURS)
        reservation_id = generate_id("RES")
        
        await db.execute("""
            INSERT INTO reservations (reservation_id, reader_id, book_code, reserved_at, expires_at, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (reservation_id, reader_id, reservation.book_code, now.isoformat(), expires_at.isoformat()))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'reservation', ?, 'create', ?, ?, ?, ?)
        """, (generate_id("LOG"), reservation_id, f"Книга: {reservation.book_code}",
              current_user["user_id"], current_user["username"], now.isoformat()))
        
        await db.commit()
        
        return Reservation(
            reservation_id=reservation_id,
            reader_id=reader_id,
            book_code=reservation.book_code,
            reserved_at=now,
            expires_at=expires_at,
            is_active=True
        )
    finally:
        await db.close()


@router.delete("/{reservation_id}")
async def cancel_reservation(reservation_id: str, current_user: dict = Depends(get_current_user)):
    """Отменить бронирование"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM reservations WHERE reservation_id = ?",
            (reservation_id,)
        )
        reservation = await cursor.fetchone()
        
        if not reservation:
            raise HTTPException(status_code=404, detail="Бронирование не найдено")
        
        res_dict = dict(reservation)
        
        # Проверяем права (владелец или библиотекарь)
        reader_id = current_user.get("reader_id")
        role = current_user["role"]
        
        if reader_id != res_dict["reader_id"] and role not in ["admin", "librarian"]:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        now = datetime.now().isoformat()
        
        await db.execute(
            "UPDATE reservations SET is_active = 0 WHERE reservation_id = ?",
            (reservation_id,)
        )
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, user_id, username, created_at)
            VALUES (?, 'reservation', ?, 'cancel', ?, ?, ?, ?)
        """, (generate_id("LOG"), reservation_id, f"Книга: {res_dict['book_code']}",
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return {"message": "Бронирование отменено"}
    finally:
        await db.close()


@router.post("/cleanup")
async def cleanup_expired_reservations(current_user: dict = Depends(require_librarian)):
    """Очистка истёкших бронирований"""
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        
        cursor = await db.execute(
            "SELECT COUNT(*) FROM reservations WHERE is_active = 1 AND expires_at < ?",
            (now,)
        )
        count = (await cursor.fetchone())[0]
        
        await db.execute(
            "UPDATE reservations SET is_active = 0 WHERE is_active = 1 AND expires_at < ?",
            (now,)
        )
        
        await db.commit()
        
        return {"message": f"Очищено {count} истёкших бронирований"}
    finally:
        await db.close()
