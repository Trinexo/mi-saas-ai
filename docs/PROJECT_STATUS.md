# Estado Del Proyecto

Fecha de consolidacion: 2026-07-15.

## Estado Git De Referencia

- Rama de trabajo esperada: `chore/consolidacion-documental`.
- Commit previo a fase 3: `917ca7b chore: proteger estado previo a consolidacion documental`.
- Tag de proteccion: `backup-antes-consolidacion-2026-07-15-02`.
- Tag previo existente: `backup-antes-consolidacion-2026-07-15`.

## Estado General

La aplicacion esta implementada como plataforma SaaS de test de oposiciones con backend, frontend y base de datos reales. No es solo un prototipo documental.

Durante la auditoria previa se verifico produccion en:

- Vercel frontend: `https://mi-saas-ai.vercel.app`
- Railway backend: `https://mi-saas-ai-production.up.railway.app`
- API base: `https://mi-saas-ai-production.up.railway.app/api`

El PR #417 estaba desplegado en Vercel y Railway segun paneles revisados.

## Funcionalidad Implementada Deducida Del Codigo

- Autenticacion, registro, login, perfil y recuperacion de password.
- Catalogo de oposiciones y acceso a oposiciones.
- Generacion, ejecucion, envio, scoring, revision e historial de tests.
- Estadisticas de progreso y rendimiento.
- Widgets de dashboard.
- Simulacros y simulacros publicos.
- Preguntas marcadas y repaso.
- Ranking con consentimiento.
- Notificaciones.
- Panel admin para preguntas, catalogo, reportes, usuarios, profesores, accesos, precios, simulacros, tests y ajustes.
- Workspace profesor con dashboard, alumnos, oposiciones, planificaciones, simulacros y estadisticas.
- Modo Albacer y modulos Albacer.
- Billing, planes y suscripciones.
- Multimedia de preguntas mediante imagen/audio.

## Verificacion Tecnica Previa

- Tests backend reportados en auditoria previa: 367 passed, 0 failed.
- Health backend produccion reportado: `success: true`, `status: ok`.
- Vercel mostraba despliegue listo para commit `4cac104` asociado a PR #417.

## Incidencias Recientes

- PR #416: mitigacion de 500 en dashboard workspace profesor.
- PR #417: optimizacion de consulta de oposiciones del dashboard profesor.
- Error previo observado en Railway/Postgres: falta de espacio en temporal PostgreSQL durante consulta de dashboard profesor.

## Documentacion No Vigente

La documentacion anterior contenia planes, sprints, instrucciones y arquitecturas objetivo mezcladas con avances reales. Todo queda archivado en `docs/_archive/2026-07-15/`.

## Riesgos Activos

- Consultas agregadas complejas pueden volver a tensionar PostgreSQL si crece el volumen o faltan indices.
- La estructura de datos real debe confirmarse antes de ejecutar scripts SQL.
- Las funcionalidades amplias del panel profesor/admin requieren pruebas de regresion cuando se toque SQL o permisos.
- Produccion puede cambiar; cualquier dato de Railway/Vercel debe verificarse de nuevo antes de actuar.

## Estado De Fase 4

La fase 4 de linea base funcional se ejecuto el 2026-07-16 en la rama `chore/linea-base-funcional`, sin corregir errores ni ejecutar migraciones.

## Linea Base Funcional 2026-07-16

### Evidencia Tecnica Recogida

- Rama usada: `chore/linea-base-funcional`.
- Backend dependencies presentes: `backend/node_modules` existe.
- Frontend dependencies presentes: `frontend/node_modules` existe.
- Backend tests: `npm.cmd test` en `backend` finalizo con 368 tests, 69 suites, 368 passed, 0 failed.
- Frontend build: `npm.cmd run build` en `frontend` finalizo correctamente con Vite y PWA `generateSW`.
- Backend produccion: `https://mi-saas-ai-production.up.railway.app/api/health` respondio HTTP 200 con `{"success":true,"data":{"status":"ok"}}`.
- Frontend produccion: `https://mi-saas-ai.vercel.app` respondio HTTP 200.
- Smoke E2E existente: `backend/tests/smoke/e2e-smoke.test.js` no se ejecuto porque requiere servidor, seed y crea/modifica datos.
- No se ejecutaron migraciones, reimports, dumps ni scripts SQL.
- No se validaron credenciales reales de usuario, admin o profesor.

### Clasificacion Funcional

| ID | Area | Estado | Evidencia | Prioridad |
| --- | --- | --- | --- | --- |
| BASE-001 | Instalacion local | Verificada y correcta | `backend/node_modules` y `frontend/node_modules` presentes. | - |
| BASE-002 | Backend tests de servicios | Verificada y correcta | `npm.cmd test` en `backend`: 368 passed, 0 failed. | - |
| BASE-003 | Frontend build | Verificada y correcta | `npm.cmd run build` en `frontend`: build Vite correcto y PWA generada. | - |
| BASE-004 | Backend health produccion | Verificada y correcta | `/api/health` en Railway respondio HTTP 200 con `status: ok`. | - |
| BASE-005 | Frontend produccion | Verificada y correcta | Vercel respondio HTTP 200 para `https://mi-saas-ai.vercel.app`. | - |
| BASE-006 | Arranque backend local | Implementada, pendiente de verificacion | `backend/src/server.js` expone Express en `PORT || 3000`; no se arranco para evitar conectar accidentalmente a una DB no controlada. | Importante |
| BASE-007 | Conexion a base de datos | Implementada, pendiente de verificacion | `backend/src/config/db.js` usa `DATABASE_URL` y SSL en produccion; no se abrio conexion ni se consulto DB real. | Importante |
| BASE-008 | Registro, login y perfil | Implementada, pendiente de verificacion | Rutas `/api/auth`, controladores y tests `auth-profile`/schemas presentes; no se uso credencial real. | Importante |
| BASE-009 | Recuperacion de password | Implementada, pendiente de verificacion | `authPasswordResetService`, rutas y paginas `ForgotPasswordPage`/`ResetPasswordPage` presentes; no se envio email. | Importante |
| BASE-010 | Roles y permisos admin/profesor/alumno | Implementada, pendiente de verificacion | Guards frontend y middleware/rutas backend presentes; no se verifico sesion real por rol. | Critica |
| BASE-011 | Catalogo y accesos a oposiciones | Implementada, pendiente de verificacion | Rutas catalogo/accesos, paginas `CatalogoPage`, `MisOposicionesPage` y tests de schemas/accesos presentes. | Importante |
| BASE-012 | Generacion y realizacion de test | Implementada, pendiente de verificacion | Servicios `testGeneration*`, `testSubmit*`, paginas `ConfigurarTestPage`/`TestPage` y tests de generacion/scoring presentes. | Critica |
| BASE-013 | Calculo de resultados | Implementada, pendiente de verificacion | Tests `test-submit-scoring` pasan; no se ejecuto flujo E2E con datos reales. | Critica |
| BASE-014 | Historial y revision de test | Implementada, pendiente de verificacion | `testQueryHistory`, `testSessionDetailReview`, `ReviewPage` y tests relacionados presentes. | Importante |
| BASE-015 | Progreso, estadisticas y dashboards alumno | Implementada, pendiente de verificacion | Rutas `/stats`, widgets y tests de estadisticas pasan; no se valido con datos reales de usuario. | Importante |
| BASE-016 | Admin: preguntas, catalogo, usuarios, reportes, ajustes | Implementada, pendiente de verificacion | Rutas y paginas admin presentes; tests de schemas y servicios admin pasan. | Critica |
| BASE-017 | Importacion CSV de preguntas | Implementada, pendiente de verificacion | `adminPreguntasImport*` y tests `admin-preguntas-import-csv-mapper` pasan; no se importo archivo real. | Importante |
| BASE-018 | Profesor workspace | Implementada, pendiente de verificacion | Rutas `/profesor`, paginas profesor y tests `profesor-workspace-schema` pasan; PR #417 optimizo dashboard. | Critica |
| BASE-019 | Modo Albacer y modulos | Implementada, pendiente de verificacion | Rutas `/albacer`, `AlbacerModulosPage` y tests `albacer-modulos-*` pasan. | Importante |
| BASE-020 | Simulacros | Implementada, pendiente de verificacion | Servicios/rutas admin, profesor y publicos; tests de simulacros presentes y parte incluida en suite. | Importante |
| BASE-021 | Marcadas, repaso, ranking y notificaciones | Implementada, pendiente de verificacion | Servicios/rutas y tests de schemas/repositorios presentes; no se verifico flujo manual. | Importante |
| BASE-022 | Billing, planes y suscripciones | Implementada, pendiente de verificacion | `billing`, `subscription`, Stripe webhook y tests de schemas presentes; no se probo Stripe real. | Critica |
| BASE-023 | Multimedia de preguntas | Implementada, pendiente de verificacion | Uploads estaticos `/uploads`, controladores imagen/audio y tests media presentes; no se subio archivo. | Importante |
| BASE-024 | Smoke E2E completo | No determinable | Existe `backend/tests/smoke/e2e-smoke.test.js`, pero crea usuarios/preguntas y requiere seed; no se ejecuto por seguridad de datos. | Critica |

### Limitaciones De La Linea Base

- La verificacion funcional profunda requiere credenciales de alumno, profesor y admin o un entorno local/QA con datos desechables.
- El estado de la base real no se puede deducir por completo sin consultas de solo lectura aprobadas y sin exponer secretos.
- Los tests actuales cubren mucha logica de servicios y schemas, pero no sustituyen una prueba E2E segura con datos controlados.
- No se ha encontrado un error funcional reproducible nuevo durante esta fase; lo pendiente principal es verificacion E2E controlada.

## Siguiente Paso Recomendado

La siguiente tarea prioritaria es preparar una verificacion E2E segura en entorno controlado, con credenciales/seed no productivos, para comprobar login, roles, test completo, admin, profesor, billing simulado y recuperacion de password sin tocar datos reales.
