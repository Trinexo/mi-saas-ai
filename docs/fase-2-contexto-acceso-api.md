# Fase 2 — Contexto de acceso y API

Estado del diseño: propuesta para revisión antes de implementar.

Base de trabajo: `main` en `dc6c1c287f5d8ab70698de7ad46a3d8eb7a0fdab`.

Este documento no modifica migraciones, repositorios, servicios, endpoints ni middleware. El stash de Fase 1 no es fuente de código: solo se ha considerado como referencia histórica.

## 1. Objetivo

Definir una capa canónica de contexto para responder, dado un usuario y una oposición:

- si existe un acceso;
- cuál es su estado almacenado y efectivo;
- si está vigente;
- qué modelos tiene concedidos;
- cuál es el modo activo;
- qué permisos se derivan del contexto;
- qué operaciones administrativas están permitidas;
- cómo se mantiene la compatibilidad temporal con `modo_preparacion`.

La capa de contexto será de lectura y cálculo. No reparará datos ni generará efectos secundarios.

## 2. Principios aprobados

- Los modelos canónicos son `experto` y `guiado`.
- `albacer` es un valor legacy equivalente a `guiado`.
- Un acceso no recibe automáticamente ambos modelos.
- Si el acceso está activo, `modo_activo` debe pertenecer a los modelos concedidos.
- `revocado` y `cancelado` son estados terminales para el flujo automático.
- Ninguno de esos estados se reactiva automáticamente.
- Reactivar es una operación administrativa explícita.
- Renovar reutiliza la misma fila de `accesos_oposicion`.
- El historial es inmutable desde la aplicación.
- Las operaciones administrativas registran actor y motivo cuando corresponda.
- Usuarios, oposiciones y accesos se desactivan lógicamente; no se borran físicamente desde la aplicación.
- El repositorio de `main` es la base de implementación; no se sustituirá por el stash.

## 3. Contrato Access Context

### 3.1 DTO canónico

```json
{
  "usuario_id": 123,
  "oposicion_id": 45,
  "tiene_acceso": true,
  "acceso_id": 789,
  "estado": "activo",
  "estado_efectivo": "activo",
  "vigencia": {
    "fecha_inicio": "2026-08-01T00:00:00.000Z",
    "fecha_fin": "2026-08-31T23:59:59.000Z",
    "esta_vigente": true,
    "dias_restantes": 30
  },
  "modelos_disponibles": ["experto", "guiado"],
  "modo_activo": "guiado",
  "permisos": {
    "puede_acceder_contenido": true,
    "puede_usar_experto": true,
    "puede_usar_guiado": true,
    "puede_cambiar_modo": true
  },
  "acciones_administrativas": {
    "puede_renovar": false,
    "puede_modificar_modelos": false,
    "puede_modificar_vigencia": false,
    "puede_revocar": false,
    "puede_cancelar": false,
    "puede_reactivar": false
  },
  "legacy": {
    "modo_preparacion": "albacer",
    "modo_preparacion_normalizado": "guiado"
  }
}
```

### 3.2 Campos

Obligatorios cuando existe una fila de acceso:

- `usuario_id`, `oposicion_id`;
- `tiene_acceso`;
- `estado`, tomado de la base;
- `estado_efectivo`, calculado sin escribir;
- `vigencia`;
- `modelos_disponibles`;
- `modo_activo`, que puede ser `null` únicamente fuera de un acceso activo o durante `pendiente_modo`;
- `permisos` y `acciones_administrativas`;
- `legacy`.

Valores nulos:

- Sin `fecha_fin`, `vigencia.fecha_fin` y `dias_restantes` son `null`; la vigencia no caduca por fecha.
- Sin modo activo, `modo_activo` es `null`.
- `legacy.modo_preparacion` puede ser `null` solo si los datos son inconsistentes; no se inventará un valor.
- `legacy.modo_preparacion_normalizado` es `null` cuando el valor legacy es nulo o desconocido.

### 3.3 Ausencia e inconsistencias

Cuando no existe acceso, el servicio devolverá un contexto negativo estable:

```json
{
  "usuario_id": 123,
  "oposicion_id": 45,
  "tiene_acceso": false,
  "acceso_id": null,
  "estado": null,
  "estado_efectivo": "sin_acceso",
  "vigencia": {
    "fecha_inicio": null,
    "fecha_fin": null,
    "esta_vigente": false,
    "dias_restantes": null
  },
  "modelos_disponibles": [],
  "modo_activo": null,
  "permisos": {
    "puede_acceder_contenido": false,
    "puede_usar_experto": false,
    "puede_usar_guiado": false,
    "puede_cambiar_modo": false
  },
  "acciones_administrativas": {
    "puede_renovar": false,
    "puede_modificar_modelos": false,
    "puede_modificar_vigencia": false,
    "puede_revocar": false,
    "puede_cancelar": false,
    "puede_reactivar": false
  },
  "legacy": {
    "modo_preparacion": null,
    "modo_preparacion_normalizado": null
  }
}
```

La forma negativa es estable y no expone detalles internos. Los estados efectivos
posibles son `sin_acceso`, `activo`, `expirado`, `revocado`, `cancelado` e
`inconsistente`.

El esquema del DTO es estable para todos los estados efectivos: no se omiten bloques
según el estado o el rol. Los valores se calculan según el principal autenticado.
Para alumno y profesor, `acciones_administrativas` siempre contiene valores `false`.
Para un administrador, sus valores se calculan según el estado efectivo y las reglas
de negocio. El principal billing no recibe permisos administrativos generales; solo
capacidades internas expresamente autorizadas. El endpoint de contexto del alumno no
revela capacidades internas de billing.

Una inconsistencia no se corregirá silenciosamente. Ejemplos:

- `estado='activo'` con `modo_activo IS NULL`;
- modo activo que no figura en los modelos;
- modelo desconocido o duplicado;
- `modo_preparacion` desconocido;
- más de un acceso para la misma pareja, pese a la restricción única.

El servicio debe registrar un error técnico sin incluir secretos y lanzar `ACCESS_CONTEXT_INCONSISTENT`. El middleware debe fallar cerrado; no concederá contenido por una fila incoherente.

### 3.4 Estado almacenado y estado efectivo

- `estado` es el valor persistido.
- `estado_efectivo` es `expirado` si el estado persistido es `activo` y `fecha_fin` ya pasó.
- Esta resolución no actualiza la fila ni genera eventos. La tarea automática de
  expiración queda fuera de la primera implementación de Fase 2.
- `revocado` y `cancelado` prevalecen sobre la vigencia temporal.
- `inconsistente` falla cerrado.

### 3.5 Vigencia

- `fecha_inicio` forma parte del DTO sin cambiar su tipo SQL actual.
- `fecha_fin = NULL` significa vigencia abierta.
- `esta_vigente` requiere estado efectivo `activo`, fecha de inicio no futura y fecha de fin nula o posterior al instante de consulta.
- `dias_restantes` es `null` para fecha fin nula; en otro caso es `max(0, ceil((fecha_fin - ahora) / 24h))`.
- La consulta debe usar un único instante de referencia para evitar resultados contradictorios entre campos.

## 4. Estados y reglas

| Estado almacenado | Estado efectivo | Acceso contenido | Cambiar modo | Renovar | Reactivar | Actor/motivo | Historial |
|---|---|---:|---:|---:|---:|---|---|
| `activo` vigente | `activo` | Sí | Sí, si hay varios modelos | No como renovación ordinaria | No | Actor en el cambio | Según operación |
| `activo` vencido | `expirado` | No | No | Sí | No | Admin y motivo según operación | `renovado` al renovar |
| `pendiente_modo` | `pendiente_modo` | No hasta seleccionar modo | Sí, seleccionando uno incluido | No automática | No | Usuario para selección; admin si modifica | `modo_activo_cambiado` |
| `expirado` | `expirado` | No | No | Sí | No | Admin y motivo según operación | `renovado` |
| `revocado` | `revocado` | No | No | No automática | Sí, admin explícito | Actor y motivo obligatorios | `reactivado` |
| `cancelado` | `cancelado` | No | No | No automática | Sí, admin explícito | Actor y motivo obligatorios | `reactivado` |

Reglas adicionales:

- Un acceso activo siempre debe tener `modo_activo` incluido en sus modelos.
- Al renovar un acceso expirado se conserva la fila y, por defecto, sus modelos; se recalcula el estado y se modifica la vigencia en una transacción.
- Una renovación puede cambiar modelos en la misma transacción. Si cambia modelos, registra también `modelos_modificados`.
- Reactivar `revocado` conserva el modo anterior si sigue concedido; si no, activa el único modelo o deja `pendiente_modo` cuando hay varios.
- Reactivar `cancelado` no tiene límite temporal, pero exige operación administrativa, actor y motivo.
- Crear, renovar y reactivar son operaciones distintas y no deben compartir una regla de UPSERT que reactive estados terminales.

## 5. Operaciones propuestas

### Alumno: obtener contexto

- Actor: usuario autenticado.
- Parámetro: `oposicionId`.
- Lectura: acceso, modelos, oposición y fechas.
- Escrituras: ninguna.
- Errores: usuario inexistente, oposición inexistente o inconsistencia.

### Alumno: cambiar modo activo

- Actor: propietario del acceso autenticado.
- Parámetro: modo canónico incluido.
- Validaciones: acceso efectivo activo, modelo concedido, modo distinto al actual si se exige evitar eventos redundantes.
- Escrituras: actualización de `modo_activo`, sincronización legacy y evento histórico, en una transacción.
- Errores: `403` sin acceso, `409` modo no incluido o estado no elegible, `422` modo inválido.

### Administración: crear acceso

- Actor: admin autenticado.
- Validaciones: usuario, oposición, tipo, modelos no duplicados y coherencia del modo activo.
- Una sola fila por `(usuario_id, oposicion_id)`.
- Si ya existe un acceso terminal, no se reactiva implícitamente; se exige la operación administrativa correspondiente.
- Evento: `acceso_creado` para una fila nueva.

### Administración: modificar modelos

- Actor: admin.
- Parámetros: lista no vacía y sin duplicados; modo activo opcional.
- Nunca deja el acceso sin modelos.
- Conserva el modo activo si sigue incluido; si desaparece, activa el único modelo o pasa a `pendiente_modo`.
- Motivo obligatorio.
- Evento: `modelos_modificados`.

### Administración: modificar vigencia

- Actor: admin.
- Parámetros: fecha de inicio/fin parciales y motivo.
- Valida orden de fechas sin cambiar tipos SQL.
- Puede modificar vigencia de un acceso expirado sin crear otra fila.
- Evento: `vigencia_modificada`; si además recupera un expirado, se aplica la semántica de `renovado`.

### Administración: renovar

- Actor: admin o flujo de billing explícitamente autorizado.
- Modifica vigencia y conserva modelos por defecto.
- Puede modificar modelos dentro de la misma transacción.
- `expirado → activo` si queda un modo válido; `expirado → pendiente_modo` si quedan varios sin selección.
- Eventos: `renovado` y, si corresponde, `modelos_modificados`.

### Administración: revocar y cancelar

- Actor y motivo obligatorios.
- `revocar`: `activo` o `expirado` → `revocado`.
- `cancelar`: finalización administrativa definitiva → `cancelado`.
- No se borran filas.
- Eventos: `revocado` o `cancelado`.

### Administración: reactivar

- Actor y motivo obligatorios.
- Solo desde `revocado` o `cancelado` mediante endpoint explícito.
- Nunca se ejecuta mediante crear acceso, renovar, webhook de billing, UPSERT,
  actualización genérica ni compatibilidad legacy.
- Se conserva el modo anterior si sigue incluido; de lo contrario se aplica la regla de uno frente a varios modelos.
- Evento: `reactivado`.

Todas las operaciones que toquen acceso, modelos e historial deben usar una única transacción y el mismo cliente PostgreSQL. El fallo de cualquier escritura produce rollback completo.

## 6. Endpoints definitivos

Las rutas de usuario y administrativas están separadas. Las operaciones
administrativas usan `accesoId`; la pareja usuario/oposición queda para la consulta
de contexto y compatibilidad legacy.

| Método y ruta | Rol | Body | Respuesta | Errores principales |
|---|---|---|---|---|
| `GET /api/v1/accesos/contexto/:oposicionId` | alumno autenticado | — | DTO Access Context | `401`, `404` oposición, inconsistencia |
| `PATCH /api/v1/accesos/:accesoId/modo-activo` | propietario | `{modo}` | DTO actualizado | `403`, `409`, `422` |
| `POST /api/v1/admin/accesos` | administrador | usuario, oposición, modelos, vigencia, modo y `motivo` | DTO creado | `400`, `404`, `409` |
| `PATCH /api/v1/admin/accesos/:accesoId/modelos` | admin | `{modelos_disponibles, modo_activo, motivo}` | DTO actualizado | `400`, `404`, `409` |
| `PATCH /api/v1/admin/accesos/:accesoId/vigencia` | admin | fechas y `motivo` | DTO actualizado | `400`, `404` |
| `POST /api/v1/admin/accesos/:accesoId/renovar` | admin/billing autorizado | vigencia, modelos opcionales, motivo | DTO actualizado | `400`, `409` |
| `POST /api/v1/admin/accesos/:accesoId/revocar` | admin | `{motivo}` | DTO actualizado | `400`, `404`, `409` |
| `POST /api/v1/admin/accesos/:accesoId/cancelar` | admin | `{motivo}` | DTO actualizado | `400`, `404`, `409` |
| `POST /api/v1/admin/accesos/:accesoId/reactivar` | admin | vigencia, modo/modelos opcionales, `{motivo}` | DTO actualizado | `400`, `409` |

Se prefiere `PATCH` para modificaciones parciales y `POST` para transiciones con evento. Las operaciones admin no usarán `DELETE`; las rutas legacy se mantendrán temporalmente como adaptadores que ejecutan desactivación lógica y exigirán los nuevos datos de auditoría.

Billing no tendrá todavía una ruta pública. Será un principal interno con scope
propio, limitado a operaciones expresamente autorizadas y sin rol administrativo
general.

La idempotencia queda fijada por operación:

- lectura: naturalmente idempotente;
- cambiar al modo ya activo: respuesta estable y sin evento duplicado, salvo decisión contraria;
- modificar modelos/vigencia con el mismo resultado: éxito sin `updated_at` innecesario,
  sin historial redundante y sin resincronización innecesaria;
- revocar/cancelar/reactivar: repetir el mismo resultado final devuelve éxito idempotente
  sin nuevo evento; una petición incompatible con el estado actual devuelve error de negocio.

El motivo es obligatorio para crear administrativamente, modificar modelos, modificar
vigencia, renovar, revocar, cancelar y reactivar. No es obligatorio para el cambio de
modo realizado por el propio alumno; si el modo cambia realmente, se registra historial.

## 7. Repositorios previstos

### `accesoOposicion.repository.js`

Responsable de la fila de acceso, sus estados, fechas, campos legacy y bloqueos de la fila.

No debe gestionar directamente toda la colección de modelos ni construir eventos dispersos.

### `accesoOposicionModelos.repository.js`

Responsable de listar, validar y reemplazar modelos dentro de un cliente de transacción. Debe:

- bloquear las filas del acceso cuando sea necesario;
- rechazar modelos desconocidos y duplicados;
- impedir una colección vacía;
- devolver la colección normalizada.

### `accesoOposicionHistorial.repository.js`

Responsable de insertar eventos con payload anterior/nuevo, actor, motivo y metadata. No debe exponer UPDATE ni DELETE del historial.

`SELECT ... FOR UPDATE` se usará para el acceso antes de decidir estado, modelos o vigencia. Historial y modelos se escriben con el mismo cliente y transacción.

## 8. Servicio Access Context

Archivo previsto: `backend/src/services/accessContext.service.js`.

Responsabilidades:

- leer una única representación consistente del acceso y modelos;
- normalizar `albacer → guiado`;
- calcular estado efectivo y vigencia;
- calcular permisos y acciones administrativas;
- detectar inconsistencias y fallar cerrado;
- devolver contexto negativo cuando no existe acceso.

No debe:

- modificar datos;
- crear historial;
- reparar `modo_activo`;
- decidir roles que pertenecen al middleware de autenticación/autorización.

Debe ser reutilizable por middleware, servicios y controladores sin duplicar consultas ni reglas de normalización.

## 9. Middleware

Capas separadas:

1. `requireAuth`: identifica al usuario.
2. Autorización de rol: distingue alumno, profesor y admin.
3. Resolución de oposición: obtiene `oposicionId` y contexto.
4. Política de contenido: exige acceso efectivo, modelo incluido y modo activo cuando proceda.

Reglas:

- Un alumno solo usa el contexto de sus propios accesos.
- Profesor se autoriza por asignación de oposición/bloque, no por acceso de alumno.
- Admin puede operar sobre accesos según rol, pero no obtiene automáticamente permisos de contenido de alumno.
- Billing usa un principal interno con scope propio y solo puede ejecutar operaciones expresamente autorizadas; no equivale a administrador.
- Contenido experto exige `experto` incluido y activo cuando la operación lo requiera.
- Contenido guiado exige `guiado` incluido y activo.
- `modo_preparacion` no se consulta directamente en middleware; se usa el contexto normalizado.
- Acceso expirado, revocado, cancelado o inconsistente falla cerrado.

## 10. Historial

Catálogo definitivo:

| Evento | Cuándo | Actor | Motivo | Automático |
|---|---|---|---|---:|
| `acceso_creado` | nueva fila | admin o sistema autorizado | según canal | No/sistema |
| `modelos_modificados` | cambia la colección | admin | Sí | No |
| `modo_activo_cambiado` | cambia el modo activo | usuario o admin | según canal | No |
| `vigencia_modificada` | cambia una fecha | admin | Sí | No |
| `renovado` | expirado recuperado cambiando vigencia | admin/billing | Sí | No |
| `revocado` | acceso revocado | admin | Sí | No |
| `cancelado` | finalización administrativa | admin | Sí | No |
| `reactivado` | recuperación explícita de terminal | admin | Sí | No |
| `expirado` | tarea automática persiste vencimiento | `NULL` | metadata de sistema | Sí |

Cada evento debe conservar payload anterior y nuevo cuando aplique, actor, motivo y metadata. Los eventos automáticos usan `actor_usuario_id = NULL` y metadata con origen/proceso.

`expirado` no se genera todavía porque la tarea automática queda aplazada. No se
crearán eventos genéricos adicionales. El catálogo no implica una migración 041
ahora; si el constraint actual no admite algún evento, primero se detectará y se
propondrá una migración separada, sin crearla todavía.

## 11. Compatibilidad legacy

Durante la transición:

- lectura canónica: `modo_activo` y `acceso_oposicion_modelos`;
- lectura legacy: `modo_preparacion` solo mediante normalización;
- `experto` legacy normaliza a `experto`;
- `albacer` legacy normaliza a `guiado`;
- escrituras nuevas reciben modelos canónicos y sincronizan el campo legacy dentro de la misma transacción;
- ningún escritor nuevo asigna directamente `modo_preparacion` fuera de esa capa;
- si existe un único modelo, el legacy se deriva de ese modelo;
- si existen dos modelos y no hay modo activo, el legacy no debe inventar una selección.

`modo_preparacion` no se eliminará aún. Su retirada requerirá inventario de lectores/escritores, migración de consumidores y aprobación específica.

## 12. Matriz de pruebas

### Unitarias

- normalización `albacer → guiado`;
- cálculo de estado efectivo;
- fechas abiertas, futuras y vencidas;
- permisos por estado y modo;
- modelos vacíos, duplicados o desconocidos;
- modo activo no incluido;
- ausencia de acceso;
- inconsistencias con fallo cerrado.

### PostgreSQL

- acceso activo con experto;
- acceso activo con guiado;
- acceso activo con ambos y modo seleccionado;
- `pendiente_modo` con ambos y modo nulo;
- estado activo con fecha vencida;
- revocado y cancelado;
- renovación de expirado en la misma fila;
- reactivación explícita de terminal;
- modificación parcial conserva precio, notas y fechas;
- rollback si falla la escritura de modelos;
- rollback si falla historial;
- trigger/permisos de historial inmutable;
- FKs e índices exactos;
- dos transacciones concurrentes cambiando modo.

### Servicios y endpoints

- autorización por propietario, admin, profesor y usuario ajeno;
- códigos `401`, `403`, `404`, `409`, `422`;
- motivo obligatorio en acciones administrativas;
- idempotencia de transiciones;
- ninguna ruta admin ejecuta borrado físico;
- adaptadores legacy conservan la semántica existente.

### E2E y regresión

- flujo alumno experto;
- flujo guiado;
- usuario con ambos modelos seleccionando uno;
- bloqueo de contenido por modelo no activo;
- revocación/cancelación y reactivación;
- Stripe renueva sin duplicar acceso ni modelos;
- regresión de profesor y admin.

## 13. Decisiones aprobadas y trabajo futuro

### Ya cerradas

- modelos `experto` y `guiado`;
- `albacer` como alias legacy de `guiado`;
- no conceder ambos modelos automáticamente;
- reactivación terminal solo administrativa;
- renovación sobre la misma fila;
- historial inmutable;
- compatibilidad legacy temporal;
- `main` como base y stash solo como referencia.

### Decisiones D1–D16 aprobadas

1. Las rutas administrativas usan `accesoId` y se separan bajo `/api/v1/admin/accesos`.
2. La consulta de contexto usa la ruta de alumno y devuelve DTO negativo estable sin acceso.
3. Las operaciones repetidas con el mismo resultado son idempotentes y no generan historial.
4. El motivo es obligatorio en todas las mutaciones administrativas indicadas.
5. El cambio real de modo del alumno genera `modo_activo_cambiado`, sin motivo obligatorio.
6. `estado_efectivo=expirado` se devuelve en el contexto; el contenido deniega acceso.
7. Un acceso activo con fecha vencida puede renovarse explícitamente.
8. Billing usa un principal interno con scope propio, sin rol admin general.
9. Profesor no administra accesos y solo accede a recursos asignados.
10. El catálogo de eventos es cerrado y no se añade una migración 041 ahora.
11. La expiración automática queda fuera de la primera implementación.
12. `modo_activo` y modelos son canónicos; el legacy se sincroniza en la capa canónica.
13. Las inconsistencias fallan cerrado como `ACCESS_CONTEXT_INCONSISTENT`.
14. Revocar o cancelar nunca reactiva implícitamente un acceso.
15. Reactivar siempre requiere operación administrativa explícita, actor, motivo,
    transacción y `SELECT FOR UPDATE`.
16. Renovar y reactivar son operaciones distintas y no se delegan en `crearAcceso`
    ni en un UPSERT genérico.

### Trabajo futuro aplazado

- tarea automática de expiración;
- normalización temporal y de zonas horarias;
- endurecimiento de permisos PostgreSQL;
- retirada de `modo_preparacion`;
- adaptaciones legacy posteriores;
- migración 041 únicamente si aparece una necesidad real de esquema;
- lectores legacy que filtren exclusivamente `estado='activo'`;
- observabilidad adicional de inconsistencias sin exponer datos sensibles.

## 14. Plan de implementación por PRs

### PR 1 — repositorios de modelos e historial

- `accesoOposicionModelos.repository.js`;
- `accesoOposicionHistorial.repository.js`;
- pruebas PostgreSQL reales aisladas de ambos repositorios;
- sin endpoints, middleware ni cambios de esquema;
- no sustituir el repositorio de acceso actual.

Criterios de aceptación:

- las transacciones son controladas por la capa superior cuando la operación lo requiere;
- el historial es inmutable desde la aplicación;
- los modelos canónicos se validan y no se duplican;
- no existe reactivación implícita;
- el rollback ante fallo queda probado;
- las pruebas usan PostgreSQL local realmente aislado;
- `main` no presenta regresiones;
- `stash@{0}` permanece intacto.

### PRs posteriores

2. Pruebas PostgreSQL de transacciones, FKs, historial y concurrencia.
3. Servicio `Access Context` de solo lectura.
4. Schemas y normalización canónica.
5. Endpoint de lectura de contexto y tests de autorización.
6. Cambio de modo activo para alumno y admin.
7. Operaciones administrativas de modelos, vigencia, renovación, revocación, cancelación y reactivación.
8. Middleware canónico.
9. Adaptación de `albacerAlumno.service` y consumidores legacy.
10. E2E, regresión y documentación operativa.

Cada PR debe mantener `database/migrations` como fuente única de cambios de esquema, incluir pruebas proporcionales y no aplicar el stash completo.

## Decisiones futuras

Solo quedan aplazadas la tarea automática de expiración, la normalización temporal
y de zonas horarias, el endurecimiento de permisos PostgreSQL, la retirada de
`modo_preparacion`, adaptaciones legacy posteriores y una eventual migración 041 si
aparece una necesidad real de esquema.
