# Backlog de tickets MVP (listo para tablero)

Objetivo: convertir la arquitectura v1 y el plan de 2 semanas en historias ejecutables con prioridad, estimación y criterios de aceptación.

Convenciones:

- Prioridad: P0 (crítico), P1 (alto), P2 (medio)
- Estimación: XS (0.5d), S (1d), M (2d), L (3d)
- Equipos: Backend, Frontend, DB, Admin, QA

---

## EPIC A — Plataforma base y autenticación

### TKT-001 — Bootstrap backend modular

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: ninguna
- Descripción: crear estructura por capas routes/controllers/services/repositories + middleware.
- Criterios de aceptación:
  - Proyecto inicia sin errores en entorno local.
  - Endpoint health responde OK.
  - Estructura modular documentada en README técnico.

### TKT-002 — Bootstrap frontend usuario

- Equipo: Frontend
- Prioridad: P0
- Estimación: S
- Dependencias: ninguna
- Descripción: crear app React con router y layout base.
- Criterios de aceptación:
  - Navegación entre pantallas base operativa.
  - Estado de error global mínimo implementado.

### TKT-003 — Migración SQL núcleo de usuarios

- Equipo: DB
- Prioridad: P0
- Estimación: S
- Dependencias: ninguna
- Descripción: crear tablas usuarios y roles/permisos mínimos para MVP.
- Criterios de aceptación:
  - Migración aplica y rollback funciona.
  - Índice único en email.

### TKT-004 — Registro de usuario

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-001, TKT-003
- Descripción: implementar POST auth/register.
- Criterios de aceptación:
  - Valida campos obligatorios.
  - Hash de contraseña persistido.
  - Respuesta consistente de éxito/error.

### TKT-005 — Login con JWT

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-004
- Descripción: implementar POST auth/login.
- Criterios de aceptación:
  - Genera token JWT válido.
  - Rechaza credenciales incorrectas.
  - Incluye expiración configurable.

### TKT-006 — Pantallas login/registro

- Equipo: Frontend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-002, TKT-004, TKT-005
- Descripción: construir formularios y persistencia de sesión.
- Criterios de aceptación:
  - Usuario inicia y cierra sesión.
  - Muestra mensajes de validación.
  - Protege rutas autenticadas.

---

## EPIC B — Modelo de contenido y consultas

### TKT-007 — Migración SQL contenido

- Equipo: DB
- Prioridad: P0
- Estimación: M
- Dependencias: ninguna
- Descripción: crear tablas oposiciones, materias, temas, preguntas, opciones_respuesta.
- Criterios de aceptación:
  - Relaciones FK definidas correctamente.
  - Índices en preguntas por tema y dificultad.

### TKT-008 — Endpoints de catálogo académico

- Equipo: Backend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-001, TKT-007
- Descripción: implementar GET oposiciones, materias por oposición y temas por materia.
- Criterios de aceptación:
  - Filtros por query params operativos.
  - Errores consistentes en ids inválidos.

### TKT-009 — Endpoint de preguntas por tema

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-008
- Descripción: implementar GET preguntas tema_id con paginación.
- Criterios de aceptación:
  - Devuelve página, total y elementos.
  - Soporta filtros mínimos por dificultad.

### TKT-010 — Home de selección de estudio

- Equipo: Frontend
- Prioridad: P1
- Estimación: M
- Dependencias: TKT-006, TKT-008, TKT-009
- Descripción: pantalla para elegir oposición, materia, tema y número de preguntas.
- Criterios de aceptación:
  - Flujo completo de selección funcional.
  - Estados cargando/error/sin datos cubiertos.

---

## EPIC C — Motor de test y corrección

### TKT-011 — Migración SQL test y respuestas

- Equipo: DB
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-007
- Descripción: crear tablas tests, tests_preguntas, respuestas_usuario, resultados_test.
- Criterios de aceptación:
  - Relaciones entre test, pregunta y usuario validadas.
  - Índices en rutas de lectura críticas.

### TKT-012 — Servicio de selección de preguntas v1

- Equipo: Backend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-009, TKT-011
- Descripción: seleccionar preguntas por tema con exclusión de recientes y balance básico de dificultad.
- Criterios de aceptación:
  - Excluye preguntas recientes del usuario.
  - Respeta cantidad solicitada.
  - Distribución de dificultad aproximada definida.

### TKT-013 — Endpoint generar test

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-012
- Descripción: implementar POST tests/generate.
- Criterios de aceptación:
  - Crea registro de test y asociación test-preguntas.
  - Devuelve payload consumible por frontend.

### TKT-014 — UI resolución de test

- Equipo: Frontend
- Prioridad: P0
- Estimación: L
- Dependencias: TKT-010, TKT-013
- Descripción: pantalla de test con navegación por preguntas y selección de respuesta.
- Criterios de aceptación:
  - Permite responder todas o parcialmente.
  - Mantiene estado local de respuestas.
  - Incluye temporizador básico en simulacro.

### TKT-015 — Servicio de corrección y nota

- Equipo: Backend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-013
- Descripción: corregir respuestas y calcular aciertos, errores, blancos y nota.
- Criterios de aceptación:
  - Persistencia de resultado por test.
  - Cálculo correcto en casos edge (vacío/parcial).

### TKT-016 — Endpoint envío de test

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-015
- Descripción: implementar POST tests/submit.
- Criterios de aceptación:
  - Guarda respuestas y resultado final.
  - Rechaza reenvíos inválidos.

### TKT-017 — UI resultados

- Equipo: Frontend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-014, TKT-016
- Descripción: pantalla de resultados con métricas básicas por test.
- Criterios de aceptación:
  - Muestra aciertos, errores, blancos y nota.
  - Presenta resumen por tema si aplica.

---

## EPIC D — Progreso y analítica útil

### TKT-018 — Migración SQL progreso

- Equipo: DB
- Prioridad: P1
- Estimación: S
- Dependencias: TKT-011
- Descripción: crear tabla progreso_usuario con métricas mínimas.
- Criterios de aceptación:
  - Índices por usuario y tema.
  - Integridad referencial con usuarios y temas.

### TKT-019 — Actualización de progreso post submit

- Equipo: Backend
- Prioridad: P1
- Estimación: M
- Dependencias: TKT-016, TKT-018
- Descripción: actualizar progreso al enviar test.
- Criterios de aceptación:
  - Incrementa vistas/aciertos/errores correctamente.
  - Registra tiempo medio.

### TKT-020 — Endpoints de estadísticas v1

- Equipo: Backend
- Prioridad: P1
- Estimación: S
- Dependencias: TKT-019
- Descripción: implementar GET stats/user y GET stats/tema.
- Criterios de aceptación:
  - Entrega estructura estable para frontend.
  - Responde en tiempo aceptable con datos de seed.

### TKT-021 — Pantalla de progreso de usuario

- Equipo: Frontend
- Prioridad: P1
- Estimación: M
- Dependencias: TKT-020
- Descripción: vista con histórico básico y métricas por tema.
- Criterios de aceptación:
  - Muestra evolución y métricas clave.
  - Maneja estados vacíos sin romper UX.

---

## EPIC E — Panel admin y contenido

### TKT-022 — Bootstrap panel admin

- Equipo: Admin
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-002
- Descripción: crear módulo admin con navegación y guard por rol.
- Criterios de aceptación:
  - Rutas admin protegidas por rol.
  - Layout base listo para módulos.

### TKT-023 — Endpoints CRUD preguntas

- Equipo: Backend
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-007, TKT-022
- Descripción: implementar POST/PUT/DELETE preguntas con validación.
- Criterios de aceptación:
  - Valida estructura de opciones y respuesta correcta.
  - Solo roles autorizados pueden mutar contenido.

### TKT-024 — UI listado preguntas con filtros y paginación

- Equipo: Admin
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-022, TKT-023
- Descripción: tabla de preguntas con filtros por oposición/materia/tema/dificultad.
- Criterios de aceptación:
  - Paginación server-side funcional.
  - Filtros combinables y reseteables.

### TKT-025 — UI formulario crear/editar pregunta

- Equipo: Admin
- Prioridad: P0
- Estimación: M
- Dependencias: TKT-023
- Descripción: formulario completo para alta y edición.
- Criterios de aceptación:
  - Soporta enunciado, opciones, correcta, explicación y referencia.
  - Validación de negocio antes de enviar.

### TKT-026 — Importador CSV de preguntas

- Equipo: Admin + Backend + DB
- Prioridad: P1
- Estimación: L
- Dependencias: TKT-023, TKT-024
- Descripción: carga masiva con prevalidación y reporte de errores.
- Criterios de aceptación:
  - Permite carga parcial con errores reportados.
  - Evita duplicados según regla definida.

### TKT-027 — Moderación de reportes

- Equipo: Admin + Backend
- Prioridad: P2
- Estimación: M
- Dependencias: TKT-024
- Descripción: listar y gestionar reportes de preguntas.
- Criterios de aceptación:
  - Permite marcar estado del reporte.
  - Traza usuario y motivo.

---

## EPIC F — Calidad, seguridad y cierre

### TKT-028 — Manejo unificado de errores API

- Equipo: Backend
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-001
- Descripción: estandarizar formato de error y códigos HTTP.
- Criterios de aceptación:
  - Todas las rutas devuelven error uniforme.
  - Incluye trazabilidad mínima de request.

### TKT-029 — Test de servicios críticos

- Equipo: QA + Backend
- Prioridad: P1
- Estimación: M
- Dependencias: TKT-013, TKT-016, TKT-020
- Descripción: pruebas de generación, corrección y estadísticas.
- Criterios de aceptación:
  - Casos edge cubiertos: sin preguntas, tema inexistente, respuestas vacías, duplicados.
  - Pruebas automatizadas ejecutables en CI local.

### TKT-030 — Smoke E2E pre-release

- Equipo: QA
- Prioridad: P0
- Estimación: S
- Dependencias: TKT-017, TKT-021, TKT-025
- Descripción: ejecutar checklist end-to-end antes de demo.
- Criterios de aceptación:
  - Flujo usuario completo sin bloqueos.
  - Flujo admin CRUD sin bloqueos.
  - Registro de incidencias priorizado por severidad.

---

## 4) Priorización sugerida para tablero

Columna Sprint actual (obligatorio):

- TKT-001 al TKT-017
- TKT-022 al TKT-025
- TKT-028
- TKT-030

Columna Sprint actual (si hay capacidad):

- TKT-018 al TKT-021
- TKT-026
- TKT-029

Columna siguiente sprint:

- TKT-027

---

## 5) Definición de estados para Kanban

- Backlog
- Ready
- In Progress
- In Review
- QA
- Done
- Blocked

Regla operativa:

- Un ticket pasa a Ready solo si tiene criterios de aceptación, dependencia resuelta y dueño asignado.
