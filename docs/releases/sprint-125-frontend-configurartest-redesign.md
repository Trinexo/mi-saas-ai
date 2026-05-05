# Sprint 125 — Rediseño UI: ConfigurarTestPage y formularios

**Fecha:** 2026-05-05  
**Tipo:** Frontend — rediseño visual  
**Rama:** feature/sprint-125-configurartest-redesign

---

## Objetivo

Aplicar el sistema de diseño del Sprint 120 a la pantalla de configuración de test y sus dos formularios internos (`GenerarTestForm` y `SimulacroForm`), unificando la paleta naranja y el estilo de cards con el resto de páginas rediseñadas.

---

## Archivos afectados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/pages/ConfigurarTestPage.jsx` | modificado | Cabecera, tabs activos en naranja, badge Pro naranja |
| `frontend/src/components/forms/GenerarTestForm.jsx` | modificado | SECTION naranja, spinner naranja, botón naranja |
| `frontend/src/components/forms/SimulacroForm.jsx` | modificado | SECTION naranja, icono naranja, selects y botón naranjas |

---

## ConfigurarTestPage

| Elemento | Antes | Después |
|---|---|---|
| Cabecera | `1.375rem / fontWeight 800` | `1.5rem / fontWeight 900`, subtítulo `#9ca3af` |
| Tab activo color | `#1d4ed8` (azul) | `#ea580c` (naranja) |
| Borde tab activo | `2px solid #1d4ed8` | `2px solid #ea580c` |
| Badge "Pro" | gris `#f3f4f6` | fondo `#fff7ed`, texto+borde naranja |

---

## GenerarTestForm

| Elemento | Antes | Después |
|---|---|---|
| `SECTION` borderBottom | `3px solid #10b981` (verde) | `3px solid #ea580c` (naranja) |
| `SECTION` shape | `borderRadius 12` | `borderRadius 16` + `border 1px solid #e5e7eb` |
| Icono cabecera | fondo verde `#10b981` | fondo naranja `#ea580c` |
| Spinner de generación | azul `#dbeafe / #1d4ed8` | naranja `#fff7ed / #ea580c` |
| Estado carga catálogo | párrafo `<p>` plano | spinner naranja estilizado |
| Estado error | párrafo `<p>` plano | banner rojo con icono ⚠️ |
| Botón "Generar test" | verde `#10b981` | naranja `#ea580c` |

---

## SimulacroForm

| Elemento | Antes | Después |
|---|---|---|
| `SECTION` borderBottom | `3px solid #1d4ed8` (azul) | `3px solid #ea580c` (naranja) |
| `SECTION` shape | `borderRadius 12` | `borderRadius 16` + `border 1px solid #e5e7eb` |
| Icono cabecera | fondo azul `#1d4ed8` | fondo naranja `#ea580c` |
| Select oposición activo | borde `#93c5fd` (azul) | borde `#fdba74` (naranja) |
| Label "Tiempo oficial" | texto azul | texto naranja |
| Input duración activo | borde `#93c5fd` | borde `#fdba74` |
| Botón "Iniciar simulacro" | azul `#1d4ed8` | naranja `#ea580c` |

---

## Verificación

- Build Vite: 0 errores en los 3 archivos

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| 120 | Sistema CSS + Sidebar | ✅ |
| 121 | HomePage dashboard | ✅ |
| 122 | TestPage split layout | ✅ |
| 123 | SimulacrosPage + RankingPage | ✅ |
| 124 | ProgressPage + Recharts | ✅ |
| **125** | **ConfigurarTestPage + formularios** | **✅** |
