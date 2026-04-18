"""
Роутер для работы с выдачами
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, date, timedelta

from ..models import Loan, LoanCreate, LoanReturn, LoanWithDetails
from ..database import get_db, generate_id
from ..auth import get_current_user, require_librarian

router = APIRouter(prefix="/loans", tags=["Выдачи"])


@router.get("/", response_model=List[LoanWithDetails])
async def get_loans(
    reader_id: Optional[str] = Query(None, description="Фильтр по читателю"),
    book_code: Optional[str] = Query(None, description="Фильтр по книге"),
    status: Optional[str] = Query(None, description="Статус: active, returned, overdue"),
    date_from: Optional[date] = Query(None, description="Дата выдачи от"),
    date_to: Optional[date] = Query(None, description="Дата выдачи до"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Получить список выдач с фильтрацией"""
    db = await get_db()
    try:
        today = date.today().isoformat()
        
        query = """
            SELECT 
                l.*,
                r.fio as reader_fio,
                r.group_name as reader_group,
                b.title as book_title,
                b.author as book_author
            FROM loans l
            JOIN readers r ON l.reader_id = r.reader_id
            JOIN books b ON l.book_code = b.book_code
            WHERE 1=1
        """
        params = []
        
        if reader_id:
            query += " AND l.reader_id = ?"
            params.append(reader_id)
        
        if book_code:
            query += " AND l.book_code = ?"
            params.append(book_code)
        
        if status == "active":
            query += " AND l.return_date IS NULL"
        elif status == "returned":
            query += " AND l.return_date IS NOT NULL"
        elif status == "overdue":
            query += f" AND (l.return_date IS NULL AND l.due_date < ? OR l.return_date > l.due_date)"
            params.append(today)
        
        if date_from:
            query += " AND l.issue_date >= ?"
            params.append(date_from.isoformat())
        
        if date_to:
            query += " AND l.issue_date <= ?"
            params.append(date_to.isoformat())
        
        query += " ORDER BY l.issue_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        loans = []
        for row in rows:
            loan_dict = dict(row)
            
            # Преобразуем даты
            loan_dict["issue_date"] = date.fromisoformat(loan_dict["issue_date"])
            loan_dict["due_date"] = date.fromisoformat(loan_dict["due_date"])
            if loan_dict["return_date"]:
                loan_dict["return_date"] = date.fromisoformat(loan_dict["return_date"])
            loan_dict["created_at"] = datetime.fromisoformat(loan_dict["created_at"])
            if loan_dict["updated_at"]:
                loan_dict["updated_at"] = datetime.fromisoformat(loan_dict["updated_at"])
            
            # Вычисляем просрочку
            today_date = date.today()
            if loan_dict["return_date"]:
                if loan_dict["return_date"] > loan_dict["due_date"]:
                    loan_dict["is_overdue"] = True
                    loan_dict["days_overdue"] = (loan_dict["return_date"] - loan_dict["due_date"]).days
                else:
                    loan_dict["is_overdue"] = False
                    loan_dict["days_overdue"] = 0
            else:
                if today_date > loan_dict["due_date"]:
                    loan_dict["is_overdue"] = True
                    loan_dict["days_overdue"] = (today_date - loan_dict["due_date"]).days
                else:
                    loan_dict["is_overdue"] = False
                    loan_dict["days_overdue"] = 0
            
            loans.append(LoanWithDetails(**loan_dict))
        
        return loans
    finally:
        await db.close()


@router.get("/{loan_id}", response_model=LoanWithDetails)
async def get_loan(loan_id: str):
    """Получить выдачу по ID"""
    db = await get_db()
    try:
        cursor = await db.execute("""
            SELECT 
                l.*,
                r.fio as reader_fio,
                r.group_name as reader_group,
                b.title as book_title,
                b.author as book_author
            FROM loans l
            JOIN readers r ON l.reader_id = r.reader_id
            JOIN books b ON l.book_code = b.book_code
            WHERE l.loan_id = ?
        """, (loan_id,))
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Выдача не найдена")
        
        loan_dict = dict(row)
        loan_dict["issue_date"] = date.fromisoformat(loan_dict["issue_date"])
        loan_dict["due_date"] = date.fromisoformat(loan_dict["due_date"])
        if loan_dict["return_date"]:
            loan_dict["return_date"] = date.fromisoformat(loan_dict["return_date"])
        loan_dict["created_at"] = datetime.fromisoformat(loan_dict["created_at"])
        if loan_dict["updated_at"]:
            loan_dict["updated_at"] = datetime.fromisoformat(loan_dict["updated_at"])
        
        # Вычисляем просрочку
        today_date = date.today()
        if loan_dict["return_date"]:
            if loan_dict["return_date"] > loan_dict["due_date"]:
                loan_dict["is_overdue"] = True
                loan_dict["days_overdue"] = (loan_dict["return_date"] - loan_dict["due_date"]).days
            else:
                loan_dict["is_overdue"] = False
                loan_dict["days_overdue"] = 0
        else:
            if today_date > loan_dict["due_date"]:
                loan_dict["is_overdue"] = True
                loan_dict["days_overdue"] = (today_date - loan_dict["due_date"]).days
            else:
                loan_dict["is_overdue"] = False
                loan_dict["days_overdue"] = 0
        
        return LoanWithDetails(**loan_dict)
    finally:
        await db.close()


@router.post("/", response_model=Loan)
async def create_loan(loan: LoanCreate, current_user: dict = Depends(require_librarian)):
    """Создать новую выдачу (выдать книгу)"""
    db = await get_db()
    try:
        # Проверяем существование читателя
        cursor = await db.execute("SELECT reader_id FROM readers WHERE reader_id = ?", (loan.reader_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Читатель не найден")
        
        # Проверяем существование книги
        cursor = await db.execute("SELECT book_code, is_available FROM books WHERE book_code = ?", (loan.book_code,))
        book = await cursor.fetchone()
        if not book:
            raise HTTPException(status_code=404, detail="Книга не найдена")
        
        # Проверяем доступность книги (бизнес-правило: один экземпляр - одна активная выдача)
        cursor = await db.execute(
            "SELECT loan_id FROM loans WHERE book_code = ? AND return_date IS NULL",
            (loan.book_code,)
        )
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Книга уже выдана другому читателю")
        
        now = datetime.now()
        today = date.today()
        loan_id = generate_id("LN")
        
        # Проверяем даты
        if loan.due_date < today:
            raise HTTPException(status_code=400, detail="Дата возврата не может быть в прошлом")
        
        await db.execute("""
            INSERT INTO loans (loan_id, reader_id, book_code, issue_date, due_date, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (loan_id, loan.reader_id, loan.book_code, today.isoformat(), 
              loan.due_date.isoformat(), current_user["user_id"], now.isoformat()))
        
        # Обновляем доступность книги
        await db.execute("UPDATE books SET is_available = 0 WHERE book_code = ?", (loan.book_code,))
        
        # Отменяем активное бронирование, если есть
        await db.execute("""
            UPDATE reservations SET is_active = 0 
            WHERE book_code = ? AND reader_id = ? AND is_active = 1
        """, (loan.book_code, loan.reader_id))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, new_value, user_id, username, created_at)
            VALUES (?, 'loan', ?, 'issue', ?, ?, ?, ?)
        """, (generate_id("LOG"), loan_id, f"Выдача книги {loan.book_code} читателю {loan.reader_id}",
              current_user["user_id"], current_user["username"], now.isoformat()))
        
        await db.commit()
        
        return Loan(
            loan_id=loan_id,
            reader_id=loan.reader_id,
            book_code=loan.book_code,
            issue_date=today,
            due_date=loan.due_date,
            return_date=None,
            is_overdue=False,
            days_overdue=0,
            created_by=current_user["user_id"],
            returned_by=None,
            created_at=now
        )
    finally:
        await db.close()


@router.post("/{loan_id}/return", response_model=Loan)
async def return_loan(loan_id: str, loan_return: LoanReturn = None, current_user: dict = Depends(require_librarian)):
    """Вернуть книгу"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM loans WHERE loan_id = ?", (loan_id,))
        loan = await cursor.fetchone()
        
        if not loan:
            raise HTTPException(status_code=404, detail="Выдача не найдена")
        
        loan_dict = dict(loan)
        
        if loan_dict["return_date"]:
            raise HTTPException(status_code=400, detail="Книга уже возвращена")
        
        now = datetime.now()
        return_date = loan_return.return_date if loan_return and loan_return.return_date else date.today()
        
        # Проверяем, что дата возврата не раньше даты выдачи
        issue_date = date.fromisoformat(loan_dict["issue_date"])
        if return_date < issue_date:
            raise HTTPException(status_code=400, detail="Дата возврата не может быть раньше даты выдачи")
        
        await db.execute("""
            UPDATE loans SET return_date = ?, returned_by = ?, updated_at = ?
            WHERE loan_id = ?
        """, (return_date.isoformat(), current_user["user_id"], now.isoformat(), loan_id))
        
        # Обновляем доступность книги
        await db.execute("UPDATE books SET is_available = 1 WHERE book_code = ?", (loan_dict["book_code"],))
        
        # Записываем в журнал
        due_date = date.fromisoformat(loan_dict["due_date"])
        is_overdue = return_date > due_date
        days_overdue = (return_date - due_date).days if is_overdue else 0
        
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, new_value, user_id, username, created_at)
            VALUES (?, 'loan', ?, 'return', ?, ?, ?, ?, ?)
        """, (generate_id("LOG"), loan_id, 
              f"Книга: {loan_dict['book_code']}, Читатель: {loan_dict['reader_id']}",
              f"Возврат {'с просрочкой ' + str(days_overdue) + ' дн.' if is_overdue else 'вовремя'}",
              current_user["user_id"], current_user["username"], now.isoformat()))
        
        await db.commit()
        
        return Loan(
            loan_id=loan_id,
            reader_id=loan_dict["reader_id"],
            book_code=loan_dict["book_code"],
            issue_date=issue_date,
            due_date=due_date,
            return_date=return_date,
            is_overdue=is_overdue,
            days_overdue=days_overdue,
            created_by=loan_dict["created_by"],
            returned_by=current_user["user_id"],
            created_at=datetime.fromisoformat(loan_dict["created_at"]),
            updated_at=now
        )
    finally:
        await db.close()


@router.delete("/{loan_id}")
async def delete_loan(loan_id: str, current_user: dict = Depends(require_librarian)):
    """Удалить выдачу (только для администраторов)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Только администратор может удалять выдачи")
    
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM loans WHERE loan_id = ?", (loan_id,))
        loan = await cursor.fetchone()
        
        if not loan:
            raise HTTPException(status_code=404, detail="Выдача не найдена")
        
        loan_dict = dict(loan)
        now = datetime.now().isoformat()
        
        # Если книга не возвращена, делаем её доступной
        if not loan_dict["return_date"]:
            await db.execute("UPDATE books SET is_available = 1 WHERE book_code = ?", (loan_dict["book_code"],))
        
        await db.execute("DELETE FROM loans WHERE loan_id = ?", (loan_id,))
        
        # Записываем в журнал
        await db.execute("""
            INSERT INTO audit_log (log_id, entity_type, entity_id, action, old_value, user_id, username, created_at)
            VALUES (?, 'loan', ?, 'delete', ?, ?, ?, ?)
        """, (generate_id("LOG"), loan_id, 
              f"Книга: {loan_dict['book_code']}, Читатель: {loan_dict['reader_id']}",
              current_user["user_id"], current_user["username"], now))
        
        await db.commit()
        
        return {"message": "Выдача удалена"}
    finally:
        await db.close()
