# Estructura del repositorio del proyecto

Este repositorio está diseñado para una plataforma de entrenamiento por test.

Se utiliza una arquitectura separando:

- frontend
- backend
- base de datos
- documentación

---

# Estructura general

/project-root

/docs
01-plataforma-test-oposiciones.md
02-arquitectura-software.md
...

/backend
/src
/controllers
/services
/models
/routes
/middleware
/utils

/database
/migrations
/seeds

/config

/tests

/frontend
/src
/components
/pages
/services
/hooks

/public

/mobile

/scripts

---

# Backend

/backend

src/
controllers/
services/
models/
routes/

---

# Frontend

/frontend

src/
components/
pages/
api/

---

# Database

/database

schema.sql
migrations/
seeds/

---

# Scripts

/scripts

import-questions
generate-tests

---

# CI/CD

.github/workflows

deploy.yml
tests.yml