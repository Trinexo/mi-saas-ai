# PR 01 Sprint 3 — Texto listo para pegar

## Título
Sprint 3 · Base de generación de test (backend + contrato inicial)

## Descripción
## Resumen
Este PR inicia Sprint 3 con una entrega acotada y revisable: la base de generación de test para habilitar el flujo principal del producto por incrementos.

## Qué cambia
- Se define la base del endpoint POST /tests/generate.
- Se fija validación de entrada para evitar payloads inválidos.
- Se establece una respuesta JSON consistente para consumo de frontend.
- Se revisa el soporte mínimo de persistencia/consulta necesario para la generación.
- Se deja alineado el contrato para siguientes PRs del sprint.

## Alcance incluido
- Backend:
  - POST /tests/generate (versión base)
  - Validación de payload
  - Respuesta normalizada
- DB:
  - Revisión de tablas e índices mínimos implicados
- Docs:
  - Ajustes de contrato en docs/api-v1.md (si aplica en esta iteración)

## Fuera de alcance
- POST /tests/submit
- Corrección y cálculo final de nota
- Pantalla completa de resultados
- Progreso agregado por tema

## Checklist obligatoria (feature)
- [ ] PR hacia main (sin push directo)
- [ ] CI en verde: test-backend y build-frontend
- [ ] Rama actualizada con main y sin conflictos
- [ ] Sin archivos no permitidos: node_modules, .env, temporales
- [ ] Si cambia API: actualizado docs/api-v1.md
- [ ] Si cambia DB: revisados database/schema.sql y database/seed.sql
- [ ] Casos críticos probados manualmente

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] chore
- [ ] docs
- [ ] test

## Criterios de aceptación
- [ ] El endpoint devuelve éxito con payload válido y estructura estable.
- [ ] El endpoint devuelve error controlado en payload inválido.
- [ ] La respuesta es consumible por frontend sin ambigüedad.

## Riesgos y mitigación
- Riesgo: preguntas insuficientes para la configuración solicitada.
  - Mitigación: respuesta controlada con mensaje explícito para ajustar criterios.
- Riesgo: latencia por selección aleatoria en alto volumen.
  - Mitigación: revisión de índices y optimización incremental en PR siguiente.

## Plan siguiente PR
Implementar envío y corrección de test (POST /tests/submit) y conectar la primera vista de resultados para cerrar el flujo E2E mínimo del sprint.