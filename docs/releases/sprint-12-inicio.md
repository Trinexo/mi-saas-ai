# Sprint 12 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar retención y continuidad de estudio con tres entregables orientados a uso diario:

1. Historial personal de tests finalizados (consultable y navegable).
2. Reintento rápido desde historial (misma configuración del test anterior).
3. Señales de progreso en historial (racha semanal y mejor nota reciente).

## Alcance comprometido

### PR 01 — Historial de tests (Backend + Frontend) [P0]

**Backend**
- Endpoint nuevo: `GET /api/v1/tests/history?limit=20`
- Validación query en `test.schema.js` (`limit 1..100`, default 20)
- Repository `getUserHistory({ userId, limit })` con join de resultados + catálogo
- Service `getHistory(userId, limit)`

**Frontend**
- Pantalla nueva `/historial` con tabla de tests finalizados
- Link en topbar principal
- Acción por fila: abrir revisión (`/revision/:testId`)

### PR 02 — Reintento desde historial (Backend + Frontend) [P1]
- Endpoint nuevo: `GET /api/v1/tests/:testId/config`
- Repository `getTestConfig(testId)` con select de configuración
- Service `getConfig(testId, userId)` con verificación de propiedad
- Controller `getTestConfig` con requireAuth
- Frontend: botón “Reintentar” por fila en historial
- Reutiliza parámetros del test origen (modo/tema/oposición/nº preguntas)
- Genera nuevo test y redirige a `/test`

### PR 03 — Señales de continuidad (Backend + Frontend) [P1]
- KPI de “tests últimos 7 días”
- KPI de “mejor nota últimos 30 días”
- Bloque compacto en cabecera de historial

## Criterios de Done
- Usuario autenticado ve su historial reciente y puede entrar a revisión desde cada fila.
- Endpoint de historial validado por esquema y sin regresiones de suite.
- `vite build` sin errores.

## PR 01 — estado actual
- ✅ Completado: backend endpoint, frontend página, tests, build validado.

## PR 02 — estado actual
- ✅ Completado: backend endpoint config, frontend botón reintentar, tests, build validado.

## Validaciones 16/03/2026
- `node --test backend/tests/services/test-history.test.js`
- `npm run build` (Vite)
