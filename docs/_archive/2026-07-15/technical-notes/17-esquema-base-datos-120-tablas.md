# Esquema avanzado de base de datos

## Objetivo

Diseñar una base de datos preparada para:

- millones de preguntas
- millones de usuarios
- millones de respuestas

---

# Dominios principales

La base de datos se divide en varios dominios.

1. Usuarios
2. Contenido
3. Test
4. Aprendizaje
5. Analítica
6. Suscripciones
7. Administración

---

# Dominio usuarios

usuarios  
usuarios_perfiles  
usuarios_roles  
usuarios_permisos  
usuarios_sesiones  
usuarios_dispositivos  
usuarios_notificaciones  

---

# Dominio contenido

oposiciones  
materias  
temas  
subtemas  

preguntas  
preguntas_versiones  
preguntas_historial  

opciones_respuesta  
explicaciones  
referencias_normativas  

etiquetas_preguntas  

---

# Dominio test

tests  
tests_configuracion  
tests_preguntas  
tests_resultados  

respuestas_usuario  
respuestas_detalle  

tests_guardados  

---

# Dominio aprendizaje

progreso_usuario  
progreso_tema  
progreso_materia  

preguntas_falladas  
preguntas_dudosas  
preguntas_favoritas  

repeticion_espaciada  

---

# Dominio analítica

estadisticas_usuario  
estadisticas_preguntas  
estadisticas_temas  

ranking_global  
ranking_oposicion  

---

# Dominio suscripciones

planes  
suscripciones  
pagos  
facturas  

---

# Dominio administración

logs  
errores  
reportes_preguntas  
revision_contenido  