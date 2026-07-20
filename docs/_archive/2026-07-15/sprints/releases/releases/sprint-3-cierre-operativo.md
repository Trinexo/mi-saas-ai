# Sprint 3 — Cierre operativo (ejecución inmediata)

Fecha: 12 de marzo de 2026
Objetivo: dejar Sprint 3 cerrado de forma verificable en remoto (GitHub).

## 1) Preparación local
1. Validar rama activa:
   - `git branch --show-current`
2. Revisar cambios pendientes:
   - `git status --short`
3. Revisar inventario generado:
   - `docs/releases/sprint-3-cambios-pendientes.txt`

## 2) Estrategia de empaquetado en PRs
Como el trabajo actual está muy concentrado en documentación y operación, usar 1 PR de cierre documental si no hay código funcional nuevo.

### Opción recomendada (MVP)
- PR único: "Sprint 3 · Cierre documental y operativo"
- Incluye:
  - releases de Sprint 3 (inicio/cierre + PR01/02/03 apertura/in-review/done)
  - actualización de índice en `docs/README.md`
  - documentación de garantía remota

### Comandos sugeridos
- `git add .github docs CONTRIBUTING.md .gitignore`
- `git commit -m "docs: cierre operativo sprint 3 y playbooks de PR"`
- `git push -u origin sprint-3/primer-pr-generate-test`

## 3) Apertura de PR
- Base: `main`
- Head: `sprint-3/primer-pr-generate-test`
- Plantilla: `feature`
- Cuerpo: usar `docs/releases/sprint-3-pr-01-body.md` (adaptándolo a cierre documental)

## 4) Criterios de cierre del PR
- Checks obligatorios verdes:
  - `test-backend`
  - `build-frontend`
- Al menos 1 aprobación
- Sin conflictos con `main`
- Sin artefactos prohibidos (`node_modules`, `.env`, temporales)

## 5) Cierre de tablero
- Mover tarjeta a `In Review` con:
  - `docs/releases/sprint-3-pr-03-in-review.md`
- Tras merge, mover a `Done` con:
  - `docs/releases/sprint-3-pr-03-done.md`

## 6) Confirmación final
- Verificar merge en `main`
- Confirmar release note publicado:
  - `docs/releases/sprint-3-cierre.md`
- Registrar estado de arranque de Sprint 4

## Resultado esperado
Sprint 3 queda cerrado con trazabilidad completa (PR + checks + tablero + release note).