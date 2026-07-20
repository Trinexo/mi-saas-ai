# Arquitectura SaaS de suscripciones

## Objetivo

Permitir monetizar la plataforma mediante suscripciones.

---

# Planes

plan_basico  
plan_premium  
plan_profesional  

---

# Funciones por plan

Básico

- test limitados
- acceso parcial

Premium

- acceso completo
- simulacros

Profesional

- estadísticas avanzadas
- tutorías

---

# Flujo de suscripción

usuario selecciona plan

↓

pasarela de pago

↓

confirmación

↓

activar suscripción

---

# Pasarelas de pago

Stripe  
PayPal  

---

# Tabla suscripciones

id  
usuario_id  
plan_id  
fecha_inicio  
fecha_fin  
estado  

---

# Renovaciones

Sistema automático:

renovar cada mes

si pago fallido

notificar usuario