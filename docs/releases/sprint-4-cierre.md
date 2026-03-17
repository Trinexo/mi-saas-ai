# Sprint 4 — Cierre

Fecha: 13 de marzo de 2026
Estado: cerrado

## Resumen
Sprint 4 queda cerrado con todos los objetivos de robustez, analítica incremental y rendimiento cumplidos. Se entregaron 16 PRs que cubren desde correcciones críticas del flujo de test hasta validaciones exhaustivas con Zod, mejoras en el cliente HTTP del frontend, un sistema de auditoría de cambios en el panel admin y el hook `useAsyncAction` para proteger todas las acciones asíncronas clave.

## Entregado

### Robustez del flujo principal (PR 01, PR 18)
- Generate devuelve error controlado cuando no hay preguntas suficientes.
- Submit acepta test enviado completamente en blanco.
- Fallback de preguntas cuando el usuario ya respondió todas las disponibles en el tema.
- Rango de `numeroPreguntas` alineado entre frontend (`1..100`) y backend.
- Submit robusto ante IDs serializados como string desde el cliente.

### Codificación y configuración (PR 02)
- `.editorconfig` con `charset = utf-8` como estándar de repositorio.
- `.gitattributes` para forzar UTF-8 en archivos de texto clave.
- `start-dev.ps1` con `chcp 65001` para consola Windows.
- Script `database/fix_mojibake_utf8.sql` para saneamiento de datos ya persitidos.

### Validaciones Zod y middleware (PR 03 – PR 10)
- Validate middleware con source configurable (`body` / `query` / `params`) y mensajes contextuales.
- Schemas de validación para todos los endpoints admin con riesgo de query injection:
  - `listPreguntasQuerySchema`, `idParamSchema`, `listReportesQuerySchema`, `listAuditoriaQuerySchema`.
- Schemas para endpoints públicos de catálogo (`materiasQuerySchema`, `temasQuerySchema`, `preguntasQuerySchema`).
- `temaStatsQuerySchema` aplicado en `GET /stats/tema`.

### Analítica y métricas (PR 04, PR 05)
- `stats/user` cuenta únicamente tests con resultado (`JOIN resultados_test`, `estado = 'finalizado'`).
- Índice parcial `idx_tests_usuario_finalizados` para consultas por usuario sobre tests finalizados.

### Rol profesor (PR 18)
- Panel admin accesible para rol `profesor`.
- Restricciones backend: crear/editar/eliminar/listar solo dentro de sus oposiciones asignadas.
- Tabla `usuario_oposiciones` y endpoints de gestión de asignaciones.

### Cliente HTTP frontend (PR 11 – PR 13)
- `apiRequest` centralizado con serialización de parámetros vía `URLSearchParams`.
- Parseo seguro de respuestas: `response.text()`, soporte `204 No Content`, fallback texto plano o JSON inválido.
- Helper `getErrorMessage` y estandarización de mensajes de error en todas las pantallas.

### Protección UX frontend (PR 19)
- Hook `useAsyncAction`: encapsula `isLoading`, `error`, limpieza y ejecución segura.
- Protección contra dobles envíos en login, registro, generación de test y submit.

### Auditoría de cambios (PR 20)
- Tabla `auditoria_preguntas` con índices por `pregunta_id`, `usuario_id` y `fecha`.
- Registro automático (fire-and-forget) en `createPregunta`, `updatePregunta` y `deletePregunta`.
- Snapshot `datos_anteriores` capturado antes de cada cambio destructivo.
- Endpoint `GET /admin/auditoria` con filtros y paginación, restringido a rol `admin`.

## Métricas de calidad
- Suite de tests: **60 pass, 0 fail** (11 archivos de test).
- Build frontend: ✓ `194.53 kB` en `1.46 s`.
- Cobertura de tests por módulo:
  - `critical-services`: generación, corrección y stats
  - `validate-middleware`: mensajes contextuales por source
  - `catalog-query`: schemas de catálogo público
  - `admin-id-params`: coerción de `:id` en params
  - `admin-preguntas-query`: paginación y filtros en listado
  - `admin-reportes-query`: paginación y filtro estado
  - `admin-profesor-scope`: restricciones de alcance por oposición
  - `admin-profesor-asignaciones-schema`: schemas de asignaciones
  - `admin-auditoria-schema`: schema de consulta de auditoría
  - `admin-auditoria-service`: acceso y paginación de auditoría
  - `e2e-smoke`: flujo end-to-end completo

## Mejoras de proceso
- Trazabilidad de PRs formalizada en `sprint-4-inicio.md` con 16 entradas.
- Nomenclatura de documentación normalizada en todos los artefactos de release.
- Separación entre schema Zod por módulo (`admin.schema.js`, `catalog.schema.js`, `stats.schema.js`).
- Patrón fire-and-forget establecido como convención para operaciones de auditoría que no deben bloquear la respuesta principal.

## Riesgos residuales
- La tabla `auditoria_preguntas` puede crecer rápidamente en entornos con alto volumen de ediciones; no tiene política de retención todavía.
- Los schemas de catálogo (`materiasQuerySchema`, `temasQuerySchema`) marcan `oposicion_id`/`materia_id` como requeridos — cualquier cliente que no los envíe recibirá `Query inválida`.

## Criterio de paso a Sprint 5
- PRs de Sprint 4 mergeados en `main` con suite de tests en verde.
- Release note publicado y referenciado en índice de documentación.
- Backlog de Sprint 5 priorizado: motor generación adaptativo (exclusión preguntas recientes por usuario, priorización de falladas, scoring por historial personal).
