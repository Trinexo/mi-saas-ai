# Arquitectura EdTech escalable

## Objetivo

Diseñar una plataforma capaz de soportar:

- 1M+ usuarios
- 100M+ preguntas respondidas
- miles de usuarios concurrentes
- aprendizaje adaptativo

---

# Arquitectura general

Cliente (Web / App)
↓
CDN
↓
API Gateway
↓
Microservicios
↓
Base de datos + Cache + Search

---

# Componentes principales

## Frontend

Tecnologías recomendadas:

- Next.js
- React
- Tailwind

Responsabilidades:

- UI
- navegación
- ejecución del test
- visualización estadísticas

---

## API Gateway

Funciones:

- autenticación
- control de tráfico
- routing

Herramientas:

- Kong
- Nginx
- Cloudflare

---

## Microservicios

### Servicio usuarios

Responsable de:

- registro
- login
- gestión perfiles

---

### Servicio preguntas

Responsable de:

- CRUD preguntas
- clasificación por temas
- indexación

---

### Servicio test

Responsable de:

- generación de test
- control temporizador
- entrega preguntas

---

### Servicio evaluación

Responsable de:

- corrección
- cálculo nota
- generación resultados

---

### Servicio aprendizaje

Responsable de:

- detección debilidades
- recomendación preguntas

---

### Servicio analítica

Responsable de:

- estadísticas
- ranking
- progreso

---

# Infraestructura recomendada

## Cloud

- AWS
- GCP
- Azure

---

## Contenedores

- Docker
- Kubernetes

---

## Cache

Redis para:

- sesiones
- preguntas populares
- test generados

---

# Escalabilidad

Estrategias:

- microservicios
- replicación base datos
- caching