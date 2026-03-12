# Backend Sprint 1

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuración

1. Copiar `.env.example` a `.env`.
2. Crear base de datos y ejecutar scripts de `database/`.
3. Instalar dependencias:

```bash
cd backend
npm install
```

4. Arrancar API:

```bash
npm run dev
```

Base URL: `http://localhost:3000/api`

## Endpoints clave Sprint 1

- `POST /auth/register`
- `POST /auth/login`
- `GET /oposiciones`
- `GET /materias?oposicion_id=...`
- `GET /temas?materia_id=...`
- `POST /tests/generate`
- `POST /tests/submit`
- `GET /stats/user`
- `GET /admin/preguntas`
- `POST /admin/preguntas`