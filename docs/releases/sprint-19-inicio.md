# Sprint 19 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Convertir el progreso detectado en acción de refuerzo concreta por tema:

1. Detectar temas débiles del usuario en backend.
2. Mostrar recomendación de refuerzo por tema en Home.
3. Mejorar análisis de historial con filtro por nota.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → progreso visible y acción inmediata.
- `docs/40-motor-aprendizaje-anki.md` → refuerzo basado en errores.
- `docs/05-diseno-ux-plataforma.md` → interfaz simple y enfocada.

## Alcance comprometido

### PR 01 — Endpoint temas débiles (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/temas-debiles`.
- Devuelve top temas con menor porcentaje de acierto.
- Respuesta: lista con `temaId`, `temaNombre`, `materiaNombre`, `oposicionNombre`, `aciertos`, `errores`, `porcentajeAcierto`.

### PR 02 — Tarjeta “Tema a reforzar” en Home (Frontend) [P0]
- Nuevo bloque en Home con el primer tema débil sugerido.
- CTA “Hacer refuerzo del tema” que genera test de refuerzo directo.
- Si no hay datos suficientes, mensaje de fallback.

### PR 03 — Filtro por nota en Historial (Frontend) [P1]
- Selector adicional de filtro por nota:
  - Todas
  - Aprobados (≥5)
  - Suspensos (<5)
- Se combina con filtros existentes de modo y texto.

## Fuera de alcance
- Ajuste de pesos por dificultad en scoring.
- Recomendador con IA avanzada.
- Segmentación por subtema.

## Criterios de Done
- Endpoint `GET /stats/temas-debiles` operativo.
- Home muestra tarjeta de tema débil y CTA de refuerzo.
- Historial permite filtrar por aprobados/suspensos.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint temas débiles |
| 02 | Frontend | Tarjeta tema débil en Home |
| 03 | Frontend | Filtro por nota en Historial |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/temas-debiles` con top de temas de menor acierto.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Tema a reforzar” en Home con CTA de refuerzo directo.

## PR 03 — estado actual
- ✅ Completado: filtro por nota en Historial (`todas`, `aprobados`, `suspensos`).

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/temas-debiles` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": [
    {
      "temaId": 12,
      "temaNombre": "Acto administrativo",
      "materiaNombre": "Derecho Administrativo",
      "oposicionNombre": "Auxiliar Administrativo",
      "aciertos": 8,
      "errores": 11,
      "porcentajeAcierto": 42
    }
  ]
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-temas-debiles.test.js`
- `npm test` (backend) → `tests 235`, `pass 235`, `fail 0`
- `npm run build` (frontend)
