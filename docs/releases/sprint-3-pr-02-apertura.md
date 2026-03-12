# Sprint 3 — PR 02 comentario de apertura

## Título sugerido del PR
Sprint 3 · Envío y corrección de test + resultado inicial

## Versión breve (copiar/pegar)
Se abre PR 02 para cerrar el flujo E2E mínimo de Sprint 3.
Estado tarjeta: In Progress
Owner: Backend
Co-owner: Frontend
ETA: 2-3 días hábiles
Alcance: `POST /tests/submit` + corrección + primera vista de resultados.
Riesgo principal: inconsistencias en cálculo de nota o respuestas duplicadas.
Mitigación: validaciones de negocio + casos edge en revisión funcional.

## Versión completa (copiar/pegar)
Actualización Sprint 3 — Apertura PR 02:

- Estado: In Progress
- Owner principal: Backend
- Co-owner: Frontend
- Entrega activa: PR 02 — envío/corrección de test y resultado inicial
- ETA: 2-3 días hábiles

Alcance comprometido:
- Backend:
  - `POST /tests/submit`
  - Corrección automática de respuestas
  - Cálculo de `aciertos`, `errores`, `blancos`, `nota`
  - Respuesta JSON estable para frontend
- Frontend:
  - Primera vista de resultados integrada con respuesta de submit

Fuera de alcance:
- Progreso agregado avanzado por tema
- Analítica avanzada
- Optimizaciones de rendimiento no críticas

Checklist de apertura:
- [ ] Alcance acotado y validado
- [ ] Contrato de response compartido con frontend
- [ ] Casos edge definidos (vacío, duplicados, pregunta fuera de test)
- [ ] Riesgos y mitigación documentados

Siguiente hito tras merge:
- PR 03 para progreso básico consolidado (`GET /stats/user`, `GET /stats/tema`) y ajustes de UX de resultados.