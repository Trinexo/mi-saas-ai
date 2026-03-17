# Sprint 20 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Dar visibilidad de evolución mensual y facilitar análisis temporal en historial:

1. Exponer insight mensual de rendimiento en backend.
2. Mostrar insight mensual en Home con mensaje accionable.
3. Añadir filtro temporal rápido en Historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → feedback inmediato y progreso visible.
- `docs/05-diseno-ux-plataforma.md` → navegación rápida y UX simple.
- `docs/36-roadmap-plataforma.md` → consolidación de métricas de uso en MVP.

## Alcance comprometido

### PR 01 — Endpoint insight mensual (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/insight-mensual`.
- Métricas:
  - `testsUltimos30Dias`
  - `aciertosUltimos30Dias`
  - `notaMediaUltimos30Dias`
  - `deltaNota7Dias` (últimos 7 días vs 7 días previos)
  - `tendencia` (`subiendo`, `estable`, `bajando`)

### PR 02 — Tarjeta insight mensual en Home (Frontend) [P0]
- Bloque “Insight mensual” en Home con métricas y tendencia.
- Mensaje contextual:
  - `subiendo` → “Tu nota va en tendencia positiva”.
  - `bajando` → “Conviene reforzar temas débiles esta semana”.
  - `estable` → “Mantén la constancia para subir tu media”.

### PR 03 — Filtro temporal en Historial (Frontend) [P1]
- Selector temporal: `últimos 7 días` | `últimos 30 días` | `todo`.
- Se combina con filtros actuales (modo, texto, nota).

## Fuera de alcance
- Predicción avanzada de notas con ML.
- Segmentación por hora/franja de estudio.
- Exportación de analítica.

## Criterios de Done
- Endpoint `GET /stats/insight-mensual` funcional.
- Home muestra insight mensual con tendencia.
- Historial permite filtrar por periodo.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint insight mensual |
| 02 | Frontend | Tarjeta insight mensual |
| 03 | Frontend | Filtro temporal en historial |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/insight-mensual` con tendencia de nota de corto plazo.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Insight mensual” en Home con mensaje contextual por tendencia.

## PR 03 — estado actual
- ✅ Completado: filtro temporal en Historial (`7 días`, `30 días`, `todo`).

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/insight-mensual` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "testsUltimos30Dias": 18,
    "aciertosUltimos30Dias": 312,
    "notaMediaUltimos30Dias": 6.84,
    "deltaNota7Dias": 0.41,
    "tendencia": "subiendo"
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-insight-mensual.test.js`
- `npm test` (backend) → `tests 237`, `pass 237`, `fail 0`
- `npm run build` (frontend)
