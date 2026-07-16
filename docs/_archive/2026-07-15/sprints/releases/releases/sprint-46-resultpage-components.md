# Sprint 46 — Descomposicion de ResultPage

**PR:** #150  
**Rama:** `sprint-46/pr-150-result-sections`  
**Fecha merge:** 2025

---

## Objetivo

Descomponer `ResultPage.jsx` (105 lineas) en componentes presentacionales reutilizables, reduciendo la pagina al minimo de orquestacion.

---

## Cambios

### Pagina refactorizada

| Archivo | Antes | Despues | Reduccion |
|---|---|---|---|
| `frontend/src/pages/ResultPage.jsx` | 105 lineas | 34 lineas | -68% |

### Componentes creados

#### `frontend/src/components/result/ResultCard.jsx`

- **Props:** `result`, `activeTest`
- **Constantes movidas desde la pagina:** `MODO_LABEL`, `DIFICULTAD_LABEL`, `BADGE_STYLE`
- **Helper movido desde la pagina:** `formatTime`
- **Calcula internamente:** `total`, `pctAciertos`, `pctErrores`, `pctBlancos`, `nota`, `notaColor`, `tiempo`, `modoLabel`, `dificultadLabel`
- **Renderiza:** badges (modo + dificultad), nota grande coloreada (3.5rem), porcentaje de aciertos y tiempo, barra segmentada verde/rojo/gris, cuatro contadores (Aciertos / Errores / En blanco / Total)

#### `frontend/src/components/result/ResultAcciones.jsx`

- **Props:** `activeTest`
- **Constante movida:** `LINK_SECONDARY` (estilo de enlace secundario)
- **Renderiza:** enlace "Nuevo test" (siempre visible), enlaces condicionales segun `testId` (Revisar respuestas), `temaId` (Ver tema), `oposicionId && !temaId` (Ver oposicion), mas Ver progreso e Historial

---

## Estructura resultante

```
frontend/src/
  pages/
    ResultPage.jsx          # 34 lineas — solo orquestacion
  components/
    result/
      ResultCard.jsx        # visualizacion del resultado
      ResultAcciones.jsx    # enlaces de navegacion post-test
```

---

## Notas tecnicas

- `ResultPage` lee `sessionStorage` para `last_result` y `active_test` y los pasa como props.
- La variable `contexto` (temaNombre / oposicionNombre) se calcula en la pagina para el subtitulo del h1.
- El caracter `·` (punto medio) se sustituyó por la entidad HTML `&middot;` para evitar problemas de codificacion en PowerShell.
- Build verificado: 125 modulos, 0 errores.
