# Карта документации — АБИС (Кейс 8)

| Версия | Статус | Дата |
|--------|--------|------|
| v5.0   | Final  | 2026-05-09 |

**О документе:** этот файл — карта документации проекта АБИС (учёт каталога, выдач и просрочек). Здесь видно, где лежат основные артефакты и как читать контрольные срезы по четырём защитам.

**Для кого:** для команды проекта, куратора дисциплины «Основы проектной деятельности» и любого участника, которому нужно быстро понять структуру.

---

## Структура документации

| Папка | Назначение |
|---|---|
| `00-governance/` | Карточка проекта, устав, риски, команда, ретроспектива |
| `01-discovery/` | Discovery: домен, персонажи, event storming |
| `02-requirements/` | Требования: Use Cases, User Stories, USM, MoSCoW |
| `03-planning/` | План MVP, WBS, technical feasibility |
| `04-architecture/` | BPMN + UI flow (SVG), системный контекст, low-fi wireframes |
| `05-data-and-integration/` | ERD, data dictionary, контуры интеграций, контракты, маппинг 1С |
| `06-final-specification/` | Финальное ТЗ, архитектура решения, сводка интеграционных точек |
| `07-validation-and-delivery/` | Демо-сценарий, runbook, план пилота, acceptance-тесты |
| `90-checkpoints/` | Хакатоны 1–4 (артефакты и презентации) |
| `98-source-materials/` | Исходный текст кейса |
| `99-standards/` | Внутренние стандарты команды |
| `_docx/` | DOCX-копии ключевых документов (Карточка, Устав, ТЗ) |

---

## Все документы

### 00-governance
| Код | Документ | Файл |
|---|---|---|
| DOC-GOV-001 | Карточка проекта и устав | `DOC-GOV-001-project-charter.md` |
| DOC-GOV-002 | Реестр рисков (10 рисков, метод Харрингтона) | `DOC-GOV-002-risk-register.md` |
| DOC-GOV-003 | Команда и план коммуникаций | `DOC-GOV-003-team-roles.md` |
| DOC-GOV-004 | Ретроспектива и lessons learned | `DOC-GOV-004-team-retrospective.md` |

### 01-discovery
| Код | Документ | Файл |
|---|---|---|
| DOC-DIS-001 | Event Storming | `DOC-DIS-001-event-storming.md` |
| DOC-DIS-002 | Персонажи (3 персоны) | `DOC-DIS-002-personas.md` |
| DOC-DIS-003 | Исследование предметной области | `DOC-DIS-003-domain-research.md` |

### 02-requirements
| Код | Документ | Файл |
|---|---|---|
| DOC-REQ-001 | Use Cases (5 UC) | `DOC-REQ-001-use-cases.md` |
| DOC-REQ-002 | User Stories | `DOC-REQ-002-user-stories.md` |
| DOC-REQ-003 | User Story Map | `DOC-REQ-003-user-story-map.md` |
| DOC-REQ-004 | Матрица MoSCoW (заморожена 2026-03-21) | `DOC-REQ-004-moscow-matrix.md` |

### 03-planning
| Код | Документ | Файл |
|---|---|---|
| DOC-PLN-001 | План разработки MVP | `DOC-PLN-001-mvp-plan.md` |
| DOC-PLN-002 | WBS (Work Breakdown Structure) | `DOC-PLN-002-wbs.md` |
| DOC-PLN-003 | Technical feasibility | `DOC-PLN-003-technical-feasibility.md` |

### 04-architecture
| Код | Документ | Файл |
|---|---|---|
| DOC-ARC-001 | BPMN бизнес-процесса + UI flow | `DOC-ARC-001-business-process-and-user-flow.md` + `image/BPMN-loan-return-v2.svg` |
| DOC-ARC-002 | Системный контекст и границы | `DOC-ARC-002-system-context.md` |
| DOC-ARC-003 | Low-fi wireframes и логика 9 экранов | `DOC-ARC-003-low-fi-wireframes-and-screen-logic.md` |

### 05-data-and-integration
| Код | Документ | Файл |
|---|---|---|
| DOC-DAT-001 | Логическая модель данных и ERD (7 сущностей) | `DOC-DAT-001-logical-data-model-and-erd.md` |
| DOC-DAT-002 | Data Dictionary и валидаторы | `DOC-DAT-002-data-dictionary.md` |
| DOC-INT-001 | Контуры интеграций и сценарии обмена | `DOC-INT-001-integration-contours.md` |
| DOC-INT-002 | Контракты обмена + DFD + структура CSV | `DOC-INT-002-data-exchange-contracts.md` |
| DOC-INT-003 | Маппинг полей 1С ↔ Backend | `DOC-INT-003-field-mapping-1c.md` |

### 06-final-specification
| Код | Документ | Файл |
|---|---|---|
| DOC-SPC-001 | Финальное техническое задание | `DOC-SPC-001-technical-specification.md` |
| DOC-SPC-002 | Архитектура решения и карта модулей | `DOC-SPC-002-solution-architecture.md` |
| DOC-SPC-003 | Сводка интеграционных точек | `DOC-SPC-003-integration-points-summary.md` |

### 07-validation-and-delivery
| Код | Документ | Файл |
|---|---|---|
| DOC-OPS-001 | Демо-сценарий (7 шагов, 5 минут) | `DOC-OPS-001-demo-scenario.md` |
| DOC-OPS-002 | План развёртывания и runbook | `DOC-OPS-002-deployment-plan-and-runbook.md` |
| DOC-OPS-003 | План пилотного развёртывания и handover | `DOC-OPS-003-pilot-rollout-and-handover-plan.md` |
| DOC-TST-001 | Acceptance-чеклист (9 AC) | `DOC-TST-001-acceptance-checklist.md` |

### 99-standards
| Код | Документ | Файл |
|---|---|---|
| DOC-STD-001 | Стандарт именования и версионирования | `DOC-STD-001-document-naming.md` |

---

## Контрольные точки (Хакатоны)

| CP | Дата | Статус | Материалы |
|----|------|--------|-----------|
| CP1 (Хакатон 1) | 16–21.03.2026 | Защищён | `Hackathon_1_presentation.pdf` |
| CP2 (Хакатон 2) | 06–11.04.2026 | Защищён | `Hackathon_2_ABIS.pptx` |
| CP3 (Хакатон 3) | 27.04–02.05.2026 | Защищён | `Hackathon_3_ABIS.pptx` |
| CP4 (Хакатон 4) | 25–30.05.2026 | Финальный (к защите) | `Hackathon_4_ABIS.pptx` |

---

## DOCX-копии ключевых документов

| MD-источник | DOCX-копия |
|---|---|
| `DOC-GOV-001-project-charter.md` | `_docx/Карточка_проекта_АБИС.docx` |
| `DOC-GOV-001-project-charter.md` | `_docx/Устав_проекта_АБИС.docx` |
| `DOC-SPC-001-technical-specification.md` | `_docx/ТЗ_АБИС_финальное.docx` |

DOCX-файлы пересобираются скриптом из MD-источника. Ручные правки в DOCX не вносятся — они потеряются при следующей пересборке. См. DOC-STD-001.

---

## Команда

| ФИО | Роль |
|---|---|
| Кирбитов А.Е. | Тимлид / Аналитик (BA/SA + PL) |
| Рабаданов А.С. | Разработчик 1С |
| Гуков Я.Р. | Fullstack (FS-API / FS-Data) |
| Коптилин И.Р. | Fullstack (FS-UI / Демо) |

---

## История изменений карты

| Дата | Версия | Что изменилось |
|---|---|---|
| 2026-02-20 | v0.1 | Создана карта документации |
| 2026-03-16 | v0.3 | Добавлены документы CP1 |
| 2026-04-13 | v1.0 | Документы CP2 (BPMN, ERD) |
| 2026-04-25 | v2.0 | Документы CP3 (контракты, маппинг, ТЗ) |
| 2026-05-09 | v5.0 | Финальная сборка под H4: добавлены DOC-ARC-003, DOC-SPC-003, DOC-OPS-003, расширен реестр рисков до 10 |
