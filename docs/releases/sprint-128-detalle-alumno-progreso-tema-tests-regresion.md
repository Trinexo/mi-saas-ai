# Sprint 128 — Detalle alumno para profesor, progreso por tema real y tests de regresion

**Fecha de apertura:** 9 de mayo de 2026  
**Tipo:** Backend / Frontend / Testing  
**Estado:** Completado

---

## Implementado

### Sprint 128.1 — Detalle de alumno para el profesor

- Endpoint `GET /api/profesor/workspace/alumnos/:alumnoId` — devuelve perfil completo del alumno: nombre, email, oposiciones inscritas, tests realizados, aciertos, errores, racha actual y ultima actividad.
- Controller `getDetalleAlumno` exportado desde `profesorWorkspace.controller.js`.
- Ruta registrada en `profesor.routes.js` bajo autenticacion y verificacion de rol profesor.
- Pagina `ProfesorAlumnoDetallePage.jsx` reescrita para consumir el endpoint real en lugar de datos simulados: muestra KPIs, tabla de rendimiento por oposicion, historial reciente de tests y estado vacio profesional.

### Sprint 128.2 — Progreso por tema real en el dashboard del alumno

- `DashboardPage.jsx` (alumno) actualizado para llamar al endpoint `/api/stats/progreso-tema` real en lugar de usar datos hardcoded.
- Widget de progreso por tema muestra rendimiento real por tema con porcentaje de aciertos, numero de preguntas respondidas y fecha de ultima actividad.
- Estado vacio cuando el alumno no tiene actividad registrada en ningun tema.

### Sprint 128.3 — Tests de regresion del flujo de planificacion

- Archivo `backend/tests/services/planificacion-flujo.test.js` creado con 16 tests de regresion que cubren el ciclo completo de planificacion academica del profesor.
- Grupos de tests: `list` (2), `get` (2), `create` (5), `update` (1), `archive` (1), `resultados` (3), `enviarRecordatorio` (2).
- Todos los repositorios mockeados con patron `snapshot/restore` para evitar efectos secundarios entre tests.
- Script `test:all` en `backend/package.json` actualizado para incluir el nuevo archivo.
- Resultado verificado: **16/16 passing**.

### Correccion de bug detectado durante testing

- Asercion de tipo en `planificacion-flujo.test.js`: el servicio parsea `query.oposicion_id` a numero con `Number()`, por lo que la comparacion `capturedFilter.oposicionId === '10'` fallaba. Corregido a `Number(capturedFilter.oposicionId) === 10`.

## Verificacion

- Tests backend: 16/16 passing en `planificacion-flujo.test.js`.
- Build frontend: correcto.
- Import backend: correcto.
- Endpoint `GET /api/profesor/workspace/alumnos/:alumnoId`: responde con datos reales.
- Widget de progreso por tema en dashboard alumno: muestra datos reales del endpoint.

---

## Archivos modificados o creados

| Archivo | Operacion |
|---|---|
| `backend/src/controllers/profesorWorkspace.controller.js` | Modificado — export `getDetalleAlumno` |
| `backend/src/routes/v1/profesor.routes.js` | Modificado — ruta `GET /alumnos/:alumnoId` |
| `backend/tests/services/planificacion-flujo.test.js` | Creado — 16 tests de regresion |
| `backend/package.json` | Modificado — script `test:all` actualizado |
| `frontend/src/pages/profesor/ProfesorAlumnoDetallePage.jsx` | Modificado — datos reales |
| `frontend/src/pages/DashboardPage.jsx` | Modificado — progreso por tema real |
