# Arquitectura mínima del producto

## Objetivo

Reducir la arquitectura a lo mínimo necesario para lanzar una primera versión funcional.

---

# Stack recomendado

Frontend

React + Vite

---

Backend

Node.js + Express

---

Base de datos

PostgreSQL

---

Hosting

Vercel (frontend)

Railway / Render (backend)

---

# Arquitectura simplificada

Usuario
│
▼
Frontend (React)

│
▼

Backend API

│
▼

PostgreSQL

---

# Servicios opcionales

Redis (cache)

Stripe (pagos)

Email service (notificaciones)

---

# Ventajas

menor complejidad

desarrollo rápido

coste bajo

---

# Escalabilidad futura

Cuando crezca:

añadir Redis

añadir ElasticSearch

separar microservicios
