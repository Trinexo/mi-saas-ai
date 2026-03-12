# Kickoff — Inicio Sprint 3

Fecha: 12 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Entregar una base funcional del flujo principal de producto para usuario final:
- generación de test
- envío y corrección
- visualización de resultados
- progreso básico por usuario/tema

## Alcance comprometido (MVP)
- Backend:
  - `POST /tests/generate`
  - `POST /tests/submit`
  - `GET /stats/user`
  - `GET /stats/tema`
- Frontend:
  - pantalla de resolución de test
  - pantalla de resultados
  - pantalla de progreso básico
- Base de datos:
  - persistencia de `tests`, `tests_preguntas`, `respuestas_usuario`, `resultados_test`, `progreso_usuario`

## Criterios de Done
- Flujo E2E operativo: generar → responder → enviar → corregir → mostrar resultado.
- Datos de progreso actualizados tras cada envío de test.
- Sin push directo a `main`; todo por PR con checks obligatorios en verde.
- Sin artefactos temporales en PR (`node_modules`, `.env`, cachés locales, builds locales).

## Checklist de arranque
- [ ] Backlog del sprint priorizado (P0/P1) y tickets asignados.
- [ ] Contratos de API Sprint 3 validados con frontend.
- [ ] Tablas/índices del sprint revisados.
- [ ] Primer PR de Sprint 3 abierto con alcance acotado.

## Riesgos iniciales
- Riesgo de desalineación API/UI si cambian contratos a mitad del sprint.
- Riesgo de degradación de rendimiento en generación de test sin índices adecuados.

## Mitigación
- Congelar contrato API al cierre de los primeros tickets backend.
- Revisar índices críticos antes de pruebas E2E ampliadas.
