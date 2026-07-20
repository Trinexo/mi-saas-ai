# Plataforma Test Albacer

Plataforma web para entrenamiento por test de oposiciones, con backend Node.js/Express, frontend React/Vite y base de datos PostgreSQL.

## Estado Actual

Este repositorio se considera consolidado documentalmente desde el 15 de julio de 2026 en la rama `chore/consolidacion-documental`.

Fuente activa de documentacion:

- `README.md`: entrada general del proyecto.
- `AGENTS.md`: instrucciones vigentes para asistentes.
- `.github/copilot-instructions.md`: instrucciones resumidas para GitHub Copilot.
- `docs/PROJECT_STATUS.md`: estado funcional y riesgos.
- `docs/ARCHITECTURE.md`: arquitectura real deducida del codigo.
- `docs/DECISIONS.md`: decisiones vigentes y contradicciones resueltas.
- `docs/BACKLOG.md`: tareas pendientes priorizadas.

La documentacion anterior queda preservada en `docs/_archive/2026-07-15/` y no debe usarse como fuente de verdad sin verificarla contra codigo, Git y entorno real.

## Estructura

```text
backend/                 API Express, servicios, repositorios, tests
frontend/                Aplicacion React/Vite
database/                Schema, migraciones y scripts SQL
docs/                    Documentacion activa y archivo historico
.github/                 Workflows, plantillas e instrucciones de Copilot
```

## Stack

- Backend: Node.js ESM, Express, PostgreSQL, JWT, Zod, Stripe, Nodemailer, Multer, Sharp.
- Frontend: React 18, Vite, React Router, Recharts, PWA.
- Base de datos: PostgreSQL con migraciones SQL numeradas.
- Produccion verificada: Railway para backend y PostgreSQL; Vercel para frontend.

## Configuracion

Variables relevantes detectadas en produccion y/o ejemplos:

- `DATABASE_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `PGSSLMODE`
- `VITE_API_URL`

No guardar credenciales reales en documentacion ni commits.

## Desarrollo Local

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Tests backend:

```powershell
cd backend
npm test
```

Smoke E2E backend contra API local aislada:

```powershell
cd backend
$env:NODE_ENV='test'
$env:ALLOW_E2E_WRITES='true'
$env:E2E_DB_ISOLATED='true'
$env:E2E_DATABASE_URL='postgres://postgres:postgres@localhost:5432/plataforma_test'
$env:E2E_API_BASE='http://localhost:3000/api'
npm run test:smoke
```

Suite CI local:

```powershell
cd backend
npm run test:ci
```

No ejecutes `test:smoke` contra Railway, Vercel ni una base de datos con usuarios reales. El smoke crea usuario, tests y una pregunta temporal, comprueba que la API local lee la misma base aislada y elimina los datos que crea.

En CI, el smoke se ejecuta dos veces contra PostgreSQL efimero para comprobar repetibilidad y limpieza.

Validacion funcional por navegador de roles admin/profesor/alumno:

```powershell
cd frontend
$env:NODE_ENV='test'
$env:ALLOW_E2E_WRITES='true'
$env:E2E_DB_ISOLATED='true'
$env:E2E_ROLE_FIXTURES_READY='true'
$env:E2E_DATABASE_URL='postgres://postgres:postgres@localhost:5432/plataforma_test_roles_e2e'
$env:E2E_API_BASE='http://127.0.0.1:3000/api'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'
npm run test:e2e:roles
```

Antes de ejecutar esa suite deben existir backend local, frontend local y PostgreSQL aislado con `backend/tests/e2e/role-fixtures.mjs setup` aplicado. El workflow de CI prepara esos servicios y ejecuta Playwright dos veces contra Chromium. No apuntes esta suite a Railway, Vercel ni bases con datos reales.

Build frontend:

```powershell
cd frontend
npm run build
```

## Base De Datos

La carpeta `database/` contiene:

- `schema.sql` y `seed.sql`.
- Migraciones numeradas en `database/migrations/`.
- Scripts seguros de mantenimiento versionados.
- Dumps y scripts de reimportacion ignorados por `.gitignore` cuando corresponda.

No ejecutar scripts SQL contra produccion sin backup, revision explicita y autorizacion.

## Produccion Conocida

- Frontend Vercel: `https://mi-saas-ai.vercel.app`
- Backend Railway API: `https://mi-saas-ai-production.up.railway.app/api`
- Servicio Railway: `mi-saas-ai`
- Root Directory Railway backend: `/backend`
- Rama conectada a produccion: `main`

El despliegue de PR #417 estaba activo en Vercel y Railway durante la auditoria previa.

## Documentacion Historica

El archivo historico conserva sprints, planes, instrucciones, notas tecnicas y documentacion duplicada:

```text
docs/_archive/2026-07-15/
```

Usarlo solo como referencia historica. Si una afirmacion historica contradice el codigo actual, prevalece el codigo verificado.
