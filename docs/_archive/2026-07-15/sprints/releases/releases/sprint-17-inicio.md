# Sprint 17 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar feedback de corto plazo para reforzar continuidad semanal:

1. Exponer resumen de rendimiento de los últimos 7 días.
2. Mostrar ese resumen en Home de forma simple y accionable.
3. Añadir atajo para reintentar el mejor test reciente desde historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → progreso visible y feedback inmediato.
- `docs/05-diseno-ux-plataforma.md` → flujo simple con navegación rápida.
- `docs/36-roadmap-plataforma.md` → consolidación MVP con métricas de uso.

## Alcance comprometido

### PR 01 — Endpoint resumen semanal (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/resumen-semana`.
- Métricas MVP:
  - `testsUltimos7Dias`
  - `notaMediaUltimos7Dias`
  - `tiempoMedioSegundosUltimos7Dias`
  - `aciertosTotalesUltimos7Dias`
- Fuente: `tests` + `resultados_test` para el usuario autenticado, últimos 7 días.

### PR 02 — Tarjeta “Resumen semanal” en Home (Frontend) [P0]
- Nuevo bloque en Home con las 4 métricas anteriores.
- Mensaje contextual:
  - si `testsUltimos7Dias = 0`: “Aún no tienes actividad esta semana”.
  - si > 0: “Llevas X tests esta semana, ¡buen ritmo!”.

### PR 03 — Acción “Reintentar mejor test semanal” (Frontend) [P1]
- En Historial, botón para reintentar automáticamente el test con mejor nota de los últimos 7 días.
- Si no hay tests en 7 días, deshabilitar botón y mostrar hint.

## Fuera de alcance
- Comparativas entre usuarios.
- Gráficas avanzadas por día.
- Exportación de reportes.

## Criterios de Done
- Endpoint `GET /stats/resumen-semana` funcional.
- Home muestra tarjeta de resumen semanal.
- Historial permite reintentar mejor test semanal en 1 clic.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint resumen semanal |
| 02 | Frontend | Tarjeta resumen semanal en Home |
| 03 | Frontend | Reintentar mejor test semanal |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/resumen-semana` con métricas de actividad y rendimiento últimos 7 días.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Resumen semanal” en Home con métricas y mensaje contextual.

## PR 03 — estado actual
- ✅ Completado: acción “Reintentar mejor test semanal” en Historial.

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/resumen-semana` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "testsUltimos7Dias": 6,
    "notaMediaUltimos7Dias": 7.42,
    "tiempoMedioSegundosUltimos7Dias": 523,
    "aciertosTotalesUltimos7Dias": 138
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-resumen-semana.test.js`
- `npm test` (backend) → `tests 231`, `pass 231`, `fail 0`
- `npm run build` (frontend)
