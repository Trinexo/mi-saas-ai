# Arquitectura software de la plataforma

## Arquitectura general

Se recomienda arquitectura **modular basada en API**.

Frontend
→ API
→ Backend
→ Base de datos

---

# Componentes

## Frontend

Responsable de:

- interfaz usuario
- ejecución de test
- estadísticas

Tecnologías recomendadas:

- React
- Next.js
- Vue

---

## Backend

Responsable de:

- autenticación
- generación de test
- corrección
- estadísticas

Tecnologías:

- Node.js
- Python (FastAPI)
- Laravel

---

## API

Tipo:

REST o GraphQL

Endpoints principales:
POST /login
GET /oposiciones
GET /preguntas
POST /generar-test
POST /enviar-test
GET /estadisticas


---

# Microservicios recomendados

Separar en servicios:

1. Usuarios
2. Test
3. Preguntas
4. Estadísticas
5. Notificaciones

---

# Infraestructura

Servidor cloud:

- AWS
- GCP
- Azure

Servicios recomendados:

- CDN
- Redis
- almacenamiento S3

---

# Seguridad

Implementar:

- JWT authentication
- rate limiting
- cifrado de contraseñas
- HTTPS obligatorio