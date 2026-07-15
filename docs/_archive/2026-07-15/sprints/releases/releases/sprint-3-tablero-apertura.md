# Sprint 3 — Comentario de apertura para tablero

## Versión breve (copiar/pegar)
Sprint 3 iniciado. Se abre PR 01 con alcance acotado para base de generación de test.
Estado: In Progress
Owner: Backend + Frontend
ETA PR 01: 2-3 días hábiles
Riesgo principal: desalineación contrato API/UI
Mitigación: congelar contrato al cierre del PR 01
Siguiente hito: PR 02 con envío/corrección de test y primera vista de resultados.

## Versión completa (copiar/pegar)
Actualización de Sprint 3:

- Estado: In Progress
- Owner principal: Backend
- Co-owner: Frontend
- Entrega activa: PR 01 — Base de generación de test
- ETA: 2-3 días hábiles para merge (si checks en verde)

Alcance PR 01:
- Definición base de endpoint de generación de test
- Validación de payload
- Respuesta JSON estable para integración frontend
- Revisión de tablas/índices mínimos implicados

Riesgos:
- Posible desalineación entre contrato API y consumo UI
- Posible falta de preguntas para ciertos criterios de generación

Mitigación:
- Congelar contrato API al cierre del PR 01
- Respuesta controlada con error explícito ante criterios insuficientes

Dependencias de salida:
- CI en verde (test-backend + build-frontend)
- Revisión funcional del flujo de generación
- Sin artefactos temporales en PR

Siguiente hito:
- PR 02: envío/corrección de test y primera pantalla de resultados
- Objetivo: cerrar flujo E2E mínimo (generate → submit → resultado)