# АБИС — Автоматизированная библиотечно-информационная система

**Кейс 8:** Библиотека — выдача и просрочки  
**Отрасль:** Образование / Госсектор  
**Команда:** Кирбитов А.Е. · Рабаданов А.С. · Гуков Я.Р. · Коптилин И.Р.

## Quick Start

### Frontend (React)
```bash
npm install
npm run dev          # → http://localhost:5173
```
Логины: `admin`/`admin123`, `librarian`/`lib123`, `reader`/`reader123`

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # → http://localhost:8000/docs
```

### Тесты
```bash
cd backend && pytest tests/ -v              # 17 тестов
python tests/validators/validate.py data/T1  # валидация CSV
```

## Структура проекта

```
├── src/                 # Frontend: React 18 + TypeScript + Tailwind (9 экранов)
├── backend/             # Backend: FastAPI + SQLite + JWT (8 роутеров)
├── 1c/                  # 1С:Предприятие 8.3 (справочники, документы, отчёт СКД)
├── data/                # T1 (250+150+600), golden, invalid
├── docs/                # Документация (по образцу примера проекта)
├── spec/                # OpenAPI спецификация
├── qa/                  # Acceptance-чеклист (9 AC)
└── tests/               # Валидаторы данных
```

## KPI

| Показатель | Целевое | Метод |
|---|---|---|
| Доля просрочек | ≤ 15% | /api/reports/kpi |
| Скорость отчёта | < 3 сек | Замер API |
| Идемпотентность | 0 дублей | Повторная загрузка CSV |

## Технологии

Frontend: React 18, TypeScript, Tailwind CSS, Vite  
Backend: Python, FastAPI, SQLite, aiosqlite, JWT  
1С: Платформа 1С:Предприятие 8.3, BSL, СКД  

## Репозиторий

https://github.com/Severenskyyy/CourseProjects
