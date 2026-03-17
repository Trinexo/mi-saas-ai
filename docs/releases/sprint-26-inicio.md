# Sprint 26 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar la visibilidad del hábito real de estudio y facilitar análisis de constancia en historial:

1. Exponer consistencia diaria de estudio en backend.
2. Mostrar insight de consistencia en Home.
3. Añadir filtro de constancia por día en Historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → continuidad diaria y hábito de uso.
- `docs/05-diseno-ux-plataforma.md` → feedback simple y accionable.
- `docs/36-roadmap-plataforma.md` → mejoras incrementales de analítica MVP.

## Alcance comprometido

### PR 01 — Endpoint consistencia diaria (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/consistencia-diaria`.
- Ventana: últimos 30 días.
- Respuesta:
  - `diasActivos30`
  - `diasInactivos30`
  - `porcentajeConstancia`
  - `tendenciaConstancia` (`mejorando`, `estable`, `empeorando`) comparando 14 días vs 14 previos.

### PR 02 — Tarjeta “Consistencia diaria” en Home (Frontend) [P0]
- Nuevo bloque en Home con días activos/inactivos y porcentaje de constancia.
- Mensaje contextual por tendencia:
  - `mejorando` → “Tu constancia diaria está subiendo, sigue así.”
  - `empeorando` → “Recupera hábito con bloques cortos diarios.”
  - `estable` → “Mantienes un ritmo constante de estudio.”

### PR 03 — Filtro “Constancia diaria” en Historial (Frontend) [P1]
- Selector de constancia por volumen de tests en el mismo día:
  - `todos`
  - `alta` (≥3 tests/día)
  - `media` (2 tests/día)
  - `baja` (1 test/día)
- Compatible con filtros actuales (modo, texto, nota, periodo, orden, errores, duración, blancos, ritmo).

## Fuera de alcance
- Recomendaciones automáticas por franja horaria.
- Alertas push/email de inactividad.
- Segmentación por subtema o dificultad en consistencia.

## Criterios de Done
- Endpoint `GET /stats/consistencia-diaria` funcional.
- Home muestra tarjeta de consistencia diaria.
- Historial permite filtrar por constancia diaria.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint consistencia diaria |
| 02 | Frontend | Tarjeta consistencia en Home |
| 03 | Frontend | Filtro constancia diaria en Historial |

## Implementación realizada

### PR 01 — Endpoint consistencia diaria (Backend) ✅
- Endpoint implementado: `GET /api/v1/stats/consistencia-diaria`.
- Capas actualizadas:
  - `backend/src/repositories/stats.repository.js`
  - `backend/src/services/stats.service.js`
  - `backend/src/controllers/stats.controller.js`
  - `backend/src/routes/v1/stats.routes.js`
- Lógica aplicada:
  - Cuenta días con actividad en últimos 30 días (`diasActivos30`) y calcula `diasInactivos30`.
  - Calcula `porcentajeConstancia` sobre 30 días.
  - Compara últimos 14 días vs 14 previos para `tendenciaConstancia`.
- Test añadido:
  - `backend/tests/services/stats-consistencia-diaria.test.js`
  - Registro en scripts de `backend/package.json` (`test` y `test:all`).

### PR 02 — Tarjeta “Consistencia diaria” en Home (Frontend) ✅
- API client añadido en `frontend/src/services/testApi.js`: `getConsistenciaDiaria()`.
- UI actualizada en `frontend/src/pages/HomePage.jsx`:
  - Días activos/inactivos en 30 días.
  - Porcentaje de constancia.
  - Mensaje contextual por tendencia.

### PR 03 — Filtro constancia diaria en Historial (Frontend) ✅
- Filtro añadido en `frontend/src/pages/HistorialPage.jsx`:
  - `todos`
  - `alta (≥3 tests en el día)`
  - `media (2 tests en el día)`
  - `baja (1 test en el día)`
- Cálculo por día realizado sobre el propio historial cargado.

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/consistencia-diaria` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "diasActivos30": 18,
    "diasInactivos30": 12,
    "porcentajeConstancia": 60,
    "tendenciaConstancia": "mejorando"
  }
}
```

## Validación
- Backend (targeted):
  - `node --test tests/services/stats-consistencia-diaria.test.js` ✅ (2/2)
- Backend (suite completa):
  - `npm test` ✅
- Frontend:
  - `npm run build` ✅

## Estado actual
- Sprint 26 completado.
