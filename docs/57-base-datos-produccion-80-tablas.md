# Base de datos de producción (estructura ampliada)

## Objetivo

Definir una arquitectura de datos capaz de soportar:

- millones de preguntas
- millones de respuestas
- analítica avanzada
- aprendizaje adaptativo
- suscripciones SaaS

---

# Dominios de la base de datos

1 usuarios
2 contenido
3 tests
4 aprendizaje
5 analítica
6 pagos
7 administración

---

# Dominio usuarios

usuarios  
usuarios_perfiles  
usuarios_roles  
usuarios_permisos  
usuarios_sesiones  
usuarios_dispositivos  
usuarios_notificaciones  
usuarios_preferencias  

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
preguntas_etiquetas  

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

# Dominio pagos

planes  
suscripciones  
pagos  
facturas  
cupones  

---

# Dominio administración

logs  
errores  
reportes_preguntas  
revision_contenido  
