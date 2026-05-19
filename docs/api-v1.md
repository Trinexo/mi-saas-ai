# API REST v1 — Contratos de endpoints

Base URL: `http://localhost:3000/api`

Todos los endpoints devuelven JSON con la forma:
```json
{ "data": <payload> }           // éxito
{ "message": "...", "code": ... } // error
```

---

## Autenticación

### POST /auth/register
Registra un nuevo usuario.

**Rate limit:** 15 peticiones/min por IP.

**Body:**
```json
{ "nombre": "Ana López", "email": "ana@example.com", "password": "secreto123" }
```
**Response 201:**
```json
{ "data": { "token": "<jwt>", "user": { "id": 1, "nombre": "Ana López", "email": "ana@example.com", "role": "alumno" } } }
```
**Errores:** 400 validación, 409 email duplicado, 429 rate limit.

---

### POST /auth/login
Autentica un usuario y devuelve un token JWT.

**Rate limit:** 15 peticiones/min por IP.

**Body:**
```json
{ "email": "ana@example.com", "password": "secreto123" }
```
**Response 200:**
```json
{ "data": { "token": "<jwt>", "user": { "id": 1, "nombre": "Ana López", "role": "alumno" } } }
```
**Errores:** 400 validación, 401 credenciales inválidas, 429 rate limit.

---

## Catálogo

> Endpoints públicos. No requieren autenticación.

### GET /catalog/oposiciones
Lista todas las oposiciones activas.

**Response 200:**
```json
{ "data": [ { "id": 1, "nombre": "Auxiliar Administrativo" } ] }
```

---

### GET /catalog/materias?oposicion_id=1
Lista las materias de una oposición.

**Response 200:**
```json
{ "data": [ { "id": 1, "nombre": "Derecho Constitucional", "oposicion_id": 1 } ] }
```

---

### GET /catalog/temas?materia_id=1
Lista los temas de una materia.

**Response 200:**
```json
{ "data": [ { "id": 1, "nombre": "Tema 1 - Constitución", "materia_id": 1 } ] }
```

---

### GET /catalog/preguntas?tema_id=1&page=1&page_size=20
Lista preguntas de un tema con paginación.

**Response 200:**
```json
{
  "data": {
    "preguntas": [ { "id": 1, "enunciado": "...", "opciones": [...] } ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## Tests

> Requieren header `Authorization: Bearer <token>`.

### POST /tests/generate
Genera un test nuevo.

**Body:**
```json
{
  "temaId": 1,
  "numPreguntas": 10,
  "nivelDificultad": "media"
}
```
- `nivelDificultad`: `"facil" | "media" | "dificil"` (opcional, omitir para mezclar).

**Response 201:**
```json
{
  "data": {
    "testId": 5,
    "preguntas": [
      {
        "preguntaId": 12,
        "enunciado": "¿Cuántos artículos tiene...?",
        "opciones": [
          { "id": 40, "texto": "169" },
          { "id": 41, "texto": "178" }
        ]
      }
    ]
  }
}
```
**Errores:** 400 sin preguntas suficientes, 422 validación.

---

### POST /tests/submit
Envía las respuestas de un test y obtiene la corrección.

**Rate limit:** 10 peticiones/min por usuario.

**Body:**
```json
{
  "testId": 5,
  "respuestas": [
    { "preguntaId": 12, "opcionId": 40 }
  ]
}
```
- `opcionId: null` para dejar en blanco.

**Response 200:**
```json
{
  "data": {
    "aciertos": 7,
    "errores": 2,
    "blancos": 1,
    "nota": 6.75,
    "tiempoSegundos": 243,
    "detalle": [
      { "preguntaId": 12, "correcta": true, "opcionCorrecta": 40 }
    ]
  }
}
```
**Errores:** 400 respuestas duplicadas / pregunta ajena al test, 404 test no encontrado, 429 rate limit.

---

## Estadísticas

> Requieren autenticación.

### GET /stats/user
Estadísticas globales del usuario autenticado.

**Response 200:**
```json
{
  "data": {
    "total_tests": 12,
    "aciertos": 87,
    "errores": 25,
    "blancos": 8,
    "nota_media": "7.20",
    "tiempo_medio": "185.50"
  }
}
```

---

## Workspace profesor - Sprint 127

> Requieren `Authorization: Bearer <token>` y rol `profesor`.
> Todos los resultados se filtran por `profesores_oposiciones`.

### GET /profesor/workspace/dashboard

Query opcional:

```txt
oposicion_id
```

Devuelve KPIs, evolucion, actividad reciente, oposiciones asignadas y alertas academicas.

### GET /profesor/workspace/oposiciones

Lista las oposiciones asignadas al profesor con resumen academico:

- alumnos activos;
- preguntas;
- plantillas de test;
- simulacros;
- media de aciertos;
- reportes abiertos.

### GET /profesor/workspace/oposiciones/:id

Devuelve detalle academico de una oposicion asignada:

- resumen;
- temario por temas;
- preguntas problematicas;
- alumnos activos;
- simulacros activos.

### GET /profesor/workspace/temario

Query opcional:

```txt
oposicion_id
```

Devuelve temas con preguntas, reportes, aciertos, errores, blancos y media de aciertos.

### GET /profesor/workspace/alumnos

Query:

```txt
oposicion_id, q, page, page_size
```

Lista alumnos con acceso activo a las oposiciones asignadas al profesor. Incluye riesgo academico y ranking interno.

### GET /profesor/workspace/alumnos/:id

Devuelve resumen academico de un alumno si pertenece a una oposicion asignada al profesor.

### GET /profesor/workspace/estadisticas

Query opcional:

```txt
oposicion_id, desde, hasta
```

Devuelve evolucion, rendimiento por oposicion, rendimiento por tema, ranking, distribucion de dificultad y preguntas problematicas.

### GET /profesor/workspace/preguntas-problematicas

Query:

```txt
oposicion_id, tema_id, page, page_size
```

Una pregunta se marca problematica si tiene reportes abiertos, tasa de fallo alta o demasiadas respuestas en blanco.

### GET /profesor/workspace/planificacion

Query:

```txt
oposicion_id, desde, hasta
```

Lista planificaciones academicas del profesor.

### POST /profesor/workspace/planificacion

Body minimo para tema recomendado:

```json
{
  "oposicion_id": 1,
  "tipo": "tema_recomendado",
  "estado": "publicada",
  "titulo": "Repaso Tema 1",
  "fecha_inicio": "2026-05-10T08:00:00.000Z",
  "tema_ids": [1],
  "numero_preguntas": 20,
  "dificultad": "mixto",
  "modo_test": "normal"
}
```

Tipos:

- `simulacro`;
- `plantilla_test`;
- `tema_recomendado`.

Estados guardados:

- `borrador`;
- `publicada`;
- `archivada`.

### PUT /profesor/workspace/planificacion/:id

Actualiza una planificacion si pertenece a una oposicion asignada al profesor.

### DELETE /profesor/workspace/planificacion/:id

Archiva la planificacion.

### POST /profesor/workspace/seleccion/preguntas

Solo propone preguntas, no guarda cambios.

Payload simple:

```json
{
  "oposicion_id": 1,
  "tema_ids": [1, 2],
  "cantidad": 20,
  "dificultad": "media",
  "exclude_ids": [10, 11],
  "plantilla_test_id": 5,
  "permitir_completar_con_otros_temas": true
}
```

Payload detallado:

```json
{
  "oposicion_id": 1,
  "temas": [
    { "tema_id": 1, "cantidad": 10 },
    { "tema_id": 2, "cantidad": 15 }
  ]
}
```

---

## Plan de estudio alumno - Sprint 127

> Requiere `Authorization: Bearer <token>` y rol `alumno`.

### GET /plan-estudio

Query:

```txt
oposicion_id
```

Devuelve planificaciones publicadas y visibles para la oposicion activa del alumno.

Estados calculados:

- `proximo`;
- `disponible`;
- `cerrado`;
- `completado`.

No devuelve borradores, archivadas ni actividades bloqueadas por dependencias no publicadas.

---

### GET /stats/tema?tema_id=1
Estadísticas del usuario para un tema concreto.

**Response 200:**
```json
{
  "data": {
    "tema_id": 1,
    "preguntas_vistas": 30,
    "aciertos": 22,
    "errores": 8
  }
}
```
**Errores:** 400 `tema_id` inválido.

---

## Administración

> Requieren autenticación con rol `admin`, `editor` o `revisor`.

### GET /admin/preguntas
Lista preguntas con filtros y paginación.

**Query params:** `oposicion_id`, `materia_id`, `tema_id`, `nivel_dificultad`, `page` (def. 1), `page_size` (def. 20).

**Response 200:**
```json
{
  "data": {
    "preguntas": [ { "id": 1, "enunciado": "...", "tema_nombre": "...", "nivel_dificultad": "media" } ],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### POST /admin/preguntas
Crea una pregunta nueva.

**Body:**
```json
{
  "temaId": 1,
  "enunciado": "¿Cuántos artículos...?",
  "explicacion": "La Constitución tiene 169 artículos.",
  "referenciaNormativa": "CE Art. 1",
  "nivelDificultad": "media",
  "opciones": [
    { "texto": "169", "esCorrecta": true },
    { "texto": "178", "esCorrecta": false },
    { "texto": "155", "esCorrecta": false },
    { "texto": "200", "esCorrecta": false }
  ]
}
```
**Response 201:**
```json
{ "data": { "id": 99, "enunciado": "..." } }
```

---

### PUT /admin/preguntas/:id
Actualiza una pregunta existente.

**Body:** mismo esquema que POST.

**Response 200:**
```json
{ "data": { "id": 99, "enunciado": "..." } }
```

---

### DELETE /admin/preguntas/:id
Elimina una pregunta.

**Response 200:**
```json
{ "data": { "deleted": true } }
```

---

### POST /admin/preguntas/import
Importa preguntas desde CSV. Soporta carga parcial: las filas válidas se insertan, las inválidas se reportan.

**Body:**
```json
{ "csv": "<contenido CSV como string>" }
```

**Formato CSV esperado** (con cabecera):
```
tema_id,enunciado,explicacion,referencia_normativa,nivel_dificultad,opcion_1,opcion_2,opcion_3,opcion_4,opcion_correcta
1,"¿Cuántos artículos...?","La CE tiene 169","CE Art. 1",media,169,178,155,200,1
```
- `nivel_dificultad`: `facil | media | dificil`
- `opcion_correcta`: número 1–4 que indica cuál opción es la correcta

**Response 200:**
```json
{
  "data": {
    "totalRows": 10,
    "imported": 9,
    "failed": 1,
    "errors": [
      { "row": 5, "message": "tema_id no existe" }
    ]
  }
}
```
**Errores:** 400 CSV vacío o malformado.

---

### GET /admin/reportes
Lista reportes de preguntas con filtro por estado y paginación.

**Query params:** `estado` (`abierto | en_revision | resuelto | descartado`), `page` (def. 1), `page_size` (def. 20).

**Response 200:**
```json
{
  "data": {
    "reportes": [
      {
        "id": 3,
        "pregunta_id": 12,
        "usuario_id": 4,
        "motivo": "Enunciado ambiguo",
        "estado": "abierto",
        "fecha_creacion": "2026-03-11T10:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### PATCH /admin/reportes/:id/estado
Actualiza el estado de un reporte.

**Body:**
```json
{ "estado": "resuelto" }
```
- `estado`: `abierto | en_revision | resuelto | descartado`

**Response 200:**
```json
{ "data": { "id": 3, "estado": "resuelto" } }
```
**Errores:** 400 estado inválido, 404 reporte no encontrado.

---

## Códigos de error comunes

| Código | Significado |
|--------|-------------|
| 400 | Validación fallida o lógica de negocio rechazada |
| 401 | Sin token o token inválido |
| 403 | Sin permisos (rol insuficiente) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej. email duplicado) |
| 429 | Rate limit superado |
| 500 | Error interno del servidor |
