# Sprint 18 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Reforzar la continuidad de estudio diaria con visibilidad de hábito y arranque rápido:

1. Exponer actividad de los últimos 14 días.
2. Mostrar continuidad visual en Home.
3. Permitir iniciar un test rápido desde Progreso para no cortar la racha.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → racha, continuidad y acción inmediata.
- `docs/05-diseno-ux-plataforma.md` → interfaz simple y navegación rápida.
- `docs/40-motor-aprendizaje-anki.md` → priorización práctica del estudio diario.

## Alcance comprometido

### PR 01 — Endpoint actividad 14 días (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/actividad-14dias`.
- Respuesta:
  - `diasActivos14`
  - `estudioHoy`
  - `actividad14Dias[]` con `{ fecha, tests, activo }`.

### PR 02 — Tarjeta continuidad en Home (Frontend) [P0]
- Bloque “Continuidad 14 días” en Home.
- Muestra `diasActivos14/14` y tira visual simple por día (activo/inactivo).
- Mensaje contextual:
  - si `estudioHoy=false`: “Haz un test rápido para mantener la racha”.
  - si `estudioHoy=true`: “Hoy ya has sumado actividad ✅”.

### PR 03 — Acción rápida en Progreso (Frontend) [P1]
- Botón “Hacer test rápido” en Progreso.
- Usa recomendación vigente y genera test en 1 clic.

## Fuera de alcance
- Predicción de abandono con ML.
- Notificaciones push/email.
- Comparativas sociales.

## Criterios de Done
- Endpoint `GET /stats/actividad-14dias` operativo.
- Home muestra continuidad de 14 días.
- Progreso incluye acción “Hacer test rápido”.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint actividad 14 días |
| 02 | Frontend | Tarjeta continuidad en Home |
| 03 | Frontend | Acción test rápido en Progreso |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/actividad-14dias` con `diasActivos14`, `estudioHoy` y detalle diario.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Continuidad 14 días” en Home con vista rápida de días activos/inactivos.

## PR 03 — estado actual
- ✅ Completado: acción “Hacer test rápido” en Progreso para arrancar en 1 clic.

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/actividad-14dias` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "diasActivos14": 9,
    "estudioHoy": true,
    "actividad14Dias": [
      { "fecha": "2026-03-03", "tests": 0, "activo": false },
      { "fecha": "2026-03-04", "tests": 2, "activo": true }
    ]
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-actividad-14dias.test.js`
- `npm test` (backend) → `tests 233`, `pass 233`, `fail 0`
- `npm run build` (frontend)
