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

Esta fase deja establecida una linea base tecnica validada y una clasificacion funcional provisional. Los 368 tests del backend confirman una cobertura tecnica solida de lo que esas pruebas contemplan; el build del frontend confirma que la aplicacion compila; los HTTP 200 de Railway y Vercel confirman disponibilidad. No equivalen todavia a una validacion funcional completa de recorridos reales de usuario, porque el smoke E2E no se ejecuto y no se probaron sesiones reales por rol.

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

### Clasificacion De Linea Base

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

La siguiente tarea prioritaria es disponer de una base aislada de pruebas y ejecutar el smoke E2E protegido contra ese entorno, verificando limpieza posterior y sin tocar produccion.

## Fase 5: Preparacion E2E Segura

Fecha: 2026-07-16.

### Estado E2E

- Framework navegador encontrado: ninguno. No hay Playwright, Cypress ni Selenium configurados.
- Smoke E2E existente: `backend/tests/smoke/e2e-smoke.test.js`, basado en `node --test` y llamadas HTTP a la API.
- El smoke existente no es solo lectura: registra un usuario, genera tests, envia resultados y, si el admin seed existe, crea/edita/elimina una pregunta.
- CI existente: `.github/workflows/backend-ci.yml` levanta PostgreSQL local, aplica `database/schema.sql`, `database/seed.sql` y migraciones, arranca backend y ejecuta `npm run test:ci`.
- Produccion no debe usarse para pruebas de escritura.

### Protecciones Anadidas

- `backend/tests/smoke/e2e-smoke.test.js` exige `NODE_ENV=test`.
- `backend/tests/smoke/e2e-smoke.test.js` exige `ALLOW_E2E_WRITES=true`.
- `backend/tests/smoke/e2e-smoke.test.js` bloquea cualquier `E2E_API_BASE` que no apunte a `localhost`, `127.0.0.1` o `::1`.
- El usuario creado por smoke usa prefijo `e2e_smoke_user_` y dominio `test.local`.
- `.github/workflows/backend-ci.yml` declara `NODE_ENV=test`, `ALLOW_E2E_WRITES=true` y `E2E_API_BASE=http://localhost:3000/api` para mantener el smoke en Postgres aislado de CI.

### Pruebas Ejecutadas En Fase 5

- No se ejecuto `npm run test:smoke`.
- No se ejecuto ninguna prueba que cree, modifique o elimine datos reales.
- Se ejecutaron tests backend y build frontend tras los cambios de proteccion.

### Clasificacion Del Smoke E2E

| Prueba | Riesgo | Motivo |
| --- | --- | --- |
| `SMOKE-U01 registro de usuario` | Escritura sin limpieza garantizada | Crea usuario E2E y no existe borrado posterior en el test. |
| `SMOKE-U02 login de usuario` | Solo lectura | Autentica usuario creado por el propio smoke. |
| `SMOKE-U03 catalogo oposiciones` | Solo lectura | Consulta catalogo. |
| `SMOKE-U04 catalogo temas` | Solo lectura | Consulta catalogo. |
| `SMOKE-U05 catalogo bloques` | Solo lectura | Consulta catalogo. |
| `SMOKE-U06 generar test` | Escritura sin limpieza garantizada | Crea test/sesion si hay preguntas suficientes. |
| `SMOKE-U07 enviar test` | Escritura sin limpieza garantizada | Guarda resultados del test. |
| `SMOKE-U07B generar test sin enviar` | Escritura sin limpieza garantizada | Crea test pendiente. |
| `SMOKE-U08 estadisticas de usuario` | Solo lectura | Lee estadisticas del usuario E2E. |
| `SMOKE-U09 estadisticas por bloque` | Solo lectura | Lee estadisticas. |
| `SMOKE-A01 login admin` | Dependiente de seed | Usa credenciales admin del seed local/CI. |
| `SMOKE-A02 listar preguntas admin` | Solo lectura | Consulta admin. |
| `SMOKE-A03 crear pregunta` | Escritura reversible parcial | Crea pregunta que despues intenta eliminar. |
| `SMOKE-A04 obtener pregunta por id` | Solo lectura | Lee pregunta creada. |
| `SMOKE-A05 editar pregunta` | Escritura reversible parcial | Modifica pregunta creada por el smoke. |
| `SMOKE-A06 eliminar pregunta` | Escritura con limpieza parcial | Elimina la pregunta creada por el smoke. |
| `SMOKE-A07 pregunta eliminada devuelve 404` | Solo lectura | Verifica borrado. |
| `SMOKE-A08 listar reportes` | Solo lectura | Consulta admin. |
| `SMOKE-S01 ruta protegida sin token` | Solo lectura | Verifica 401 sin crear datos. |
| `SMOKE-S02 ruta admin con token usuario` | Solo lectura | Verifica 403. |
| `SMOKE-S03 login incorrecto` | Solo lectura | Verifica 401. |

### Entorno Seguro Pendiente

El entorno seguro recomendado es una base PostgreSQL local o temporal, inicializada con schema, seed y migraciones, con backend local en `NODE_ENV=test`, `ALLOW_E2E_WRITES=true` y `E2E_API_BASE` local. Falta implementar limpieza comprobable para usuario/tests/resultados creados por el smoke antes de considerarlo repetible sin residuos.

### Riesgos De Railway/Vercel Actuales

- Railway/Vercel apuntan a produccion conectada a `main`.
- El smoke crea datos y podria afectar usuarios, estadisticas, reportes o contenido si se apuntara a produccion.
- Billing, email y notificaciones no estan mockeados para un E2E completo.
- No hay usuarios de prueba productivos ni mecanismo de limpieza aprobado.
