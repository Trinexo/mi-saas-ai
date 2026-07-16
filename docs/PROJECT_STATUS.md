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

## Siguiente Paso Recomendado

La siguiente tarea prioritaria es ejecutar la fase 4 de linea base funcional en una rama independiente, sin corregir errores durante la auditoria. El objetivo es clasificar con evidencia que funciona, que falla y que no puede determinarse.
