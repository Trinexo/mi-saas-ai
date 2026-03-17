# Sprint 21 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar la lectura de rendimiento por tipo de práctica y facilitar análisis del historial:

1. Exponer rendimiento por modo de test en backend.
2. Mostrar resumen de rendimiento por modo en Home.
3. Permitir ordenar historial por fecha o nota.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → feedback claro y accionable.
- `docs/05-diseno-ux-plataforma.md` → navegación simple y rápida.
- `docs/36-roadmap-plataforma.md` → consolidación de analítica práctica en MVP.

## Alcance comprometido

### PR 01 — Endpoint rendimiento por modo (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/rendimiento-modos`.
- Ventana de análisis: últimos 30 días.
- Respuesta por modo:
  - `modo`
  - `tests`
  - `notaMedia`
  - `aciertosTotales`
  - `erroresTotales`

### PR 02 — Tarjeta “Rendimiento por modo” en Home (Frontend) [P0]
- Bloque con tabla/listado compacto de modos y métricas.
- Resaltar el modo con mejor nota media.
- Si no hay datos, mostrar fallback simple.

### PR 03 — Ordenación en Historial (Frontend) [P1]
- Selector de orden:
  - `Fecha (reciente primero)`
  - `Nota (alta primero)`
- Compatible con filtros existentes (modo, texto, nota, periodo).

## Fuera de alcance
- Segmentación por subtema y dificultad avanzada.
- Recomendador ML por modo.
- Exportación CSV de analítica.

## Criterios de Done
- Endpoint `GET /stats/rendimiento-modos` operativo.
- Home muestra rendimiento por modo.
- Historial permite ordenar por fecha/nota.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint rendimiento por modo |
| 02 | Frontend | Tarjeta rendimiento por modo |
| 03 | Frontend | Ordenación en Historial |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/rendimiento-modos` con agregados por modo de test (últimos 30 días).

## PR 02 — estado actual
- ✅ Completado: tarjeta “Rendimiento por modo” en Home con mejor modo y tabla compacta de métricas.

## PR 03 — estado actual
- ✅ Completado: selector de orden en Historial (`fecha` o `nota`) compatible con filtros existentes.

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/rendimiento-modos` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "modo": "adaptativo",
      "tests": 9,
      "notaMedia": 7.21,
      "aciertosTotales": 126,
      "erroresTotales": 48
    }
  ]
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-rendimiento-modos.test.js`
- `npm test` (backend) → `tests 239`, `pass 239`, `fail 0`
- `npm run build` (frontend)
