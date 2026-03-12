# Diagrama de base de datos y relaciones

## Objetivo

Definir las relaciones principales entre entidades del sistema.

---

# Entidades principales

usuarios  
oposiciones  
materias  
temas  
preguntas  
opciones_respuesta  
tests  
respuestas_usuario  

---

# Relaciones

usuarios
│
├── tests
│      │
│      ├── test_preguntas
│      │
│      └── respuestas_usuario
│
└── progreso_usuario

---

oposiciones
│
└── materias
        │
        └── temas
               │
               └── preguntas
                       │
                       └── opciones_respuesta

---

# Explicación

Una oposición contiene varias materias.

Cada materia contiene varios temas.

Cada tema contiene muchas preguntas.

Cada pregunta contiene varias opciones de respuesta.

Un usuario realiza múltiples tests.

Cada test contiene múltiples preguntas.

Las respuestas se almacenan en respuestas_usuario.