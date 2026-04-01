# Sprint 55 — Split progressStats.repository.js en progressGeneral y progressTemario

## Resumen

Refactorizacion del repositorio de progreso de estadisticas: `progressStats.repository.js` (480 lineas, 12 metodos) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 lineas).

## Motivacion

`progressStats.repository.js` mezclaba dos dominios distintos en 480 lineas:
- Estadisticas generales del usuario y datos transversales (dashboard, evolucion, simulacros, oposiciones del usuario)
- Progreso por temario: temas, materias, repaso y detalle por tema/materia

Separar ambos dominios permite localizar mas rapido cada consulta y facilita el mantenimiento independiente.

## Cambios

### Archivos creados

#### `backend/src/repositories/progressGeneral.repository.js`
- **Proposito**: Consultas de estadisticas generales y datos transversales del usuario
- **Lineas**: 177
- **Imports**: `pool`
- **Metodos** (5):
  - `getUserStats` — totales de tests, preguntas y aciertos del usuario
  - `getDashboard` — resumen rapido para el dashboard principal
  - `getSimulacrosStats` — estadisticas de simulacros completados
  - `getEvolucion` — serie temporal de rendimiento del usuario
  - `getMisOposiciones` — oposiciones a las que esta suscrito el usuario

#### `backend/src/repositories/progressTemario.repository.js`
- **Proposito**: Consultas de progreso desglosado por temas, materias y repaso
- **Lineas**: 306
- **Imports**: `pool`
- **Metodos** (7):
  - `getProgresoTemas` — % de avance por tema dentro de una oposicion
  - `getTemaStats` — estadisticas detalladas de un tema concreto
  - `getRepasoStats` — preguntas pendientes de repaso espaciado
  - `getResumenOposicion` — resumen global de progreso en una oposicion
  - `getProgresoMaterias` — % de avance por materia
  - `getProgresoTemasByMateria` — temas agrupados bajo una materia
  - `getDetalleTema` — detalle completo de un tema (preguntas, fallos, repaso)

### Archivos modificados

#### `backend/src/repositories/progressStats.repository.js` → barrel (10 lineas)
Fusiona ambos repositorios en `progressStatsRepository` para compatibilidad total:

```js
// Barrel de compatibilidad - los metodos se han dividido en progressGeneral y progressTemario.
import { progressGeneralRepository } from './progressGeneral.repository.js';
import { progressTemarioRepository } from './progressTemario.repository.js';

export const progressStatsRepository = {
  ...progressGeneralRepository,
  ...progressTemarioRepository,
};

export { progressGeneralRepository, progressTemarioRepository };
```

#### `backend/src/services/stats.service.js` — sin cambios
#### `backend/src/repositories/stats.repository.js` — sin cambios (barrel de nivel superior)

## Metricas

| Archivo | Antes | Despues |
|---|---|---|
| `progressStats.repository.js` | 480 lineas | 10 lineas (barrel) |
| `progressGeneral.repository.js` | — | 177 lineas |
| `progressTemario.repository.js` | — | 306 lineas |

## Compatibilidad

- **`stats.service.js`**: Sin cambios. Importa `progressStatsRepository` del barrel.
- **`stats.repository.js`**: Sin cambios. Importa `progressStatsRepository` del barrel y lo extiende en su propio barrel de nivel superior.
- **Nuevos consumidores**: Pueden importar `progressGeneralRepository` o `progressTemarioRepository` por separado.

## CI

- Build frontend: OK (327.31 kB)
- Tests backend: 4/4 checks passed
- PR codigo: #167
- PR docs: #168
