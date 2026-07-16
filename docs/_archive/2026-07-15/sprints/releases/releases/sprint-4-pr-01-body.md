## Resumen
PR 01 de Sprint 4 centrado en robustez del flujo principal de test.

## Qué cambia
- `POST /tests/generate` deja de aceptar generación parcial: si no hay suficientes preguntas, responde error controlado.
- `POST /tests/submit` permite enviar un test completamente en blanco.
- El progreso por tema deja de depender de respuestas registradas y pasa a basarse en el resultado consolidado del test.
- `GET /stats/tema` lee el agregado persistido en `progreso_usuario`, evitando incoherencias cuando hay blancos.
- Se amplía la cobertura de regresión en tests de servicio.

## Alcance
- Robustez funcional en generación, envío y estadísticas por tema.
- Cobertura de regresión de casos edge del MVP.

## Fuera de alcance
- Cambios de UI.
- Analítica avanzada.
- Optimización de rendimiento fuera de este flujo.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [ ] chore
- [x] test

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales
- [ ] Validado `npm run test`
- [ ] Validado `npm run test:smoke`

## Validación local
- `backend/npm run test` ✅
- `backend/npm run test:smoke` ✅

## Siguiente paso
Continuar Sprint 4 con refuerzo de estadísticas básicas y endurecimiento adicional de validaciones de entrada.