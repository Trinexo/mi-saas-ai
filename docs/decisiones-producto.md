# Decisiones de producto - OpoTest

**Fecha de ultima actualizacion:** 8 de mayo de 2026  
**Objetivo:** mantener una fuente clara de decisiones funcionales para no mezclar conceptos antiguos con el modelo actual de la plataforma.

---

## 1. Modelo academico oficial

La jerarquia conceptual de producto es:

```txt
Oposicion -> Temas -> Preguntas -> Tests / Simulacros
```

- **Oposicion:** curso o preparacion principal.
- **Temas:** unidad oficial del temario de una oposicion.
- **Preguntas:** pertenecen a un tema principal.
- **Tests:** se crean reutilizando preguntas existentes.
- **Simulacros:** se crean reutilizando preguntas existentes y representan examen oficial o practica tipo examen.

El concepto `bloque` deja de ser capa estructural oficial.

---

## 2. Temas

Un tema representa una unidad oficial del temario.

Ejemplo:

```txt
Tema 1. La Constitucion Espanola de 1978
```

Puede tener campos auxiliares sin crear otra capa jerarquica:

- alias interno;
- categoria;
- orden;
- peso;
- dificultad estimada;
- estado;
- etiquetas o categorias secundarias futuras.

---

## 3. Eliminacion progresiva de bloques

Objetivo tecnico final:

```txt
preguntas.tema_id
tests.tema_id
progreso_usuario.tema_id
```

Estrategia:

1. En producto, UX, docs y APIs nuevas se usa `tema`.
2. En backend puede mantenerse compatibilidad temporal con `bloque_id`.
3. `bloque_id` queda deprecated.
4. La migracion tecnica completa se hara en sprint posterior.

Durante la transicion:

- la API nueva usa `tema_id` como campo oficial;
- puede aceptar `bloque_id` temporalmente;
- las respuestas nuevas devuelven `tema`, no `bloque`.

---

## 4. Tests

El modelo de tests es mixto.

### Plantilla de test

Recurso reutilizable creado por admin o profesor.

Puede ser:

- monografica: preguntas de un solo tema;
- mixta: preguntas de varios temas.

Reglas:

- pertenece a una sola oposicion;
- usa preguntas ya creadas;
- puede tener configuracion, estado y visibilidad;
- puede generarse manualmente o con seleccion automatica basica.

### Sesion de test

Realizacion concreta de un alumno.

Puede venir de:

- una plantilla publicada;
- el creador dinamico de test;
- repaso;
- refuerzo;
- aleatorio;
- practica por tema;
- simulacro.

Cuando el alumno usa el creador de test, selecciona:

- oposicion activa;
- uno o varios temas;
- nivel;
- modo;
- numero de preguntas;
- parametros de practica.

---

## 5. Simulacros

El simulacro usa modelo mixto:

- es entidad propia para edicion, configuracion y publicacion;
- al realizarse genera una sesion de test vinculada al simulacro.

Un simulacro pertenece siempre a una sola oposicion.

Puede tener:

- reparto por temas;
- seleccion manual global de preguntas;
- duracion;
- penalizacion;
- reglas oficiales;
- estado borrador/publicado/programado;
- fechas de apertura y cierre.

El editor debe ofrecer dos vistas:

1. estructura por temas;
2. preguntas seleccionadas.

---

## 6. Seleccion automatica

Sprint 127 debe contemplar seleccion automatica basica para:

- plantillas de test;
- simulacros.

Funcionamiento MVP:

- seleccionar uno o varios temas;
- cantidad de preguntas;
- dificultad editorial opcional;
- excluir duplicadas dentro del test/simulacro;
- validar disponibilidad;
- permitir revision manual posterior.

No entra aun:

- IA;
- balance avanzado;
- optimizacion por tasa de fallo;
- dificultad adaptativa compleja.

---

## 7. Preguntas

Cada pregunta tiene:

- tema principal obligatorio;
- oposicion derivada del tema principal;
- autor;
- dificultad editorial;
- dificultad observada calculada;
- etiquetas/categorias secundarias opcionales.

Una pregunta pertenece estructuralmente a un unico tema.

Las etiquetas/categorias secundarias sirven para busqueda y organizacion transversal, pero no cambian la pertenencia principal.

---

## 8. Banco de preguntas y profesores

Modelo mixto con control editorial del admin.

Reglas:

- toda pregunta tiene autor;
- los profesores asignados a una misma oposicion ven siempre todas las preguntas de esa oposicion;
- un profesor puede usar preguntas de otros profesores si pertenecen a una oposicion que tiene asignada;
- el admin decide si una pregunta puede reutilizarse fuera de su oposicion original;
- la visibilidad transversal entre oposiciones no la decide el profesor.

Visibilidad recomendada:

- `oposicion`: visible para profesores de esa oposicion;
- `global`: reutilizable en otros contextos aprobados por admin.

---

## 9. Publicacion de preguntas

Las preguntas creadas por profesor se publican directamente.

Reglas:

- quedan usables inmediatamente dentro de su oposicion asignada;
- los profesores de la misma oposicion pueden verlas y reutilizarlas;
- el admin puede revisar, editar, archivar o marcar como global;
- los reportes de alumnos actuan como control de calidad posterior.

Estados minimos:

- `publicada`;
- `archivada`;
- reportes asociados mediante `reportes_preguntas`.

Nota tecnica de transicion:

- mientras la base de datos conserve el estado historico `aprobada`, este equivale funcionalmente a `publicada`;
- no se debe usar `pendiente` para preguntas nuevas creadas o importadas por profesor salvo que en un sprint posterior se introduzca una cola editorial explicita.

---

## 10. Reportes y revision

Los reportes de preguntas los ven:

- admin: todos;
- profesor: reportes de preguntas pertenecientes a sus oposiciones asignadas.

Reglas:

- el profesor no necesita ser autor de la pregunta;
- si tiene asignada la oposicion, puede revisar el reporte;
- al resolver o descartar debe generarse notificacion al alumno que reporto;
- las estadisticas del profesor cuentan reportes abiertos de sus oposiciones.

---

## 11. Alumnos del profesor

Modelo mixto.

MVP:

```txt
profesor -> oposiciones asignadas -> alumnos con acceso activo
```

Futuro:

- grupos;
- aulas;
- profesor responsable;
- planificacion por grupo;
- seguimiento por aula.

---

## 12. Workspace profesor

Sprint 127 debe cubrir MVP completo de las pantallas del workspace profesor:

- Dashboard;
- Mis oposiciones;
- Detalle de oposicion;
- Temario;
- Tests;
- Simulacros;
- Preguntas;
- Alumnos;
- Estadisticas;
- Planificacion;
- Revision;
- Notificaciones.

Todas deben cargar datos reales minimos.

No se exige analitica perfecta, pero los KPIs principales no deben depender de datos ficticios.

---

## 13. Planificacion

El modulo visible para profesor se llama:

```txt
Planificacion
```

No es una agenda de clases/tutorias en el MVP.

Usos incluidos en Sprint 127:

1. Programar simulacros oficiales.
2. Planificar estudio mediante tests o temas recomendados.

Fuera de Sprint 127:

- clases;
- tutorias;
- eventos genericos;
- competiciones/batallas.

---

## 14. Plan de estudio del alumno

La planificacion del profesor aparece en la Home del alumno como:

```txt
Plan de estudio
```

Contenido:

- simulacros programados;
- plantillas de test recomendadas;
- temas recomendados;
- fechas;
- disponibilidad;
- CTA para empezar.

Sprint 127 debe incluir integracion minima en Home del alumno.

---

## 15. Destinatarios de planificacion

MVP:

- una planificacion va dirigida a toda la oposicion.

Futuro:

- grupos;
- aulas;
- alumnos concretos.

Campos futuros preparados:

- `destinatario_tipo`;
- `grupo_id`;
- `aula_id`.

En Sprint 127:

```txt
destinatario_tipo = oposicion
oposicion_id = ...
```

---

## 16. Notificaciones por planificacion

Modelo mixto.

Al crear o publicar una planificacion, el profesor decide:

- notificar alumnos;
- guardar sin notificar.

Campo recomendado:

```txt
notificar_alumnos
```

Si es `true`, se notifican alumnos con acceso activo a la oposicion.

---

## 17. Simulacros programados

Un simulacro programado:

- es visible antes de la apertura;
- no se puede realizar hasta la fecha/hora de apertura;
- puede cerrarse por fecha de cierre;
- muestra estado:
  - proximo;
  - disponible;
  - cerrado;
  - completado.

Intentos:

- configurables por simulacro;
- por defecto 1 intento.

Resultados:

- configurables;
- inmediatos o al cierre;
- revision inmediata, al cierre o nunca.

Campos recomendados:

- `intentos_maximos`;
- `permitir_reintento`;
- `resultados_visibles_desde`;
- `revision_visible_desde`.

---

## 18. Plantillas de test programadas

Cuando una plantilla de test se programa en el plan de estudio:

- los intentos son configurables;
- por defecto puede ser repetible;
- si se quiere comportamiento de examen, se limita desde configuracion.

---

## 19. Temas recomendados en plan de estudio

El profesor puede recomendar uno o varios temas.

Puede configurar:

- numero de preguntas;
- dificultad;
- modo de test;
- tiempo recomendado;
- objetivo o descripcion.

Si hay configuracion suficiente, el alumno pulsa "Empezar" y se genera el test.

Si no, se abre el creador de test con el tema preseleccionado.

---

## 20. Competiciones y batallas

Las batallas quedan fuera de Sprint 127.

Perteneceran a un modulo futuro de gamificacion/ranking:

- competiciones;
- rondas;
- duelos 1 vs 1;
- eliminatorias;
- participantes;
- reglas de paso;
- resultados;
- ranking;
- temporadas.

Planificacion podra mostrarlas o programarlas cuando exista el modulo, pero no contendra sus reglas.

---

## 21. Estadisticas profesor

Sprint 127 incluye metricas academicas reales por:

- oposicion;
- tema;
- pregunta;
- alumno;
- plantilla de test;
- sesion de test;
- simulacro.

Debe cubrir:

- alumnos activos;
- tests realizados;
- media de aciertos;
- simulacros completados;
- preguntas reportadas;
- evolucion simple;
- temas debiles;
- preguntas problematicas;
- ranking de alumnos;
- rendimiento por oposicion;
- distribucion por dificultad.

Fuera de MVP:

- heatmaps avanzados;
- cohortes;
- predicciones;
- IA;
- abandono avanzado;
- comparativas historicas profundas.

---

## 22. Pregunta problematica

Una pregunta se considera problematica si:

- tiene reportes abiertos;
- tiene tasa de fallo alta;
- tiene demasiadas respuestas en blanco;
- tiene comportamiento anomalo frente a preguntas del mismo tema/dificultad.

Umbrales MVP:

- minimo 5 intentos para calcular tasa;
- tasa de fallo >= 60%;
- blancos >= 30%;
- cualquier reporte abierto la marca como problematica.

---

## 23. Ranking de alumnos

Ranking combinado:

- 60% rendimiento;
- 25% actividad;
- 15% evolucion.

Profesor:

- ve ranking completo como herramienta academica.

Alumno:

- puede participar en rankings gamificados si acepta;
- puede activar/desactivar participacion;
- si no participa, no aparece publicamente en rankings de alumnos;
- sus datos internos siguen disponibles para seguimiento academico del profesor.

Sprint 127:

- implementa ranking para profesor;
- deja documentado el consentimiento para ranking publico de alumnos.

---

## 24. Dificultad

Modelo mixto:

- dificultad editorial: facil, media, dificil;
- dificultad observada: calculada por rendimiento real.

En seleccion automatica MVP:

- se usa dificultad editorial como filtro principal;
- la dificultad observada se calcula para analitica.

Si hay desajuste fuerte:

- se crea o muestra sugerencia de revision;
- no se cambia automaticamente;
- profesor/admin decide.

---

## 25. Reutilizacion global de preguntas

Modelo mixto.

Por defecto:

- si el admin reutiliza una pregunta en otra oposicion, se crea una copia adaptada;
- la copia conserva trazabilidad de origen.

Campos recomendados:

- `pregunta_origen_id`;
- `copiada_desde_oposicion_id`;
- `copiada_por_usuario_id`.

Solo se referencia una pregunta compartida real en casos excepcionales.

---

## 26. Versionado de preguntas

Modelo mixto.

Cambios menores editan directo:

- ortografia;
- formato;
- explicacion;
- referencia;
- etiquetas/categorias.

Cambios mayores crean nueva version:

- enunciado sustancial;
- respuesta correcta;
- opciones;
- tema principal;
- sentido juridico/tecnico.

Sprint 127:

- no implementa versionado completo;
- deja base minima preparada si hay migraciones relacionadas.

Campos recomendados:

- `version`;
- `pregunta_origen_id`;
- `es_version_actual`;
- `fecha_version`;
- `version_creada_por`.

---

## 27. Transicion tecnica de nombres

### Plantillas de test

En producto, documentacion y APIs nuevas se usa:

```txt
plantilla_test
```

Internamente puede seguir existiendo temporalmente `admin_tests`.

Reglas:

- `admin_tests` queda como nombre heredado;
- los endpoints nuevos deben responder con `plantilla_test`;
- la migracion fisica a `plantillas_test` queda para un sprint posterior.

### Sesiones de test

En producto, documentacion y APIs nuevas se usa:

```txt
sesion_test
```

Internamente puede seguir existiendo temporalmente `tests`.

Reglas:

- `tests` queda como nombre heredado ambiguo;
- si se habla de intentos del alumno, usar `sesion_test`;
- si se habla de contenido reutilizable, usar `plantilla_test`.

---

## 28. Planificaciones academicas

La tabla principal sera:

```txt
planificaciones_academicas
```

La relacion con temas sera:

```txt
planificacion_academica_temas
```

Motivo:

- sirve para profesor ahora;
- puede servir para admin despues;
- alimenta el Plan de estudio del alumno;
- no queda limitada a clases o tutorias.

Sprint 127 implementa creacion por profesor, pero el modelo queda preparado para admin.

Campos de autor:

- `creado_por_usuario_id`;
- `creado_por_rol`.

Estados guardados:

- `borrador`;
- `publicada`;
- `archivada`.

Estado calculado para profesor:

- `bloqueada`, cuando la planificacion esta publicada pero depende de una plantilla/simulacro en borrador o con configuracion incompleta.

Estados calculados para alumno:

- `proximo`;
- `disponible`;
- `cerrado`;
- `completado`.

Reglas:

- una planificacion en borrador no aparece al alumno;
- una planificacion archivada se oculta al alumno y se conserva como historico para profesor;
- en el workspace profesor, cada profesor gestiona sus propias planificaciones;
- Sprint 127 requiere `fecha_inicio`;
- `fecha_fin` es opcional;
- `duracion_minutos` es opcional;
- si no hay `fecha_fin`, queda disponible desde `fecha_inicio`;
- para evitar doble notificacion se usa `notificada_en`;
- si `notificar_alumnos = true`, se notifica al crear publicada o al pasar de borrador a publicada.

---

## 29. Planificacion y dependencias

### Plantilla de test

Se puede planificar una plantilla en borrador, pero el alumno solo la ve si:

- la planificacion esta `publicada`;
- la plantilla de test esta `publicada`.

### Simulacro

Se puede planificar un simulacro en borrador, pero el alumno solo lo ve si:

- la planificacion esta `publicada`;
- el simulacro esta `publicado`.

Planificar no publica automaticamente.

### Temas

Si `tipo = tema_recomendado`, los temas se guardan en `planificacion_academica_temas`.

Si `tipo = plantilla_test`, los temas se derivan de la plantilla.

Si `tipo = simulacro`, los temas se derivan del simulacro.

Validacion:

- si la planificacion apunta a una plantilla, su oposicion debe coincidir con `oposicion_id`;
- si apunta a un simulacro, su oposicion debe coincidir con `oposicion_id`;
- si la planificacion la crea un profesor, el simulacro debe haber sido creado por ese profesor;
- si es tema recomendado, todos los temas deben pertenecer a `oposicion_id`;
- el profesor debe tener asignada esa oposicion.

---

## 30. Endpoints de planificacion y plan de estudio

Endpoint profesor:

```txt
GET    /api/profesor/workspace/planificacion
POST   /api/profesor/workspace/planificacion
PUT    /api/profesor/workspace/planificacion/:id
DELETE /api/profesor/workspace/planificacion/:id
```

Endpoint alumno:

```txt
GET /api/plan-estudio
```

Reglas del endpoint alumno:

- requiere alumno autenticado;
- valida acceso activo a `oposicion_id`;
- devuelve solo planificaciones publicadas y visibles;
- no devuelve planificaciones bloqueadas;
- se consume desde la Home del alumno.

---

## 31. Seleccion automatica de preguntas - contrato tecnico

Endpoint profesor:

```txt
POST /api/profesor/workspace/seleccion/preguntas
```

La seleccion automatica solo propone preguntas. No guarda ni modifica plantillas/simulacros.

Formatos aceptados:

Payload simple:

```json
{
  "oposicion_id": 1,
  "tema_ids": [1, 2, 3],
  "cantidad": 30,
  "dificultad": "media"
}
```

Payload detallado:

```json
{
  "oposicion_id": 1,
  "temas": [
    { "tema_id": 1, "cantidad": 15 },
    { "tema_id": 2, "cantidad": 10 },
    { "tema_id": 3, "cantidad": 5 }
  ],
  "dificultad": "media"
}
```

Reglas:

- si viene `temas`, se respeta el reparto exacto;
- si viene `tema_ids + cantidad`, se reparte equitativamente;
- las preguntas se devuelven agrupadas por tema y aleatorias dentro de cada tema;
- puede recibir `exclude_ids`;
- puede recibir `plantilla_test_id`;
- puede recibir `simulacro_id`;
- las exclusiones se combinan;
- se valida que plantilla/simulacro pertenezcan a una oposicion asignada al profesor.

Si un tema no tiene suficientes preguntas:

- por defecto devuelve seleccion parcial con aviso;
- indica faltantes;
- no guarda nada;
- si `permitir_completar_con_otros_temas = true`, completa faltantes con otros temas seleccionados con disponibilidad.
