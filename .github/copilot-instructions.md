# GitHub Copilot Instructions

Responder en espanol y seguir la documentacion activa:

- `AGENTS.md`
- `docs/PROJECT_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`

El stack real es backend Node.js/Express, frontend React/Vite y PostgreSQL. Mantener la arquitectura por capas del backend: routes, controllers, services, repositories, schemas/middleware.

No usar los documentos archivados en `docs/_archive/2026-07-15/` como fuente de verdad sin verificar contra codigo, Git y entorno real.

No modificar base de datos, migraciones, dependencias, configuracion de despliegue ni scripts SQL sin una peticion explicita. No ejecutar scripts destructivos. No incluir credenciales reales.

Para cambios de codigo, preferir intervenciones pequenas, tests enfocados y consistencia con los patrones existentes.
