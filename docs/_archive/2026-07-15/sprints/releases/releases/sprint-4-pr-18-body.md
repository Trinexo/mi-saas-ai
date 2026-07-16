# Sprint 4 — PR 18 — Body

## Resumen
Este PR corrige los incidencias reportadas en generación de tests:

1. `Payload inválido` al generar tests de 1 a 4 preguntas.
2. Error de falta de preguntas al repetir generación con dataset pequeño.
3. Textos con mojibake/UTF-8 dañado en preguntas y opciones.
4. `Payload inválido` al enviar test tras responder preguntas (submit).

## Qué cambia

### Backend
- Se actualiza la validación de `POST /api/tests/generate` para aceptar `numeroPreguntas` entre `1` y `100`.
- Se mejora el selector de preguntas:
  - primero intenta preguntas no recientes para el usuario,
  - si no alcanza, completa con preguntas del mismo tema (reutilización controlada).
- Se añade normalización de texto en salida para recuperar caracteres mojibake en respuestas API.
- Se endurece validación de `POST /api/tests/submit` con coerción numérica (`testId`, `preguntaId`, `respuestaId`, `tiempoSegundos`) para aceptar payloads serializados por el frontend.
- `tests/generate` devuelve `id` numéricos en preguntas y opciones para consistencia de tipos en cliente.
- Se añade soporte de rol `profesor` en módulo admin con alcance por oposición asignada:
  - acceso permitido al área admin para `profesor`,
  - restricciones en backend para listar/crear/editar/eliminar/importar solo dentro de sus oposiciones,
  - restricciones equivalentes para reportes.
- Se añaden endpoints admin para gestionar asignaciones profesor-oposición:
  - listar asignaciones por email,
  - asignar oposición a profesor,
  - quitar oposición a profesor.

### Base de datos
- Nuevo script `database/fix_mojibake_utf8.sql` para limpiar datos ya persistidos con codificación dañada en:
  - `oposiciones.nombre`, `oposiciones.descripcion`
  - `materias.nombre`
  - `temas.nombre`
  - `preguntas.enunciado`
  - `preguntas.explicacion`
  - `preguntas.referencia_normativa`
  - `opciones_respuesta.texto`
- Nueva tabla `usuario_oposiciones` para asignar oposiciones gestionables por cada profesor.
- Se documenta ejecución en `database/README.md`.

### Frontend
- `HomePage` valida y permite rango `1..100` antes de enviar.
- Input numérico de generación ajustado a `min=1`.
- `TestPage` envía IDs de submit como numéricos para evitar rechazos por tipo en backend.
- El área `/admin` permite también el rol `profesor` (la autorización fina queda en backend).
- El panel admin incorpora gestión de asignaciones de profesor:
  - consulta por email,
  - selector de oposición desde catálogo,
  - quitar asignación desde fila con confirmación.

### Tests
- Se actualizan tests de servicios críticos para cubrir:
  - fallback de selección cuando faltan preguntas frescas,
  - error cuando ni el fallback alcanza.
- Se añaden tests de alcance para `profesor` en admin:
  - profesor sin asignaciones -> denegado,
  - profesor con asignación -> listado acotado,
  - creación fuera de su oposición -> denegada.
- Se añaden tests de schema para endpoints de asignaciones profesor-oposición.

## Validación local
- Backend tests:
  - `node --test backend/tests/services/critical-services.test.js backend/tests/services/validate-middleware.test.js`
  - `node --test backend/tests/services/admin-profesor-scope.test.js`
  - `node --test backend/tests/services/admin-profesor-asignaciones-schema.test.js`
- Frontend build:
  - `npm run build` en `frontend`
- API manual:
  - generar `1` pregunta OK,
  - generar `5` preguntas repetidas para mismo usuario OK,
  - enviar test con respuestas OK (200), incluyendo caso con IDs serializados como string,
  - login profesor + acceso admin de listado OK,
  - creación en tema fuera de ámbito profesor -> 403 esperado,
  - endpoints admin de asignación profesor-oposición: asignar / listar / quitar OK,
  - respuesta con acentos y signos invertidos correcta.
- DB cleanup aplicado y verificado en `pregunta_id=6` y `materias.id=1` (`Constitución`).

## Riesgos y mitigación
- Riesgo bajo: cambios encapsulados en flujo de generación y limpieza textual.
- Mitigación: tests de servicio actualizados + build frontend + validación API real.

## Checklist
- [x] Validación backend alineada con UX (`1..100`)
- [x] Fallback de preguntas implementado
- [x] Saneo de texto en respuesta API
- [x] Submit robusto ante IDs serializados
- [x] Rol profesor restringido por oposición asignada
- [x] Script SQL para corrección persistente
- [x] Documentación de base de datos actualizada
- [x] Tests y build locales en verde
