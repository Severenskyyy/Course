# 📚 АБИС — Автоматизированная библиотечно-информационная система

**Кейс 8:** Библиотека — выдача и просрочки
**Курс:** Основы проектной деятельности (ОПД), РТУ МИРЭА
**Год:** 2025/2026

---

## Команда

| Роль                     | ФИО             | Профиль подготовки                       |
|--------------------------|-----------------|------------------------------------------|
| Team Lead / Аналитик     | Кирбицов А.Е.   | ПИ — Информатизация организаций          |
| 1С-разработчик           | Рабаданов А.С.  | ИСТ — Платформенные решения              |
| Fullstack-разработчик    | Гуков Я.Р.      | ИСТ — Фуллстек разработка (Backend/Data) |
| Fullstack-разработчик    | Коптилин И.Р.   | ИСТ — Фуллстек разработка (UI / Демо)    |

---

## Что реализовано

Система автоматизирует жизненный цикл выдачи библиотечного фонда:

1. Каталог экземпляров, справочник читателей.
2. Регистрация выдач и возвратов с контролем бизнес-правил (BR-01…BR-06).
3. Отчёт «Просрочки» с фильтрами и экспортом в CSV.
4. KPI-дашборд (доля просрочек, средняя/медианная, ТОП-N).
5. Идемпотентный импорт/экспорт CSV.
6. Три роли с разграничением прав (admin, librarian, reader).
7. Параллельная 1С-подсистема с такой же бизнес-логикой и обменом данными.

---

## Быстрый старт

### Frontend (React)

```bash
npm install
npm run dev          # → http://localhost:5173
```

Демо-логины: `admin` / `admin2026`, `librarian` / `library2026`, `reader` / `reader2026`.

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000           # → http://localhost:8000/docs
```

### Тесты

```bash
cd backend && pytest tests/ -v                      # 17 pytest-кейсов
python tests/validators/validate.py data/T1        # проверка T1-датасета
```

### 1С-подсистема

Инструкция: `1c/README.md` — загрузка конфигурации, импорт демо-данных, запуск рабочего места библиотекаря.

---

## Структура репозитория

```
Наш проект/
├── src/               # Frontend — React 18 + TypeScript + Tailwind + Vite (9 экранов)
├── backend/           # Backend — FastAPI + SQLite + JWT (8 роутеров, 17 тестов)
├── 1c/                # 1С:Предприятие 8.3 — справочники, документы, регистр, отчёт СКД
├── data/              # Синтетический датасет T1 (250 книг, 150 читателей, 600 выдач)
│   ├── generate_data.py
│   ├── T1/            # Основной набор
│   ├── golden/        # Эталонные срезы для сверки
│   └── invalid/       # Заведомо ошибочные примеры
├── docs/              # Документация (структура DOC-CAT-NNN согласно DOC-STD-001)
│   ├── 00-governance/
│   ├── 01-discovery/
│   ├── 02-requirements/
│   ├── 03-planning/
│   ├── 04-architecture/
│   ├── 05-data-and-integration/
│   ├── 06-final-specification/
│   ├── 07-validation-and-delivery/
│   ├── 90-checkpoints/       # Материалы Хакатонов 1-4
│   ├── 98-source-materials/  # Исходный кейс 8
│   └── 99-standards/
├── spec/              # OpenAPI 3.1 спецификация
├── qa/                # Acceptance-чеклист
└── tests/             # Валидаторы CSV и golden-сверка
```

---

## KPI проекта (соответствие ТЗ)

| Показатель                   | Целевое значение | Источник                              |
|------------------------------|------------------|---------------------------------------|
| Доля просроченных выдач      | ≤ 15 %           | `GET /api/reports/kpi`                |
| Средняя просрочка            | ≤ 7 дней         | Отчёт «Просрочки»                     |
| Медианная просрочка          | ≤ 5 дней         | Отчёт «Просрочки»                     |
| Время построения отчёта T1   | < 1 сек          | Замер API                             |
| Идемпотентность импорта      | 0 дублей         | Повторная загрузка того же CSV        |
| Покрытие тестами API         | ≥ 80 %           | `pytest --cov`                        |
| Acceptance-критерии MVP      | 100 %            | `qa/acceptance_checklist.md`          |

---

## Критерии приёмки Кейса 8

| № | Критерий                                                    | Где проверить                                 |
|---|-------------------------------------------------------------|-----------------------------------------------|
| 1 | Корректные статусы выдач (включая просрочку)                | UI `LoansPage`, 1С «Рабочее место»            |
| 2 | Отчёт «Просрочки» (reader_id, book_code, days_overdue)      | UI `OverduePage`, 1С «Отчёт Просрочки»        |
| 3 | Экспорт отчёта в CSV                                        | Кнопка «Экспорт CSV» в обоих интерфейсах       |
| 4 | README со шагами проверки                                   | Этот файл + `docs/07-.../DOC-OPS-002...`       |

---

## Ключевые документы

| Документ                                                    | Где                                           |
|-------------------------------------------------------------|-----------------------------------------------|
| Карточка проекта                                            | `docs/00-governance/DOC-GOV-001-...docx`      |
| Реестр рисков                                               | `docs/00-governance/DOC-GOV-002-...md`        |
| Команда и план коммуникации                                 | `docs/00-governance/DOC-GOV-003-...md`        |
| Ретроспектива и lessons learned                             | `docs/00-governance/DOC-GOV-004-...md`        |
| User Stories и Use Cases                                    | `docs/02-requirements/`                        |
| MoSCoW-матрица                                              | `docs/02-requirements/DOC-REQ-004-...md`      |
| BPMN + UI flow + SVG                                        | `docs/04-architecture/DOC-ARC-001-...md`      |
| ERD и логическая модель данных                              | `docs/05-data-and-integration/DOC-DAT-001-...md` |
| Маппинг 1С ↔ Backend                                        | `docs/05-data-and-integration/DOC-INT-003-...md` |
| Финальное ТЗ                                                | `docs/06-final-specification/DOC-SPC-001-...md` |
| Архитектура решения и карта модулей                         | `docs/06-final-specification/DOC-SPC-002-...md` |
| План развёртывания                                          | `docs/07-validation-and-delivery/DOC-OPS-002-...md` |
| Acceptance-сценарии                                         | `docs/07-validation-and-delivery/DOC-TST-001-...md` |
| Хакатоны 1–4                                                | `docs/90-checkpoints/`                         |

---

## Технологии

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Vitest
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite, JWT, pytest
- **1С:** 1С:Предприятие 8.3, встроенный язык (BSL), СКД
- **Инфраструктура:** GitHub + Actions, формат диаграмм: Mermaid + SVG

---

## Репозиторий и лицензия

- Репозиторий: https://github.com/Severenskyyy/Course
- Пример проекта (референс): https://github.com/Severenskyyy/CourseProjects
- Лицензия: учебный проект, использование в рамках дисциплины ОПД.
