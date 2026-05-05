# Sprint 124 — Rediseño UI: ProgressPage + gráficos Recharts

**Fecha:** 2026-05-04  
**Tipo:** Frontend — rediseño visual + instalación de librería  
**Rama:** feature/sprint-124-progresspage-recharts

---

## Objetivo

Rediseñar la página de progreso aplicando el sistema de diseño del Sprint 120 e incorporar gráficos interactivos con Recharts: gráfico de área para evolución temporal y donut para distribución de respuestas.

---

## Dependencias añadidas

```
npm install recharts   →   40 paquetes añadidos
```

---

## Archivos afectados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/components/progress/EvolucionSection.jsx` | reescritura | Recharts `AreaChart` con gradiente naranja |
| `frontend/src/components/progress/ResumenGlobalSection.jsx` | reescritura | Donut `PieChart` + 4 KPI cards + barra distribución |
| `frontend/src/components/progress/RachaObjetivoSection.jsx` | reescritura | Nuevo diseño CARD, mini calendario 7 días, sub-KPIs objetivo |
| `frontend/src/pages/ProgressPage.jsx` | modificado | Grid con gap 16, separadores mejorados, cabecera actualizada, teaser Elite en naranja |

---

## EvolucionSection — Recharts AreaChart

**Antes:** gráfico de barras manual con divs coloreados (~80 líneas).

**Después:**
```jsx
<ResponsiveContainer height={200}>
  <AreaChart data={datos}>
    <defs>
      <linearGradient id="gradNota">  {/* naranja → transparente */}
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="fecha" />
    <YAxis domain={[0, 10]} />
    <ReferenceLine y={5} label="Aprobado" />
    <Area dataKey="nota" fill="url(#gradNota)" stroke="#ea580c" />
    <Tooltip content={<CustomTooltip />} />
  </AreaChart>
</ResponsiveContainer>
```

Header muestra nota media + tendencia (↑ verde / ↓ rojo).

---

## ResumenGlobalSection — Donut PieChart

**Antes:** 6 tiles grises + barra de progreso plana.

**Después:**
- Donut `PieChart` (innerRadius 42 / outerRadius 62): Aciertos 🟢 / Errores 🔴 / En blanco ⚪ con porcentaje central
- 4 KPI cards con icono coloreado: Tests realizados, Tasa de acierto, Nota media, Tiempo medio
- Barra de distribución segmentada con leyenda

---

## RachaObjetivoSection

- Card racha: icono 🔥 grande + mejor racha + badge "Estudiado/Sin estudiar hoy" + mini calendario 7 días
- Card objetivo: contador grande `X / Y preguntas`, barra naranja de progreso, 3 sub-KPIs (Hoy, Esta semana, Racha objetivos)

---

## ProgressPage.jsx

- `GRID2`: `gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'` + `gap: 16`
- `SectionLabel`: separador más marcado (`fontWeight 800`, `margin 28px`)
- Cabecera: `fontWeight 900`, `fontSize 1.5rem`
- Teaser Elite: fondo `#fff7ed`, borde naranja, botón `#ea580c`

---

## Verificación

- Build Vite: 0 errores en todos los archivos modificados

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| 120 | Sistema CSS + Sidebar | ✅ |
| 121 | HomePage dashboard | ✅ |
| 122 | TestPage split layout | ✅ |
| 123 | SimulacrosPage + RankingPage | ✅ |
| **124** | **ProgressPage + Recharts** | **✅** |
| 125 | ConfigurarTestPage + formularios | ✅ |
