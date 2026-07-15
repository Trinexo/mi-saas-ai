# Sprint 127 — Backend MVP del workspace profesor

**Fecha de apertura:** 8 de mayo de 2026  
**Tipo:** Backend MVP / Analitica academica / Perfil profesor  
**Estado:** ✅ Cerrado

---

## Actualizacion 9 de mayo de 2026

Sprint 127 ya no queda solo como plan de backend MVP: se ha avanzado la implementacion del workspace profesor y la alineacion tecnica con el modelo academico actual.

### Implementado

- Backend `/api/profesor/workspace/*` para dashboard, oposiciones, detalle, alumnos, estadisticas, temario, alertas, calendario y seleccion de preguntas.
- Backend `/api/plan-estudio` para planificaciones visibles por el alumno.
- Rutas especificas de profesor para tests y simulacros:
  - `/profesor/tests`
  - `/profesor/tests/nuevo`
  - `/profesor/simulacros`
  - `/profesor/simulacros/nuevo`
- Selectores de oposicion limitados a oposiciones asignadas al profesor.
- Seleccion por defecto cuando el profesor solo tiene una oposicion asignada.
- Revision de reportes visible para profesor solo sobre preguntas de sus oposiciones asignadas.
- Creacion e importacion CSV de preguntas desde perfil profesor.
- Banco de preguntas compartido por oposicion: los profesores de la misma oposicion ven y reutilizan todas las preguntas de esa oposicion.
- Creacion de preguntas por profesor publicada directamente dentro de su oposicion asignada.
- Media de preguntas e imagenes/audio protegidos para profesor segun oposiciones asignadas.
- Frontend del workspace profesor conectado a datos reales en las pantallas principales.
- Login redirige a profesor hacia `/profesor`, evitando que cargue pantallas admin y provoque 403 esperados.
- Repositorio legado de profesor alineado con `preguntas.tema_id`, evitando fallos con preguntas nuevas sin `bloque_id`.
- Banco de preguntas del profesor con filtro real por dificultad y listado compartido por oposicion asignada.
- Wizard de simulacros de profesor conectado a rutas propias `/api/profesor/mis-simulacros/*`.
- Rutas admin de simulacros cerradas a `admin`, evitando edicion directa por profesor fuera del workspace propio.
- Secciones de simulacro de profesor aceptan `numero_preguntas` en alta y edicion.
- Modales de seleccion de preguntas corrigen paginacion usando `pagination.total`.
- Alta de secciones de simulacro de profesor conserva `numero_preguntas` desde controlador y servicio.
- Planificacion de profesor limitada a actividades propias y oposiciones asignadas.
- Planificacion de simulacros exige que el simulacro haya sido creado por el profesor que lo programa.
- Home del alumno deja de mostrar materias de ejemplo cuando no hay plan real y usa un estado vacio profesional.
- Workspace profesor retira series, alumnos y porcentajes simulados del frontend; ahora muestra datos reales o estados vacios.
- Dashboard profesor deja de ocultar errores del endpoint principal `/profesor/workspace/dashboard`.
- Limpieza de textos visibles en el workspace profesor para evitar mojibake y mantener UTF-8 correcto en dashboard, oposiciones, estadisticas, preguntas, temario, tests y simulacros.
- Banco de medios del profesor expuesto bajo rutas propias:
  - `/api/profesor/media/preguntas`
  - `/api/profesor/media/audios`
  - `/api/profesor/preguntas/:id/imagen`
  - `/api/profesor/preguntas/:id/audio`
- Los modales de imagen/audio seleccionan automaticamente la API de profesor o admin segun el rol, evitando 403 por llamadas innecesarias a `/api/admin/media/*`.
- Limpieza de textos visibles del banco de medios de preguntas para mantener UTF-8 correcto.
- Dashboard profesor conectado al selector de oposicion: al cambiar la oposicion se recalculan KPIs, evolucion, actividad reciente, preguntas, tests y simulacros con datos filtrados por backend.
- Badge de revision en el menu habilitado tambien para profesor usando `/api/profesor/reportes`, de forma que solo cuenta reportes abiertos de sus oposiciones asignadas.
- Tests curados validan que el `tema_id` pertenezca a la `oposicion_id` seleccionada antes de crear o actualizar, evitando cruces entre oposiciones.
- Tests y simulacros bloquean cambios de `oposicion_id` cuando ya contienen preguntas de otra oposicion, evitando contenido cruzado tras una edicion.
- Seleccion automatica de preguntas usa realmente `permitir_completar_con_otros_temas`: si faltan preguntas en los temas pedidos, completa con otros temas de la misma oposicion y avisa si no alcanza.
- Tests del profesor expuestos bajo rutas propias `/api/profesor/mis-tests/*` para detalle, creacion, edicion y gestion de preguntas, evitando que el workspace profesor dependa de `/api/admin/tests/*`.
- Editor visual de tests reutilizado por admin/profesor selecciona automaticamente `profesorApi` o `adminApi` segun el rol.
- Listados compartidos estabilizados para profesor: tests y simulacros usan rutas propias cuando el rol es profesor, revision usa `/api/profesor/reportes`, y los modales de medios dejan de llamar a endpoints admin.
- Limpieza final de textos corruptos visibles en administracion de etiquetas y verificacion de UTF-8 en el frontend; solo queda excluido `text-normalizer.js` porque contiene patrones intencionados de reparacion.
- Edicion parcial de tests estabilizada: el repositorio de `admin_tests` actualiza solo los campos enviados y ya no puede vaciar `oposicion_id`, `tema_id`, descripcion o configuracion por omisiones del payload.
- Schema base alineado con el modelo actual: `tests.tema_id` queda definido, se anade la migracion `027_align_profesor_workspace_schema.sql`, y `schema.sql` incluye `accesos_oposicion` y `profesores_oposiciones`.
- Generacion de tests guarda ya el `tema_id` real; el progreso legacy por `bloque_id` se vuelve no bloqueante para evitar errores al enviar tests creados directamente desde temas.
- Progreso por tema implementado como siguiente paso de transicion: `progreso_usuario.tema_id`, migracion `028_add_tema_id_to_progreso_usuario.sql`, backfill desde bloques y `bloque_id` queda nullable para compatibilidad.

### Alineacion de modelo

El modelo oficial sigue siendo:

```txt
Oposicion -> Temas -> Preguntas -> Tests / Simulacros
```

Cambios aplicados:

- `preguntas.tema_id` es la relacion oficial usada por las consultas nuevas.
- `preguntas.bloque_id` queda como compatibilidad heredada.
- `colecciones` sustituye el uso antiguo de bloques como agrupacion flexible.
- Los listados de preguntas, reportes, media, tests, simulacros y analitica de profesor se apoyan en `tema_id`.

### Verificacion

- Backend: `npm.cmd test -- --runInBand` correcto.
- Frontend: `npm.cmd run build` correcto.
- Importacion de rutas backend: correcta.
- Verificacion adicional tras rutas de medios profesor: backend y frontend correctos.
- Verificacion adicional tras filtro de dashboard por oposicion: backend y frontend correctos.
- Verificacion adicional tras badge de revision profesor: frontend correcto.
- Verificacion adicional tras validacion tema/oposicion en tests: backend correcto.
- Verificacion adicional tras bloqueo de cambio de oposicion con preguntas asociadas: backend correcto.
- Verificacion adicional tras completar faltantes desde otros temas de la misma oposicion: backend correcto.
- Verificacion adicional tras rutas propias de tests profesor: backend y frontend correctos.
- Verificacion adicional tras estabilizacion de llamadas profesor/admin y limpieza UTF-8: frontend correcto.
- Verificacion adicional tras update parcial de tests: import de backend, tests backend y build frontend correctos.
- Verificacion adicional tras alineacion `tests.tema_id`/schema: import de backend, tests backend y build frontend correctos.
- Verificacion adicional tras `progreso_usuario.tema_id`: migracion aplicada en local, import backend, tests backend y build frontend correctos.
- Verificacion adicional tras pagina completa de Plan de estudio alumno: build frontend, import backend y tests backend correctos.

---

## Objetivo del sprint

Convertir el nuevo workspace visual de profesor en una experiencia funcional con datos reales, reduciendo los datos simulados o derivados del frontend y creando un backend MVP que permita al profesor:

- supervisar oposiciones asignadas;
- ver alumnos asociados a esas oposiciones;
- medir rendimiento academico;
- detectar preguntas y bloques problematicos;
- revisar actividad reciente;
- planificar simulacros y publicaciones;
- recibir alertas utiles.

El foco no es crear toda la analitica avanzada definitiva, sino una primera capa fiable, segura y extensible.

---

## Estado actual

### Ya existe

- Rol `profesor`.
- Tabla `profesores_oposiciones`.
- Rutas base `/api/profesor`.
- Dashboard simple de profesor.
- Listado de preguntas del profesor.
- Creacion/importacion CSV de preguntas con guardas por oposicion asignada.
- Tests y simulacros reutilizando endpoints admin/profesor.
- Reportes de preguntas filtrados por oposiciones asignadas.
- Notificaciones para profesor.
- Frontend del workspace profesor:
  - `/profesor`
  - `/profesor/oposiciones`
  - `/profesor/oposiciones/:id`
  - `/profesor/temario`
  - `/profesor/preguntas`
  - `/profesor/alumnos`
  - `/profesor/estadisticas`
  - `/profesor/calendario`
  - `/profesor/revision`
  - `/profesor/notificaciones`

### Falta

- Endpoints agregados para alimentar el workspace.
- Metricas reales por oposicion, alumno, tema/bloque, pregunta, test y simulacro.
- Listado real de alumnos asociados a las oposiciones del profesor.
- Detalle academico por alumno.
- Alertas automaticas.
- Calendario persistente.
- Normalizacion de respuestas para que el frontend deje de usar fallbacks visuales.

---

## Alcance MVP

### Incluido

1. Backend de dashboard profesor.
2. Backend de oposiciones asignadas con resumen academico.
3. Backend de detalle de oposicion.
4. Backend de alumnos del profesor.
5. Backend de estadisticas generales.
6. Backend de preguntas problematicas.
7. Backend de alertas MVP.
8. Backend de calendario academico MVP.
9. Adaptacion frontend para consumir datos reales.
10. Tests de servicios/repositorios criticos.

### No incluido en MVP

- IA generativa de recomendaciones.
- Heatmaps historicos complejos con almacenamiento preagregado.
- Drag & drop real del calendario.
- Comparativas avanzadas por cohortes.
- Mensajeria profesor-alumno.

---

## Modelo de permisos

Todo endpoint del sprint debe cumplir:

- Solo `profesor` autenticado.
- Todas las consultas se limitan a `profesores_oposiciones`.
- Un profesor solo ve alumnos con acceso activo a alguna de sus oposiciones.
- Un profesor solo ve preguntas, reportes, tests, simulacros y resultados vinculados a sus oposiciones.
- Si se solicita `oposicion_id`, debe validarse contra sus asignaciones.

Helper obligatorio:

- `profesorAccessRepository.listAssignedOposicionIds(userId)`
- `profesorAccessRepository.hasAssignedOposicion(userId, oposicionId)`

Si falta algun helper especifico, se crea en este sprint.

---

## Endpoints MVP propuestos

### 1. Dashboard profesor

`GET /api/profesor/workspace`

Debe devolver:

```json
{
  "kpis": {
    "alumnos_activos": 0,
    "tests_hoy": 0,
    "media_aciertos": 0,
    "simulacros_completados": 0,
    "preguntas_pendientes_revision": 0
  },
  "evolucion": [
    {
      "fecha": "2026-05-08",
      "media_aciertos": 68,
      "tiempo_medio_min": 31,
      "actividad": 22
    }
  ],
  "actividad_reciente": [],
  "oposiciones": [],
  "alertas": []
}
```

Fuente de datos inicial:

- alumnos: accesos activos por oposicion;
- tests: `tests`, `resultados_test`;
- preguntas/reportes: `preguntas`, `reportes_preguntas`;
- simulacros: `simulacros`, tests de tipo simulacro si aplica;
- actividad: `actividad_global`, `auditoria_preguntas`, reportes y resultados recientes.

---

### 2. Mis oposiciones

`GET /api/profesor/workspace/oposiciones`

Debe devolver una card por oposicion asignada:

```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Auxiliar Administrativo del Estado",
      "categoria": "Administracion",
      "alumnos_activos": 256,
      "tests": 45,
      "simulacros": 8,
      "preguntas": 320,
      "progreso_medio": 68,
      "media_aciertos": 72,
      "ultimo_simulacro": {
        "id": 4,
        "nombre": "Simulacro 4",
        "fecha": "2026-05-08"
      }
    }
  ]
}
```

---

### 3. Detalle de oposicion

`GET /api/profesor/workspace/oposiciones/:id`

Debe devolver:

- resumen academico;
- rendimiento por tema/bloque;
- temas con mas fallos;
- actividad reciente de alumnos;
- simulacros activos;
- tests creados;
- preguntas/reportes asociados.

Validacion:

- `:id` debe ser una oposicion asignada al profesor.

---

### 4. Alumnos

`GET /api/profesor/workspace/alumnos?oposicion_id=&q=&page=&page_size=`

Debe listar alumnos que tienen acceso a las oposiciones asignadas al profesor.

Campos MVP:

- `id`
- `nombre`
- `email`
- `oposiciones`
- `progreso`
- `ultima_actividad`
- `media_aciertos`
- `tests_realizados`
- `simulacros_realizados`
- `riesgo` (`bajo`, `medio`, `alto`)

`GET /api/profesor/workspace/alumnos/:id`

Debe devolver:

- resumen individual;
- evolucion;
- historial de tests/simulacros;
- temas debiles;
- preguntas falladas frecuentes;
- tiempo de estudio aproximado.

Validacion:

- El alumno debe tener acceso a alguna oposicion asignada al profesor.

---

### 5. Estadisticas generales

`GET /api/profesor/workspace/estadisticas?oposicion_id=&desde=&hasta=`

Debe devolver:

- evolucion global de aciertos;
- evolucion de actividad;
- tiempo medio;
- rendimiento por oposicion;
- distribucion por dificultad;
- ranking de alumnos;
- preguntas problematicas.

Campos para preguntas problematicas:

- `pregunta_id`
- `enunciado`
- `oposicion`
- `tema`
- `tasa_fallo`
- `intentos`
- `reportes`
- `abandono_estimado`

---

### 6. Temario

`GET /api/profesor/workspace/temario?oposicion_id=`

Debe devolver:

- oposiciones asignadas;
- temas;
- bloques;
- numero de preguntas;
- tasa de acierto;
- tasa de fallo;
- reportes abiertos;
- tests/simulacros vinculados.

MVP:

- lectura analitica.

Fuera de MVP:

- CRUD completo de temario desde profesor si requiere reglas academicas adicionales.

---

### 7. Alertas

`GET /api/profesor/workspace/alertas?oposicion_id=`

Alertas MVP:

- preguntas reportadas abiertas;
- bloque/tema con tasa de acierto baja;
- alumno inactivo;
- simulacro con media baja;
- pregunta con tasa de fallo alta.

Modelo recomendado:

No crear tabla todavia si no es necesario. Generar alertas dinamicas desde consultas agregadas.

Tabla futura opcional:

```sql
profesor_alertas (
  id,
  profesor_id,
  oposicion_id,
  tipo,
  severidad,
  titulo,
  mensaje,
  entidad,
  entidad_id,
  resuelta,
  creado_en,
  resuelta_en
)
```

---

### 8. Calendario academico

MVP persistente:

`GET /api/profesor/workspace/calendario?desde=&hasta=`

`POST /api/profesor/workspace/calendario`

`PUT /api/profesor/workspace/calendario/:id`

`DELETE /api/profesor/workspace/calendario/:id`

Nueva migracion recomendada:

```sql
profesor_eventos (
  id BIGSERIAL PRIMARY KEY,
  profesor_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id BIGINT REFERENCES oposiciones(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('simulacro', 'test', 'clase', 'revision', 'publicacion', 'otro')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ,
  entidad TEXT,
  entidad_id BIGINT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Validacion:

- Si incluye `oposicion_id`, debe estar asignada al profesor.

---

## Repositorios y servicios propuestos

### Backend

Crear:

- `backend/src/repositories/profesorWorkspace.repository.js`
- `backend/src/services/profesorWorkspace.service.js`
- `backend/src/controllers/profesorWorkspace.controller.js`
- `backend/src/schemas/profesorWorkspace.schema.js`

Extender:

- `backend/src/routes/v1/profesor.routes.js`
- `backend/src/repositories/profesorAccess.repository.js`
- `backend/src/repositories/profesorDashboard.repository.js` o sustituirlo progresivamente por `profesorWorkspace.repository.js`

### Frontend

Adaptar:

- `frontend/src/pages/profesor/profesorWorkspaceData.js`
- `frontend/src/services/profesorApi.js`
- `frontend/src/pages/profesor/ProfesorDashboardPage.jsx`
- `frontend/src/pages/profesor/ProfesorOposicionesPage.jsx`
- `frontend/src/pages/profesor/ProfesorOposicionDetallePage.jsx`
- `frontend/src/pages/profesor/ProfesorEstadisticasPage.jsx`
- `frontend/src/pages/profesor/ProfesorAlumnosPage.jsx`
- `frontend/src/pages/profesor/ProfesorCalendarioPage.jsx`
- `frontend/src/pages/profesor/ProfesorTemarioPage.jsx`
- `frontend/src/pages/profesor/ProfesorPreguntasPage.jsx`

---

## Backlog por PR

### PR A — Base de workspace profesor

- Crear controller/service/repository/schema.
- Añadir rutas bajo `/api/profesor/workspace`.
- Crear helpers de permisos por oposicion/alumno.
- Tests de acceso:
  - profesor sin asignaciones;
  - profesor con una asignacion;
  - profesor intentando consultar oposicion ajena.

### PR B — Dashboard y oposiciones

- Implementar `GET /workspace`.
- Implementar `GET /workspace/oposiciones`.
- Implementar `GET /workspace/oposiciones/:id`.
- Sustituir fallbacks principales del dashboard frontend.

### PR C — Alumnos

- Implementar listado de alumnos por oposiciones asignadas.
- Implementar detalle de alumno.
- Calcular:
  - progreso;
  - media;
  - actividad;
  - riesgo academico MVP.
- Conectar `/profesor/alumnos`.

### PR D — Estadisticas y preguntas problematicas

- Implementar `/workspace/estadisticas`.
- Agregar consultas por:
  - pregunta;
  - tema;
  - bloque;
  - oposicion;
  - dificultad.
- Conectar `/profesor/estadisticas`.
- Enriquecer `/profesor/preguntas`.

### PR E — Temario analitico

- Implementar `/workspace/temario`.
- Devolver temas/bloques con metricas.
- Conectar `/profesor/temario`.

### PR F — Alertas MVP

- Implementar `/workspace/alertas`.
- Generar alertas dinamicas.
- Conectar dashboard y notificaciones visuales.

### PR G — Calendario MVP

- Crear migracion `026_profesor_eventos.sql`.
- CRUD de eventos.
- Conectar `/profesor/calendario`.
- Validar oposicion asignada.

### PR H — Limpieza frontend y QA

- Retirar datos mock/fallback innecesarios.
- Normalizar estados de carga/error/vacio.
- Revisar responsive.
- Corregir mojibake visible en paginas profesor heredadas.
- Build frontend.
- Suite backend.

---

## Consultas analiticas MVP

### Alumnos activos

Base:

- usuarios con acceso activo a oposiciones asignadas.

### Media de aciertos

Base:

- `resultados_test.aciertos / tests.numero_preguntas`
- limitar por tests de oposiciones asignadas.

### Progreso por alumno

MVP:

- promedio de `progreso_usuario` sobre bloques de la oposicion.
- fallback: tests finalizados / tests esperados si no hay progreso suficiente.

### Tasa de fallo por pregunta

Base:

- `respuestas_usuario.correcta = false`
- agrupado por `pregunta_id`.

### Preguntas reportadas

Base:

- `reportes_preguntas.estado IN ('abierto', 'en_revision')`.

### Actividad reciente

Fuentes combinadas:

- `actividad_global`
- `auditoria_preguntas`
- `tests.fecha_creacion`
- `resultados_test.fecha`
- `reportes_preguntas.fecha_creacion`

---

## Criterios de aceptacion

- El profesor no ve datos de oposiciones no asignadas.
- `/profesor` carga sin datos simulados para KPIs principales.
- `/profesor/oposiciones` muestra solo oposiciones asignadas con metricas reales.
- `/profesor/oposiciones/:id` devuelve 403 si la oposicion no esta asignada.
- `/profesor/alumnos` muestra alumnos con acceso a sus oposiciones.
- `/profesor/estadisticas` muestra ranking, preguntas problematicas y evolucion desde backend.
- `/profesor/calendario` persiste eventos reales.
- El frontend muestra estados vacios profesionales si no hay datos.
- `npm.cmd run build` frontend correcto.
- `npm.cmd test -- --runInBand` backend correcto.

---

## Riesgos

- El esquema actual mezcla etapas historicas (`bloque_id`, `tema_id`, colecciones). Hay que confirmar columnas reales antes de cada consulta.
- Algunas metricas pueden ser costosas si se calculan en caliente sobre muchas respuestas.
- El concepto "alumno del profesor" depende de accesos a oposiciones, no de una relacion directa profesor-alumno.
- Las alertas pueden generar falsos positivos si no se definen umbrales claros.

---

## Decisiones MVP

- Relacion profesor-alumno MVP: alumno con acceso activo a oposicion asignada al profesor.
- Alertas MVP: calculadas dinamicamente, sin tabla persistente.
- Calendario MVP: tabla nueva `profesor_eventos`.
- Analitica MVP: agregaciones SQL directas con indices suficientes.
- Preagregados/materialized views: fuera del MVP, valorar en sprint posterior si hay lentitud.

---

## Definition of Done

- Endpoints documentados y protegidos.
- Frontend conectado sin fallbacks falsos en KPIs principales.
- Tests unitarios/servicio para permisos y agregaciones.
- Migracion aplicada en local si se crea calendario.
- Sprint actualizado con archivos modificados y verificacion final.

---

## Estabilizacion de errores

### Corregido

- El modal de gestion de preguntas del wizard de simulacros ya usa endpoints de profesor cuando el usuario tiene rol `profesor`.
- La seleccion/listado de preguntas para simulacros de profesor usa `/api/profesor/mis-preguntas`.
- La asignacion y retirada de preguntas en simulacros de profesor usa `/api/profesor/mis-simulacros/:id/bloques/:bloqueId/preguntas`.
- Se reviso que los textos de las pantallas compartidas de test/simulacros estan guardados en UTF-8; la salida mojibake observada corresponde a la consola, no al archivo fuente.
- La lista de tests del perfil profesor vuelve a ocupar ancho completo en escritorio, alineada con el estilo del workspace.
- El menu profesor muestra badge de revision con los reportes abiertos de sus oposiciones asignadas.
- Se actualizo el layout profesor antiguo para no conservar rutas `/profesor/mis-tests` y `/profesor/mis-simulacros`.
- Las paginas compartidas de tests/simulacros quedan endurecidas para usar APIs de profesor cuando el rol sea `profesor`.
- Se corrigio `/api/profesor/dashboard` para no ordenar por `preguntas.fecha_creacion`, columna que no existe en el modelo actual.
- Se hizo tolerante `/api/admin/actividad`: si falta la tabla `actividad_global`, devuelve lista vacia en vez de tumbar el dashboard.
- Se alineo `database/schema.sql` con migraciones aplicadas: `preguntas.imagen_url`, `preguntas.audio_url` y `tests.fecha_fin`.
- El listado admin/profesor de preguntas ya acepta y aplica filtros `q` y `estado`, usados por modales y bancos de preguntas.

### Plan de estudio alumno

- Se anadio `tests.planificacion_id` con la migracion `029_add_planificacion_id_to_tests.sql`.
- El Plan de estudio del alumno ya puede iniciar actividades reales desde `POST /api/plan-estudio/:id/empezar`.
- Las actividades de tipo `tema_recomendado` generan un test normal/adaptativo desde los temas configurados por el profesor.
- Las actividades de tipo `plantilla_test` crean una sesion usando las preguntas del test publicado recomendado.
- Las actividades de tipo `simulacro` crean una sesion usando las preguntas del simulacro publicado.
- El Home del alumno guarda la actividad iniciada como `active_test` y navega directamente a `/test`.
- El listado de Plan de estudio cuenta intentos por alumno y marca como `completado` cuando existe un test finalizado vinculado a la planificacion.
- Al finalizar un test, el progreso del alumno se acumula por `preguntas.tema_id`; esto permite que tests mixtos, plantillas y simulacros alimenten correctamente las metricas por tema.
- La planificacion del profesor devuelve metricas de seguimiento por actividad: intentos totales, alumnos iniciados, completados, nota media y tiempo medio.
- La pagina `/profesor/calendario` muestra esas metricas en cada actividad planificada.
- Se anadio `GET /api/profesor/workspace/planificacion/:id/resultados` para consultar el seguimiento por alumno de una actividad planificada.
- El detalle de resultados incluye alumnos pendientes, iniciados y completados, con intentos, nota media, mejor nota y ultimo intento.
- La pagina `/profesor/calendario` permite abrir el panel de resultados desde cada actividad.
- Se anadio `POST /api/profesor/workspace/planificacion/:id/recordatorio` para enviar notificaciones a alumnos pendientes de completar una actividad.
- El panel de resultados permite enviar recordatorios a pendientes y muestra confirmacion con el numero de alumnos notificados.
- El componente compartido `Button` del workspace profesor soporta estado `disabled`.
- Las notificaciones `plan_estudio` y `plan_estudio_recordatorio` incluyen `oposicionNombre` en `datos_extra`.
- La pagina de notificaciones del alumno reconoce avisos del Plan de estudio, muestra estilo propio y permite abrir `/plan-estudio` con la oposicion activa seleccionada.
- Se anadio la pagina completa `/plan-estudio` para el alumno, con listado de todas sus actividades planificadas por oposicion, filtros por estado, resumen superior y accion directa para empezar.
- El menu principal del alumno incluye acceso a Plan de estudio.
- El Home del alumno cambia el bloque semanal para enlazar a `/plan-estudio` mediante "Ver todo" y usa la misma ruta en el estado vacio.
- Se anadio cobertura de servicio para Plan de estudio: control de acceso por oposicion, listado permitido, bloqueo de actividades no disponibles e inicio de tema recomendado con vinculacion de `planificacion_id`.
- El arranque de actividades del Plan de estudio valida tambien que una plantilla de test o simulacro pertenezca a la misma oposicion planificada antes de crear la sesion del alumno.
- El catalogo de oposiciones queda corregido por rol: alumno y usuario anonimo siguen viendo solo oposiciones con preguntas, mientras que admin y profesor pueden ver oposiciones sin preguntas para poder crear estructura, subir contenido y mantener Gestion Procesal, Tramitacion y Auxiliar Administrativo aunque esten vacias.
- El endpoint publico `/api/oposiciones` carga autenticacion opcional; si llega token de `admin` o `profesor`, devuelve tambien oposiciones sin preguntas.
- Las pantallas autenticadas que consumen `catalogApi.getOposiciones` envian token para respetar el comportamiento por rol.

### Verificacion

- `frontend`: `npm.cmd run build` correcto.
- `backend`: `npm.cmd test -- --runInBand` correcto, 210 tests en verde.
- `backend`: importacion de `src/app.js` correcta tras registrar `/plan-estudio`.
- `backend`: consulta de planificacion del profesor validada con `planificacion query OK`.
- `backend`: SQL de actualizacion de progreso validado con `updateProgress SQL OK`.
- `backend`: SQL de resultados de planificacion validado con `planificacion resultados query OK`.
- `backend`: SQL de alumnos pendientes de planificacion validado con `pendientes query OK`.

### Seleccion automatica para admin (11 de mayo de 2026)

- Nuevo metodo `seleccionarAdmin()` en `profesorWorkspaceSeleccion.service.js`: misma logica que `seleccionar()` pero sin validaciones de acceso de profesor (`profesorAccess`). Solo valida que los temas pertenezcan a la oposicion indicada.
- Nuevo export `seleccionarPreguntasAdmin` en `adminTests.controller.js`.
- Nueva ruta `POST /api/admin/tests/seleccion/preguntas` en `adminTests.routes.js`, protegida con `requireRole('admin')` y validada con `seleccionPreguntasSchema`.
- Nuevo metodo `seleccionarPreguntasAdmin(token, payload)` en `adminApi.js`.
- `AdminEditTestPage.jsx`: el `useEffect` de temas carga via `adminApi.listTemas` cuando es admin (normaliza a formato comun `{tema_id, tema_nombre}`). `handleAutoSelect` usa `adminApi.seleccionarPreguntasAdmin` para admin. El panel de auto-seleccion visible tambien para admin cuando hay temas cargados.
- `AdminSimulacroWizardPage.jsx` (`ModalGestionPreguntas`): mismos cambios que `AdminEditTestPage`.

### Verificacion (11 de mayo de 2026)

- `backend`: importacion de `src/app.js` correcta tras endpoint admin de seleccion.
- `frontend`: `npm.cmd run build` correcto, build completado en 6 segundos.
