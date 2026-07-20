# Sprint 25 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar el control del ritmo de resolución para estudiar con más constancia y menos bloqueos de tiempo:

1. Exponer un indicador de ritmo por pregunta en backend.
2. Mostrar insight de ritmo en Home.
3. Añadir filtro por ritmo en Historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → feedback accionable y continuidad.
- `docs/05-diseno-ux-plataforma.md` → UX simple de lectura rápida.
- `docs/36-roadmap-plataforma.md` → mejoras incrementales de analítica MVP.

## Alcance comprometido

### PR 01 — Endpoint ritmo por pregunta (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/ritmo-pregunta`.
- Ventana: últimos 30 días.
- Respuesta:
  - `segundosMediosPorPregunta`
  - `preguntasAnalizadas`
  - `testsAnalizados`
  - `tendenciaRitmo` (`mejorando`, `estable`, `empeorando`) comparando 7 días vs 7 previos.

### PR 02 — Tarjeta “Ritmo de resolución” en Home (Frontend) [P0]
- Mostrar segundos medios por pregunta y volumen analizado.
- Mensaje contextual:
  - `mejorando` → “Tu ritmo está mejorando, mantén la constancia”.
  - `empeorando` → “Haz bloques más cortos para recuperar velocidad”.
  - `estable` → “Ritmo estable, puedes subir intensidad progresivamente”.

### PR 03 — Filtro por ritmo en Historial (Frontend) [P1]
- Selector:
  - `todos`
  - `rápidos (<45s/pregunta)`
  - `medios (45–90s/pregunta)`
  - `pausados (>90s/pregunta)`
- Compatible con filtros actuales (modo, texto, nota, periodo, orden, errores, duración, blancos).

## Fuera de alcance
- Recomendaciones personalizadas por franja horaria.
- Ajuste automático del número de preguntas por sesión.
- Predicción avanzada por IA.

## Criterios de Done
- Endpoint `GET /stats/ritmo-pregunta` funcional.
- Home muestra tarjeta de ritmo de resolución.
- Historial permite filtrar por ritmo por pregunta.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint ritmo por pregunta |
| 02 | Frontend | Tarjeta ritmo en Home |
| 03 | Frontend | Filtro por ritmo en Historial |

## Implementación realizada

### PR 01 — Endpoint ritmo por pregunta (Backend) ✅
- Endpoint implementado: `GET /api/v1/stats/ritmo-pregunta`.
- Capas actualizadas:
  - `backend/src/repositories/stats.repository.js`
  - `backend/src/services/stats.service.js`
  - `backend/src/controllers/stats.controller.js`
  - `backend/src/routes/v1/stats.routes.js`
- Lógica aplicada:
  - Calcula en últimos 30 días `testsAnalizados`, `preguntasAnalizadas` y `segundosMediosPorPregunta`.
  - Compara 7 días vs 7 previos para determinar `tendenciaRitmo`.
- Test añadido:
  - `backend/tests/services/stats-ritmo-pregunta.test.js`
  - Registro en scripts de `backend/package.json` (`test` y `test:all`).

### PR 02 — Tarjeta “Ritmo de resolución” en Home (Frontend) ✅
- API client añadido en `frontend/src/services/testApi.js`: `getRitmoPregunta()`.
- UI actualizada en `frontend/src/pages/HomePage.jsx`:
  - Muestra segundos por pregunta.
  - Muestra preguntas y tests analizados.
  - Muestra mensaje contextual por tendencia (`mejorando`, `estable`, `empeorando`).

### PR 03 — Filtro por ritmo en Historial (Frontend) ✅
- Filtro añadido en `frontend/src/pages/HistorialPage.jsx`:
  - `todos`
  - `rápidos (<45s/pregunta)`
  - `medios (45–90s/pregunta)`
  - `pausados (>90s/pregunta)`
- Compatible con filtros actuales (modo, texto, nota, periodo, orden, errores, duración, blancos).

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/ritmo-pregunta` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "segundosMediosPorPregunta": 61.42,
    "preguntasAnalizadas": 540,
    "testsAnalizados": 19,
    "tendenciaRitmo": "mejorando"
  }
}
```

## Validación

- Backend (targeted):
  - `node --test tests/services/stats-ritmo-pregunta.test.js` ✅ (2/2)
- Backend (suite completa):
  - `npm test` ✅
  - Resumen: `tests 247`, `pass 247`, `fail 0`
- Frontend:
  - `npm run build` ✅

## Estado actual
- Sprint 25 completado.
