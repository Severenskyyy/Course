# Библиотека АБИС - FastAPI Backend

Автоматизированная библиотечно-информационная система для учёта выдач и просрочек.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### Запуск сервера

```bash
# Режим разработки
uvicorn app.main:app --reload --port 8000

# Продакшен
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### API Документация

После запуска доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔐 Авторизация

### Демо-аккаунты

| Логин | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | Администратор |
| librarian | lib123 | Библиотекарь |
| reader | reader123 | Читатель |

### Получение токена

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Ответ:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

### Использование токена

```bash
curl -X GET "http://localhost:8000/api/books" \
  -H "Authorization: Bearer eyJ..."
```

## 📚 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `GET /api/me` - Текущий пользователь

### Книги
- `GET /api/books` - Список книг (фильтры: search, author, udk, available_only)
- `GET /api/books/{book_code}` - Карточка книги
- `POST /api/books` - Добавить книгу 🔒
- `PUT /api/books/{book_code}` - Редактировать 🔒
- `DELETE /api/books/{book_code}` - Удалить 🔒

### Читатели
- `GET /api/readers` - Список читателей
- `GET /api/readers/groups` - Список групп
- `GET /api/readers/{reader_id}` - Карточка читателя
- `GET /api/readers/{reader_id}/loans` - Выдачи читателя
- `POST /api/readers` - Добавить читателя 🔒
- `PUT /api/readers/{reader_id}` - Редактировать 🔒
- `DELETE /api/readers/{reader_id}` - Удалить 🔒

### Выдачи
- `GET /api/loans` - Список выдач (фильтры: reader_id, book_code, status, date_from, date_to)
- `GET /api/loans/{loan_id}` - Детали выдачи
- `POST /api/loans` - Выдать книгу 🔒
- `POST /api/loans/{loan_id}/return` - Вернуть книгу 🔒
- `DELETE /api/loans/{loan_id}` - Удалить выдачу 👑

### Бронирования
- `GET /api/reservations` - Список бронирований
- `POST /api/reservations` - Забронировать книгу
- `DELETE /api/reservations/{id}` - Отменить бронь
- `GET /api/reservations/check/{book_code}` - Проверить возможность брони

### Отчёты
- `GET /api/reports/overdue` - Отчёт о просрочках
- `GET /api/reports/overdue/export` - Экспорт в CSV
- `GET /api/reports/kpi` - KPI показатели
- `GET /api/reports/top-readers` - ТОП читателей по просрочкам
- `GET /api/reports/top-books` - ТОП книг по просрочкам
- `GET /api/reports/audit-log` - Журнал изменений

### Уведомления
- `GET /api/notifications` - Список уведомлений
- `GET /api/notifications/count` - Количество непрочитанных
- `POST /api/notifications/{id}/read` - Отметить прочитанным
- `POST /api/notifications/read-all` - Прочитать все

### Импорт/Экспорт (1С)
- `POST /api/import-export/books/import` - Импорт книг из CSV 👑
- `POST /api/import-export/readers/import` - Импорт читателей 👑
- `POST /api/import-export/loans/import` - Импорт выдач 👑
- `GET /api/import-export/books/export` - Экспорт книг в CSV 👑
- `GET /api/import-export/readers/export` - Экспорт читателей 👑
- `GET /api/import-export/loans/export` - Экспорт выдач 👑

🔒 - требуется роль librarian или admin
👑 - требуется роль admin

## 📊 Бизнес-правила

### Выдача книг
- Один экземпляр (book_code) - одна активная выдача
- issue_date ≤ due_date
- Блокировка повторной выдачи до возврата

### Просрочка
- return_date = NULL и today > due_date
- ИЛИ return_date > due_date

### Бронирование
- Срок брони: 24 часа
- Повторная бронь той же книги: через 3 дня
- Нельзя бронировать выданную книгу

### KPI
- Целевой порог просрочек: ≤ 15%
- Отслеживается средняя и медианная просрочка

## 📁 Формат CSV для 1С

### books.csv
```csv
book_code;title;author;year;udk;description;publisher;pages;isbn
BK0001;Война и мир;Толстой Л.Н.;1869;84(2Рус);Роман-эпопея;Просвещение;1225;978-5-0000-0001-1
```

### readers.csv
```csv
reader_id;fio;group;email;phone
RD0001;Иванов Иван Иванович;ИС-21;ivanov@mail.ru;+7-900-000-00-01
```

### loans.csv
```csv
loan_id;reader_id;book_code;issue_date;due_date;return_date
LN00001;RD0001;BK0001;2024-01-15;2024-01-29;
```

## 🗄️ Структура БД

```
books (book_code PK, title, author, year, udk, description, publisher, pages, isbn, is_available)
readers (reader_id PK, fio, group_name, email, phone)
users (user_id PK, username, password_hash, role, full_name, reader_id FK)
loans (loan_id PK, reader_id FK, book_code FK, issue_date, due_date, return_date, created_by, returned_by)
reservations (reservation_id PK, reader_id FK, book_code FK, reserved_at, expires_at, is_active)
notifications (notification_id PK, reader_id FK, loan_id FK, type, title, message, is_read)
audit_log (log_id PK, entity_type, entity_id, action, old_value, new_value, user_id, username, created_at)
```

## 🔄 Интеграция с 1С

Backend поддерживает обмен данными с 1С:Предприятие через CSV файлы:

1. **Экспорт из 1С** → CSV → **Импорт в систему**
2. **Экспорт из системы** → CSV → **Импорт в 1С**

Импорт идемпотентный: повторная загрузка обновляет существующие записи без создания дублей.

## 📝 Лицензия

Учебный проект. MIT License.
