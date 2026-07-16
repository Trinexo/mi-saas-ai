# Arquitectura general del sistema

## Objetivo

Visualizar todos los componentes del sistema.

---

# Diagrama

Usuario
│
│ navegador / app
▼

Frontend (React / Mobile)
│
▼
API Gateway
│
▼
Backend API
│
├── Servicio usuarios
├── Servicio preguntas
├── Servicio tests
├── Servicio analítica
│
▼
Base de datos PostgreSQL

---

# Servicios auxiliares

Redis

cache de preguntas  
cache de tests  

---

# Servicios externos

CDN  
pasarela de pagos  
servicio de email  

---

# Beneficios de esta arquitectura

escalable

modular

fácil de mantener
