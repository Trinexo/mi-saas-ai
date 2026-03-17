Sprint 4 — PR #18 actualizado y validado ✅

Se corrigen incidencias críticas del flujo de tests:
- Generate: ahora admite 1..100 preguntas (frontend + backend alineados).
- Generate repetido: fallback para reutilizar preguntas del mismo tema cuando no hay pool fresco suficiente.
- Submit: corregido `Payload inválido` al enviar test por tipos string/number en IDs.
- UTF-8: limpieza de mojibake en contenido de preguntas/opciones y también catálogo (`oposiciones`, `materias`, `temas`).
- Nuevo rol `profesor` acotado por oposición asignada (solo gestiona su ámbito).
- Gestión admin de asignaciones profesor-oposición ya disponible en API y panel.

Validación realizada:
- Tests backend de servicios en verde.
- Build frontend en verde.
- Reproducción API real OK:
  - generar 1 pregunta,
  - generar 5 repetidas mismo usuario,
  - enviar test con 5 respuestas,
  - enviar test con IDs serializados como string (ya no falla).
  - profesor: listado admin OK en su ámbito y bloqueo 403 fuera de ámbito.
  - admin: asignar / listar / quitar oposiciones a profesor OK.

Documentación:
- Body PR: `docs/releases/sprint-4-pr-18-body.md`
- Script limpieza BD: `database/fix_mojibake_utf8.sql`
