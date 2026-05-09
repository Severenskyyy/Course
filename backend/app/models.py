"""
Pydantic модели для библиотечной системы АБИС
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    LIBRARIAN = "librarian"
    READER = "reader"


class NotificationType(str, Enum):
    WEEK_BEFORE = "week_before"
    THREE_DAYS = "three_days"
    ONE_DAY = "one_day"
    OVERDUE = "overdue"
    RESERVATION = "reservation"


# ==================== КНИГИ ====================

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=300)
    year: int = Field(..., ge=1000, le=2100)
    udk: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    publisher: Optional[str] = None
    pages: Optional[int] = Field(None, ge=1)
    isbn: Optional[str] = None


class BookCreate(BookBase):
    book_code: str = Field(..., min_length=1, max_length=20)


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    author: Optional[str] = Field(None, min_length=1, max_length=300)
    year: Optional[int] = Field(None, ge=1000, le=2100)
    udk: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    publisher: Optional[str] = None
    pages: Optional[int] = Field(None, ge=1)
    isbn: Optional[str] = None


class Book(BookBase):
    book_code: str
    is_available: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== ЧИТАТЕЛИ ====================

class ReaderBase(BaseModel):
    fio: str = Field(..., min_length=2, max_length=200)
    group: str = Field(..., min_length=1, max_length=50)
    email: Optional[str] = None
    phone: Optional[str] = None


class ReaderCreate(ReaderBase):
    reader_id: str = Field(..., min_length=1, max_length=20)
    password: str = Field(..., min_length=4)


class ReaderUpdate(BaseModel):
    fio: Optional[str] = Field(None, min_length=2, max_length=200)
    group: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[str] = None
    phone: Optional[str] = None


class Reader(ReaderBase):
    reader_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== ВЫДАЧИ ====================

class LoanBase(BaseModel):
    reader_id: str
    book_code: str
    due_date: date

    @validator('due_date')
    def due_date_must_be_future(cls, v):
        if v < date.today():
            raise ValueError('Дата возврата должна быть в будущем')
        return v


class LoanCreate(LoanBase):
    pass


class LoanReturn(BaseModel):
    return_date: Optional[date] = None


class Loan(BaseModel):
    loan_id: str
    reader_id: str
    book_code: str
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    is_overdue: bool = False
    days_overdue: int = 0
    created_by: Optional[str] = None
    returned_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoanWithDetails(Loan):
    reader_fio: Optional[str] = None
    reader_group: Optional[str] = None
    book_title: Optional[str] = None
    book_author: Optional[str] = None


# ==================== БРОНИРОВАНИЯ ====================

class ReservationCreate(BaseModel):
    book_code: str


class Reservation(BaseModel):
    reservation_id: str
    reader_id: str
    book_code: str
    reserved_at: datetime
    expires_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True


class ReservationWithDetails(Reservation):
    book_title: Optional[str] = None
    book_author: Optional[str] = None


# ==================== УВЕДОМЛЕНИЯ ====================

class Notification(BaseModel):
    notification_id: str
    reader_id: str
    loan_id: str
    type: NotificationType
    title: str
    message: str
    book_title: str
    due_date: date
    days_until_due: int
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ПОЛЬЗОВАТЕЛИ И АВТОРИЗАЦИЯ ====================

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole
    full_name: str = Field(..., min_length=2, max_length=200)


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)
    reader_id: Optional[str] = None  # Связь с читателем для роли reader


class User(UserBase):
    user_id: str
    reader_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# ==================== ОТЧЁТЫ ====================

class OverdueReportItem(BaseModel):
    reader_id: str
    fio: str
    group: str
    book_code: str
    title: str
    author: str
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    days_overdue: int


class OverdueReport(BaseModel):
    items: List[OverdueReportItem]
    total_overdue: int
    total_active_loans: int
    overdue_percentage: float
    average_overdue_days: float
    median_overdue_days: float
    generated_at: datetime


class KPIMetrics(BaseModel):
    total_books: int
    total_readers: int
    active_loans: int
    overdue_loans: int
    overdue_percentage: float
    target_threshold: float = 15.0
    is_within_target: bool
    average_overdue_days: float
    median_overdue_days: float
    total_reservations: int
    books_in_circulation: int
    circulation_rate: float


class TopReader(BaseModel):
    reader_id: str
    fio: str
    group: str
    overdue_count: int
    total_overdue_days: int


class TopBook(BaseModel):
    book_code: str
    title: str
    author: str
    overdue_count: int
    total_overdue_days: int


# ==================== ЖУРНАЛ ИЗМЕНЕНИЙ ====================

class AuditLogEntry(BaseModel):
    log_id: str
    entity_type: str  # book, reader, loan, reservation
    entity_id: str
    action: str  # create, update, delete, issue, return
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user_id: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ИМПОРТ/ЭКСПОРТ ====================

class ImportResult(BaseModel):
    success: bool
    total_records: int
    imported: int
    skipped: int
    errors: List[str]


class ExportRequest(BaseModel):
    format: str = "csv"
    filters: Optional[dict] = None
