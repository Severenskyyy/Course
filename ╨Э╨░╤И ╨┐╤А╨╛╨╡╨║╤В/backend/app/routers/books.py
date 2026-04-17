"""
Роутер для работы с книгами
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime

from ..models import Book, BookCreate, BookUpdate
from ..database import get_db, generate_id
from ..auth import get_current_user, require_librarian

router = APIRouter(prefix="/books", tags=["Книги"])


@router.get("/", response_model=List[Book])
async def get_books(
    search: Optional[str] = Query(None, description="Поиск по названию или автору"),
    author: Optional[str] = Query(None, description="Фильтр по автору"),
    udk: Optional[str] = Query(None, description="Фильтр по УДК"),
    available_only: bool = Query(False, description="Только доступные"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Получить список книг с фильтрацией"""
    db = await get_db()
    try:
        query = "SELECT * FROM books WHERE 1=1"
        params = []
        
        if search:
            query += " AND (title LIKE ? OR author LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
        
        if author:
            query += " AND author = ?"
            params.append(author)
        
        if udk:
            query += " AND udk LIKE ?"
            params.append(f"{udk}%")
        
        if available_only:
            query += " AND is_available = 1"
        
        query += " ORDER BY title LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        books = []
        for row in rows:
            book_dict = dict(row)
            book_dict["is_available"] = bool(book_dict["is_available"])
            book_dict["created_at"] = datetime.fromisoformat(book_dict["created_at"])
            if book_dict["updated_at"]:
                book_dict["updated_at"] = datetime.fromisoformat(book_dict["updated_at"])
            # Переименовываем group_name обратно в group для модели
            books.append(Book(**book_dict))
        
        return books
    finally:
        await db.close()


@router.get("/authors", response_model=List[str])
async def get_authors():
    """Получить список всех авторов"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT DISTINCT author FROM books ORDER BY author")
        rows = await cursor.fetchall()
        return [row["author"] for row in rows]
    finally:
        await db.close()


@router.get("/udk", response_model=List[str])
async def get_udk_list():
    """Получить список всех УДК"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT DISTINCT udk FROM books ORDER BY udk")
        rows = await cursor.fetchall()
        return [row["udk"] for row in rows]
    finally:
        await db.close()


@router.get("/{book_code}", response_model=Book)
async def get_book(book_code: str):
    """Получить книгу по коду"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM books WHERE book_code = ?", (book_code,))
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Книга не найдена")
        
        book_dict = dict(row)
        book_dict["is_available"] = bool(book_dict["is_available"])
        book_dict["created_at"] = datetime.fromisoformat(book_dict["created_at"])
        if book_dict["updated_at"]:
            book_dict["updated_at"] = datetime.fromisoformat(book_dict["updated_at"])
        
        return Book(**book_dict)
    finally:
        await db.close()


@router.post("/", response_model=Book)
async def create_book(book: BookCreate, current_user: dict = Depends(require_librarian)):
    """Создать новую книгу"""
    db = await get_db()
    try:
        # Проверяем уникальность кода
        cursor = await db.execute("SELECT book_code FROM books WHERE book_code = ?", (book.book_code,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Книга с таким кодом уже существует")
        
        now = datetime.now().isoformat()
        
        await db.execute("""
            INSERT INTO books (book_code, title, author, year, udk, description, publisher, pages, isbn, is_available, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (book.book_code, book.title, book.author, book.year, book.udk, 
              book.description, book.publisher, book.pages, book.isbn, now))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'book', ?, 'create', ?, ?, ?, ?)
        """, (generate_id("LOG"), book.book_code, book.title, current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return Book(
            book_code=book.book_code,
            title=book.title,
            author=book.author,
            year=book.year,
            udk=book.udk,
            description=book.description,
            publisher=book.publisher,
            pages=book.pages,
            isbn=book.isbn,
            is_available=True,
            created_at=datetime.fromisoformat(now)
        )
    finally:
        await db.close()


@router.put("/{book_code}", response_model=Book)
async def update_book(book_code: str, book_update: BookUpdate, current_user: dict = Depends(require_librarian)):
    """Обновить информацию о книге"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM books WHERE book_code = ?", (book_code,))
        existing = await cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Книга не найдена")
        
        existing_dict = dict(existing)
        update_data = book_update.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Нет данных для обновления")
        
        now = datetime.now().isoformat()
        
        # Формируем запрос на обновление
        set_parts = []
        params = []
        for key, value in update_data.items():
            set_parts.append(f"{key} = ?")
            params.append(value)
        
        set_parts.append("updated_at = ?")
        params.append(now)
        params.append(book_code)
        
        await db.execute(f"UPDATE books SET {', '.join(set_parts)} WHERE book_code = ?", params)
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, new_value, user_id, username, created_at)
            VALUES (?, 'book', ?, 'update', ?, ?, ?, ?, ?)
        """, (generate_id("LOG"), book_code, str(existing_dict), str(update_data), 
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        # Получаем обновлённую книгу
        cursor = await db.execute("SELECT * FROM books WHERE book_code = ?", (book_code,))
        row = await cursor.fetchone()
        book_dict = dict(row)
        book_dict["is_available"] = bool(book_dict["is_available"])
        book_dict["created_at"] = datetime.fromisoformat(book_dict["created_at"])
        if book_dict["updated_at"]:
            book_dict["updated_at"] = datetime.fromisoformat(book_dict["updated_at"])
        
        return Book(**book_dict)
    finally:
        await db.close()


@router.delete("/{book_code}")
async def delete_book(book_code: str, current_user: dict = Depends(require_librarian)):
    """Удалить книгу"""
    db = await get_db()
    try:
        # Проверяем, есть ли активные выдачи
        cursor = await db.execute(
            "SELECT COUNT(*) FROM loans WHERE book_code = ? AND return_date IS NULL",
            (book_code,)
        )
        count = (await cursor.fetchone())[0]
        
        if count > 0:
            raise HTTPException(status_code=400, detail="Нельзя удалить книгу с активной выдачей")
        
        cursor = await db.execute("SELECT title FROM books WHERE book_code = ?", (book_code,))
        book = await cursor.fetchone()
        
        if not book:
            raise HTTPException(status_code=404, detail="Книга не найдена")
        
        now = datetime.now().isoformat()
        
        await db.execute("DELETE FROM books WHERE book_code = ?", (book_code,))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, user_id, username, created_at)
            VALUES (?, 'book', ?, 'delete', ?, ?, ?, ?)
        """, (generate_id("LOG"), book_code, book["title"], current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return {"message": "Книга удалена"}
    finally:
        await db.close()
