## Resumen
PR 05 de Sprint 4 para optimizar la consulta de `stats/user` enfocándola en tests finalizados y dejar índice específico para ese patrón de lectura.

## Qué cambia
- `statsRepository.getUserStats` añade filtro explícito `t.estado = 'finalizado'`.
- Se añade índice parcial en `tests` para consultas por usuario sobre tests finalizados:
  - `idx_tests_usuario_finalizados (usuario_id, id) WHERE estado = 'finalizado'`

## Justificación técnica
- El endpoint `stats/user` consume únicamente resultados finalizados.
- El índice parcial reduce coste de lectura y mantiene el índice pequeño al excluir estados no finalizados.

## Alcance
- Rendimiento de estadísticas de usuario.
- Consistencia semántica alineada con métricas finalizadas.

## Fuera de alcance
- Cambios de UI.
- Cambios de contrato del endpoint.
- Refactor de otras consultas.

## Tipo de cambio
- [x] feat
- [ ] fix
- [x] docs
- [ ] chore
- [ ] test

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Validación local
- `backend/npm run test` ✅
