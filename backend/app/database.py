"""
База данных для библиотечной системы АБИС
Использует SQLite + aiosqlite для асинхронной работы
"""
import aiosqlite
import json
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
import uuid
import os
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "library.db"


async def get_db():
    """Получить соединение с базой данных"""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Инициализация базы данных с таблицами"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Таблица книг
        await db.execute("""
            CREATE TABLE IF NOT EXISTS books (
                book_code TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                year INTEGER NOT NULL,
                udk TEXT NOT NULL,
                description TEXT,
                publisher TEXT,
                pages INTEGER,
                isbn TEXT,
                is_available INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        
        # Таблица читателей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS readers (
                reader_id TEXT PRIMARY KEY,
                fio TEXT NOT NULL,
                group_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        
        # Таблица пользователей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT NOT NULL,
                reader_id TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY (reader_id) REFERENCES readers(reader_id)
            )
        """)
        
        # Таблица выдач
        await db.execute("""
            CREATE TABLE IF NOT EXISTS loans (
                loan_id TEXT PRIMARY KEY,
                reader_id TEXT NOT NULL,
                book_code TEXT NOT NULL,
                issue_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                return_date TEXT,
                created_by TEXT,
                returned_by TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
                FOREIGN KEY (book_code) REFERENCES books(book_code)
            )
        """)
        
        # Таблица бронирований
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reservations (
                reservation_id TEXT PRIMARY KEY,
                reader_id TEXT NOT NULL,
                book_code TEXT NOT NULL,
                reserved_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
                FOREIGN KEY (book_code) REFERENCES books(book_code)
            )
        """)
        
        # Таблица уведомлений
        await db.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id TEXT PRIMARY KEY,
                reader_id TEXT NOT NULL,
                loan_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                book_title TEXT NOT NULL,
                due_date TEXT NOT NULL,
                days_until_due INTEGER NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (reader_id) REFERENCES readers(reader_id),
                FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
            )
        """)
        
        # Журнал изменений (аудит)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id TEXT PRIMARY KEY,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        
        # Индексы для оптимизации запросов
        await db.execute("CREATE INDEX IF NOT EXISTS idx_loans_reader ON loans(reader_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_code)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_loans_dates ON loans(issue_date, due_date, return_date)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_reservations_reader ON reservations(reader_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_reservations_book ON reservations(book_code)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_notifications_reader ON notifications(reader_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)")
        
        await db.commit()


async def seed_demo_data():
    """Заполнение демо-данными"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Проверяем, есть ли уже данные
        cursor = await db.execute("SELECT COUNT(*) FROM books")
        count = (await cursor.fetchone())[0]
        if count > 0:
            return  # Данные уже есть
        
        now = datetime.now().isoformat()
        today = date.today()
        
        # Демо-книги (50 книг)
        books = []
        authors = [
            "Пушкин А.С.", "Толстой Л.Н.", "Достоевский Ф.М.", "Чехов А.П.",
            "Гоголь Н.В.", "Тургенев И.С.", "Булгаков М.А.", "Горький М.",
            "Есенин С.А.", "Маяковский В.В.", "Ахматова А.А.", "Цветаева М.И.",
            "Блок А.А.", "Бунин И.А.", "Куприн А.И.", "Шолохов М.А.",
            "Пастернак Б.Л.", "Солженицын А.И.", "Набоков В.В.", "Замятин Е.И."
        ]
        
        titles = [
            ("Евгений Онегин", "84(2Рус)"),
            ("Война и мир", "84(2Рус)"),
            ("Преступление и наказание", "84(2Рус)"),
            ("Вишнёвый сад", "84(2Рус)"),
            ("Мёртвые души", "84(2Рус)"),
            ("Отцы и дети", "84(2Рус)"),
            ("Мастер и Маргарита", "84(2Рус)"),
            ("На дне", "84(2Рус)"),
            ("Стихотворения", "84(2Рус)-1"),
            ("Облако в штанах", "84(2Рус)-1"),
            ("Реквием", "84(2Рус)-1"),
            ("Поэма горы", "84(2Рус)-1"),
            ("Двенадцать", "84(2Рус)-1"),
            ("Тёмные аллеи", "84(2Рус)"),
            ("Гранатовый браслет", "84(2Рус)"),
            ("Тихий Дон", "84(2Рус)"),
            ("Доктор Живаго", "84(2Рус)"),
            ("Архипелаг ГУЛАГ", "84(2Рус)"),
            ("Лолита", "84(2Рус)"),
            ("Мы", "84(2Рус)")
        ]
        
        for i in range(50):
            idx = i % len(titles)
            author_idx = i % len(authors)
            book_code = f"BK{str(i+1).zfill(4)}"
            title, udk = titles[idx]
            if i >= len(titles):
                title = f"{title} (том {i // len(titles) + 1})"
            
            books.append((
                book_code,
                title,
                authors[author_idx],
                1900 + (i * 2) % 120,
                udk,
                f"Описание книги «{title}» автора {authors[author_idx]}. Классическое произведение русской литературы.",
                "Издательство «Просвещение»",
                100 + i * 10,
                f"978-5-{str(i).zfill(4)}-{str(i*2).zfill(4)}-{i % 10}",
                1,
                now,
                None
            ))
        
        await db.executemany("""
            INSERT INTO books (book_code, title, author, year, udk, description, publisher, pages, isbn, is_available, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, books)
        
        # Демо-читатели (30 читателей)
        groups = ["ИС-21", "ИС-22", "ИС-23", "ПИ-21", "ПИ-22", "ПИ-23", 
                  "ММ-21", "ММ-22", "ФИЗ-21", "ФИЗ-22", "ХИМ-21", "ЭК-21"]
        
        first_names = ["Александр", "Мария", "Дмитрий", "Анна", "Сергей", 
                       "Елена", "Андрей", "Ольга", "Михаил", "Наталья"]
        last_names = ["Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
                      "Морозов", "Волков", "Соколов", "Лебедев", "Кузнецов"]
        patronymics = ["Александрович", "Дмитриевич", "Сергеевич", "Михайлович", "Андреевич",
                       "Александровна", "Дмитриевна", "Сергеевна", "Михайловна", "Андреевна"]
        
        readers = []
        for i in range(30):
            reader_id = f"RD{str(i+1).zfill(4)}"
            fn = first_names[i % len(first_names)]
            ln = last_names[i % len(last_names)]
            pt = patronymics[i % len(patronymics)]
            
            readers.append((
                reader_id,
                f"{ln} {fn} {pt}",
                groups[i % len(groups)],
                f"reader{i+1}@library.ru",
                f"+7-900-{str(i+1).zfill(3)}-00-00",
                now,
                None
            ))
        
        await db.executemany("""
            INSERT INTO readers (reader_id, fio, group_name, email, phone, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, readers)
        
        # Демо-пользователи
        from passlib.hash import bcrypt
        
        users = [
            ("admin", bcrypt.hash("admin123"), "admin", "Администратор Системы", None, now),
            ("librarian", bcrypt.hash("lib123"), "librarian", "Библиотекарь Главный", None, now),
            ("reader", bcrypt.hash("reader123"), "reader", "Иванов Александр Александрович", "RD0001", now),
        ]
        
        for i, (username, pwd_hash, role, full_name, reader_id, created) in enumerate(users):
            user_id = f"USR{str(i+1).zfill(4)}"
            await db.execute("""
                INSERT INTO users (user_id, username, password_hash, role, full_name, reader_id, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (user_id, username, pwd_hash, role, full_name, reader_id, created))
        
        # Демо-выдачи (120+ выдач)
        loans = []
        for i in range(120):
            loan_id = f"LN{str(i+1).zfill(5)}"
            reader_id = f"RD{str((i % 30) + 1).zfill(4)}"
            book_code = f"BK{str((i % 50) + 1).zfill(4)}"
            
            # Разные статусы выдач
            if i < 30:
                # Активные выдачи без просрочки
                issue_date = today - timedelta(days=7)
                due_date = today + timedelta(days=7 + (i % 14))
                return_date = None
            elif i < 50:
                # Активные просроченные выдачи
                issue_date = today - timedelta(days=30)
                due_date = today - timedelta(days=1 + (i % 14))
                return_date = None
            elif i < 80:
                # Возвращённые вовремя
                issue_date = today - timedelta(days=60 + i)
                due_date = today - timedelta(days=40 + i)
                return_date = today - timedelta(days=45 + i)
            else:
                # Возвращённые с просрочкой
                issue_date = today - timedelta(days=90 + i)
                due_date = today - timedelta(days=70 + i)
                return_date = today - timedelta(days=60 + i)
            
            loans.append((
                loan_id,
                reader_id,
                book_code,
                issue_date.isoformat(),
                due_date.isoformat(),
                return_date.isoformat() if return_date else None,
                "USR0002",  # librarian
                "USR0002" if return_date else None,
                now,
                now if return_date else None
            ))
        
        await db.executemany("""
            INSERT INTO loans (loan_id, reader_id, book_code, issue_date, due_date, return_date, created_by, returned_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, loans)
        
        # Обновляем доступность книг
        await db.execute("""
            UPDATE books SET is_available = 0
            WHERE book_code IN (
                SELECT book_code FROM loans WHERE return_date IS NULL
            )
        """)
        
        # Выдачи для демо-читателя с уведомлениями
        demo_loans = [
            (f"LN{str(121).zfill(5)}", "RD0001", "BK0045", 
             (today - timedelta(days=7)).isoformat(),
             (today + timedelta(days=7)).isoformat(), None),
            (f"LN{str(122).zfill(5)}", "RD0001", "BK0046",
             (today - timedelta(days=11)).isoformat(),
             (today + timedelta(days=3)).isoformat(), None),
            (f"LN{str(123).zfill(5)}", "RD0001", "BK0047",
             (today - timedelta(days=13)).isoformat(),
             (today + timedelta(days=1)).isoformat(), None),
            (f"LN{str(124).zfill(5)}", "RD0001", "BK0048",
             (today - timedelta(days=20)).isoformat(),
             (today - timedelta(days=5)).isoformat(), None),
        ]
        
        for loan in demo_loans:
            await db.execute("""
                INSERT INTO loans (loan_id, reader_id, book_code, issue_date, due_date, return_date, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'USR0002', ?)
            """, (*loan, now))
        
        await db.commit()
        print("Демо-данные успешно загружены")


def generate_id(prefix: str) -> str:
    """Генерация уникального ID"""
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"
