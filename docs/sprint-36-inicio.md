# Sprint 36 — Descomposición de HomePage.jsx en widgets y forms reutilizables

## Fecha
Sprint cerrado: PR #131 → merge `4254a69` en `main`

## Objetivo
Eliminar el monolito `HomePage.jsx` (900 líneas, ~40 `useState`) extrayendo cada sección en un componente independiente autocontenido.

## Problema que resuelve
`HomePage.jsx` era el mayor punto de deuda técnica del frontend:
- 900 líneas en un solo fichero
- ~40 estados locales mezclados
- 16 `useEffect` paralelos con llamadas a API incrustadas
- Imposible reutilizar ninguna sección en otras páginas
- Difícil de depurar y extender

## Solución aplicada

### Nuevos componentes: `frontend/src/components/widgets/`

| Componente | Responsabilidad |
|---|---|
| `ResumenOposicionWidget` | Barra de maestría de la oposición preferida |
| `ConfigurarOposicionWidget` | Selector de oposición preferida (cuando no hay ninguna) |
| `TestRecomendadoWidget` | Test recomendado adaptativo con acción de inicio |
| `FocoHoyWidget` | Foco del día con acción de inicio |
| `ResumenSemanaWidget` | Estadísticas de los últimos 7 días |
| `Actividad14Widget` | Mapa de puntos de actividad de 14 días |
| `TemasDebilesWidget` | Tema más débil con botón de refuerzo |
| `InsightMensualWidget` | Tendencia de los últimos 30 días |
| `RendimientoModosWidget` | Tabla comparativa por modo (adaptativo/normal/repaso/etc.) |
| `ProgresoSemanalWidget` | Mapa de calor de actividad de 7 días |
| `EficienciaWidget` | Tiempo medio y aciertos por minuto |
| `ConsistenciaDiariaWidget` | Constancia de estudio en 30 días |
| `RitmoPreguntaWidget` | Segundos por pregunta y tendencia |
| `BalancePrecisionWidget` | Ratio acierto/error/blanco |
| `TuNivelWidget` | XP y nivel de gamificación con barra de progreso |
| `ObjetivoDiarioWidget` | Barra de progreso del objetivo diario |
| `TuRachaWidget` | Racha de días consecutivos y últimos 7 días |
| `RepasoPendienteWidget` | Botón de arranque del repaso espaciado pendiente |

### Nuevos componentes: `frontend/src/components/forms/`

| Componente | Responsabilidad |
|---|---|
| `GenerarTestForm` | Selector completo de oposición/materia/tema/modo/dificultad con refuerzo |
| `SimulacroForm` | Generador de simulacro de examen con duración opcional |

### Patrón de cada widget
- Gestiona su propio `useState` y `useEffect`
- Llama directamente a `testApi` (o `catalogApi`/`authApi` según corresponda)
- Los widgets de acción (`TestRecomendadoWidget`, `FocoHoyWidget`, `TemasDebilesWidget`, `RepasoPendienteWidget`) tienen su propio `useAsyncAction` y `useNavigate`
- Sin props: autocontenidos

### `HomePage.jsx` resultante
```jsx
export default function HomePage() {
  const { user } = useAuth();
  return (
    <>
      {user?.oposicionPreferidaId ? <ResumenOposicionWidget /> : <ConfigurarOposicionWidget />}
      <TestRecomendadoWidget />
      <FocoHoyWidget />
      ... (18 componentes)
      <GenerarTestForm />
      <SimulacroForm />
    </>
  );
}
```

## Métricas

| Métrica | Antes | Después |
|---|---|---|
| Líneas `HomePage.jsx` | 900 | **47** |
| `useState` en `HomePage` | ~40 | **1** (`user`) |
| `useEffect` en `HomePage` | 16 | **0** |
| Módulos Vite build | 66 | **86** (+20) |
| Errores de build | 0 | **0** |
| `className` en el frontend | 0 | **0** |

## Archivos modificados
- `frontend/src/pages/HomePage.jsx` — reducido de 900 a 47 líneas
- `frontend/src/components/widgets/*` — 18 nuevos ficheros
- `frontend/src/components/forms/*` — 2 nuevos ficheros

## PR
- **#131** Sprint 36 — Descomponer HomePage.jsx en widgets y forms reutilizables
- Commit squash: `4254a69`
