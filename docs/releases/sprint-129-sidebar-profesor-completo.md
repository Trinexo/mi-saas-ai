# Sprint 129 — Sidebar del profesor completo

**Fecha de apertura:** 10 de mayo de 2026  
**Tipo:** Frontend / UX  
**Estado:** Completado

---

## Objetivo

Completar el sidebar de navegacion del workspace del profesor anadiendo las secciones que faltaban: Alumnos, Estadisticas, Planificacion y Notificaciones.

---

## Implementado

- `ProfesorLayout.jsx` — constante `NAV_ITEMS` ampliada de 7 a 11 elementos:

| Ruta | Icono | Etiqueta | Estado previo |
|---|---|---|---|
| `/profesor` | ▦ | Dashboard | Existia |
| `/profesor/oposiciones` | ▤ | Mis oposiciones | Existia |
| `/profesor/temario` | ▥ | Temario | Existia |
| `/profesor/tests` | ▣ | Tests | Existia |
| `/profesor/simulacros` | ▤ | Simulacros | Existia |
| `/profesor/preguntas` | ? | Preguntas | Existia |
| `/profesor/alumnos` | ◉ | Alumnos | **Nuevo** |
| `/profesor/estadisticas` | ◈ | Estadisticas | **Nuevo** |
| `/profesor/calendario` | ◷ | Planificacion | **Nuevo** |
| `/profesor/revision` | ◎ | Revision | Existia |
| `/profesor/notificaciones` | ◬ | Notificaciones | **Nuevo** |

- Las cuatro secciones nuevas ya tenian rutas y paginas registradas en el router; solo faltaba el enlace en el sidebar.

## Verificacion

- Build frontend: correcto.
- Sidebar del profesor muestra los 11 items en local.
- Navegacion a `/profesor/alumnos`, `/profesor/estadisticas`, `/profesor/calendario` y `/profesor/notificaciones` carga las paginas correctas.

---

## Archivos modificados

| Archivo | Operacion |
|---|---|
| `frontend/src/pages/profesor/ProfesorLayout.jsx` | Modificado — `NAV_ITEMS` ampliado a 11 elementos |

---

## Adicional: Tests y simulacros sin finalizar

**Fecha:** 12-13 de mayo de 2026  
**Scope:** Backend + Frontend / Tests sin finalizar

### Objetivo

Permitir que los alumnos vean tests y simulacros sin finalizar (estado `generado` con 0 o más respuestas) en secciones dedicadas de `/mis-tests` y `/simulacros`, con opciones de Continuar o Cerrar.

### Implementado

#### Backend

**`backend/src/services/testPendientes.service.js`** — nuevo archivo:
- `getPendientes(userId)` — devuelve todos los tests en estado `generado` (no finalizados), con conteo de respuestas y datos básicos de oposición/tema.
- `cerrar(userId, testId)` — marca un test como `finalizado` + fecha_fin = NOW(), validando que pertenece al usuario.

**`backend/src/controllers/test.controller.js`** — modificado:
- Imports: `testPendientesService`
- Handlers añadidos:
  - `getTestPendientes` → `GET /tests/pendientes`
  - `cerrarTest` → `POST /tests/:testId/cerrar`

**`backend/src/routes/v1/tests.routes.js`** — modificado:
- Rutas: `GET /pendientes` y `POST /:testId/cerrar` (antes de `/:testId/review`)

**`backend/src/services/testContinuar.service.js`** — modificado:
- Añadida condición: `AND EXISTS (SELECT 1 FROM respuestas_usuario ru WHERE ru.test_id = t.id)` para excluir tests con 0 respuestas del card "retomar" del Home.

#### Frontend

**`frontend/src/services/testApi.js`** — modificado:
- Nuevos métodos:
  - `getPendientes(token)` → GET /tests/pendientes
  - `cerrar(token, testId)` → POST /tests/:testId/cerrar

**`frontend/src/pages/MisTestsPage.jsx`** — reescrita:
- Estado nuevo: `pendientes`, `loadingPend`, `continuandoId`, `cerrandoId`
- Componente `PendienteCard` — tarjeta con barra de progreso (respondidas/total), botones Continuar/Cerrar
- Sección "Tests sin finalizar" — siempre visible (muestra "Todo al día" si vacío), filtra tipos `normal` y `mejorar` (excluye `simulacro`)
- Cabecera naranja con contador badge

**`frontend/src/pages/SimulacrosPage.jsx`** — modificada:
- Estado nuevo: `pendientesSim` (filtrado `tipoTest === 'simulacro'` del listado de pendientes)
- Componente `PendienteSimulacroCard` — mismo diseño con colores naranja
- Sección "⏳ Simulacros sin finalizar" — entre "Simulacros del profesor" y "Simulacro personalizado", con estado vacío personalizado

### Datos consultados

**Tabla `tests`:**
- Filtro: `usuario_id = ?, estado = 'generado'`
- Sin `HAVING COUNT(respuestas) > 0` → muestra tests incluso con 0 respuestas

**Tabla `respuestas_usuario`:**
- Usado en `COUNT(ru.id)` para mostrar "X/Y respondidas" en cada card

### Verificación

✅ `GET /tests/pendientes` devuelve tests `generado` sin filtrar por respuestas  
✅ `POST /tests/:testId/cerrar` cambia estado a `finalizado` y desaparece de la lista  
✅ `/mis-tests` muestra sección "Tests sin finalizar" con tests normal/mejorar (excluye simulacro)  
✅ `/simulacros` muestra sección "Simulacros sin finalizar" con tests tipo `simulacro`  
✅ Card "retomar" del Home no incluye tests con 0 respuestas  
✅ Cabeceras en ambas páginas igualadas (títulos naranja + badges con contador)

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `backend/src/services/testPendientes.service.js` | ✨ Nuevo |
| `backend/src/controllers/test.controller.js` | +2 handlers |
| `backend/src/routes/v1/tests.routes.js` | +2 rutas |
| `backend/src/services/testContinuar.service.js` | +AND EXISTS (respuestas_usuario) |
| `frontend/src/services/testApi.js` | +getPendientes, +cerrar |
| `frontend/src/pages/MisTestsPage.jsx` | Reescrita — sección pendientes + componente |
| `frontend/src/pages/SimulacrosPage.jsx` | +sección simulacros sin finalizar |
