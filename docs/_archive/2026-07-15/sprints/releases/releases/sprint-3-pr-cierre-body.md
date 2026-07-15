## Resumen
Este PR empaqueta el cierre operativo y documental de Sprint 3, incluyendo artefactos de release, flujo estandarizado por PRs, playbooks de cierre y verificación remota de gobernanza en GitHub.

## Qué cambia
- Añade release note de cierre de Sprint 3.
- Añade artefactos de PR para PR 01, PR 02 y PR 03 (apertura, In Review y Done).
- Añade playbooks de cierre operativo y garantía remota.
- Añade guías rápidas de setup/verificación remota en GitHub.
- Actualiza el índice de documentación para centralizar acceso a todos los artefactos.

## Alcance
- Documentación operativa de Sprint 3.
- Gobernanza remota de `main` validada.
- Trazabilidad de cierre y transición a Sprint 4.

## Fuera de alcance
- Cambios funcionales de backend o frontend.
- Optimización de rendimiento.
- Nuevas features de producto.

## Checklist obligatoria (feature)
- [ ] PR hacia `main` (sin push directo)
- [ ] CI en verde: `test-backend` y `build-frontend`
- [ ] Rama actualizada con `main` y sin conflictos
- [ ] Sin archivos no permitidos: `node_modules`, `.env`, temporales
- [ ] Casos críticos probados manualmente

## Tipo de cambio
- [ ] feat
- [ ] fix
- [x] docs
- [ ] chore
- [ ] test

## Riesgos y mitigación
- Riesgo: diferencias entre cierre documental y estado real si el PR no mergea.
  - Mitigación: no considerar Sprint 3 cerrado hasta merge en `main` con checks verdes.
- Riesgo: disciplina de equipo en seguimiento de tablero.
  - Mitigación: usar los comentarios ya versionados en `docs/releases/`.

## Siguiente paso
Tras merge, marcar Sprint 3 como `Done` en tablero y abrir kickoff de Sprint 4 con backlog priorizado.