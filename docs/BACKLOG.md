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

## Critico

- BL-021: Completar verificacion funcional de roles y permisos reales de admin, profesor y alumno contra flujos felices de frontend y API en entorno aislado. Ya existe validacion tecnica local de bloqueos cruzados y guards; falta navegador/datos de prueba.
- BL-022: Verificar billing, planes y suscripciones con Stripe en modo seguro o entorno de pruebas, sin cargos reales.

## Importante

- BL-004: Ampliar documentacion operativa de despliegue con pasos seguros para Railway/Vercel sin incluir secretos.
- BL-005: Documentar endpoints principales de la API desde `backend/src/routes/index.js` y controladores reales.
- BL-006: Ampliar cobertura frontend mas alla del build: rutas criticas, login, test flow, progreso, admin y profesor.
- BL-007: Auditar permisos y roles en admin/profesor/alumno contra middleware y consultas SQL.
- BL-017: Mantener optimizadas las consultas del dashboard profesor y progreso. Verificar planes SQL e indices antes de nuevas agregaciones.
- BL-018: Proteger scripts SQL delicados. Ningun reimport, dump o script destructivo debe ejecutarse sin backup externo y aprobacion explicita.
- BL-019: Verificar produccion despues de cambios funcionales. Confirmar Vercel, Railway, health endpoint y variables relevantes.
- BL-024: Verificar conexion a base de datos mediante consultas de solo lectura aprobadas, sin exponer secretos ni ejecutar migraciones.
- BL-025: Evaluar Playwright o alternativa de navegador para cubrir login, logout y pantallas no destructivas del frontend contra entorno aislado.

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
