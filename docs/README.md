# Карта документации — АБИС (Кейс 8)

| Версия | Статус | Дата       |
|--------|--------|------------|
| v4.0   | Final  | 2026-05-28 |

## Структура документации

| Папка                           | Назначение                                                   |
|---------------------------------|--------------------------------------------------------------|
| `00-governance/`                | Карточка проекта, устав, риски, команда, ретро               |
| `01-discovery/`                 | Discovery: домен, персонажи, event storming                  |
| `02-requirements/`              | Требования: Use Cases, User Stories, USM, MoSCoW             |
| `03-planning/`                  | План MVP, WBS, technical feasibility                         |
| `04-architecture/`              | BPMN + UI flow (SVG), system context                         |
| `05-data-and-integration/`      | ERD, data dictionary, DFD, контуры интеграций, маппинг       |
| `06-final-specification/`       | Финальное ТЗ, архитектура решения и карта модулей            |
| `07-validation-and-delivery/`   | Демо-сценарий, runbook развёртывания, acceptance-тесты       |
| `90-checkpoints/`               | Хакатоны 1–4 (артефакты и презентации)                       |
| `98-source-materials/`          | Исходный текст кейса                                         |
| `99-standards/`                 | Внутренние стандарты (именование документов)                 |

## Все документы

### 00-governance
| Код | Документ | Файл |
|---|---|---|
| DOC-GOV-001 | Карточка проекта + Устав | `DOC-GOV-001-project-charter.docx` |
| DOC-GOV-002 | Реестр рисков | `DOC-GOV-002-risk-register.md` |
| DOC-GOV-003 | Команда и план коммуникации | `DOC-GOV-003-team-roles.md` |
| DOC-GOV-004 | Ретроспектива и lessons learned | `DOC-GOV-004-team-retrospective.md` |

### 01-discovery
| Код | Документ | Файл |
|---|---|---|
| DOC-DIS-001 | Event Storming | `DOC-DIS-001-event-storming.md` |
| DOC-DIS-002 | Персонажи | `DOC-DIS-002-personas.md` |
| DOC-DIS-003 | Исследование предметной области | `DOC-DIS-003-domain-research.md` |

### 02-requirements
| Код | Документ | Файл |
|---|---|---|
| DOC-REQ-001 | Use Cases (5 UC) | `DOC-REQ-001-use-cases.md` |
| DOC-REQ-002 | User Stories | `DOC-REQ-002-user-stories.md` |
| DOC-REQ-003 | User Story Map | `DOC-REQ-003-user-story-map.md` |
| DOC-REQ-004 | Матрица MoSCoW (заморожена) | `DOC-REQ-004-moscow-matrix.md` |

### 03-planning
| Код | Документ | Файл |
|---|---|---|
| DOC-PLN-001 | План MVP | `DOC-PLN-001-mvp-plan.md` |
| DOC-PLN-002 | WBS | `DOC-PLN-002-wbs.md` |
| DOC-PLN-003 | Technical feasibility | `DOC-PLN-003-technical-feasibility.md` |

### 04-architecture
| Код | Документ | Файл |
|---|---|---|
| DOC-ARC-001 | BPMN + UI flow | `DOC-ARC-001-business-process-and-user-flow.md` + `image/BPMN-loan-return-v2.svg` |
| DOC-ARC-002 | Системный контекст и границы | `DOC-ARC-002-system-context.md` |

### 05-data-and-integration
| Код | Документ | Файл |
|---|---|---|
| DOC-DAT-001 | Логическая модель данных и ERD | `DOC-DAT-001-logical-data-model-and-erd.md` |
| DOC-DAT-002 | Data Dictionary | `DOC-DAT-002-data-dictionary.md` |
| DOC-INT-001 | Контуры интеграции | `DOC-INT-001-integration-contours.md` |
| DOC-INT-002 | Контракты обмена + DFD + маппинг | `DOC-INT-002-data-exchange-contracts.md` |
| DOC-INT-003 | Маппинг 1С ↔ Backend | `DOC-INT-003-field-mapping-1c.md` |

### 06-final-specification
| Код | Документ | Файл |
|---|---|---|
| DOC-SPC-001 | Финальное ТЗ | `DOC-SPC-001-technical-specification.md` |
| DOC-SPC-002 | Архитектура решения и карта модулей | `DOC-SPC-002-solution-architecture.md` |

### 07-validation-and-delivery
| Код | Документ | Файл |
|---|---|---|
| DOC-OPS-001 | Демо-сценарий | `DOC-OPS-001-demo-scenario.md` |
| DOC-OPS-002 | План развёртывания и runbook | `DOC-OPS-002-deployment-plan-and-runbook.md` |
| DOC-TST-001 | Acceptance-чеклист | `DOC-TST-001-acceptance-checklist.md` |

### 99-standards
| Код | Документ | Файл |
|---|---|---|
| DOC-STD-001 | Стандарт именования и версионирования | `DOC-STD-001-document-naming.md` |

## Контрольные точки (Хакатоны)

| CP              | Дата             | Статус    | Материалы                       |
|-----------------|------------------|-----------|----------------------------------|
| CP1 (Хакатон 1) | 16–21.03.2026    | Защищён   | `Hackathon_1_presentation.pdf`   |
| CP2 (Хакатон 2) | 06–11.04.2026    | Защищён   | `Hackathon_2_ABIS.pptx`          |
| CP3 (Хакатон 3) | 27.04–02.05.2026 | Защищён   | `Hackathon_3_ABIS.pptx`          |
| CP4 (Хакатон 4) | 25–30.05.2026    | Финальный | `Hackathon_4_ABIS.pptx`          |

## Команда

| ФИО            | Роль                                                  |
|----------------|--------------------------------------------------------|
| Кирбицов А.Е.  | Тимлид / Аналитик (BA/SA + PL)                         |
| Рабаданов А.С. | Разработчик 1С                                         |
| Гуков Я.Р.     | Fullstack (FS-API / FS-Data)                           |
| Коптилин И.Р.  | Fullstack (FS-UI / Демо)                               |
