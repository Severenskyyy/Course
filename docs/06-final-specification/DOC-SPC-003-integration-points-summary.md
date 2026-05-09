# Сводка интеграционных точек — АБИС (Кейс 8)

| Версия | Статус | Дата |
|---|---|---|
| v1.0 | Final | 2026-05-09 |

**Авторы документа.** Кирбитов А.Е. — сводка контрактов; Гуков Я.Р. — backend-эндпоинты; Рабаданов А.С. — 1С-стороны обмена.

**Назначение.** Концентрированный технический справочник по всем интеграционным точкам системы. Документ предназначен для быстрого ответа на вопросы комиссии «куда что идёт и в каком формате» на финальной защите.

---

## 1. Карта интеграций

```
                    ┌─────────────────────┐
                    │   1С:Предприятие    │
                    │   8.3 (учебная)     │
                    └──────────┬──────────┘
                               │ CSV (UTF-8 BOM, ;)
                               │
        ┌──────────────────────┼──────────────────────┐
        │ I-01..I-03 импорт    │  I-04..I-05 экспорт  │
        ▼                      ▼                      ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │   (8 роутеров)      │
                    └──────────┬──────────┘
                               │ REST + JSON + JWT
                               ▼
                    ┌─────────────────────┐
                    │  React Frontend     │
                    │   (9 экранов)       │
                    └─────────────────────┘
```

---

## 2. Контур A — Frontend ↔ Backend

**Транспорт:** HTTP(S), JSON, заголовок `Authorization: Bearer <JWT>`.
**Кодировка:** UTF-8.
**Базовый URL:** `http://localhost:8000` (dev), `/api/...` (prod через reverse proxy).
**Спецификация:** `spec/openapi.yaml`.

### 2.1. Группы эндпоинтов

| Группа | Префикс | Роутер | Методы | Пример |
|---|---|---|---|---|
| Auth | `/api/auth/` | `auth.py` | `POST login`, `POST refresh`, `POST logout` | `POST /api/auth/login` |
| Books | `/api/books/` | `books.py` | `GET`, `POST`, `PUT`, `DELETE` | `GET /api/books?limit=1000` |
| Readers | `/api/readers/` | `readers.py` | `GET`, `POST`, `PUT`, `DELETE` | `POST /api/readers` |
| Loans | `/api/loans/` | `loans.py` | `GET`, `POST` (выдача), `PATCH` (возврат) | `POST /api/loans` |
| Reports | `/api/reports/` | `reports.py` | `GET kpi`, `GET overdue`, `GET overdue/export` | `GET /api/reports/overdue?group=ИКБО` |
| Import/Export | `/api/import-export/` | `import_export.py` | `POST import/{books,readers,loans}`, `GET export/{books,overdue}`, `GET status` | `POST /api/import-export/import/books` |
| Reservations | `/api/reservations/` | `reservations.py` | `POST`, `DELETE` (Could-have) | `POST /api/reservations` |
| Notifications | `/api/notifications/` | `notifications.py` | `GET` (Could-have) | `GET /api/notifications/me` |

Итого **8 роутеров**, ~28 публичных методов. Всё видно через Swagger UI на `/docs`.

### 2.2. Авторизация

- Алгоритм: HS256, время жизни access-токена 15 минут, refresh — 7 дней.
- Роли: `admin`, `librarian`, `reader`. Проверка через FastAPI `Depends(require_admin)` / `require_librarian`.
- Хеширование паролей: `bcrypt` (passlib) — заметка: 72-байт лимит bcrypt учитывается, длинные пароли отсекаются.

### 2.3. Стандартные коды ответов

| Код | Значение | Когда |
|---|---|---|
| 200 | OK | GET, успешный возврат данных |
| 201 | Created | POST с созданием ресурса |
| 204 | No Content | DELETE |
| 400 | Bad Request | Невалидный JSON / параметры |
| 401 | Unauthorized | Нет JWT или истёк |
| 403 | Forbidden | Роль не позволяет операцию |
| 404 | Not Found | Ресурс не найден |
| 409 | Conflict | BR-01 (двойная выдача), уникальность нарушена |
| 422 | Unprocessable | Pydantic-валидация (например, `due_date < issue_date`) |

---

## 3. Контур B — Backend ↔ 1С (CSV)

**Транспорт:** файловый CSV-обмен через эндпоинты `/api/import-export/*`.
**Кодировка:** UTF-8 BOM по умолчанию; cp1251 — по флагу `Charset` в заголовке/настройке.
**Разделитель:** `;` (точка с запятой).
**Кавычки:** двойные, если в значении есть `;`, перенос строки или `"`.
**Формат дат:** `YYYY-MM-DD`.

### 3.1. Импорты (1С → Backend)

| ID | Файл | Эндпоинт | Заголовки CSV | PK | Идемпотентность |
|---|---|---|---|---|---|
| **I-01** | `books.csv` | `POST /api/import-export/import/books` | `book_code;title;author;year;udk` | `book_code` | UPSERT по `book_code` |
| **I-02** | `readers.csv` | `POST /api/import-export/import/readers` | `reader_id;fio;group` | `reader_id` | UPSERT по `reader_id` |
| **I-03** | `loans.csv` | `POST /api/import-export/import/loans` | `loan_id;reader_id;book_code;issue_date;due_date;return_date` | `loan_id` | UPSERT по `loan_id`, обновляется только `return_date` |

**Ответ:** `{"created": N, "updated": M, "skipped": K, "errors": [{"row": 17, "field": "year", "msg": "..."}]}`.

### 3.2. Экспорты (Backend → 1С)

| ID | Эндпоинт | Заголовки CSV | Файл-имя |
|---|---|---|---|
| **I-04** | `GET /api/import-export/export/books` | `book_code;title;author;year;udk` | `books_YYYYMMDD.csv` |
| **I-05** | `GET /api/import-export/export/overdue` | `reader_id;fio;group;book_code;title;issue_date;due_date;days_overdue` | `overdue_YYYYMMDD.csv` |

**Заголовок ответа:** `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename=...`.

### 3.3. Конверсия идентификаторов

В 1С коды формируются стандартом платформы — 9-значные числовые. В backend — символьные префиксированные. Маппинг при импорте/экспорте:

| 1С → Backend | Backend → 1С |
|---|---|
| `000000001` (Книги) → `BK0001` | `BK0042` → `000000042` |
| `000000017` (Читатели) → `RD0017` | `RD0150` → `000000150` |
| `000000099` (Выдачи) → `LN0099` | `LN0600` → `000000600` |

Реализация: `app/utils/id_mapper.py` и в 1С — общий модуль `КонвертацияКодов`.

---

## 4. Контур C — статус интеграции

| Эндпоинт | Метод | Назначение |
|---|---|---|
| `/api/import-export/status` | GET | Возвращает `{last_import: {...}, last_export: {...}, pending_errors: N}` для админ-дашборда |

Используется в `IntegrationPage` (Экран 7) и в журнале действий куратора.

---

## 5. Журналирование (audit_log)

Каждая операция, меняющая состояние, записывается в таблицу `audit_log`:

| Поле | Пример |
|---|---|
| `id` | autoincrement |
| `timestamp` | `2026-05-09T10:42:13` |
| `user_id` | `librarian` |
| `entity_type` | `loans` / `books` / `readers` / `csv_import` |
| `entity_id` | `LN0042` |
| `action` | `create` / `update` / `delete` / `import` / `export` |
| `details` | JSON с дельтой |

Эндпоинт чтения: `GET /api/reports/audit?limit=100&user_id=...`.

---

## 6. Безопасность интеграций

| Контур | Меры |
|---|---|
| Frontend ↔ Backend | JWT (HS256), 15-минутный access, refresh-токен в HttpOnly-cookie (план для прода) |
| Backend ↔ 1С (CSV) | В MVP — локальная сеть, без шифрования. В проде — VPN/mTLS. Контроль контрольных сумм SHA-256 (опц.) |
| Файлы CSV | UTF-8 BOM фиксирует кодировку для Excel; значения с `;` экранируются двойными кавычками |
| Загружаемые CSV | Лимит размера 10 МБ, валидация заголовков и количества колонок |

---

## 7. Сводный список интеграционных точек

| ID | Тип | Источник → Получатель | Формат | Документ |
|---|---|---|---|---|
| I-01 | Импорт | 1С → Backend | CSV `books.csv` | DOC-INT-002 §A |
| I-02 | Импорт | 1С → Backend | CSV `readers.csv` | DOC-INT-002 §B |
| I-03 | Импорт | 1С → Backend | CSV `loans.csv` | DOC-INT-002 §C |
| I-04 | Экспорт | Backend → 1С | CSV `books_*.csv` | DOC-INT-002 §D |
| I-05 | Экспорт | Backend → 1С | CSV `overdue_*.csv` | DOC-INT-002 §E |
| I-06 | Статус | Backend → Frontend | JSON | (этот документ) |
| I-07 | API | Frontend ↔ Backend | REST + JSON + JWT | `spec/openapi.yaml` |

---

## 8. Связь с другими документами

- DOC-INT-001 — описание контуров и сценариев обмена.
- DOC-INT-002 — детальные контракты CSV (по полям, валидаторы).
- DOC-INT-003 — маппинг полей 1С ↔ Backend.
- DOC-SPC-001 — FR-09, FR-10, FR-13 (требования к интеграциям).
- DOC-SPC-002 — карта модулей (`backend/app/routers/`).

---

## История изменений

| Дата | Версия | Что изменилось | Автор |
|---|---|---|---|
| 2026-05-09 | v1.0 | Создан под H4 как сводный справочник | Кирбитов, Гуков |
