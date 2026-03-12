# Guía de contribución

## Flujo de ramas (MVP)

- Trabajar en una rama de feature o fix.
- Abrir Pull Request siempre hacia main.
- Evitar push directo a main.

## Plantillas de Pull Request

- Plantilla por defecto: .github/pull_request_template.md
  - Usar para cambios pequeños o mixtos.
- Plantilla hotfix: .github/PULL_REQUEST_TEMPLATE/hotfix.md
  - Usar para incidencias urgentes en producción.
- Plantilla feature: .github/PULL_REQUEST_TEMPLATE/feature.md
  - Usar para nuevas funcionalidades o cambios amplios.
- Regla obligatoria: si el PR es `feature` o `hotfix`, cambiar a su plantilla específica antes de enviar a review.

## Requisitos mínimos antes de pedir review

- Checks en verde: test-backend y build-frontend.
- Rama actualizada con main y sin conflictos.
- Sin archivos no permitidos: node_modules, .env, temporales.
- Si hay cambios de API o base de datos, actualizar documentación y scripts correspondientes.
