# Sprint 47 — Descomposicion de MisOposicionesPage

**PR:** #151  
**Rama:** `sprint-47/pr-151-misoposiciones-sections`  
**Fecha merge:** 2025

---

## Objetivo

Descomponer `MisOposicionesPage.jsx` (107 lineas) en componentes presentacionales, separando el estado vacio y cada tarjeta de oposicion.

---

## Cambios

### Pagina refactorizada

| Archivo | Antes | Despues | Reduccion |
|---|---|---|---|
| `frontend/src/pages/MisOposicionesPage.jsx` | 107 lineas | 55 lineas | -49% |

### Componentes creados

#### `frontend/src/components/misoposiciones/MisOposicionesEmpty.jsx`

- **Props:** ninguna
- **Renderiza:** mensaje de estado vacio con enlace `<Link to="/">Ir al inicio</Link>`

#### `frontend/src/components/misoposiciones/OposicionCard.jsx`

- **Props:** `op`, `onNavigate`, `onPracticar`
- **Helper movido desde la pagina:** `formatDate`
- **Calcula internamente:** `color` (barra de maestria segun porcentaje), `pctAcierto`
- **Renderiza:** div clicable (`onClick` → `onNavigate`), sombra al hover, cabecera con nombre y ultima practica, boton Practicar (`e.stopPropagation()` → `onPracticar`), barra de maestria coloreada, grid de estadisticas (respondidas / % acierto / tests realizados)

---

## Estructura resultante

```
frontend/src/
  pages/
    MisOposicionesPage.jsx                       # 55 lineas — solo orquestacion
  components/
    misoposiciones/
      MisOposicionesEmpty.jsx                    # estado vacio
      OposicionCard.jsx                          # tarjeta por oposicion
```

---

## Notas tecnicas

- `MisOposicionesPage` conserva `Link` (usado en el breadcrumb de navegacion).
- Los callbacks `onNavigate` y `onPracticar` mantienen la logica de `navigate` en la pagina:
  - `onNavigate(id)` → `navigate('/oposicion/${id}')`
  - `onPracticar(id)` → `navigate('/', { state: { oposicionId: id } })`
- Build verificado: 125 modulos, 0 errores.
