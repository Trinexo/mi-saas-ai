# Repositorio MVP completo

## Objetivo

Proporcionar una estructura de repositorio lista para iniciar el desarrollo del MVP de la plataforma de test.

---

# Estructura del proyecto

/project-root

/backend
/src
controllers
routes
services
models
middleware
utils

/config
database.js

/tests

/frontend
/src
components
pages
api
hooks
styles

/public

/database
schema.sql
seed.sql

/scripts
start-dev.sh
import-questions.js

/docs

---

# Descripción

backend → API REST  
frontend → interfaz web  
database → esquema SQL y datos iniciales  
scripts → utilidades para desarrollo  
docs → documentación técnica

---

# Requisitos

Node.js 18+
PostgreSQL 14+
Redis (opcional)

---

# Instalación

Clonar repositorio:

git clone proyecto

Entrar en carpeta:

cd project-root