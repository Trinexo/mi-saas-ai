# Backlog

Ultima consolidacion documental: 2026-07-15.

## Critico

- BL-001: Ejecutar fase 4 de linea base funcional en `chore/linea-base-funcional`, sin corregir errores durante la auditoria. Documentar evidencias en `docs/PROJECT_STATUS.md` y prioridades en este backlog.

## Importante

- BL-004: Ampliar documentacion operativa de despliegue con pasos seguros para Railway/Vercel sin incluir secretos.
- BL-005: Documentar endpoints principales de la API desde `backend/src/routes/index.js` y controladores reales.
- BL-006: Revisar cobertura frontend: build, rutas criticas, login, test flow, progreso, admin y profesor.
- BL-007: Auditar permisos y roles en admin/profesor/alumno contra middleware y consultas SQL.
- BL-017: Mantener optimizadas las consultas del dashboard profesor y progreso. Verificar planes SQL e indices antes de nuevas agregaciones.
- BL-018: Proteger scripts SQL delicados. Ningun reimport, dump o script destructivo debe ejecutarse sin backup externo y aprobacion explicita.
- BL-019: Verificar produccion despues de cambios funcionales. Confirmar Vercel, Railway, health endpoint y variables relevantes.

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
