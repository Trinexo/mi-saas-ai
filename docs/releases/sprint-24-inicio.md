# Sprint 24 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Aumentar control sobre precisión de respuesta y facilitar revisión de tests con dudas (blancos):

1. Exponer balance de precisión en backend.
2. Mostrar insight de precisión en Home.
3. Añadir filtro por blancos en Historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → feedback claro de rendimiento.
- `docs/05-diseno-ux-plataforma.md` → UX simple y de lectura rápida.
- `docs/36-roadmap-plataforma.md` → mejoras incrementales en analítica MVP.

## Alcance comprometido

### PR 01 — Endpoint balance de precisión (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/balance-precision`.
- Ventana: últimos 30 días.
- Respuesta:
  - `aciertosTotales`
  - `erroresTotales`
  - `blancosTotales`
  - `porcentajeAcierto`
  - `porcentajeError`
  - `porcentajeBlanco`

### PR 02 — Tarjeta “Balance de precisión” en Home (Frontend) [P0]
- Mostrar los tres porcentajes y volumen total.
- Mensaje contextual:
  - blancos altos (>20%) → “Reduce blancos con tests más cortos”.
  - errores altos (>35%) → “Conviene reforzar conceptos clave”.
  - resto → “Buen equilibrio de respuesta”.

### PR 03 — Filtro por blancos en Historial (Frontend) [P1]
- Selector:
  - `todos`
  - `con blancos`
  - `sin blancos`
- Compatible con filtros actuales (modo, texto, nota, periodo, orden, errores, duración).

## Fuera de alcance
- Personalización automática del número de preguntas.
- Predicción de fallos por tema.
- Exportación avanzada de analítica.

## Criterios de Done
- Endpoint `GET /stats/balance-precision` funcional.
- Home muestra tarjeta de balance de precisión.
- Historial permite filtrar por blancos.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint balance de precisión |
| 02 | Frontend | Tarjeta balance de precisión en Home |
| 03 | Frontend | Filtro por blancos en Historial |

## Implementación realizada

### PR 01 — Endpoint balance de precisión (Backend) ✅
- Endpoint implementado: `GET /api/v1/stats/balance-precision`.
- Capas actualizadas:
  - `backend/src/repositories/stats.repository.js`
  - `backend/src/services/stats.service.js`
  - `backend/src/controllers/stats.controller.js`
  - `backend/src/routes/v1/stats.routes.js`
- Lógica:
  - Agrega en últimos 30 días `aciertos_totales`, `errores_totales`, `blancos_totales`.
  - Calcula `porcentajeAcierto`, `porcentajeError`, `porcentajeBlanco` sobre el total contestado.
- Contrato final (`200 OK`):

```json
{
  "ok": true,
  "data": {
    "aciertosTotales": 40,
    "erroresTotales": 12,
    "blancosTotales": 8,
    "porcentajeAcierto": 66.67,
    "porcentajeError": 20,
    "porcentajeBlanco": 13.33
  }
}
```

### PR 02 — Tarjeta “Balance de precisión” en Home (Frontend) ✅
- API client añadido en `frontend/src/services/testApi.js`: `getBalancePrecision()`.
- UI actualizada en `frontend/src/pages/HomePage.jsx`:
  - Muestra porcentajes de acierto/error/blancos.
  - Muestra volumen total (`aciertos + errores + blancos`).
  - Mensaje contextual aplicado según umbrales definidos.

### PR 03 — Filtro por blancos en Historial (Frontend) ✅
- Filtro añadido en `frontend/src/pages/HistorialPage.jsx`:
  - `todos`
  - `con blancos` (`blancos > 0`)
  - `sin blancos` (`blancos === 0`)
- Compatible con el resto de filtros existentes y ordenación.

## Validación

- Backend (targeted):
  - `node --test tests/services/stats-balance-precision.test.js` ✅ (2/2)
- Backend (suite completa):
  - `npm test` ✅
  - Resumen: `tests 245`, `pass 245`, `fail 0`
- Frontend:
  - `npm run build` ✅

## Estado actual
- Sprint 24 completado.
