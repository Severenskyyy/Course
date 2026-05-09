"""
Генератор синтетических данных для АБИС (Кейс 8)
T1: books 200-300, readers 120-200, loans 400-800
"""
import csv
import random
import os
from datetime import date, timedelta

random.seed(42)

OUT = os.path.dirname(os.path.abspath(__file__))
T1 = os.path.join(OUT, "T1")
GOLDEN = os.path.join(OUT, "golden")
INVALID = os.path.join(OUT, "invalid")
SCHEMAS = os.path.join(OUT, "schemas")
os.makedirs(T1, exist_ok=True)
os.makedirs(GOLDEN, exist_ok=True)
os.makedirs(INVALID, exist_ok=True)
os.makedirs(SCHEMAS, exist_ok=True)

# === BOOKS (250 records) ===
authors = [
    "Пушкин А.С.", "Толстой Л.Н.", "Достоевский Ф.М.", "Чехов А.П.",
    "Гоголь Н.В.", "Тургенев И.С.", "Булгаков М.А.", "Горький М.",
    "Есенин С.А.", "Маяковский В.В.", "Ахматова А.А.", "Цветаева М.И.",
    "Блок А.А.", "Бунин И.А.", "Куприн А.И.", "Шолохов М.А.",
    "Пастернак Б.Л.", "Солженицын А.И.", "Набоков В.В.", "Замятин Е.И.",
    "Платонов А.П.", "Зощенко М.М.", "Ильф И.А.", "Петров Е.П.",
    "Островский А.Н.", "Грибоедов А.С.", "Лермонтов М.Ю.", "Некрасов Н.А.",
    "Тютчев Ф.И.", "Фет А.А."
]

titles = [
    "Евгений Онегин", "Война и мир", "Преступление и наказание", "Вишнёвый сад",
    "Мёртвые души", "Отцы и дети", "Мастер и Маргарита", "На дне",
    "Стихотворения", "Облако в штанах", "Реквием", "Поэма горы",
    "Двенадцать", "Тёмные аллеи", "Гранатовый браслет", "Тихий Дон",
    "Доктор Живаго", "Архипелаг ГУЛАГ", "Защита Лужина", "Мы",
    "Котлован", "Аристократка", "Двенадцать стульев", "Золотой телёнок",
    "Гроза", "Горе от ума", "Герой нашего времени", "Кому на Руси жить хорошо",
    "Весенние воды", "Шёпот, робкое дыханье", "Анна Каренина", "Идиот",
    "Бесы", "Братья Карамазовы", "Обломов", "Дворянское гнездо",
    "Собачье сердце", "Белая гвардия", "Ревизор", "Капитанская дочка",
    "Руслан и Людмила", "Пиковая дама", "Дубровский", "Палата №6",
    "Три сестры", "Дядя Ваня", "Чайка", "Записки из подполья",
    "Бедные люди", "Воскресение"
]

udks = ["84(2Рус)", "84(2Рус)-1", "84(2Рус)-4", "82.09", "821.161.1"]

books = []
for i in range(250):
    book_code = f"BK{str(i+1).zfill(4)}"
    title = titles[i % len(titles)]
    if i >= len(titles):
        title = f"{title} (экз. {i // len(titles) + 1})"
    author = authors[i % len(authors)]
    year = random.randint(1820, 2024)
    udk = udks[i % len(udks)]
    books.append({"book_code": book_code, "title": title, "author": author, "year": year, "udk": udk})

with open(os.path.join(T1, "books.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["book_code", "title", "author", "year", "udk"])
    w.writeheader()
    w.writerows(books)

# === READERS (150 records) ===
first_names_m = ["Александр", "Дмитрий", "Сергей", "Андрей", "Михаил", "Иван", "Артём", "Максим", "Никита", "Кирилл", "Егор", "Даниил", "Роман", "Владимир", "Олег"]
first_names_f = ["Мария", "Анна", "Елена", "Ольга", "Наталья", "Екатерина", "Татьяна", "Ирина", "Юлия", "Дарья", "Алина", "Виктория", "Полина", "София", "Ксения"]
last_names = ["Иванов", "Петров", "Сидоров", "Козлов", "Новиков", "Морозов", "Волков", "Соколов", "Лебедев", "Кузнецов", "Попов", "Смирнов", "Васильев", "Павлов", "Фёдоров", "Николаев", "Алексеев", "Степанов", "Зайцев", "Орлов"]
patronymics_m = ["Александрович", "Дмитриевич", "Сергеевич", "Михайлович", "Андреевич", "Иванович", "Олегович", "Владимирович"]
patronymics_f = ["Александровна", "Дмитриевна", "Сергеевна", "Михайловна", "Андреевна", "Ивановна", "Олеговна", "Владимировна"]
groups = ["ИС-21", "ИС-22", "ИС-23", "ИС-24", "ПИ-21", "ПИ-22", "ПИ-23", "ММ-21", "ММ-22", "ФИЗ-21", "ФИЗ-22", "ХИМ-21", "ХИМ-22", "ЭК-21", "ЭК-22"]

readers = []
for i in range(150):
    reader_id = f"RD{str(i+1).zfill(4)}"
    if i % 2 == 0:
        fn = random.choice(first_names_m)
        ln = random.choice(last_names)
        pt = random.choice(patronymics_m)
    else:
        fn = random.choice(first_names_f)
        ln = random.choice(last_names) + "а" if not random.choice(last_names).endswith("о") else random.choice(last_names)
        pt = random.choice(patronymics_f)
    fio = f"{ln} {fn} {pt}"
    group = random.choice(groups)
    readers.append({"reader_id": reader_id, "fio": fio, "group": group})

with open(os.path.join(T1, "readers.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["reader_id", "fio", "group"])
    w.writeheader()
    w.writerows(readers)

# === LOANS (600 records) ===
TODAY = date(2026, 4, 12)
loans = []
active_books = set()  # Track to avoid duplicate active loans on same book

for i in range(600):
    loan_id = f"LN{str(i+1).zfill(5)}"
    reader_id = f"RD{str(random.randint(1, 150)).zfill(4)}"
    
    # Pick a book_code, avoiding duplicates for active loans
    book_idx = random.randint(1, 250)
    book_code = f"BK{str(book_idx).zfill(4)}"
    
    if i < 80:
        # Active loans - no return
        issue_date = TODAY - timedelta(days=random.randint(3, 20))
        due_date = issue_date + timedelta(days=random.randint(7, 21))
        return_date = ""
        while book_code in active_books:
            book_idx = random.randint(1, 250)
            book_code = f"BK{str(book_idx).zfill(4)}"
        active_books.add(book_code)
    elif i < 140:
        # Active overdue loans - no return, past due
        issue_date = TODAY - timedelta(days=random.randint(20, 60))
        due_date = TODAY - timedelta(days=random.randint(1, 25))
        return_date = ""
        while book_code in active_books:
            book_idx = random.randint(1, 250)
            book_code = f"BK{str(book_idx).zfill(4)}"
        active_books.add(book_code)
    elif i < 400:
        # Returned on time
        issue_date = TODAY - timedelta(days=random.randint(30, 180))
        due_date = issue_date + timedelta(days=random.randint(7, 21))
        return_date = (issue_date + timedelta(days=random.randint(3, (due_date - issue_date).days))).isoformat()
    else:
        # Returned late
        issue_date = TODAY - timedelta(days=random.randint(40, 200))
        due_date = issue_date + timedelta(days=random.randint(7, 14))
        return_date = (due_date + timedelta(days=random.randint(1, 30))).isoformat()
    
    loans.append({
        "loan_id": loan_id,
        "reader_id": reader_id,
        "book_code": book_code,
        "issue_date": issue_date.isoformat(),
        "due_date": due_date.isoformat(),
        "return_date": return_date
    })

with open(os.path.join(T1, "loans.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["loan_id", "reader_id", "book_code", "issue_date", "due_date", "return_date"])
    w.writeheader()
    w.writerows(loans)

# === GOLDEN: overdue.csv ===
from collections import defaultdict
reader_stats = defaultdict(lambda: {"loans_total": 0, "overdue_cnt": 0, "overdue_days_sum": 0})

for loan in loans:
    rid = loan["reader_id"]
    reader_stats[rid]["loans_total"] += 1
    
    due = date.fromisoformat(loan["due_date"])
    ret = loan["return_date"]
    
    if ret == "":
        # Active loan
        if TODAY > due:
            reader_stats[rid]["overdue_cnt"] += 1
            reader_stats[rid]["overdue_days_sum"] += (TODAY - due).days
    else:
        ret_date = date.fromisoformat(ret)
        if ret_date > due:
            reader_stats[rid]["overdue_cnt"] += 1
            reader_stats[rid]["overdue_days_sum"] += (ret_date - due).days

golden = []
for rid in sorted(reader_stats.keys()):
    s = reader_stats[rid]
    if s["overdue_cnt"] > 0:
        golden.append({
            "reader_id": rid,
            "loans_total": s["loans_total"],
            "overdue_cnt": s["overdue_cnt"],
            "overdue_days_sum": s["overdue_days_sum"]
        })

with open(os.path.join(GOLDEN, "overdue.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["reader_id", "loans_total", "overdue_cnt", "overdue_days_sum"])
    w.writeheader()
    w.writerows(golden)

# === INVALID data files ===
# Invalid books - missing required fields
with open(os.path.join(INVALID, "books_invalid.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["book_code", "title", "author", "year", "udk"])
    w.writerow(["", "Книга без кода", "Автор", "2020", "84"])  # empty PK
    w.writerow(["BK9999", "", "Автор", "2020", "84"])  # empty title
    w.writerow(["BK9998", "Книга", "Автор", "abc", "84"])  # invalid year

# Invalid loans - broken dates, missing FK
with open(os.path.join(INVALID, "loans_invalid.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["loan_id", "reader_id", "book_code", "issue_date", "due_date", "return_date"])
    w.writerow(["LN99001", "RD9999", "BK0001", "2026-01-01", "2026-01-14", ""])  # FK violation: reader not exists
    w.writerow(["LN99002", "RD0001", "BK9999", "2026-01-01", "2026-01-14", ""])  # FK violation: book not exists
    w.writerow(["LN99003", "RD0001", "BK0001", "2026-02-01", "2026-01-14", ""])  # issue > due

# === SCHEMA ===
with open(os.path.join(SCHEMAS, "schema.md"), "w", encoding="utf-8") as f:
    f.write("""# Schema — АБИС Кейс 8

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
""")

# Summary
total_active = sum(1 for l in loans if l["return_date"] == "")
total_overdue_active = sum(1 for l in loans if l["return_date"] == "" and date.fromisoformat(l["due_date"]) < TODAY)
print(f"Generated: {len(books)} books, {len(readers)} readers, {len(loans)} loans")
print(f"Active loans: {total_active}, Active overdue: {total_overdue_active}")
print(f"Overdue %: {total_overdue_active/total_active*100:.1f}%")
print(f"Golden records: {len(golden)} readers with overdue history")
