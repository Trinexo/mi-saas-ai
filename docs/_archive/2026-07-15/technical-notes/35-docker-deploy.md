
---

# 3️⃣5️⃣ `35-docker-deploy.md`

```md id="docker-deploy"
# Docker deploy

## Objetivo

Permitir levantar la plataforma completa con un solo comando.

---

# docker-compose.yml


version: "3"

services:

backend:
build: ./docker/Dockerfile.backend
ports:
- "3000:3000"
depends_on:
- db

frontend:
build: ./docker/Dockerfile.frontend
ports:
- "5173:5173"

db:
image: postgres
environment:
POSTGRES_PASSWORD: password
POSTGRES_DB: test_platform
ports:
- "5432:5432"