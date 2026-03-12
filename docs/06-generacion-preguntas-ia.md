# Sistema de generación de preguntas con IA

## Objetivo

Crear automáticamente grandes bancos de preguntas a partir del temario.

---

# Flujo de generación

1 obtener temario
2 dividir por secciones
3 generar preguntas
4 validar respuestas
5 almacenar en base de datos

---

# Tipos de preguntas generadas

- test clásico
- verdadero / falso
- multirespuesta
- casos prácticos

---

# Ejemplo de prompt

Generar pregunta tipo test sobre:

tema: procedimiento administrativo

formato:

Pregunta
A
B
C
D
Respuesta correcta
Explicación

---

# Validación automática

Verificar:

- existencia respuesta correcta
- coherencia normativa
- dificultad

---

# Pipeline

Temario
→ generación IA
→ revisión
→ base de datos

---

# Generación masiva

Ejemplo:

100 temas
× 200 preguntas

= 20,000 preguntas

---

# Sistema de mejora

Registrar:

- tasa de error usuarios
- preguntas confusas

Para ajustar dificultad.