# Schema — АБИС Кейс 8

## books.csv
| Поле | Тип | PK/FK | Обязательность | Домен |
|------|-----|-------|----------------|-------|
| book_code | string(20) | PK | Да | Уникальный, не пустой |
| title | string(255) | — | Да | Не пустой |
| author | string(255) | — | Да | Не пустой |
| year | integer | — | Нет | 1000..2100 |
| udk | string(50) | — | Нет | Формат УДК |

## readers.csv
| Поле | Тип | PK/FK | Обязательность | Домен |
|------|-----|-------|----------------|-------|
| reader_id | string(20) | PK | Да | Уникальный, не пустой |
| fio | string(255) | — | Да | Не пустой |
| group | string(100) | — | Да | Не пустой |

## loans.csv
| Поле | Тип | PK/FK | Обязательность | Домен |
|------|-----|-------|----------------|-------|
| loan_id | string(20) | PK | Да | Уникальный, не пустой |
| reader_id | string(20) | FK→readers | Да | Существует в readers |
| book_code | string(20) | FK→books | Да | Существует в books |
| issue_date | date (ISO) | — | Да | <= due_date |
| due_date | date (ISO) | — | Да | >= issue_date |
| return_date | date (ISO) | — | Нет | >= issue_date; null = активная выдача |

## Бизнес-правила
1. Один book_code — не более 1 активной выдачи (return_date пустой)
2. issue_date <= due_date
3. Если return_date задана: return_date >= issue_date
4. Просрочка: return_date IS NULL AND today > due_date, ИЛИ return_date > due_date
