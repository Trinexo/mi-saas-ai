# Sprint 22 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar visibilidad de progreso semanal y facilitar revisión de tests con fallos:

1. Exponer progreso diario de los últimos 7 días desde backend.
2. Mostrar progreso semanal visual en Home.
3. Añadir filtro rápido en Historial para tests con errores.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → progreso visible y acción rápida.
- `docs/05-diseno-ux-plataforma.md` → UX simple, lectura clara.
- `docs/36-roadmap-plataforma.md` → consolidación funcional del MVP.

## Alcance comprometido

### PR 01 — Endpoint progreso semanal (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/progreso-semanal`.
- Devuelve:
  - `dias` con `{ fecha, tests, aciertos, errores, blancos, notaMedia }`
  - `testsSemana`
  - `notaMediaSemana`

### PR 02 — Tarjeta “Progreso semanal” en Home (Frontend) [P0]
- Nuevo bloque en Home con resumen de tests/nota semanal.
- Mini visual de 7 días por volumen de tests.
- Mensaje:
  - si no hay actividad: “Empieza hoy con un test rápido”.
  - si hay actividad: “Has mantenido actividad esta semana”.

### PR 03 — Filtro “Con errores” en Historial (Frontend) [P1]
- Añadir selector:
  - `todos`
  - `con errores`
  - `sin errores`
- Compatible con filtros actuales de modo, texto, nota, periodo y orden.

## Fuera de alcance
- Gráficas avanzadas interactivas.
- Segmentación por subtema.
- Recomendador automático por día.

## Criterios de Done
- Endpoint `GET /stats/progreso-semanal` funcional.
- Home muestra progreso semanal.
- Historial permite filtrar por presencia de errores.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint progreso semanal |
| 02 | Frontend | Tarjeta progreso semanal en Home |
| 03 | Frontend | Filtro con/sin errores en Historial |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/progreso-semanal` con serie de 7 días y agregados semanales.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Progreso semanal” en Home con mini visual de actividad diaria.

## PR 03 — estado actual
- ✅ Completado: filtro `todos / con errores / sin errores` en Historial.

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/progreso-semanal` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "dias": [
      { "fecha": "2026-03-10", "tests": 1, "aciertos": 8, "errores": 2, "blancos": 0, "notaMedia": 7.4 }
    ],
    "testsSemana": 7,
    "notaMediaSemana": 6.98
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-progreso-semanal.test.js`
- `npm test` (backend) → `tests 241`, `pass 241`, `fail 0`
- `npm run build` (frontend)
