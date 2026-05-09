# UML Class diagram — связь компонентов АБИС (Кейс 8)

| Версия | Статус | Дата создания | Дата обновления |
|---|---|---|---|
| v1.0 | Final | 2026-05-09 | 2026-05-09 |

**Авторы документа.** Кирбитов А.Е. — модель и нотация; Гуков Я.Р. — соответствие классов в `backend/app/models.py` и `backend/app/routers/`; Коптилин И.Р. — frontend-компоненты в `src/`.

**Назначение.** Объектная модель АБИС в нотации UML Class. Документ закрывает пункт 3 содержания финальной защиты согласно дорожной карте курса — «Связь компонентов (UML Class)». Соединяет ERD (DOC-DAT-001) и архитектуру (DOC-SPC-002) на уровне классов и их зависимостей.

---

## 1. Backend: доменные классы

```
                ┌─────────────────────────────┐
                │       <<enum>> UserRole     │
                │ ─────────────────────────── │
                │ + ADMIN     : str           │
                │ + LIBRARIAN : str           │
                │ + READER    : str           │
                └──────────────┬──────────────┘
                               │ 1
                               │
                               │ assigns
                               │
                               ▼ *
┌────────────────────────────────────────────────────────────┐
│                          User                              │
│ ────────────────────────────────────────────────────────── │
│ - username       : str  «PK»                               │
│ - password_hash  : str                                     │
│ - role           : UserRole                                │
│ - reader_id      : str  «FK Reader, nullable»              │
│ ────────────────────────────────────────────────────────── │
│ + verify_password(plain: str)        : bool                │
│ + create_token()                      : str                │
│ + has_role(*roles: UserRole)          : bool               │
└──────────┬─────────────────────────────────────────────────┘
           │ 0..1                              ┌────────────────────────┐
           │ associated with                   │       AuditLog         │
           ▼ 1                                 │ ────────────────────── │
   ┌───────────────────────┐                   │ - id          : int    │
   │       Reader          │ 1     creates *   │ - timestamp   : datetime│
   │ ───────────────────── │◄──────────────────┤ - user_id     : str    │
   │ - reader_id : str «PK»│                   │ - entity_type : str    │
   │ - fio       : str     │                   │ - entity_id   : str    │
   │ - group     : str     │                   │ - action      : str    │
   │ ───────────────────── │                   │ - details     : json   │
   │ + active_loans()      │                   │ ────────────────────── │
   │ + is_blocked() : bool │                   │ + write(action, ...)   │
   └─────────┬─────────────┘                   └────────────────────────┘
             │ 1
             │ borrows
             │
             ▼ *
   ┌─────────────────────────────────┐
   │             Loan                │            ┌──────────────────────┐
   │ ─────────────────────────────── │     *      │         Book         │
   │ - loan_id      : str «PK»       │     ┌──────┤ ──────────────────── │
   │ - reader_id    : str «FK»       │     │  1   │ - book_code : str «PK»│
   │ - book_code    : str «FK»       │◄────┘      │ - title     : str    │
   │ - issue_date   : date           │ borrowed   │ - author    : str    │
   │ - due_date     : date           │            │ - year      : int    │
   │ - return_date  : date «nullable»│            │ - udk       : str    │
   │ ─────────────────────────────── │            │ ──────────────────── │
   │ + is_active()       : bool      │            │ + has_active_loan()  │
   │ + days_overdue()    : int       │            │ + delete_safely()    │
   │ + close(today)                  │            └──────────────────────┘
   └─────────────────────────────────┘
                     │
                     │ ◄─── enforces ─── BR-01..BR-06 (LoanService)
                     ▼
            ┌────────────────────────────────────┐
            │        <<service>> LoanService     │
            │ ────────────────────────────────── │
            │ + create(reader, book, due_date)   │
            │ + return_book(loan_id, today)      │
            │ + check_BR01_unique_active()       │
            │ + check_BR03_overdue(today)        │
            └────────────────────────────────────┘
```

### 1.1. Сущностные классы (мапятся в SQLAlchemy `models.py`)

| Класс | Файл | PK / FK |
|---|---|---|
| `Book` | `backend/app/models.py` | PK `book_code` |
| `Reader` | `backend/app/models.py` | PK `reader_id` |
| `Loan` | `backend/app/models.py` | PK `loan_id`, FK `reader_id`, FK `book_code` |
| `User` | `backend/app/models.py` | PK `username`, FK `reader_id` (nullable) |
| `AuditLog` | `backend/app/models.py` | PK `id` (autoincrement) |
| `UserRole` (enum) | `backend/app/models.py` | values: ADMIN, LIBRARIAN, READER |

### 1.2. Сервисные классы

| Класс | Назначение |
|---|---|
| `AuthService` (`auth.py`) | Хеширование паролей (bcrypt), генерация и проверка JWT, RBAC |
| `LoanService` (логика в `loans.py`) | Реализация BR-01..BR-06: контроль уникальной активной выдачи, расчёт дней просрочки |
| `ReportService` (логика в `reports.py`) | Агрегация KPI-1, KPI-2, фильтрация просрочек, ТОП-N |
| `ImportExportService` (`import_export.py`) | Идемпотентный CSV-импорт, экспорт books/overdue с BOM-кодировкой |

---

## 2. Frontend: классы и контексты

```
        ┌─────────────────────────────────┐
        │        <<context>>              │
        │        AuthContext              │
        │ ─────────────────────────────── │
        │ - user      : User              │
        │ - token     : string            │
        │ - role      : UserRole          │
        │ ─────────────────────────────── │
        │ + login(username, pwd)          │
        │ + logout()                      │
        │ + isAuthorized(role)  : bool    │
        └────────────────┬────────────────┘
                         │ provides
                         ▼
          ┌──────────────────────────────┐
          │      <<HOC>> RoleGuard       │
          │ ──────────────────────────── │
          │ + render(children, allowed)  │
          └──────────────┬───────────────┘
                         │ wraps
                         ▼
        ┌─────────────────────────────────┐
        │       <<page>> Page (abstract)  │
        └────┬────┬────┬────┬────┬────┬───┘
             │    │    │    │    │    │
       ┌─────┘    │    │    │    │    └────────┐
       ▼          ▼    ▼    ▼    ▼              ▼
   LoginPage   HomePage Catalog Loans   Integration  ...

                          ▲
                          │ uses
                          │
                ┌─────────┴──────────┐
                │   <<service>>      │
                │   ApiClient        │
                │ ────────────────── │
                │ - baseUrl: string  │
                │ - token : string   │
                │ ────────────────── │
                │ + get(path)        │
                │ + post(path, body) │
                │ + put(path, body)  │
                │ + delete(path)     │
                └────────────────────┘
```

### 2.1. Frontend-классы (TypeScript)

| Класс / модуль | Файл | Тип |
|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` | React Context |
| `RoleGuard` | `src/components/layout/RoleGuard.tsx` | HOC |
| `ApiClient` | `src/services/api.ts` | Service singleton |
| `Page` (по 9 экранам) | `src/pages/*.tsx` | React FC |
| `BookCard`, `LoanForm`, `KpiWidget`, ... | `src/components/*.tsx` | UI-компоненты |

---

## 3. Зависимости между слоями

```
   Frontend                Backend                    Storage
   ────────                ────────                  ─────────
   AuthContext ────HTTPS───► auth.py    ──orm──►    User table
   ApiClient   ────HTTPS───► books.py   ──orm──►    Book table
                            readers.py  ──orm──►    Reader table
                            loans.py    ──orm──►    Loan table
                            reports.py  ──read──►   {Loan, Book, Reader} JOIN
                            import_export.py ──orm──► {Book, Reader, Loan}
                            ↓
                         LoanService  ──enforces──► BR-01..BR-06
                            ↓
                         AuditLog write on every state change
                            
   1С (внешняя система) ────CSV──► import_export.py ──orm──► tables
                       ◄───CSV────                  ◄──read──
```

---

## 4. Связь с RoadMap

| RoadMap (CP4 пункт) | Документ-источник |
|---|---|
| 1. Демо UI-прототипа | DOC-OPS-001 |
| **2. Архитектурная схема (UML Component)** | DOC-SPC-002 |
| **3. Связь компонентов (UML Class)** | **этот документ (DOC-ARC-004)** |
| 4. API/JSON взаимодействие | spec/openapi.yaml + DOC-SPC-003 |
| 5. Артефакты 1С | 1c/README.md + DOC-INT-003 |
| 6. Тестовые данные и сценарий загрузки | data/T1/ + backend/tests/test_abis.py |
| 7. Финальное ТЗ | DOC-SPC-001 |
| 8. Демо-сценарий | DOC-OPS-001 |

---

## 5. Принципы дизайна

- **Anemic vs Rich models.** В backend сущности (`Book`, `Reader`) — простые dataclass-подобные модели; бизнес-логика вынесена в *Service*-классы (`LoanService`, `ReportService`). Это упрощает тестирование (см. `test_abis.py`).
- **Single source of truth для ролей.** `UserRole` — один enum, переиспользуется в backend (`models.py`) и в `AuthContext` на frontend (как тип-зеркало).
- **Свойство `is_active()` у `Loan`** — единственная точка истины для определения «выдача открыта»; используется в `LoanService.check_BR01_unique_active()`, в фильтрах `LoansPage`, в дашборде.
- **AuditLog как side effect.** Любая операция, меняющая состояние, дополнительно вызывает `AuditLog.write()` — это закрывает FR-12 без захламления роутеров условиями.

---

## 6. Связь с другими документами

- DOC-DAT-001 — ERD (физическая модель таблиц).
- DOC-SPC-002 — UML Component (модули и слои).
- DOC-ARC-001 — BPMN (как BR-01..BR-06 действуют в процессе).
- DOC-INT-003 — маппинг полей 1С ↔ классы backend.

---

## История изменений

| Дата | Версия | Что изменилось | Автор |
|---|---|---|---|
| 2026-05-09 | v1.0 | Документ создан под H4 (закрытие требования RoadMap) | Кирбитов |
