# Arquitectura técnica del sistema

## Objetivo

Mostrar todos los componentes necesarios para operar la plataforma.

---

# Diagrama conceptual

Usuario
│
▼
Frontend Web / App móvil
│
▼
CDN
│
▼
API Gateway
│
▼
Backend

Servicios:

auth service
question service
test service
analytics service
subscription service

│
▼
Base de datos PostgreSQL

---

# Sistemas auxiliares

Redis

cache de preguntas

cache de test

---

ElasticSearch

búsqueda rápida

filtrado por tema

---

Queue system

procesamiento de jobs

---

# Servicios externos

email service

payment gateway

monitorización