# Логическая модель данных и ERD — АБИС (Кейс 8)

| Версия | Статус | Дата       |
|--------|--------|------------|
| v2.0   | Final  | 2026-04-25 |

## 1. Назначение

Документ фиксирует логическую модель данных проекта: список сущностей, их атрибуты, связи, первичные и внешние ключи. Модель нормализована до 3НФ и используется для генерации схемы БД и 1С-справочников.

## 2. Перечень сущностей (7)

| # | Сущность        | Назначение                                                   | Ключ (PK)   |
|---|-----------------|---------------------------------------------------------------|-------------|
| 1 | `books`         | Каталог экземпляров библиотеки                                | `book_code` |
| 2 | `readers`       | Зарегистрированные читатели                                   | `reader_id` |
| 3 | `loans`         | Журнал выдач и возвратов                                      | `loan_id`   |
| 4 | `users`         | Учётные записи системы (JWT-авторизация)                      | `user_id`   |
| 5 | `audit_log`     | Журнал действий пользователей                                 | `log_id`    |
| 6 | `reservations`  | Резерв экземпляра (Could, в MVP неактивно)                    | `reserv_id` |
| 7 | `notifications` | Уведомления читателям (Could, в MVP не исполняется)           | `notif_id`  |

## 3. ERD (диаграмма сущностей и связей)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   books      │       │   readers    │       │     users        │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ PK book_code │◄──┐   │ PK reader_id │◄──┐   │ PK user_id       │
│    title     │   │   │    fio       │   │   │    username      │
│    author    │   │   │    group     │   │   │    password_hash │
│    year      │   │   │    email     │   │   │    role          │
│    udk       │   │   │    phone     │   │   │    full_name     │
│    is_avail  │   │   └──────────────┘   │   │ FK reader_id ────┼──► readers
│    created_at│   │                      │   └──────────────────┘
└──────────────┘   │   ┌──────────────┐   │             │
                   │   │    loans     │   │             │ N:1
                   │   ├──────────────┤   │             ▼
                   └───┤FK book_code  │   │       ┌────────────────┐
                       │FK reader_id──┼───┘       │   audit_log    │
                       │PK loan_id    │           ├────────────────┤
                       │  issue_date  │           │ PK log_id      │
                       │  due_date    │           │ FK user_id     │
                       │  return_date │           │    entity_type │
                       │  created_by  │           │    entity_id   │
                       └──────┬───────┘           │    action      │
                              │                   │    old_value   │
                              │ опционально       │    new_value   │
                              ▼                   │    created_at  │
                       ┌──────────────┐           └────────────────┘
                       │ reservations │
                       ├──────────────┤           ┌────────────────┐
                       │PK reserv_id  │           │ notifications  │
                       │FK reader_id  │           ├────────────────┤
                       │FK book_code  │           │ PK notif_id    │
                       │  reserved_at │           │ FK reader_id   │
                       │  expires_at  │           │ FK loan_id     │
                       │  is_active   │           │   type, title  │
                       └──────────────┘           │   message      │
                                                  │   is_read      │
                                                  └────────────────┘
```

## 4. Связи (Relationships)

| № | Источник         | Цель            | Кардинальность | Ограничение             |
|---|------------------|-----------------|----------------|-------------------------|
| R1 | `books`         | `loans`         | 1:N            | `ON DELETE RESTRICT`    |
| R2 | `readers`       | `loans`         | 1:N            | `ON DELETE RESTRICT`    |
| R3 | `users`         | `audit_log`     | 1:N            | `ON DELETE SET NULL`    |
| R4 | `readers`       | `users`         | 1:1 (опц.)     | `ON DELETE SET NULL`    |
| R5 | `readers`       | `reservations`  | 1:N            | `ON DELETE CASCADE`     |
| R6 | `books`         | `reservations`  | 1:N            | `ON DELETE CASCADE`     |
| R7 | `readers`       | `notifications` | 1:N            | `ON DELETE CASCADE`     |
| R8 | `loans`         | `notifications` | 1:N            | `ON DELETE CASCADE`     |

## 5. Бизнес-ограничения на уровне модели

1. **Один book_code — одна активная выдача:** уникальный частичный индекс
   `CREATE UNIQUE INDEX ON loans(book_code) WHERE return_date IS NULL`.
2. **Корректность дат:** `CHECK (issue_date <= due_date)` и
   `CHECK (return_date IS NULL OR return_date >= issue_date)`.
3. **Год издания:** `CHECK (year BETWEEN 1000 AND 2100)`.
4. **Роль в users:** `CHECK (role IN ('admin','librarian','reader'))`.
5. **Ссылочная целостность:** FK на `book_code` и `reader_id` обязательны при создании выдачи.

## 6. Нормализация

Модель приведена к **3НФ**:
- 1НФ: все атрибуты атомарны (ФИО не разбивается на 3 поля, это допустимое решение для учебного проекта).
- 2НФ: нет частичных зависимостей от составного ключа (все PK одиночные).
- 3НФ: нет транзитивных зависимостей (например, `title` зависит от `book_code`, а не от `loan_id`).

## 7. Соответствие 1С-объектам

| Сущность     | 1С-объект                           |
|--------------|-------------------------------------|
| books        | Справочник «Книги»                  |
| readers      | Справочник «Читатели»               |
| loans        | Документ «ВыдачаКниги» + «ВозвратКниги» + Регистр «Выдачи» |
| users        | Пользователи информационной базы    |
| audit_log    | Журнал регистрации (встроенный)     |

## 8. Связь с BPMN

Все сущности имеют трассировку к шагам BPMN-схемы (см. `DOC-ARC-001-business-process-and-user-flow.md`). Каждое состояние в процессе «выдача–возврат» изменяет атрибуты хотя бы одной из сущностей `loans`, `books.is_avail`, `audit_log`.
