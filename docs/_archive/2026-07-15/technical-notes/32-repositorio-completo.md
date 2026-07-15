# Repositorio completo de la plataforma

## Objetivo

Definir la estructura final del proyecto para un MVP funcional.

---

# Estructura

/project-root

backend/
frontend/
database/
scripts/
docs/

docker/
docker-compose.yml

---

# Backend

/backend

src/

controllers/
authController.js
testController.js
questionController.js

routes/
authRoutes.js
testRoutes.js
questionRoutes.js

services/
testService.js
questionService.js

models/
userModel.js
questionModel.js

middleware/
authMiddleware.js

config/
database.js

server.js

---

# Frontend

/frontend

src/

components/
QuestionCard.jsx
TestNavigation.jsx

pages/
Home.jsx
Test.jsx
Results.jsx
Admin.jsx

services/
api.js

styles/

---

# Database

/database

schema.sql
seed.sql

---

# Scripts

/scripts

importQuestions.js
generateTest.js

---

# Docker

/docker

Dockerfile.backend
Dockerfile.frontend
