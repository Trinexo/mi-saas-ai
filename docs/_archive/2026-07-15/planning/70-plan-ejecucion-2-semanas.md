# Plan de ejecución técnico (2 semanas)

Objetivo: entregar una versión funcional del MVP con flujo completo de test, corrección, progreso básico y panel admin operativo para contenido.

Alcance de este plan:

- Backend API REST
- Frontend usuario
- Base de datos PostgreSQL
- Panel admin
- Integración end-to-end

## 1) Criterios de éxito al día 10 hábil

- Usuario puede registrarse/iniciar sesión.
- Usuario puede generar test, responder, enviar y ver resultado.
- Sistema guarda respuestas, calcula nota y actualiza progreso básico.
- Admin puede crear/editar/listar/filtrar preguntas.
- Importación CSV inicial operativa.
- Métricas mínimas disponibles (aciertos, errores, blancos, tiempo medio).

---

## 2) Organización por equipos

## Equipo Backend

Responsable de:

- auth + permisos
- endpoints de contenido
- motor de generación y envío de test
- corrección y resultados
- progreso y estadísticas

Entregables:

- API v1 documentada (request/response)
- validaciones + errores consistentes
- tests de servicios críticos

## Equipo Frontend (usuario)

Responsable de:

- flujo Home → Test → Resultado → Progreso
- estados de carga/error/sin datos/completado
- integración con endpoints v1

Entregables:

- pantallas funcionales conectadas
- manejo de sesión y navegación protegida

## Equipo Base de Datos

Responsable de:

- esquema SQL v1 + índices
- migraciones y seed inicial
- soporte de consultas para test y progreso

Entregables:

- migraciones ejecutables
- índices mínimos aplicados
- dataset inicial cargado

## Equipo Admin

Responsable de:

- dashboard básico
- CRUD de oposiciones/materias/temas/preguntas
- filtros + paginación
- importación CSV
- moderación de reportes

Entregables:

- panel usable por rol admin/editor/revisor
- flujo de gestión de contenido operativo

---

## 3) Orden de implementación (dependencias)

1. Base de datos v1 (bloqueante para backend).
2. Backend auth + contenido (bloqueante para frontend y admin).
3. Backend motor test + corrección (bloqueante para frontend usuario).
4. Frontend usuario integrado (depende de 2 y 3).
5. Panel admin integrado (depende de 2).
6. Progreso/estadísticas + estabilización E2E.

---

## 4) Plan diario (10 días hábiles)

## Semana 1

### Día 1 (Lunes)

DB:

- crear migraciones tablas núcleo (`usuarios`, `oposiciones`, `materias`, `temas`, `preguntas`, `opciones_respuesta`)
- definir FKs e índices base

Backend:

- bootstrap API + estructura por capas (`routes/controllers/services/repositories`)
- endpoint `GET /health`

Frontend:

- bootstrap app React + layout base + router

Admin:

- bootstrap módulo admin y navegación

Criterio de salida:

- proyecto arranca en local y migra esquema base sin errores

### Día 2 (Martes)

DB:

- tablas `tests`, `tests_preguntas`, `respuestas_usuario`, `resultados_test`, `progreso_usuario`

Backend:

- `POST /auth/register`, `POST /auth/login`
- middleware JWT + autorización por rol

Frontend:

- pantallas login/registro
- guard de rutas autenticadas

Admin:

- pantalla dashboard base

Criterio de salida:

- login funcional extremo a extremo

### Día 3 (Miércoles)

Backend:

- `GET /oposiciones`
- `GET /materias?oposicion_id`
- `GET /temas?materia_id`
- `GET /preguntas?tema_id`

Frontend usuario:

- Home con selección oposición/materia/tema

Admin:

- listado de preguntas con paginación y filtros

DB:

- ajuste de índices de lectura por `tema_id` y `nivel_dificultad`

Criterio de salida:

- contenido navegable y consultable desde frontend y admin

### Día 4 (Jueves)

Backend:

- `POST /tests/generate` (selección por tema + exclusión recientes)
- persistencia de `tests` y `tests_preguntas`

Frontend usuario:

- pantalla de test con navegación entre preguntas
- temporizador básico (simulacro)

DB:

- query tuning de generación de test

Criterio de salida:

- test generado y renderizado en UI

### Día 5 (Viernes)

Backend:

- `POST /tests/submit`
- corrección automática
- cálculo `aciertos/errores/blancos/nota`
- guardar `resultados_test` y actualizar `progreso_usuario`

Frontend usuario:

- pantalla de resultados

QA (todos):

- pruebas E2E del flujo principal

Criterio de salida:

- flujo completo resolver + enviar + resultado operativo

## Semana 2

### Día 6 (Lunes)

Admin:

- `POST /preguntas`, `PUT /preguntas/:id`, `DELETE /preguntas/:id`
- formulario completo (enunciado, opciones, correcta, explicación, referencia)

Backend:

- validaciones robustas de payload
- errores normalizados

Criterio de salida:

- CRUD de preguntas funcionando desde panel

### Día 7 (Martes)

Admin:

- importador CSV con previsualización y validación por fila
- reporte de errores de importación

DB:

- script de carga masiva y rollback seguro

Backend:

- endpoint de importación protegido por rol

Criterio de salida:

- banco inicial de preguntas cargable en entorno local

### Día 8 (Miércoles)

Backend:

- `GET /stats/user`
- `GET /stats/tema`

Frontend usuario:

- pantalla progreso con histórico y métricas clave

Admin:

- módulo moderación (`reportes_preguntas`)

Criterio de salida:

- métricas mínimas visibles y moderación operativa

### Día 9 (Jueves)

Rendimiento y hardening:

- optimización de consultas críticas
- límites de rate en auth y test submit
- revisión de seguridad básica (JWT, hashing, validación)
- caché opcional de lectura frecuente (si aplica)

Criterio de salida:

- tiempos de respuesta estables en flujos críticos

### Día 10 (Viernes)

Cierre y release candidata:

- smoke tests completos
- corrección de bugs críticos
- documentación técnica de endpoints y despliegue
- checklist de salida a demo

Criterio de salida:

- release candidata MVP lista para validación funcional

---

## 5) Definición de entregables por equipo

Backend:

- colección de endpoints v1 implementados y documentados
- cobertura de tests en servicios críticos (generación/corrección)

Frontend:

- flujo usuario completo operativo
- manejo de estados y errores consistente

DB:

- migraciones + seed + índices + scripts de importación

Admin:

- CRUD + filtros/paginación + importación CSV + moderación

---

## 6) Riesgos del sprint y mitigación

Riesgo: bloqueo por contratos API inestables.

- Mitigación: congelar contrato al final del Día 3.

Riesgo: baja calidad de carga CSV.

- Mitigación: validación por fila y rechazo parcial con reporte.

Riesgo: lentitud en generación de test.

- Mitigación: índices + exclusión de recientes + prefiltrado por tema.

Riesgo: desviación por alcance.

- Mitigación: no incluir funciones premium ni analítica avanzada en este sprint.

---

## 7) Ceremonia mínima recomendada

- Daily 15 min por la mañana.
- Corte técnico diario 10 min para dependencias entre equipos.
- Demo interna al cierre de Día 5 y Día 10.

---

## 8) Checklist final (Go/No-Go)

- [ ] Auth estable (registro/login)
- [ ] Generación y envío de test estables
- [ ] Corrección y resultados correctos
- [ ] Progreso básico actualizado
- [ ] Panel admin CRUD operativo
- [ ] Importación CSV funcional
- [ ] Métricas mínimas visibles
- [ ] Sin bugs críticos abiertos
