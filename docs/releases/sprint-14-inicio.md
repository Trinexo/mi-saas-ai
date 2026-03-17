# Sprint 14 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Convertir la continuidad de estudio en hábito diario con una capa de motivación y foco operativo sobre lo ya entregado en Sprints 12–13:

1. Objetivo diario visible y accionable desde Home.
2. Gamificación base (puntos y nivel) por actividad real.
3. Recomendación de test rápido para reducir fricción de inicio.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → progreso diario, objetivo del día, racha, mensaje de continuidad.
- `docs/40-motor-aprendizaje-anki.md` → priorizar repasos vencidos y continuidad basada en rendimiento.
- `docs/69-arquitectura-objetivo-v1.md` → fase de retención y analítica práctica en MVP.
- `docs/36-roadmap-plataforma.md` → consolidación de plataforma completa antes de escalado.

## Alcance comprometido

### PR 01 — Objetivo diario (Backend + Frontend) [P0]

**Backend**
- Endpoint nuevo: `GET /api/v1/stats/objetivo-diario`
- Métricas mínimas:
  - `objetivoPreguntasDia` (default MVP: 30)
  - `preguntasRespondidasHoy`
  - `porcentajeCumplido`
  - `cumplido` (boolean)
- Fuente de cálculo: respuestas del día en `respuestas_usuario` del usuario autenticado.

**Frontend**
- Bloque en Home: “Objetivo de hoy”.
- Barra/progreso simple con ratio actual.
- Mensaje contextual:
  - si no cumplido: “Te faltan X preguntas para completar tu objetivo”.
  - si cumplido: “Objetivo del día completado ✅”.

### PR 02 — Gamificación base (Backend + Frontend) [P1]

**Backend**
- Endpoint nuevo: `GET /api/v1/stats/gamificacion`
- Regla MVP de puntos:
  - +10 XP por test finalizado
  - +2 XP por respuesta correcta
- Respuesta:
  - `xpTotal`
  - `nivelActual`
  - `xpSiguienteNivel`
  - `progresoNivel`
- Mapeo de nivel MVP:
  - `nivelActual = floor(xpTotal / 100) + 1`

**Frontend**
- KPI compacto en Home: “Nivel” + “XP”.
- Barra de progreso hacia siguiente nivel.
- Integración visual mínima, sin rediseño global.

### PR 03 — Recomendación de test rápido (Backend + Frontend) [P1]

**Backend**
- Endpoint nuevo: `GET /api/v1/tests/recomendado`
- Estrategia MVP:
  1) si hay repaso pendiente → sugerir `modo: 'repaso'` con tema sugerido,
  2) si no hay repaso pendiente y hay fallos recientes → sugerir `modo: 'refuerzo'`,
  3) fallback → sugerir `modo: 'adaptativo'` con 10 preguntas.
- Devuelve payload listo para generar test (`modo`, `temaId/oposicionId`, `numeroPreguntas`, `motivo`).

**Frontend**
- CTA principal en Home: “Hacer test ahora”.
- Al pulsar, consulta recomendación y genera directamente el test sugerido.
- Mensaje corto bajo botón con el motivo recomendado.

## Fuera de alcance en este sprint
- Notificaciones push/email reales.
- Sistema social/rankings entre usuarios.
- Personalización avanzada de objetivo diario por perfil.
- Economía avanzada de recompensas (logros, insignias, tienda).

## Criterios de Done
- Usuario autenticado ve su objetivo diario y progreso en Home.
- Usuario autenticado ve XP/nivel actualizado en Home.
- Usuario puede iniciar “test ahora” con recomendación automática en 1 clic.
- Endpoints nuevos con validación y sin regresiones de tests backend.
- `npm run build` de frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend + Frontend | Objetivo diario y progreso visible |
| 02 | Backend + Frontend | XP y nivel (gamificación base) |
| 03 | Backend + Frontend | Recomendación + CTA “Hacer test ahora” |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/objetivo-diario` y bloque “Objetivo de hoy” en Home con progreso y mensaje contextual.

## PR 02 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/gamificacion` y KPI de nivel/XP en Home con barra de progreso al siguiente nivel.

## PR 03 — estado actual
- ✅ Completado: endpoint `GET /api/v1/tests/recomendado` y CTA “Hacer test ahora” en Home con generación en 1 clic según recomendación.

### Endpoint PR 02 (request/response)
- **Request**: `GET /api/v1/stats/gamificacion` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "xpTotal": 340,
    "nivelActual": 4,
    "xpSiguienteNivel": 400,
    "progresoNivel": 40
  }
}
```

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/objetivo-diario` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "objetivoPreguntasDia": 30,
    "preguntasRespondidasHoy": 12,
    "porcentajeCumplido": 40,
    "cumplido": false
  }
}
```

### Endpoint PR 03 (request/response)
- **Request**: `GET /api/v1/tests/recomendado` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "modo": "repaso",
    "temaId": 14,
    "numeroPreguntas": 10,
    "motivo": "Tienes repasos pendientes hoy"
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-objetivo-diario.test.js`
- `node --test tests/services/stats-gamificacion.test.js`
- `node --test tests/services/test-recomendado.test.js`
- `npm test` (backend)
- `npm run build` (frontend)
