# Sprint 13 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Activar el ciclo de retención avanzada definido en `docs` para convertir continuidad en hábito diario:

1. Test de refuerzo con preguntas falladas/en blanco/dudosas.
2. Repetición espaciada visible y accionable para el usuario.
3. Señales de racha + recordatorio de estudio para no romper continuidad.

## Base documental (fuente)
- `docs/69-arquitectura-objetivo-v1.md` → Fase 2 (retención): progreso por tema, test de refuerzo, dashboard de usuario.
- `docs/14-algoritmo-spaced-repetition.md` → intervalos y objetivo de repetición espaciada.
- `docs/40-motor-aprendizaje-anki.md` → tabla `repeticion_espaciada` y selección por `proxima_revision`.
- `docs/44-ux-maximizar-uso.md` → racha diaria y recordatorio “No rompas tu racha de estudio”.
- `docs/01-plataforma-test-oposiciones.md` → definición funcional de test de refuerzo.

## Alcance comprometido

### PR 01 — Test de refuerzo real (Backend + Frontend) [P0]

**Backend**
- Endpoint nuevo: `POST /api/v1/tests/generate-refuerzo`
- Selección prioritaria por usuario con este orden:
  1) preguntas falladas recientes,
  2) preguntas en blanco,
  3) preguntas marcadas/dudosas,
  4) fallback a banco del tema si faltan.
- Reutilizar pipeline existente de creación de test (`tests`, `tests_preguntas`) para no duplicar lógica.

**Frontend**
- CTA en inicio: “Hacer test de refuerzo”.
- Flujo mínimo: genera test de refuerzo y navega a `/test`.

### PR 02 — Cola de repaso pendiente (Backend + Frontend) [P0]

**Backend**
- Endpoint nuevo: `GET /api/v1/repaso/pendientes?limit=20`
- Basado en `repeticion_espaciada.proxima_revision <= NOW()` por usuario.
- Respuesta incluye total pendiente + items de próximas preguntas.

**Frontend**
- Bloque en home/historial: “Repaso pendiente hoy”.
- Acción: “Empezar repaso” (genera test sobre pendientes).

## PR 02 — estado actual
- ✅ Completado: endpoint `GET /api/v1/repaso/pendientes`, bloque “Repaso pendiente hoy” en Home y acción “Empezar repaso”.

### PR 03 — Racha y recordatorio de continuidad (Backend + Frontend) [P1]

**Backend**
- Endpoint nuevo: `GET /api/v1/stats/racha`
- Métricas: racha actual (días), mejor racha, actividad últimos 7 días.

**Frontend**
- KPI visible de racha en cabecera.
- Mensaje contextual:
  - si no hay actividad hoy: “No rompas tu racha de estudio”.
  - si hay actividad: “Racha activa”.

## Fuera de alcance en este sprint
- Notificaciones push/email reales (solo mensaje in-app en Sprint 13).
- Rediseño completo de dashboard.
- Ajustes avanzados del algoritmo (SM-2 completo / IA adaptativa compleja).

## Criterios de Done
- Usuario autenticado puede lanzar test de refuerzo desde la UI y completar el flujo de test.
- Usuario ve repaso pendiente del día y puede iniciarlo con un clic.
- Usuario ve racha actual y mejor racha con mensajes de continuidad.
- Endpoints nuevos validados por esquema y sin regresiones en tests backend.
- `npm run build` de frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend + Frontend | Test de refuerzo real por fallos/blancos/dudosas |
| 02 | Backend + Frontend | Cola de repaso pendiente + arranque rápido |
| 03 | Backend + Frontend | Racha y mensaje de continuidad |

## Estado actual
- Sprint completado. PR 01, PR 02 y PR 03 completados.

## PR 01 — estado actual
- ✅ Completado: endpoint `POST /api/v1/tests/generate-refuerzo`, selección priorizada (fallos/blancos/marcadas), CTA en Home y navegación a `/test`.

## Validaciones 16/03/2026
- `node --test tests/services/test-refuerzo.test.js`
- `node --test tests/services/test-history.test.js`
- `node --test tests/services/repaso-pendientes.test.js`
- `node --test tests/services/stats-racha.test.js`
- `npm test` (backend)
- `npm run build` (frontend)

## PR 03 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/racha`, KPI de racha en Home y mensaje contextual de continuidad.

### Endpoint PR 03 (request/response)
- **Request**: `GET /api/v1/stats/racha` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "rachaActual": 4,
    "mejorRacha": 9,
    "estudioHoy": false,
    "actividad7Dias": [
      { "fecha": "2026-03-10", "tests": 1, "activo": true },
      { "fecha": "2026-03-11", "tests": 0, "activo": false },
      { "fecha": "2026-03-12", "tests": 2, "activo": true },
      { "fecha": "2026-03-13", "tests": 1, "activo": true },
      { "fecha": "2026-03-14", "tests": 1, "activo": true },
      { "fecha": "2026-03-15", "tests": 1, "activo": true },
      { "fecha": "2026-03-16", "tests": 0, "activo": false }
    ]
  }
}
```
