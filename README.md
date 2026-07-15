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
npm run test:smoke
npm run test:ci
```

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
