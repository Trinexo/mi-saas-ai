# Diagrama visual de arquitectura

## Objetivo

Representar la arquitectura completa de la plataforma.

---

# Diagrama

                 ┌───────────────────┐
                 │      Usuario       │
                 │ Web / Mobile App   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │       CDN          │
                 │  Archivos estáticos│
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │    API Gateway     │
                 │ Autenticación      │
                 │ Rate limiting      │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      Backend       │
                 │ Node / Python API  │
                 └───────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼

┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ PostgreSQL     │ │ Redis Cache   │ │ ElasticSearch │
│ Base de datos  │ │ Preguntas     │ │ Búsqueda      │
└───────────────┘ └───────────────┘ └───────────────┘

---

# Servicios externos

Email service

Pasarela de pagos

Monitorización

Logs
