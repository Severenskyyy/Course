"""
Роутер для работы с читателями
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime

from ..models import Reader, ReaderCreate, ReaderUpdate
from ..database import get_db, generate_id
from ..auth import get_current_user, require_librarian, get_password_hash

router = APIRouter(prefix="/readers", tags=["Читатели"])


@router.get("/", response_model=List[Reader])
async def get_readers(
    search: Optional[str] = Query(None, description="Поиск по ФИО"),
    group: Optional[str] = Query(None, description="Фильтр по группе"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Получить список читателей с фильтрацией"""
    db = await get_db()
    try:
        query = "SELECT * FROM readers WHERE 1=1"
        params = []
        
        if search:
            query += " AND fio LIKE ?"
            params.append(f"%{search}%")
        
        if group:
            query += " AND group_name = ?"
            params.append(group)
        
        query += " ORDER BY fio LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        readers = []
        for row in rows:
            reader_dict = dict(row)
            reader_dict["group"] = reader_dict.pop("group_name")
            reader_dict["created_at"] = datetime.fromisoformat(reader_dict["created_at"])
            if reader_dict["updated_at"]:
                reader_dict["updated_at"] = datetime.fromisoformat(reader_dict["updated_at"])
            readers.append(Reader(**reader_dict))
        
        return readers
    finally:
        await db.close()


@router.get("/groups", response_model=List[str])
async def get_groups():
    """Получить список всех групп"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT DISTINCT group_name FROM readers ORDER BY group_name")
        rows = await cursor.fetchall()
        return [row["group_name"] for row in rows]
    finally:
        await db.close()


@router.get("/{reader_id}", response_model=Reader)
async def get_reader(reader_id: str):
    """Получить читателя по ID"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM readers WHERE reader_id = ?", (reader_id,))
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Читатель не найден")
        
        reader_dict = dict(row)
        reader_dict["group"] = reader_dict.pop("group_name")
        reader_dict["created_at"] = datetime.fromisoformat(reader_dict["created_at"])
        if reader_dict["updated_at"]:
            reader_dict["updated_at"] = datetime.fromisoformat(reader_dict["updated_at"])
        
        return Reader(**reader_dict)
    finally:
        await db.close()


@router.get("/{reader_id}/loans")
async def get_reader_loans(reader_id: str, status: Optional[str] = Query(None)):
    """Получить выдачи читателя"""
    db = await get_db()
    try:
        # Проверяем существование читателя
        cursor = await db.execute("SELECT reader_id FROM readers WHERE reader_id = ?", (reader_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Читатель не найден")
        
        query = """
            SELECT 
                l.*,
                b.title as book_title,
                b.author as book_author
            FROM loans l
            JOIN books b ON l.book_code = b.book_code
            WHERE l.reader_id = ?
        """
        params = [reader_id]
        
        if status == "active":
            query += " AND l.return_date IS NULL"
        elif status == "returned":
            query += " AND l.return_date IS NOT NULL"
        
        query += " ORDER BY l.issue_date DESC"
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        return [dict(row) for row in rows]
    finally:
        await db.close()


@router.post("/", response_model=Reader)
async def create_reader(reader: ReaderCreate, current_user: dict = Depends(require_librarian)):
    """Создать нового читателя"""
    db = await get_db()
    try:
        # Проверяем уникальность ID
        cursor = await db.execute("SELECT reader_id FROM readers WHERE reader_id = ?", (reader.reader_id,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Читатель с таким ID уже существует")
        
        now = datetime.now().isoformat()
        
        await db.execute("""
            INSERT INTO readers (reader_id, fio, group_name, email, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (reader.reader_id, reader.fio, reader.group, reader.email, reader.phone, now))
        
        # Создаём пользователя для входа
        from ..auth import get_password_hash
        user_id = generate_id("USR")
        password_hash = get_password_hash(reader.password)
        
        await db.execute("""
            INSERT INTO users (user_id, username, password_hash, role, full_name, reader_id, is_active, created_at)
            VALUES (?, ?, ?, 'reader', ?, ?, 1, ?)
        """, (user_id, reader.reader_id, password_hash, reader.fio, reader.reader_id, now))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'reader', ?, 'create', ?, ?, ?, ?)
        """, (generate_id("LOG"), reader.reader_id, reader.fio, current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return Reader(
            reader_id=reader.reader_id,
            fio=reader.fio,
            group=reader.group,
            email=reader.email,
            phone=reader.phone,
            created_at=datetime.fromisoformat(now)
        )
    finally:
        await db.close()


@router.put("/{reader_id}", response_model=Reader)
async def update_reader(reader_id: str, reader_update: ReaderUpdate, current_user: dict = Depends(require_librarian)):
    """Обновить информацию о читателе"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM readers WHERE reader_id = ?", (reader_id,))
        existing = await cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Читатель не найден")
        
        existing_dict = dict(existing)
        update_data = reader_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Нет данных для обновления")
        
        now = datetime.now().isoformat()
        
        # Переименовываем group в group_name для БД
        if "group" in update_data:
            update_data["group_name"] = update_data.pop("group")
        
        set_parts = []
        params = []
        for key, value in update_data.items():
            set_parts.append(f"{key} = ?")
            params.append(value)
        
        set_parts.append("updated_at = ?")
        params.append(now)
        params.append(reader_id)
        
        await db.execute(f"UPDATE readers SET {', '.join(set_parts)} WHERE reader_id = ?", params)
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, new_value, user_id, username, created_at)
            VALUES (?, 'reader', ?, 'update', ?, ?, ?, ?, ?)
        """, (generate_id("LOG"), reader_id, str(existing_dict), str(update_data), 
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        # Получаем обновлённого читателя
        cursor = await db.execute("SELECT * FROM readers WHERE reader_id = ?", (reader_id,))
        row = await cursor.fetchone()
        reader_dict = dict(row)
        reader_dict["group"] = reader_dict.pop("group_name")
        reader_dict["created_at"] = datetime.fromisoformat(reader_dict["created_at"])
        if reader_dict["updated_at"]:
            reader_dict["updated_at"] = datetime.fromisoformat(reader_dict["updated_at"])
        
        return Reader(**reader_dict)
    finally:
        await db.close()


@router.delete("/{reader_id}")
async def delete_reader(reader_id: str, current_user: dict = Depends(require_librarian)):
    """Удалить читателя"""
    db = await get_db()
    try:
        # Проверяем, есть ли активные выдачи
        cursor = await db.execute(
            "SELECT COUNT(*) FROM loans WHERE reader_id = ? AND return_date IS NULL",
            (reader_id,)
        )
        count = (await cursor.fetchone())[0]
        
        if count > 0:
            raise HTTPException(status_code=400, detail="Нельзя удалить читателя с активными выдачами")
        
        cursor = await db.execute("SELECT fio FROM readers WHERE reader_id = ?", (reader_id,))
        reader = await cursor.fetchone()
        
        if not reader:
            raise HTTPException(status_code=404, detail="Читатель не найден")
        
        now = datetime.now().isoformat()
        
        # Удаляем пользователя
        await db.execute("DELETE FROM users WHERE reader_id = ?", (reader_id,))
        
        # Удаляем читателя
        await db.execute("DELETE FROM readers WHERE reader_id = ?", (reader_id,))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, user_id, username, created_at)
            VALUES (?, 'reader', ?, 'delete', ?, ?, ?, ?)
        """, (generate_id("LOG"), reader_id, reader["fio"], current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return {"message": "Читатель удалён"}
    finally:
        await db.close()
