# Documentación del proyecto

Esta carpeta contiene la documentación completa de la plataforma.

## Codificación

- Estándar del repositorio: UTF-8.
- Si usas terminal en Windows, ejecuta `chcp 65001` para evitar caracteres españoles corruptos.

Guía de contribución del repositorio: `../CONTRIBUTING.md`

## Arquitectura

docs/architecture/

## Contenido

1. plataforma del sistema
2. arquitectura software
3. modelo de base de datos
4. generación de test
5. aprendizaje adaptativo
6. banco de preguntas
7. analítica
8. monetización
9. despliegue
10. roadmap

## Flujo de Pull Request (MVP)

- Plantilla por defecto: `.github/pull_request_template.md`
	- Usar para cambios pequeños o mixtos que no sean urgencia crítica.
- Plantilla hotfix: `.github/PULL_REQUEST_TEMPLATE/hotfix.md`
	- Usar para correcciones urgentes en producción o bloqueos críticos.
- Plantilla feature: `.github/PULL_REQUEST_TEMPLATE/feature.md`
	- Usar para nuevas funcionalidades o cambios funcionales amplios.

Regla operativa:
- Siempre abrir PR hacia `main`.
- Mantener checks obligatorios en verde (`test-backend` y `build-frontend`).

## Releases

- Cierre Sprint 2: `docs/releases/sprint-2-cierre.md`
- Inicio Sprint 3: `docs/releases/sprint-3-inicio.md`
- Cierre Sprint 3: `docs/releases/sprint-3-cierre.md`
- Inicio Sprint 4: `docs/releases/sprint-4-inicio.md`
- Sprint 3 PR 01 checklist: `docs/releases/sprint-3-pr-01-checklist.md`
- Sprint 3 PR 01 In Review: `docs/releases/sprint-3-pr-01-in-review.md`
- Sprint 3 PR 01 Done: `docs/releases/sprint-3-pr-01-done.md`
- Sprint 3 PR 02 Apertura: `docs/releases/sprint-3-pr-02-apertura.md`
- Sprint 3 PR 02 In Review: `docs/releases/sprint-3-pr-02-in-review.md`
- Sprint 3 PR 02 Done: `docs/releases/sprint-3-pr-02-done.md`
- Sprint 3 PR 03 Apertura: `docs/releases/sprint-3-pr-03-apertura.md`
- Sprint 3 PR 03 In Review: `docs/releases/sprint-3-pr-03-in-review.md`
- Sprint 3 PR 03 Done: `docs/releases/sprint-3-pr-03-done.md`
- Sprint 3 Cierre Operativo: `docs/releases/sprint-3-cierre-operativo.md`
- Garantía remota GitHub (permisos/reglas): `docs/releases/garantia-remota-github.md`
- Setup remoto GitHub en 10 min: `docs/releases/github-remoto-setup-10min.md`
- Checklist garantía remota: `docs/releases/github-remoto-checklist.md`
- Verificación remota aplicada: `docs/releases/github-remoto-verificacion.md`