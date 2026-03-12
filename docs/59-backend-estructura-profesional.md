# Backend profesional de la plataforma

## Tecnologías recomendadas

Node.js
Express
PostgreSQL
Redis

---

# Arquitectura

src/

controllers
services
repositories
routes
middleware
utils

---

# Capas

controllers

gestión de peticiones HTTP

---

services

lógica de negocio

---

repositories

acceso a base de datos

---

# Ejemplo flujo

controller

↓

service

↓

repository

↓

database

---

# Servicios principales

auth service

registro

login

roles

---

question service

CRUD preguntas

búsqueda

---

test service

generación de tests

corrección

---

analytics service

estadísticas

progreso
