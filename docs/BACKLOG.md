# Backlog

Ultima consolidacion documental: 2026-07-15.

## Completado

- BL-001: Ejecutada fase 4 de linea base funcional en `chore/linea-base-funcional`, sin corregir errores durante la auditoria. Queda como linea base tecnica validada y clasificacion funcional provisional; evidencias registradas en `docs/PROJECT_STATUS.md`.
- BL-023: Smoke E2E protegido contra ejecucion accidental en produccion mediante `NODE_ENV=test`, `ALLOW_E2E_WRITES=true` y API base local obligatoria.
- BL-027: Smoke E2E reforzado con verificacion de DB local aislada, marcador DB/API, identificador unico, limpieza por IDs exactos y bloqueo de emails en `NODE_ENV=test`.
- BL-028: Corregido `database/seed.sql` para usar `opciones_respuesta.correcta`, alineado con `database/schema.sql` y repositorios. CI queda preparado para dos ejecuciones visibles del smoke sobre PostgreSQL efimero.
- BL-029: Cubierto `email.service.js` con prueba de regresion: en `NODE_ENV=test` no crea transporter ni lee SMTP; fuera de `NODE_ENV=test` conserva el flujo de envio.
- BL-030: Diagnosticado el fallo inicial del smoke E2E en CI: el marcador insertaba `oposiciones` sin `slug` despues de la migracion `032` y `preguntas.nivel_dificultad=1` despues de la migracion `030`. Corregido el marcador y endurecida la carga SQL del workflow con `ON_ERROR_STOP`.
- BL-020: Verificacion E2E segura validada en CI sobre PostgreSQL efimero en run de PR `29581036429`; pasaron tests unitarios backend, smoke first pass y smoke second pass, con comprobacion de residuos integrada.
- BL-026: Validada la limpieza automatica del smoke E2E en dos ejecuciones consecutivas del mismo job de CI mediante `assertNoResidues()`.
- BL-031: Validacion tecnica local de roles y permisos: `requireAuth`, `requireRole`, bloqueos HTTP cruzados en Express y guards frontend admin/profesor/alumno cubiertos por `backend/tests/services/roles-permisos-flujos.test.js`.
- BL-025: Playwright preparado como runner de navegador para roles en entorno aislado: `frontend/e2e/roles.flows.spec.js`, fixture `backend/tests/e2e/role-fixtures.mjs` y job `browser-roles-e2e` en CI.
- BL-021: Validacion funcional completa de roles y permisos realizada con Playwright en CI sobre PostgreSQL efimero. Los recorridos de administrador, profesor y alumno, los accesos permitidos, los bloqueos cruzados y el cierre de sesion pasaron en dos ejecuciones consecutivas del job `browser-roles-e2e`, run `29743555297`, sin utilizar produccion ni datos reales.
- BL-032: Auditoria tecnica BL-022A de Stripe, billing, planes y suscripciones realizada en rama `audit/BL-022-stripe-billing`, sin llamadas a Stripe, sin produccion y sin cambios funcionales. Queda documentada la arquitectura real, cobertura existente, riesgos y entorno seguro requerido para validar BL-022.
- BL-033: Aislamiento tecnico BL-022B de checkout y webhook Stripe preparado con cliente inyectable, fake local, barreras anti-live, firma local de webhooks, idempotencia persistente y job CI con PostgreSQL efimero. No usa Stripe real, claves reales, produccion ni datos reales.
- BL-034: Preparacion BL-022C de validacion Stripe sandbox manual, con modo `sandbox` separado de `mock`, guards anti-live, fixture E2E local, spec Playwright y workflow `Stripe Sandbox E2E` de ejecucion manual protegida. No ejecuta Stripe real por defecto y no cierra BL-022.
- BL-006A: Validado en CI el flujo completo de test del alumno mediante navegador y PostgreSQL efimero. La fixture crea solo estructura academica y acceso; el navegador crea el test por la UI real, responde 5 preguntas, valida resultado, revision, historial, progreso, logout y limpieza por IDs exactos. Evidencia: PR #425 integrada, commit `39cfb529ebe334dad88c932b2f18f1481714f6bf`, Platform CI run `29851154654` con `browser-alumno-test-flow-e2e` verde en dos pasadas.
- BL-035: Validada la interoperabilidad técnica entre VS Copilot y Codex mediante un traspaso real sobre `docs/ai-copilot-codex-workflow`: Copilot creó y publicó el protocolo común en el commit `2b889e51cd296b7aac89831358ef6f4edb9cd75a`; Codex recibió la misma rama limpia y sincronizada, revisó el commit y el diff contra `main`, conservó el historial y continuó mediante un segundo commit independiente. El cierre formal requiere checks verdes, squash merge y la posterior etiqueta `baseline-copilot-codex-2026-07-21`.

## Critico

- BL-022: Verificar billing, planes y suscripciones con Stripe en modo seguro o entorno de pruebas, sin cargos reales. Debe permanecer abierta hasta ejecutar de forma repetible el workflow manual `Stripe Sandbox E2E` con environment `stripe-test`, claves `sk_test_`, PostgreSQL efimero, checkout success, checkout cancelado, webhook firmado, validacion DB y limpieza controlada.

## Importante

- BL-004: Ampliar documentacion operativa de despliegue con pasos seguros para Railway/Vercel sin incluir secretos.
- BL-005: Documentar endpoints principales de la API desde `backend/src/routes/index.js` y controladores reales.
- BL-006B: Ampliar cobertura funcional del alumno sobre preguntas marcadas, repaso y repeticion de tests, una vez cerrado BL-006A.
- BL-007: Auditar permisos y roles en admin/profesor/alumno contra middleware y consultas SQL.
- BL-017: Mantener optimizadas las consultas del dashboard profesor y progreso. Verificar planes SQL e indices antes de nuevas agregaciones.
- BL-018: Proteger scripts SQL delicados. Ningun reimport, dump o script destructivo debe ejecutarse sin backup externo y aprobacion explicita.
- BL-019: Verificar produccion despues de cambios funcionales. Confirmar Vercel, Railway, health endpoint y variables relevantes.
- BL-024: Verificar conexion a base de datos mediante consultas de solo lectura aprobadas, sin exponer secretos ni ejecutar migraciones.

## Producto

- BL-008: Validar con usuarios el flujo profesor: alumnos, oposiciones, planificaciones, simulacros y estadisticas.
- BL-009: Validar el modo Albacer y su separacion respecto al modo general.
- BL-010: Revisar planes, billing y suscripciones contra la configuracion real de Stripe antes de comercializar.

## Documentacion

- BL-011: Mantener `docs/PROJECT_STATUS.md` actualizado despues de cada despliegue relevante.
- BL-012: Convertir decisiones nuevas en entradas de `docs/DECISIONS.md`.
- BL-013: No reactivar documentos archivados salvo que se consoliden manualmente contra codigo.

## Futuro

- BL-014: Evaluar observabilidad de consultas lentas y errores 5xx en Railway.
- BL-015: Preparar guia de restauracion y backup de PostgreSQL.
- BL-016: Preparar mapa de datos y migraciones aplicadas en produccion.
