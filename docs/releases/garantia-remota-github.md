# Garantía remota en GitHub (cuentas, permisos y control)

Fecha: 12 de marzo de 2026
Objetivo: garantizar que el cierre del sprint no dependa de confianza manual, sino de reglas verificables.

## 1) Qué permiso necesita cada rol

### Maintainer / Tech Lead
- Permiso recomendado: `Maintain` (o `Admin` si gestiona reglas)
- Responsable de:
  - configurar branch protection/rulesets
  - definir checks requeridos
  - aprobar/rechazar excepciones

### Desarrollador
- Permiso recomendado: `Write`
- Responsable de:
  - abrir PR
  - responder revisiones
  - no puede saltarse reglas si están bien configuradas

### QA / Revisor
- Permiso recomendado: `Write` (para review)
- Responsable de:
  - aprobar cambios
  - validar criterios de aceptación

## 2) Reglas obligatorias en `main` (GitHub)
Configurar `Branch protection` o `Rulesets` con:
- Require a pull request before merging
- Require approvals: mínimo 1 (ideal 2)
- Dismiss stale approvals when new commits are pushed
- Require status checks to pass before merging:
  - `test-backend`
  - `build-frontend`
- Require branches to be up to date before merging
- Block force pushes
- Block deletions
- Include administrators (recomendado)

## 3) Cómo garantizar con evidencia (auditable)

### Evidencia mínima por PR
- URL del PR
- Captura/check de CI en verde
- Número de aprobaciones
- Commit SHA mergeado
- Enlace a release note del sprint

### Evidencia mínima de repositorio
- Captura o export de reglas activas de `main`
- Registro de quién cambió reglas y cuándo (audit log)

## 4) Verificación técnica rápida (manual)
Antes de merge:
1. Verificar checks requeridos verdes
2. Verificar aprobación mínima
3. Verificar rama actualizada con `main`
4. Verificar que no hay archivos prohibidos

Después de merge:
1. Confirmar PR en estado `Merged`
2. Confirmar commit en `main`
3. Confirmar actualización de tablero a `Done`
4. Confirmar release note enlazado en `docs/README.md`

## 5) Recomendación para no depender de personas
- Usar rulesets en lugar de política informal
- No conceder `Admin` a perfiles que no gestionan gobernanza
- Exigir checks y approvals siempre
- Prohibir merge directo a `main`

## 6) Alternativa robusta (si queréis máxima garantía)
- Activar CODEOWNERS para carpetas críticas:
  - `.github/`
  - `backend/`
  - `frontend/`
  - `docs/releases/`
- Obligar review de owners en áreas sensibles
- Añadir workflow de policy-check (rechazar PR sin release note/checklist)

## Resultado esperado
Aunque cambie el equipo, nadie puede cerrar ni mergear fuera del proceso definido: todo queda forzado por permisos + reglas + checks.