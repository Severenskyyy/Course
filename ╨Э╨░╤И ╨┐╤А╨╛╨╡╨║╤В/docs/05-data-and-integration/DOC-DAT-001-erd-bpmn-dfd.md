# Модели данных и процессов — АБИС (Кейс 8)

## 1. ERD (Entity-Relationship Diagram)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   books      │       │   readers    │       │     users        │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ PK book_code │◄──┐   │ PK reader_id │◄──┐   │ PK user_id      │
│    title     │   │   │    fio       │   │   │    username      │
│    author    │   │   │    group     │   │   │    password_hash │
│    year      │   │   │    email     │   │   │    role          │
│    udk       │   │   │    phone     │   │   │    full_name     │
│    is_avail  │   │   └──────────────┘   │   │ FK reader_id ────┼──► readers
│    created_at│   │                      │   └──────────────────┘
└──────────────┘   │   ┌──────────────┐   │          │
                   │   │    loans     │   │          │
                   │   ├──────────────┤   │   ┌──────┴─────────┐
                   └───┤FK book_code  │   │   │   audit_log    │
                       │FK reader_id──┼───┘   ├────────────────┤
                       │PK loan_id    │       │ PK log_id      │
                       │  issue_date  │       │ FK user_id     │
                       │  due_date    │       │    entity_type  │
                       │  return_date │       │    entity_id    │
                       │  created_by  │       │    action       │
                       └──────┬───────┘       │    old_value    │
                              │               │    new_value    │
                       ┌──────┴───────┐       │    created_at   │
                       │ reservations │       └────────────────┘
                       ├──────────────┤
                       │PK reserv_id  │       ┌────────────────┐
                       │FK reader_id  │       │ notifications  │
                       │FK book_code  │       ├────────────────┤
                       │  reserved_at │       │PK notif_id     │
                       │  expires_at  │       │FK reader_id    │
                       │  is_active   │       │FK loan_id      │
                       └──────────────┘       │   type, title  │
                                              │   message      │
                                              │   is_read      │
                                              └────────────────┘
```

**Связи:** books 1:N loans, readers 1:N loans, users 1:N audit_log, readers 1:N reservations, readers 1:N notifications

**7 сущностей**, все в 3НФ.

---

## 2. BPMN — Процесс выдачи и возврата книги

**Участники (Lanes):** Читатель, Библиотекарь, Система АБИС

**Поток:**
1. [Начало] → Читатель запрашивает книгу
2. Библиотекарь ищет книгу и читателя в системе
3. Система проверяет: экземпляр свободен? (gateway)
   - Нет → Отказ → [Конец]
   - Да → Продолжение
4. Библиотекарь оформляет выдачу
5. Система записывает loan: issue_date, due_date, return_date=NULL
6. ... (время пользования) ...
7. Читатель возвращает книгу
8. Библиотекарь оформляет возврат
9. Система: обновляет return_date, рассчитывает days_overdue
10. Система: если просрочка — фиксирует в отчёте
11. Библиотекарь формирует отчёт «Просрочки»
12. [Конец]

---

## 3. DFD (Data Flow Diagram)

```
                    ┌─────────────┐
                    │  CSV-файлы  │
                    │(books,      │
                    │ readers,    │
                    │ loans)      │
                    └──────┬──────┘
                           │ импорт
                    ┌──────▼──────┐
┌──────────┐        │  Процесс    │        ┌──────────┐
│Библио-   │◄──────►│  Управление │◄──────►│  БД      │
│текарь    │ формы  │  выдачами   │ SQL    │  SQLite  │
└──────────┘        └──────┬──────┘        └──────────┘
                           │ отчёт
                    ┌──────▼──────┐
                    │  Отчёт      │
                    │ «Просрочки» │
                    │  + CSV      │
                    └─────────────┘
```

**Внешние сущности:** Библиотекарь, Администратор, Читатель, 1С:Предприятие  
**Процессы:** Управление каталогом, Управление выдачами, Формирование отчётов, Импорт/экспорт CSV  
**Хранилища:** БД SQLite (books, readers, loans, users, audit_log)

---

## 4. Таблица маппинга данных

| Источник | Поле источника | Приёмник | Поле приёмника | Преобразование |
|----------|---------------|----------|----------------|---------------|
| books.csv | book_code | books (SQLite) | book_code | Без преобразования (PK) |
| books.csv | title | books (SQLite) | title | TRIM, NOT NULL |
| books.csv | author | books (SQLite) | author | TRIM, NOT NULL |
| books.csv | year | books (SQLite) | year | INT, диапазон 1000-2100 |
| books.csv | udk | books (SQLite) | udk | TRIM |
| readers.csv | reader_id | readers (SQLite) | reader_id | Без преобразования (PK) |
| readers.csv | fio | readers (SQLite) | fio | TRIM, NOT NULL |
| readers.csv | group | readers (SQLite) | group_name | TRIM, NOT NULL |
| loans.csv | loan_id | loans (SQLite) | loan_id | Без преобразования (PK) |
| loans.csv | reader_id | loans (SQLite) | reader_id | FK→readers, проверка |
| loans.csv | book_code | loans (SQLite) | book_code | FK→books, проверка |
| loans.csv | issue_date | loans (SQLite) | issue_date | ISO date, ≤ due_date |
| loans.csv | due_date | loans (SQLite) | due_date | ISO date, ≥ issue_date |
| loans.csv | return_date | loans (SQLite) | return_date | ISO date или NULL |
| SQLite loans | * | 1С Регистр Выдачи | * | Экспорт CSV, поля соответствуют |

---

## 5. Лист KPI

| KPI | Формула | Единицы | Целевое значение | Источник | Метод измерения |
|-----|---------|---------|-----------------|----------|----------------|
| Доля просроченных выдач | (просрочки / активные) × 100 | % | ≤ 15% | /api/reports/kpi | Автоматический расчёт |
| Средняя просрочка | SUM(days_overdue) / COUNT(overdue) | дни | ≤ 7 дней | /api/reports/overdue | Вычисляемое поле |
| Медианная просрочка | MEDIAN(days_overdue) | дни | ≤ 5 дней | /api/reports/overdue | Статистика |
| Оборачиваемость фонда | выданные / всего книг × 100 | % | ≥ 30% | /api/reports/kpi | Автоматический расчёт |
| Идемпотентность импорта | дубли при повторной загрузке | шт. | 0 | Тест CSV дважды | Ручная проверка |
