# Sprint 84 – Split progressTemarioResumen.repository

## Fecha
2026-04-07

## Objetivo
Dividir `progressTemarioResumen.repository.js` (100 líneas, 3 métodos) en dos sub-repositorios cohesivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `progressTemarioResumenTema.repository.js` | Nuevo | `getTemaStats` + `getRepasoStats` |
| `progressTemarioResumenOposicion.repository.js` | Nuevo | `getResumenOposicion` |
| `progressTemarioResumen.repository.js` | Barrel | Compatibilidad — re-exporta ambos sub-repos |

## División de responsabilidades

### `progressTemarioResumenTema.repository.js`
- **`getTemaStats(userId, temaId)`** — progreso del usuario en un tema concreto (`progreso_usuario`)
- **`getRepasoStats(userId, temaId)`** — cuenta pendientes de repaso espaciado (`repeticion_espaciada`)

### `progressTemarioResumenOposicion.repository.js`
- **`getResumenOposicion(userId, oposicionId)`** — resumen agregado de una oposición: temas totales, temas practicados, maestría, preguntas respondidas, % acierto, tests realizados, nota media. Usa `Promise.all` con 3 consultas paralelas.

## Barrel de compatibilidad

```js
import { progressTemarioResumenTemaRepository } from './progressTemarioResumenTema.repository.js';
import { progressTemarioResumenOposicionRepository } from './progressTemarioResumenOposicion.repository.js';

export const progressTemarioResumenRepository = { ...progressTemarioResumenTemaRepository, ...progressTemarioResumenOposicionRepository };
export { progressTemarioResumenTemaRepository, progressTemarioResumenOposicionRepository };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #225 mergeado
