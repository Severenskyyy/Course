"""
Роутер для отчётов и аналитики
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, date
from statistics import median
import csv
import io

from ..models import (
    OverdueReportItem, OverdueReport, KPIMetrics, 
    TopReader, TopBook, AuditLogEntry
)
from ..database import get_db
from ..auth import get_current_user, require_librarian

router = APIRouter(prefix="/reports", tags=["Отчёты"])


@router.get("/overdue", response_model=OverdueReport)
async def get_overdue_report(
    group: Optional[str] = Query(None, description="Фильтр по группе"),
    author: Optional[str] = Query(None, description="Фильтр по автору"),
    udk: Optional[str] = Query(None, description="Фильтр по УДК"),
    min_days: Optional[int] = Query(None, description="Минимум дней просрочки"),
    max_days: Optional[int] = Query(None, description="Максимум дней просрочки"),
    current_user: dict = Depends(require_librarian)
):
    """Отчёт о просрочках с фильтрацией"""
    db = await get_db()
    try:
        today = date.today()
        today_str = today.isoformat()
        
        # Запрос для получения просроченных выдач
        query = """
            SELECT 
                l.loan_id,
                l.reader_id,
                r.fio,
                r.group_name as "group",
                l.book_code,
                b.title,
                b.author,
                b.udk,
                l.issue_date,
                l.due_date,
                l.return_date,
                CASE 
                    WHEN l.return_date IS NULL THEN 
                        CAST(julianday(?) - julianday(l.due_date) AS INTEGER)
                    ELSE 
                        CAST(julianday(l.return_date) - julianday(l.due_date) AS INTEGER)
                END as days_overdue
            FROM loans l
            JOIN readers r ON l.reader_id = r.reader_id
            JOIN books b ON l.book_code = b.book_code
            WHERE (
                (l.return_date IS NULL AND l.due_date < ?)
                OR (l.return_date IS NOT NULL AND l.return_date > l.due_date)
            )
        """
        params = [today_str, today_str]
        
        if group:
            query += " AND r.group_name = ?"
            params.append(group)
        
        if author:
            query += " AND b.author = ?"
            params.append(author)
        
        if udk:
            query += " AND b.udk LIKE ?"
            params.append(f"{udk}%")
        
        if min_days is not None:
            query += " AND days_overdue >= ?"
            params.append(min_days)
        
        if max_days is not None:
            query += " AND days_overdue <= ?"
            params.append(max_days)
        
        query += " ORDER BY days_overdue DESC"
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        items = []
        days_list = []
        for row in rows:
            row_dict = dict(row)
            days = row_dict["days_overdue"]
            if days > 0:
                days_list.append(days)
            items.append(OverdueReportItem(
                reader_id=row_dict["reader_id"],
                fio=row_dict["fio"],
                group=row_dict["group"],
                book_code=row_dict["book_code"],
                title=row_dict["title"],
                author=row_dict["author"],
                issue_date=date.fromisoformat(row_dict["issue_date"]),
                due_date=date.fromisoformat(row_dict["due_date"]),
                return_date=date.fromisoformat(row_dict["return_date"]) if row_dict["return_date"] else None,
                days_overdue=days
            ))
        
        # Получаем общее количество активных выдач
        cursor = await db.execute("SELECT COUNT(*) FROM loans WHERE return_date IS NULL")
        total_active = (await cursor.fetchone())[0]
        
        # Считаем статистику
        total_overdue = len([i for i in items if i.return_date is None])  # Только текущие просрочки
        overdue_percentage = (total_overdue / total_active * 100) if total_active > 0 else 0
        average_days = sum(days_list) / len(days_list) if days_list else 0
        median_days = median(days_list) if days_list else 0
        
        return OverdueReport(
            items=items,
            total_overdue=total_overdue,
            total_active_loans=total_active,
            overdue_percentage=round(overdue_percentage, 2),
            average_overdue_days=round(average_days, 2),
            median_overdue_days=float(median_days),
            generated_at=datetime.now()
        )
    finally:
        await db.close()


@router.get("/overdue/export")
async def export_overdue_csv(
    group: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    udk: Optional[str] = Query(None),
    min_days: Optional[int] = Query(None),
    max_days: Optional[int] = Query(None),
    current_user: dict = Depends(require_librarian)
):
    """Экспорт отчёта о просрочках в CSV"""
    report = await get_overdue_report(group, author, udk, min_days, max_days, current_user)
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # Заголовок
    writer.writerow([
        'reader_id', 'fio', 'group', 'book_code', 'title', 'author',
        'issue_date', 'due_date', 'return_date', 'days_overdue'
    ])
    
    # Данные
    for item in report.items:
        writer.writerow([
            item.reader_id,
            item.fio,
            item.group,
            item.book_code,
            item.title,
            item.author,
            item.issue_date.isoformat(),
            item.due_date.isoformat(),
            item.return_date.isoformat() if item.return_date else '',
            item.days_overdue
        ])
    
    # Итоговая строка
    writer.writerow([])
    writer.writerow(['Итого просрочек:', report.total_overdue])
    writer.writerow(['Всего активных выдач:', report.total_active_loans])
    writer.writerow(['Процент просрочек:', f'{report.overdue_percentage}%'])
    writer.writerow(['Средняя просрочка (дни):', report.average_overdue_days])
    writer.writerow(['Медианная просрочка (дни):', report.median_overdue_days])
    writer.writerow(['Дата формирования:', report.generated_at.isoformat()])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=overdue_report_{date.today().isoformat()}.csv"
        }
    )


@router.get("/kpi", response_model=KPIMetrics)
async def get_kpi_metrics(current_user: dict = Depends(require_librarian)):
    """Получить KPI показатели библиотеки"""
    db = await get_db()
    try:
        today = date.today().isoformat()
        
        # Общее количество книг
        cursor = await db.execute("SELECT COUNT(*) FROM books")
        total_books = (await cursor.fetchone())[0]
        
        # Общее количество читателей
        cursor = await db.execute("SELECT COUNT(*) FROM readers")
        total_readers = (await cursor.fetchone())[0]
        
        # Активные выдачи
        cursor = await db.execute("SELECT COUNT(*) FROM loans WHERE return_date IS NULL")
        active_loans = (await cursor.fetchone())[0]
        
        # Просроченные выдачи
        cursor = await db.execute("""
            SELECT COUNT(*) FROM loans 
            WHERE return_date IS NULL AND due_date < ?
        """, (today,))
        overdue_loans = (await cursor.fetchone())[0]
        
        # Процент просрочек
        overdue_percentage = (overdue_loans / active_loans * 100) if active_loans > 0 else 0
        
        # Дни просрочки для статистики
        cursor = await db.execute("""
            SELECT CAST(julianday(?) - julianday(due_date) AS INTEGER) as days
            FROM loans 
            WHERE return_date IS NULL AND due_date < ?
        """, (today, today))
        days_rows = await cursor.fetchall()
        days_list = [row["days"] for row in days_rows if row["days"] > 0]
        
        avg_overdue = sum(days_list) / len(days_list) if days_list else 0
        med_overdue = median(days_list) if days_list else 0
        
        # Активные бронирования
        cursor = await db.execute("""
            SELECT COUNT(*) FROM reservations 
            WHERE is_active = 1 AND expires_at > ?
        """, (datetime.now().isoformat(),))
        total_reservations = (await cursor.fetchone())[0]
        
        # Книги в обращении
        cursor = await db.execute("SELECT COUNT(*) FROM books WHERE is_available = 0")
        books_in_circulation = (await cursor.fetchone())[0]
        
        # Коэффициент оборачиваемости
        circulation_rate = (books_in_circulation / total_books * 100) if total_books > 0 else 0
        
        target_threshold = 15.0
        
        return KPIMetrics(
            total_books=total_books,
            total_readers=total_readers,
            active_loans=active_loans,
            overdue_loans=overdue_loans,
            overdue_percentage=round(overdue_percentage, 2),
            target_threshold=target_threshold,
            is_within_target=overdue_percentage <= target_threshold,
            average_overdue_days=round(avg_overdue, 2),
            median_overdue_days=float(med_overdue),
            total_reservations=total_reservations,
            books_in_circulation=books_in_circulation,
            circulation_rate=round(circulation_rate, 2)
        )
    finally:
        await db.close()


@router.get("/top-readers", response_model=List[TopReader])
async def get_top_readers_by_overdue(
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(require_librarian)
):
    """ТОП читателей по просрочкам"""
    db = await get_db()
    try:
        today = date.today().isoformat()
        
        cursor = await db.execute("""
            SELECT 
                r.reader_id,
                r.fio,
                r.group_name as "group",
                COUNT(*) as overdue_count,
                SUM(
                    CASE 
                        WHEN l.return_date IS NULL THEN 
                            CAST(julianday(?) - julianday(l.due_date) AS INTEGER)
                        ELSE 
                            CAST(julianday(l.return_date) - julianday(l.due_date) AS INTEGER)
                    END
                ) as total_overdue_days
            FROM loans l
            JOIN readers r ON l.reader_id = r.reader_id
            WHERE (
                (l.return_date IS NULL AND l.due_date < ?)
                OR (l.return_date IS NOT NULL AND l.return_date > l.due_date)
            )
            GROUP BY r.reader_id, r.fio, r.group_name
            ORDER BY overdue_count DESC, total_overdue_days DESC
            LIMIT ?
        """, (today, today, limit))
        
        rows = await cursor.fetchall()
        
        return [TopReader(
            reader_id=row["reader_id"],
            fio=row["fio"],
            group=row["group"],
            overdue_count=row["overdue_count"],
            total_overdue_days=row["total_overdue_days"]
        ) for row in rows]
    finally:
        await db.close()


@router.get("/top-books", response_model=List[TopBook])
async def get_top_books_by_overdue(
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(require_librarian)
):
    """ТОП книг по просрочкам"""
    db = await get_db()
    try:
        today = date.today().isoformat()
        
        cursor = await db.execute("""
            SELECT 
                b.book_code,
                b.title,
                b.author,
                COUNT(*) as overdue_count,
                SUM(
                    CASE 
                        WHEN l.return_date IS NULL THEN 
                            CAST(julianday(?) - julianday(l.due_date) AS INTEGER)
                        ELSE 
                            CAST(julianday(l.return_date) - julianday(l.due_date) AS INTEGER)
                    END
                ) as total_overdue_days
            FROM loans l
            JOIN books b ON l.book_code = b.book_code
            WHERE (
                (l.return_date IS NULL AND l.due_date < ?)
                OR (l.return_date IS NOT NULL AND l.return_date > l.due_date)
            )
            GROUP BY b.book_code, b.title, b.author
            ORDER BY overdue_count DESC, total_overdue_days DESC
            LIMIT ?
        """, (today, today, limit))
        
        rows = await cursor.fetchall()
        
        return [TopBook(
            book_code=row["book_code"],
            title=row["title"],
            author=row["author"],
            overdue_count=row["overdue_count"],
            total_overdue_days=row["total_overdue_days"]
        ) for row in rows]
    finally:
        await db.close()


@router.get("/audit-log", response_model=List[AuditLogEntry])
async def get_audit_log(
    entity_type: Optional[str] = Query(None, description="Тип сущности: book, reader, loan, reservation"),
    entity_id: Optional[str] = Query(None, description="ID сущности"),
    action: Optional[str] = Query(None, description="Действие: create, update, delete, issue, return"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(require_librarian)
):
    """Журнал изменений (аудит)"""
    db = await get_db()
    try:
        query = "SELECT * FROM audit_log WHERE 1=1"
        params = []
        
        if entity_type:
            query += " AND entity_type = ?"
            params.append(entity_type)
        
        if entity_id:
            query += " AND entity_id = ?"
            params.append(entity_id)
        
        if action:
            query += " AND action = ?"
            params.append(action)
        
        if date_from:
            query += " AND created_at >= ?"
            params.append(date_from.isoformat())
        
        if date_to:
            query += " AND created_at <= ?"
            params.append(f"{date_to.isoformat()}T23:59:59")
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        return [AuditLogEntry(
            log_id=row["log_id"],
            entity_type=row["entity_type"],
            entity_id=row["entity_id"],
            action=row["action"],
            old_value=row["old_value"],
            new_value=row["new_value"],
            user_id=row["user_id"],
            username=row["username"],
            created_at=datetime.fromisoformat(row["created_at"])
        ) for row in rows]
    finally:
        await db.close()
