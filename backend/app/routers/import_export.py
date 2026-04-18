"""
Роутер для импорта и экспорта данных (интеграция с 1С)
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, date
import csv
import io

from ..models import ImportResult
from ..database import get_db, generate_id
from ..auth import require_admin, get_current_user

router = APIRouter(prefix="/import-export", tags=["Импорт/Экспорт (1С)"])


@router.post("/books/import", response_model=ImportResult)
async def import_books_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """
    Импорт каталога книг из CSV (формат 1С).
    Идемпотентный импорт: повторная загрузка не создаёт дублей.
    
    Формат CSV:
    book_code;title;author;year;udk;description;publisher;pages;isbn
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Файл должен быть в формате CSV")
    
    content = await file.read()
    
    # Пробуем разные кодировки
    for encoding in ['utf-8', 'cp1251', 'windows-1251']:
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="Не удалось определить кодировку файла")
    
    db = await get_db()
    try:
        reader = csv.DictReader(io.StringIO(text), delimiter=';')
        
        imported = 0
        skipped = 0
        errors = []
        total = 0
        now = datetime.now().isoformat()
        
        for row in reader:
            total += 1
            try:
                book_code = row.get('book_code', '').strip()
                if not book_code:
                    errors.append(f"Строка {total}: отсутствует book_code")
                    continue
                
                # Проверяем, существует ли книга (идемпотентность)
                cursor = await db.execute(
                    "SELECT book_code FROM books WHERE book_code = ?",
                    (book_code,)
                )
                existing = await cursor.fetchone()
                
                title = row.get('title', '').strip()
                author = row.get('author', '').strip()
                year = int(row.get('year', 0))
                udk = row.get('udk', '').strip()
                description = row.get('description', '').strip() or None
                publisher = row.get('publisher', '').strip() or None
                pages = int(row.get('pages', 0)) if row.get('pages') else None
                isbn = row.get('isbn', '').strip() or None
                
                if not title or not author:
                    errors.append(f"Строка {total}: отсутствует title или author")
                    continue
                
                if existing:
                    # Обновляем существующую книгу
                    await db.execute("""
                        UPDATE books SET title=?, author=?, year=?, udk=?, description=?, 
                               publisher=?, pages=?, isbn=?, updated_at=?
                        WHERE book_code=?
                    """, (title, author, year, udk, description, publisher, pages, isbn, now, book_code))
                    skipped += 1
                else:
                    # Создаём новую книгу
                    await db.execute("""
                        INSERT INTO books (book_code, title, author, year, udk, description, 
                                          publisher, pages, isbn, is_available, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                    """, (book_code, title, author, year, udk, description, publisher, pages, isbn, now))
                    imported += 1
                
            except Exception as e:
                errors.append(f"Строка {total}: {str(e)}")
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'import', 'books', 'import', ?, ?, ?, ?)
        """, (generate_id("LOG"), f"Импортировано: {imported}, Обновлено: {skipped}, Ошибок: {len(errors)}",
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return ImportResult(
            success=len(errors) == 0,
            total_records=total,
            imported=imported,
            skipped=skipped,
            errors=errors[:10]  # Возвращаем первые 10 ошибок
        )
    finally:
        await db.close()


@router.post("/readers/import", response_model=ImportResult)
async def import_readers_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """
    Импорт читателей из CSV (формат 1С).
    
    Формат CSV:
    reader_id;fio;group;email;phone
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Файл должен быть в формате CSV")
    
    content = await file.read()
    
    for encoding in ['utf-8', 'cp1251', 'windows-1251']:
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="Не удалось определить кодировку файла")
    
    db = await get_db()
    try:
        reader = csv.DictReader(io.StringIO(text), delimiter=';')
        
        imported = 0
        skipped = 0
        errors = []
        total = 0
        now = datetime.now().isoformat()
        
        for row in reader:
            total += 1
            try:
                reader_id = row.get('reader_id', '').strip()
                if not reader_id:
                    errors.append(f"Строка {total}: отсутствует reader_id")
                    continue
                
                cursor = await db.execute(
                    "SELECT reader_id FROM readers WHERE reader_id = ?",
                    (reader_id,)
                )
                existing = await cursor.fetchone()
                
                fio = row.get('fio', '').strip()
                group = row.get('group', '').strip()
                email = row.get('email', '').strip() or None
                phone = row.get('phone', '').strip() or None
                
                if not fio or not group:
                    errors.append(f"Строка {total}: отсутствует fio или group")
                    continue
                
                if existing:
                    await db.execute("""
                        UPDATE readers SET fio=?, group_name=?, email=?, phone=?, updated_at=?
                        WHERE reader_id=?
                    """, (fio, group, email, phone, now, reader_id))
                    skipped += 1
                else:
                    await db.execute("""
                        INSERT INTO readers (reader_id, fio, group_name, email, phone, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (reader_id, fio, group, email, phone, now))
                    imported += 1
                
            except Exception as e:
                errors.append(f"Строка {total}: {str(e)}")
        
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'import', 'readers', 'import', ?, ?, ?, ?)
        """, (generate_id("LOG"), f"Импортировано: {imported}, Обновлено: {skipped}",
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return ImportResult(
            success=len(errors) == 0,
            total_records=total,
            imported=imported,
            skipped=skipped,
            errors=errors[:10]
        )
    finally:
        await db.close()


@router.post("/loans/import", response_model=ImportResult)
async def import_loans_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """
    Импорт выдач из CSV (формат 1С).
    Идемпотентный: проверяет уникальность по reader_id + book_code + issue_date.
    
    Формат CSV:
    loan_id;reader_id;book_code;issue_date;due_date;return_date
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Файл должен быть в формате CSV")
    
    content = await file.read()
    
    for encoding in ['utf-8', 'cp1251', 'windows-1251']:
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="Не удалось определить кодировку файла")
    
    db = await get_db()
    try:
        reader = csv.DictReader(io.StringIO(text), delimiter=';')
        
        imported = 0
        skipped = 0
        errors = []
        total = 0
        now = datetime.now().isoformat()
        
        for row in reader:
            total += 1
            try:
                reader_id = row.get('reader_id', '').strip()
                book_code = row.get('book_code', '').strip()
                issue_date = row.get('issue_date', '').strip()
                due_date = row.get('due_date', '').strip()
                return_date = row.get('return_date', '').strip() or None
                
                if not reader_id or not book_code or not issue_date or not due_date:
                    errors.append(f"Строка {total}: отсутствуют обязательные поля")
                    continue
                
                # Проверяем существование читателя и книги
                cursor = await db.execute("SELECT reader_id FROM readers WHERE reader_id = ?", (reader_id,))
                if not await cursor.fetchone():
                    errors.append(f"Строка {total}: читатель {reader_id} не найден")
                    continue
                
                cursor = await db.execute("SELECT book_code FROM books WHERE book_code = ?", (book_code,))
                if not await cursor.fetchone():
                    errors.append(f"Строка {total}: книга {book_code} не найдена")
                    continue
                
                # Проверяем уникальность (идемпотентность)
                cursor = await db.execute("""
                    SELECT loan_id FROM loans 
                    WHERE reader_id = ? AND book_code = ? AND issue_date = ?
                """, (reader_id, book_code, issue_date))
                
                if await cursor.fetchone():
                    skipped += 1
                    continue
                
                # Проверяем, нет ли активной выдачи на эту книгу
                if not return_date:
                    cursor = await db.execute("""
                        SELECT loan_id FROM loans 
                        WHERE book_code = ? AND return_date IS NULL
                    """, (book_code,))
                    if await cursor.fetchone():
                        errors.append(f"Строка {total}: книга {book_code} уже выдана")
                        continue
                
                loan_id = row.get('loan_id', '').strip() or generate_id("LN")
                
                await db.execute("""
                    INSERT INTO loans (loan_id, reader_id, book_code, issue_date, due_date, return_date, created_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (loan_id, reader_id, book_code, issue_date, due_date, return_date, current_user["user_id"], now))
                
                # Обновляем доступность книги
                if not return_date:
                    await db.execute("UPDATE books SET is_available = 0 WHERE book_code = ?", (book_code,))
                
                imported += 1
                
            except Exception as e:
                errors.append(f"Строка {total}: {str(e)}")
        
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'import', 'loans', 'import', ?, ?, ?, ?)
        """, (generate_id("LOG"), f"Импортировано: {imported}, Пропущено: {skipped}",
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return ImportResult(
            success=len(errors) == 0,
            total_records=total,
            imported=imported,
            skipped=skipped,
            errors=errors[:10]
        )
    finally:
        await db.close()


@router.get("/books/export")
async def export_books_csv(
    current_user: dict = Depends(require_admin)
):
    """Экспорт каталога книг в CSV (формат 1С)"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM books ORDER BY book_code")
        rows = await cursor.fetchall()
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        writer.writerow(['book_code', 'title', 'author', 'year', 'udk', 'description', 'publisher', 'pages', 'isbn'])
        
        for row in rows:
            writer.writerow([
                row['book_code'],
                row['title'],
                row['author'],
                row['year'],
                row['udk'],
                row['description'] or '',
                row['publisher'] or '',
                row['pages'] or '',
                row['isbn'] or ''
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=books_export_{date.today().isoformat()}.csv"
            }
        )
    finally:
        await db.close()


@router.get("/readers/export")
async def export_readers_csv(current_user: dict = Depends(require_admin)):
    """Экспорт читателей в CSV (формат 1С)"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM readers ORDER BY reader_id")
        rows = await cursor.fetchall()
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        writer.writerow(['reader_id', 'fio', 'group', 'email', 'phone'])
        
        for row in rows:
            writer.writerow([
                row['reader_id'],
                row['fio'],
                row['group_name'],
                row['email'] or '',
                row['phone'] or ''
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=readers_export_{date.today().isoformat()}.csv"
            }
        )
    finally:
        await db.close()


@router.get("/loans/export")
async def export_loans_csv(
    status: Optional[str] = Query(None, description="Статус: active, returned, overdue, all"),
    current_user: dict = Depends(require_admin)
):
    """Экспорт выдач в CSV (формат 1С)"""
    db = await get_db()
    try:
        today = date.today().isoformat()
        
        query = "SELECT * FROM loans WHERE 1=1"
        params = []
        
        if status == "active":
            query += " AND return_date IS NULL"
        elif status == "returned":
            query += " AND return_date IS NOT NULL"
        elif status == "overdue":
            query += " AND return_date IS NULL AND due_date < ?"
            params.append(today)
        
        query += " ORDER BY issue_date DESC"
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        writer.writerow(['loan_id', 'reader_id', 'book_code', 'issue_date', 'due_date', 'return_date'])
        
        for row in rows:
            writer.writerow([
                row['loan_id'],
                row['reader_id'],
                row['book_code'],
                row['issue_date'],
                row['due_date'],
                row['return_date'] or ''
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=loans_export_{date.today().isoformat()}.csv"
            }
        )
    finally:
        await db.close()
