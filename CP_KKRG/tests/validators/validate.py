"""
Валидатор данных АБИС (Кейс 8)
Проверяет формат, целостность и бизнес-правила CSV-файлов
"""
import csv
import sys
import os
from datetime import date

def load_csv(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))

def validate(data_dir):
    errors = []
    warnings = []
    
    books_path = os.path.join(data_dir, "books.csv")
    readers_path = os.path.join(data_dir, "readers.csv")
    loans_path = os.path.join(data_dir, "loans.csv")
    
    for p in [books_path, readers_path, loans_path]:
        if not os.path.exists(p):
            errors.append(f"ФАЙЛ НЕ НАЙДЕН: {p}")
            return errors, warnings
    
    books = load_csv(books_path)
    readers = load_csv(readers_path)
    loans = load_csv(loans_path)
    
    # --- V1: Обязательные поля ---
    book_codes = set()
    for i, b in enumerate(books, 2):
        if not b.get("book_code", "").strip():
            errors.append(f"books.csv строка {i}: пустой book_code")
        elif b["book_code"] in book_codes:
            errors.append(f"books.csv строка {i}: дублирующийся book_code '{b['book_code']}'")
        else:
            book_codes.add(b["book_code"])
        if not b.get("title", "").strip():
            errors.append(f"books.csv строка {i}: пустой title")
        if not b.get("author", "").strip():
            errors.append(f"books.csv строка {i}: пустой author")
    
    reader_ids = set()
    for i, r in enumerate(readers, 2):
        if not r.get("reader_id", "").strip():
            errors.append(f"readers.csv строка {i}: пустой reader_id")
        elif r["reader_id"] in reader_ids:
            errors.append(f"readers.csv строка {i}: дублирующийся reader_id '{r['reader_id']}'")
        else:
            reader_ids.add(r["reader_id"])
        if not r.get("fio", "").strip():
            errors.append(f"readers.csv строка {i}: пустой fio")
        if not r.get("group", "").strip():
            errors.append(f"readers.csv строка {i}: пустой group")
    
    # --- V2-V7: Loans validation ---
    loan_ids = set()
    active_books = set()
    
    for i, l in enumerate(loans, 2):
        lid = l.get("loan_id", "").strip()
        if not lid:
            errors.append(f"loans.csv строка {i}: пустой loan_id")
            continue
        if lid in loan_ids:
            errors.append(f"loans.csv строка {i}: дублирующийся loan_id '{lid}'")
        loan_ids.add(lid)
        
        # V4: FK readers
        rid = l.get("reader_id", "").strip()
        if rid not in reader_ids:
            errors.append(f"loans.csv строка {i}: reader_id '{rid}' не найден в readers")
        
        # V5: FK books
        bc = l.get("book_code", "").strip()
        if bc not in book_codes:
            errors.append(f"loans.csv строка {i}: book_code '{bc}' не найден в books")
        
        # V2: issue_date <= due_date
        try:
            issue = date.fromisoformat(l["issue_date"])
            due = date.fromisoformat(l["due_date"])
            if issue > due:
                errors.append(f"loans.csv строка {i}: issue_date ({issue}) > due_date ({due})")
        except (ValueError, KeyError) as e:
            errors.append(f"loans.csv строка {i}: невалидная дата: {e}")
            continue
        
        # V3: return_date >= issue_date
        ret = l.get("return_date", "").strip()
        if ret:
            try:
                ret_date = date.fromisoformat(ret)
                if ret_date < issue:
                    errors.append(f"loans.csv строка {i}: return_date ({ret_date}) < issue_date ({issue})")
            except ValueError:
                errors.append(f"loans.csv строка {i}: невалидная return_date '{ret}'")
        
        # V6: One active loan per book_code
        if not ret:
            if bc in active_books:
                errors.append(f"loans.csv строка {i}: book_code '{bc}' уже имеет активную выдачу")
            active_books.add(bc)
    
    # --- Summary ---
    print(f"\n{'='*50}")
    print(f"Валидация данных АБИС")
    print(f"{'='*50}")
    print(f"Книги:    {len(books)} записей")
    print(f"Читатели: {len(readers)} записей")
    print(f"Выдачи:   {len(loans)} записей")
    print(f"{'='*50}")
    
    if errors:
        print(f"\n❌ ОШИБКИ ({len(errors)}):")
        for e in errors[:20]:
            print(f"  - {e}")
        if len(errors) > 20:
            print(f"  ... и ещё {len(errors) - 20} ошибок")
    else:
        print("\n✅ Ошибок не обнаружено")
    
    if warnings:
        print(f"\n⚠️  ПРЕДУПРЕЖДЕНИЯ ({len(warnings)}):")
        for w in warnings:
            print(f"  - {w}")
    
    print(f"\nИтог: {'ПРОВАЛ' if errors else 'УСПЕХ'}")
    return errors, warnings

if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "T1")
    errors, _ = validate(data_dir)
    sys.exit(1 if errors else 0)
