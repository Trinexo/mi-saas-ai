# Sprint 23 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Mejorar la lectura de eficiencia de estudio y permitir análisis rápido por tiempo:

1. Exponer eficiencia de tiempo en backend.
2. Mostrar insight de eficiencia en Home.
3. Añadir filtro por duración en Historial.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → feedback inmediato y progreso visible.
- `docs/05-diseno-ux-plataforma.md` → interfaz simple y navegación rápida.
- `docs/36-roadmap-plataforma.md` → consolidación de métricas útiles en MVP.

## Alcance comprometido

### PR 01 — Endpoint eficiencia de tiempo (Backend) [P0]
- Endpoint nuevo: `GET /api/v1/stats/eficiencia-tiempo`.
- Ventana: últimos 30 días.
- Respuesta:
  - `tiempoMedioPorTestSegundos`
  - `aciertosPorMinuto`
  - `testsAnalizados`
  - `tendenciaTiempo` (`mejorando`, `estable`, `empeorando`) comparando 7 días vs 7 previos.

### PR 02 — Tarjeta “Eficiencia” en Home (Frontend) [P0]
- Bloque con tiempo medio por test y aciertos por minuto.
- Mensaje contextual por tendencia de tiempo.

### PR 03 — Filtro por duración en Historial (Frontend) [P1]
- Selector de duración:
  - `todos`
  - `cortos (<10 min)`
  - `medios (10–30 min)`
  - `largos (>30 min)`
- Compatible con filtros actuales.

## Fuera de alcance
- Benchmark entre usuarios.
- Ajuste por dificultad de pregunta.
- Recomendador dinámico por tiempo.

## Criterios de Done
- Endpoint `GET /stats/eficiencia-tiempo` operativo.
- Home muestra tarjeta de eficiencia.
- Historial permite filtrar por duración.
- `npm test` backend sin regresiones.
- `npm run build` frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | Endpoint eficiencia de tiempo |
| 02 | Frontend | Tarjeta eficiencia en Home |
| 03 | Frontend | Filtro por duración en Historial |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: endpoint `GET /api/v1/stats/eficiencia-tiempo` con métricas de tiempo y ritmo de aciertos.

## PR 02 — estado actual
- ✅ Completado: tarjeta “Eficiencia” en Home con mensaje contextual por tendencia.

## PR 03 — estado actual
- ✅ Completado: filtro por duración en Historial (cortos/medios/largos).

### Endpoint PR 01 (request/response)
- **Request**: `GET /api/v1/stats/eficiencia-tiempo` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "tiempoMedioPorTestSegundos": 712,
    "aciertosPorMinuto": 1.43,
    "testsAnalizados": 16,
    "tendenciaTiempo": "mejorando"
  }
}
```

## Validaciones 16/03/2026
- `node --test tests/services/stats-eficiencia-tiempo.test.js`
- `npm test` (backend) → `tests 243`, `pass 243`, `fail 0`
- `npm run build` (frontend)
