# CP4 (Хакатон 4 / Финальная защита): MVP v1.0 — 25–30 мая 2026

| Версия | Статус | Дата |
|---|---|---|
| v1.0 | Запланирован | 2026-05-25 |

## Артефакты

| Код            | Артефакт                                              | Ссылка                                                                  |
|----------------|-------------------------------------------------------|-------------------------------------------------------------------------|
| DOC-SPC-001    | Финальное ТЗ                                          | [MD](../06-final-specification/DOC-SPC-001-technical-specification.md)  |
| DOC-SPC-002    | Архитектура решения и карта модулей (UML Component)   | [MD](../06-final-specification/DOC-SPC-002-solution-architecture.md)    |
| DOC-OPS-001    | Демо-сценарий (7 шагов, 5 мин)                        | [MD](../07-validation-and-delivery/DOC-OPS-001-demo-scenario.md)        |
| DOC-OPS-002    | План развёртывания и runbook                          | [MD](../07-validation-and-delivery/DOC-OPS-002-deployment-plan-and-runbook.md) |
| DOC-TST-001    | Acceptance-чеклист (9 AC)                             | [MD](../07-validation-and-delivery/DOC-TST-001-acceptance-checklist.md) |
| DOC-GOV-004    | Ретроспектива команды и lessons learned               | [MD](../00-governance/DOC-GOV-004-team-retrospective.md)                |
| SPEC-API       | OpenAPI спецификация                                  | [YAML](../../spec/openapi.yaml)                                         |
| MVP-FRONTEND   | React 18, 9 экранов                                   | [/src/](../../src/)                                                     |
| MVP-BACKEND    | FastAPI, 8 роутеров                                   | [/backend/](../../backend/)                                             |
| MVP-1C         | Конфигурация + модули + BSL                           | [/1c/](../../1c/)                                                       |
| PRES-CP4       | Презентация финальной защиты                          | [PPTX](Hackathon_4_ABIS.pptx)                                           |

## Содержание презентации (по RoadMap)

1. Демо UI-прототипа
2. Архитектурная схема системы (UML Component)
3. Связь компонентов (UML Class)
4. API / JSON взаимодействие (при наличии)
5. Артефакты решения на платформе 1С
6. Тестовые данные и сценарий загрузки
7. Финальное техническое задание
8. Демонстрационный сценарий защиты

## Результаты по ролям

| Роль | Результаты |
|---|---|
| Кирбитов (PL/BA) | Проверка AC, финальные требования, ТЗ с описанием 1С |
| Рабаданов (1С) | Артефакты 1С, тестовые данные с описанием загрузки |
| Гуков (FS-API) | Архитектура, связь компонентов, API/JSON, тестовые данные |
| Коптилин (FS-UI) | UI-прототип, демо-сценарий, сборка презентации |
