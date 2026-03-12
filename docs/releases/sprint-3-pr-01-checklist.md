# Sprint 3 — PR 01 (Generate Test base)

Fecha: 12 de marzo de 2026
Rama sugerida: sprint-3/primer-pr-generate-test
Estado: listo para abrir PR

## Título sugerido del PR
Sprint 3 · Base de generación de test (backend + contrato inicial)

## Objetivo del PR
Entregar la primera pieza funcional de Sprint 3 con alcance acotado:
- contrato inicial de generación de test
- base de persistencia mínima para test generado
- validaciones de entrada y respuesta consistente

## Alcance incluido
- Backend:
  - `POST /tests/generate` (versión base)
  - validación de payload
  - respuesta JSON normalizada
- DB:
  - revisión de tablas/índices mínimos usados por generación
- Docs:
  - actualización de contrato en `docs/api-v1.md` (si aplica)

## Fuera de alcance (este PR)
- envío/corrección (`POST /tests/submit`)
- pantalla completa de resultados
- progreso agregado por tema

## Checklist de calidad
- [ ] PR abierto contra `main` (sin push directo).
- [ ] Se usa plantilla `feature`.
- [ ] Checks en verde: `test-backend` y `build-frontend`.
- [ ] Sin archivos no permitidos (`node_modules`, `.env`, temporales).
- [ ] Contrato request/response revisado con frontend.
- [ ] Se documentan riesgos técnicos en el PR.

## Criterios de aceptación
- [ ] El endpoint responde 201 con un test generado cuando el payload es válido.
- [ ] Devuelve 400/422 cuando el payload es inválido o insuficiente.
- [ ] La estructura de respuesta es estable para consumo frontend.

## Riesgos y mitigación
- Riesgo: no haya suficientes preguntas para la configuración solicitada.
  - Mitigación: respuesta controlada y mensaje explícito para ajustar criterio.
- Riesgo: degradación por selección aleatoria en volumen.
  - Mitigación: validar índices y dejar criterio de optimización para PR siguiente.

## Texto breve para descripción del PR
Este PR inicia Sprint 3 con la base de generación de test. Incluye endpoint `POST /tests/generate` con validación de entrada y contrato de respuesta estable para frontend. No incluye corrección ni progreso; esos puntos se abordan en PRs siguientes para mantener alcance reducido y revisión rápida.
