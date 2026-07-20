# Sprint 16 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Reducir el tiempo hasta la primera acción útil del día y facilitar revisión del historial reciente:

1. Filtrar historial para encontrar rápidamente tests relevantes.
2. Exponer un foco diario recomendado desde backend.
3. Añadir acciones de arranque rápido desde Home/Progreso usando ese foco.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → progreso visible, recomendación y rapidez.
- `docs/40-motor-aprendizaje-anki.md` → priorización por pendientes y refuerzo.
- `docs/36-roadmap-plataforma.md` → consolidación de plataforma completa en MVP.

## Alcance comprometido

### PR 01 — Filtros de historial (Frontend) [P0]
- `HistorialPage` con filtros por modo (`todos`, `adaptativo`, `normal`, `repaso`, `refuerzo`, `simulacro`, `marcadas`).
- Filtro por texto sobre materia/tema/oposición.
- Contador visible: “mostrando X de Y”.

### PR 02 — Endpoint foco diario (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/foco-hoy`.
- Estrategia MVP:
  1) si hay repaso pendiente → foco `repaso` con `temaId` y `pendientes`,
  2) si no hay pendiente → foco `refuerzo` sobre tema con peor ratio de acierto,
  3) fallback → foco `adaptativo` de 10 preguntas.
- Payload listo para ejecutar test (`modo`, `temaId`, `numeroPreguntas`, `motivo`).

### PR 03 — CTA de foco diario (Frontend) [P1]
- `HomePage`: tarjeta “Foco de hoy” con motivo + botón “Empezar foco”.
- `ProgressPage`: acción rápida “Ir al foco de hoy”.
- Reutiliza endpoint `GET /stats/foco-hoy` y generación existente de tests.

## Fuera de alcance
- Algoritmo adaptativo avanzado por subtema.
- Personalización manual de foco por usuario.
- Notificaciones push/email.

## Criterios de Done
- Historial filtrable por modo y texto.
- Endpoint `GET /stats/foco-hoy` disponible y estable.
- Home y Progreso permiten arrancar foco diario en 1 clic.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Frontend | Filtros de historial |
| 02 | Backend | Endpoint foco diario |
| 03 | Frontend | CTA foco diario en Home/Progreso |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: filtros de historial por modo y texto con contador de resultados visibles.

## PR 02 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/foco-hoy` con estrategia de prioridad (repaso → refuerzo → adaptativo).

## PR 03 — estado actual
- ✅ Completado: tarjeta y CTA “Foco de hoy” en Home y botón rápido en Progreso para iniciar test en 1 clic.

### Endpoint PR 02 (request/response)
- **Request**: `GET /api/v1/stats/foco-hoy` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "modo": "repaso",
    "temaId": 14,
    "numeroPreguntas": 10,
    "motivo": "Tienes 12 preguntas pendientes en Tema 14"
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-foco-hoy.test.js`
- `npm test` (backend) → `tests 229`, `pass 229`, `fail 0`
- `npm run build` (frontend)
