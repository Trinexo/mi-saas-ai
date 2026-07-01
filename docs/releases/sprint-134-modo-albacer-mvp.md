# Sprint 134 - Modo Experto y Modo Albacer MVP

**Fecha de apertura:** 23 de junio de 2026  
**Tipo:** Producto / Backend / Frontend / Arquitectura de aprendizaje  
**Estado:** En desarrollo

---

## Objetivo

Crear la base funcional para que cada alumno use una oposicion en uno de dos modelos de preparacion:

- **Modo Experto:** entrenamiento libre con tests, simulacros, historial, estadisticas, ranking y recomendaciones por rendimiento.
- **Modo Albacer:** ruta guiada por modulos/niveles creados por profesor o admin, con avance condicionado por el simulacro final de cada modulo.

El cambio debe convivir con el modelo actual sin mezclar historicos, estadisticas ni ranking entre modos.

---

## Decisiones de producto cerradas

### Modos

- Los nombres finales son `Modo Experto` y `Modo Albacer`.
- El modo se guarda por `usuario + oposicion`.
- El alumno puede cambiar de modo desde la interfaz.
- Al cambiar de modo se conserva el historico separado de cada modo.
- Si un acceso no tiene modo configurado, entra por defecto en `Modo Albacer`.

### Tipo de alumno por oposicion

- `alumno_albacer` no es un rol global.
- Debe guardarse por `usuario + oposicion`.
- Un alumno libre y un alumno Albacer pueden usar ambos modos.
- La diferencia es que solo el alumno marcado como `alumno_albacer` en esa oposicion ve tests y simulacros sugeridos por el profesor.

### Ranking

- El ranking solo usa resultados del `Modo Experto`.
- El ranking es independiente por oposicion.
- `Modo Albacer` no participa en ranking.
- La participacion publica en ranking se decide por alumno y oposicion.

### Estadisticas

- Las estadisticas de `Modo Experto` y `Modo Albacer` nunca se mezclan.
- Las estadisticas se filtran siempre por oposicion.
- En `Modo Albacer`, las estadisticas se separan tambien por modulo.
- En `Modo Albacer`, historial y estadisticas solo se alimentan de tests y simulacros creados dentro del plan Albacer.

### Plan legacy

- El `Plan de estudio` y la planificacion/calendario actual quedan como `legacy/deprecated`.
- No se eliminan fisicamente de base de datos en este MVP.
- Deben ocultarse por completo del frontend de alumno.
- Se crea una programacion nueva basada en modulos Albacer.

---

## Modo Experto

### Alcance funcional

El Modo Experto mantiene una experiencia parecida a la actual:

- crear tests libres;
- crear simulacros libres;
- consultar historial;
- consultar estadisticas;
- participar en ranking por oposicion;
- recibir recomendaciones de temas por preguntas no realizadas o malos resultados;
- ver tests/simulacros sugeridos por profesor si el acceso del alumno en esa oposicion es `alumno_albacer`.

### No incluido

- Plan de estudio guiado.
- Niveles.
- Bloqueo de contenido por modulos.

---

## Modo Albacer

### Concepto

El Modo Albacer funciona como una ruta guiada por modulos/niveles.

Cada modulo:

- pertenece a una oposicion;
- tiene un orden;
- puede estar en `borrador`, `publicado` o `archivado`;
- contiene uno o varios temas;
- contiene tests propios del modulo;
- contiene un simulacro final propio;
- puede repetirse tantas veces como quiera el alumno;
- desbloquea el siguiente modulo cuando el alumno supera el simulacro final.

### Avance

- El modulo actual es el primer modulo publicado no superado.
- Si todos los modulos estan superados, se muestra `Plan completado`.
- Cuando el plan esta completado debe aparecer un boton para activar `Modo Experto`.
- Los modulos posteriores publicados se muestran bloqueados hasta superar el modulo anterior.
- El alumno puede ir directamente al simulacro final desde el inicio del modulo.
- Los tests del modulo no son obligatorios, pero estan disponibles mientras el modulo este desbloqueado.

### Superacion

- La superacion depende del simulacro final del modulo.
- Cuenta la mejor nota conseguida.
- El profesor/admin configura el criterio del simulacro final:
  - aprobado por nota;
  - aprobado por porcentaje de acierto.
- La penalizacion y scoring se configuran por test/simulacro, como hasta ahora.
- La configuracion de scoring usada debe guardarse como snapshot en cada intento para no recalcular historicos si la configuracion cambia despues.

### Revision de respuestas

- Antes de aprobar el modulo:
  - no se muestra respuesta correcta;
  - no se muestra explicacion;
  - solo se indica correcta, fallada o en blanco.
- Despues de aprobar el modulo:
  - se puede mostrar la revision completa de los intentos de ese modulo.

### Preguntas reutilizadas

- La restriccion de preguntas reutilizadas se aplica solo dentro del mismo modulo.
- Al crear un test del modulo, las preguntas ya usadas en tests anteriores del mismo modulo aparecen desactivadas.
- Al crear el simulacro final, las preguntas ya usadas dentro del modulo aparecen desactivadas.
- Profesor/admin puede forzar reutilizacion manualmente.

### Modulos automaticos

Los modulos automaticos quedan para una fase posterior del MVP, pero el modelo debe quedar preparado.

Reglas decididas:

- profesor/admin selecciona temas;
- selecciona cantidad de preguntas por test;
- selecciona cantidad de preguntas para simulacro final;
- puede seleccionar dificultad o reparto de dificultad;
- si no hay preguntas suficientes para crear al menos un test y un simulacro final sin repetir, se bloquea y avisa;
- por defecto no se repiten preguntas.

---

## Modelo de datos propuesto

### Extender `accesos_oposicion`

Guardar el tipo de alumno y modo activo por oposicion:

```sql
ALTER TABLE accesos_oposicion
  ADD COLUMN tipo_alumno TEXT NOT NULL DEFAULT 'libre'
    CHECK (tipo_alumno IN ('libre', 'albacer')),
  ADD COLUMN modo_preparacion TEXT NOT NULL DEFAULT 'albacer'
    CHECK (modo_preparacion IN ('experto', 'albacer'));
```

Notas:

- `tipo_alumno = 'albacer'` permite ver sugeridos del profesor.
- `modo_preparacion` indica la experiencia activa del alumno en esa oposicion.

### Extender `tests`

Guardar el contexto del intento:

```sql
ALTER TABLE tests
  ADD COLUMN modo_preparacion TEXT NOT NULL DEFAULT 'experto'
    CHECK (modo_preparacion IN ('experto', 'albacer')),
  ADD COLUMN albacer_modulo_id BIGINT,
  ADD COLUMN albacer_item_id BIGINT,
  ADD COLUMN scoring_snapshot JSONB;
```

Uso:

- `modo_preparacion` separa estadisticas, historial y ranking.
- `albacer_modulo_id` permite filtrar estadisticas por modulo.
- `albacer_item_id` vincula el intento a un test/simulacro del modulo.
- `scoring_snapshot` guarda penalizaciones, criterio y configuracion aplicada en ese intento.

### Extender `admin_tests`

Reutilizar plantillas actuales para tests de modulo:

```sql
ALTER TABLE admin_tests
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'experto'
    CHECK (scope IN ('experto', 'albacer_modulo', 'sugerido_profesor')),
  ADD COLUMN albacer_modulo_id BIGINT;
```

### Extender `simulacros`

Reutilizar simulacros actuales para simulacro final de modulo:

```sql
ALTER TABLE simulacros
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'experto'
    CHECK (scope IN ('experto', 'albacer_modulo_final', 'sugerido_profesor')),
  ADD COLUMN albacer_modulo_id BIGINT,
  ADD COLUMN criterio_superacion TEXT NOT NULL DEFAULT 'nota'
    CHECK (criterio_superacion IN ('nota', 'porcentaje')),
  ADD COLUMN valor_superacion NUMERIC(6,2);
```

### Nuevas tablas Albacer

```sql
CREATE TABLE albacer_modulos (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  creado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_por_rol TEXT NOT NULL DEFAULT 'profesor',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE albacer_modulo_temas (
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (modulo_id, tema_id)
);

CREATE TABLE albacer_modulo_items (
  id BIGSERIAL PRIMARY KEY,
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('test', 'simulacro_final')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  plantilla_test_id BIGINT REFERENCES admin_tests(id) ON DELETE SET NULL,
  simulacro_id BIGINT REFERENCES simulacros(id) ON DELETE SET NULL,
  orden INT NOT NULL DEFAULT 0,
  obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE albacer_modulo_progreso (
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('bloqueado', 'disponible', 'superado')),
  mejor_nota NUMERIC(5,2),
  mejor_porcentaje NUMERIC(5,2),
  test_id_mejor_intento BIGINT REFERENCES tests(id) ON DELETE SET NULL,
  superado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, modulo_id)
);
```

---

## Backend MVP propuesto

### Alumno - modo y estado

Endpoints nuevos o extendidos:

- `GET /api/accesos/oposicion/:oposicionId/preparacion`
- `PATCH /api/accesos/oposicion/:oposicionId/preparacion`
- `GET /api/albacer/estado?oposicion_id=`
- `GET /api/albacer/modulos?oposicion_id=`
- `POST /api/albacer/items/:id/empezar`
- `POST /api/albacer/modulos/:id/simulacro-final/empezar`

Validaciones:

- usuario autenticado;
- acceso activo a la oposicion;
- modo guardado por `accesos_oposicion`;
- historial separado por `tests.modo_preparacion`;
- solo alumnos con `tipo_alumno = 'albacer'` ven sugeridos del profesor.

### Profesor/admin - modulos

Endpoints profesor:

- `GET /api/profesor/albacer/modulos?oposicion_id=`
- `POST /api/profesor/albacer/modulos`
- `GET /api/profesor/albacer/modulos/:id`
- `PUT /api/profesor/albacer/modulos/:id`
- `DELETE /api/profesor/albacer/modulos/:id`
- `POST /api/profesor/albacer/modulos/:id/tests`
- `POST /api/profesor/albacer/modulos/:id/simulacro-final`
- `GET /api/profesor/albacer/modulos/:id/preguntas-disponibles`

Endpoints admin equivalentes:

- `GET /api/admin/albacer/modulos`
- `POST /api/admin/albacer/modulos`
- `GET /api/admin/albacer/modulos/:id`
- `PUT /api/admin/albacer/modulos/:id`
- `DELETE /api/admin/albacer/modulos/:id`

Permisos:

- admin puede gestionar cualquier oposicion;
- profesor solo puede gestionar oposiciones asignadas;
- profesor solo ve alumnos y progreso de sus oposiciones asignadas.

### Scoring

Cambios necesarios:

- Al iniciar un test/simulacro Albacer se guarda `scoring_snapshot`.
- Al enviar un intento se conserva el scoring usado en el intento.
- La superacion del modulo se evalua con:
  - mejor nota del simulacro final;
  - o mejor porcentaje de acierto del simulacro final.
- Si el profesor cambia scoring o criterio despues, solo afecta a nuevos intentos.

### Ranking

Actualizar consultas de ranking:

- incluir solo `tests.modo_preparacion = 'experto'`;
- seguir filtrando por `oposicion_id`;
- excluir tests de `scope` Albacer.

### Estadisticas

Actualizar repositorios de progreso, historial y widgets:

- `Modo Experto`: filtrar `tests.modo_preparacion = 'experto'`.
- `Modo Albacer`: filtrar `tests.modo_preparacion = 'albacer'`.
- En Albacer permitir filtro por `albacer_modulo_id`.

---

## Frontend MVP propuesto

### Mis oposiciones

Cada card debe mostrar:

- modo activo;
- tipo de alumno en esa oposicion (`Libre` o `Albacer`);
- boton para cambiar entre `Modo Experto` y `Modo Albacer`;
- aviso de que el historico no se mezcla.

### Navegacion alumno

Si la oposicion activa esta en `Modo Albacer`:

- ocultar `Crear test`;
- ocultar `Ranking`;
- ocultar `Plan de estudio`;
- mantener `Historial` filtrado a Albacer;
- mantener `Estadisticas` con version Albacer;
- mantener `Simulacros` solo para simulacros de modulo y sugeridos permitidos;
- mostrar acceso a la home Albacer.

Si la oposicion activa esta en `Modo Experto`:

- mantener flujo actual de entrenamiento libre;
- ocultar el plan legacy;
- ranking visible;
- crear test visible;
- simulacros libres visibles.

### Home Albacer

La home Albacer debe mostrar:

- modulo actual;
- progreso de modulos superados / totales;
- tests del modulo;
- simulacro final disponible desde el inicio;
- modulos siguientes bloqueados;
- mejor nota del simulacro final;
- intentos realizados;
- temas incluidos en el modulo;
- sugeridos del profesor si el acceso es `tipo_alumno = 'albacer'`.

Si todos los modulos estan superados:

- mostrar `Plan completado`;
- boton `Activar Modo Experto`.

### Historial Albacer

Debe mostrar:

- todos los intentos Albacer de la oposicion activa;
- filtro por modulo;
- tipo de item: test de modulo o simulacro final;
- mejor intento resaltado.

### Progreso Albacer

Debe mostrar:

- modulos superados / totales;
- modulo actual;
- mejor nota por modulo;
- tests realizados del modulo;
- intentos del simulacro final;
- temas del modulo;
- estado: bloqueado, disponible, superado.

---

## Backlog por PR

### PR A - Migraciones base

- Crear migracion base Albacer:
  - columnas en `accesos_oposicion`;
  - columnas en `tests`;
  - columnas en `admin_tests`;
  - columnas en `simulacros`;
  - tablas `albacer_modulos`, `albacer_modulo_temas`, `albacer_modulo_items`, `albacer_modulo_progreso`.
- Crear indices por oposicion, modulo, modo y scope.
- Actualizar `database/schema.sql`.
- Estado: implementado en `database/migrations/037_albacer_mode_base.sql`.

### PR B - Acceso, modo activo y tipo de alumno

- Extender repositorio de accesos.
- Exponer endpoint para leer/cambiar modo por oposicion.
- Permitir a admin/profesor marcar un acceso como `tipo_alumno = albacer`.
- Actualizar `useUserAccesos` para recibir `modo_preparacion` y `tipo_alumno`.
- Actualizar `MisOposicionesPage` con selector/cambio de modo.
- Estado: implementado en el PR B del sprint. El cambio de modo queda disponible para el alumno y el tipo de alumno se gestiona desde accesos admin.

### PR C - Navegacion por modo y ocultar legacy

- Ocultar `Plan de estudio` legacy del menu de alumno.
- Ocultar `Crear test` y `Ranking` cuando la oposicion activa esta en Modo Albacer.
- Mantener `Ranking` solo en Modo Experto.
- Crear guardas frontend para rutas no disponibles por modo.
- Preparar home con switch `HomeExperto` / `HomeAlbacer`.
- Estado: implementado parcialmente. Navegacion y rutas quedan protegidas por modo; la home oculta accesos libres en Albacer hasta crear la Home Albacer completa del PR G.

### PR D - CRUD modulos Albacer profesor/admin

- Crear repositorio, servicio, controller, schemas y rutas Albacer.
- CRUD de modulos con temas.
- Estados `borrador`, `publicado`, `archivado`.
- Validar oposicion asignada al profesor.
- Crear primeras pantallas admin/profesor para listar y editar modulos.
- Estado: backend MVP implementado con endpoints admin/profesor, permisos por oposicion asignada y API frontend preparada. La pantalla visual queda para el siguiente bloque de UI.
- Estado UI: pantalla compartida admin/profesor preparada para listar, filtrar, crear, editar, publicar, archivar y eliminar modulos Albacer.

### PR E - Tests y simulacro final de modulo

- Crear tests propios de modulo usando `admin_tests` con `scope = albacer_modulo`.
- Crear simulacro final usando `simulacros` con `scope = albacer_modulo_final`.
- Bloquear preguntas ya usadas dentro del mismo modulo.
- Permitir forzar reutilizacion.
- Guardar items en `albacer_modulo_items`.
- Estado: backend y UI inicial preparados para asociar tests existentes y un unico simulacro final existente a cada modulo. La creacion automatica/manual de tests desde el propio modulo queda para el siguiente bloque.
- Estado creacion tests: preparado endpoint para crear un test desde el modulo y abrirlo en el editor; el selector de preguntas bloquea las ya usadas en otros tests/simulacros del mismo modulo.

### PR F - Ejecucion alumno Albacer

- `GET /api/albacer/estado`.
- `GET /api/albacer/modulos`.
- `POST /api/albacer/items/:id/empezar`.
- `POST /api/albacer/modulos/:id/simulacro-final/empezar`.
- Crear sesiones en `tests` con `modo_preparacion = albacer`.
- Guardar `albacer_modulo_id`, `albacer_item_id` y `scoring_snapshot`.
- Evaluar superacion por mejor nota o porcentaje.
- Estado backend inicial: endpoints de alumno preparados para listar modulos publicados, calcular modulo actual/bloqueado, iniciar tests de modulo y simulacro final creando sesiones Albacer con snapshot de puntuacion.
- Estado superacion: al enviar el simulacro final Albacer se actualiza `albacer_modulo_progreso` con mejor nota/porcentaje, se marca el modulo como `superado` cuando cumple el criterio configurado y se desbloquea el siguiente modulo publicado.

### PR G - Home Albacer MVP

- Crear home Albacer.
- Mostrar modulo actual, tests, simulacro final, progreso y bloqueos.
- Mostrar `Plan completado` con boton para activar Modo Experto.
- Mostrar sugeridos del profesor solo si `tipo_alumno = albacer`.
- Estado: Home Albacer MVP implementada sobre endpoints reales. Muestra progreso de modulos, modulo actual, tests, simulacro final, ruta bloqueada/superada y cambio a Modo Experto al completar el plan.

### PR H - Historial, progreso y ranking separados

- Actualizar historial para filtrar por modo.
- Actualizar progreso para filtrar por modo y modulo.
- Actualizar ranking para contar solo Modo Experto.
- Actualizar widgets de home para no mezclar datos.
- Estado: historial, resumen global, evolucion, simulacros de progreso y ranking filtran por `modo_preparacion`. El backend queda preparado para filtro por `albacer_modulo_id`; la UI de selector por modulo queda para el siguiente bloque especifico de Progreso Albacer.
- Estado selector modulo: Progreso muestra selector de modulo cuando la oposicion activa esta en `Modo Albacer` y aplica `albacer_modulo_id` al resumen global, evolucion y progreso real por tema.
- Estado widgets: racha, objetivo diario, actividad semanal, nivel/XP y analiticas avanzadas respetan `modo_preparacion` y `albacer_modulo_id`.

### PR I - Retirada frontend del plan legacy

- Quitar enlaces visibles al plan legacy.
- Mantener rutas legacy solo si hacen falta temporalmente para compatibilidad interna.
- Marcar servicios y endpoints como deprecated.
- Documentar retirada futura de tablas legacy.
- Estado: frontend de alumno limpio. Se elimina la pantalla `PlanEstudioPage`, el cliente `planEstudioApi`, los enlaces de menu/home/notificaciones y `/plan-estudio` queda como redireccion a Inicio. El backend y tablas legacy se conservan para compatibilidad interna.
- Estado backend legacy: `/plan-estudio` devuelve `410` en oposiciones con `Modo Albacer`, evitando que el plan antiguo cree tests fuera de los modulos Albacer.

### PR J - Modulos automaticos

- Selector de temas.
- Numero de tests.
- Numero de preguntas por test.
- Numero de preguntas de simulacro final.
- Reparto por dificultad.
- Validacion de preguntas suficientes sin repetir.
- Generacion automatica bloqueante si no hay banco suficiente.
- Estado: MVP implementado con generacion automatica desde el panel de contenido del modulo. Permite configurar numero de tests, preguntas por test, preguntas del simulacro final, dificultad y repeticion. Backend valida banco suficiente y crea tests + simulacro final asociados al modulo.

---

## Criterios de aceptacion MVP

- Un alumno puede tener Modo Experto en una oposicion y Modo Albacer en otra.
- El cambio de modo no mezcla historicos.
- `Modo Albacer` no aparece en ranking.
- Ranking sigue separado por oposicion.
- El alumno puede activar/desactivar si aparece publicamente en ranking por oposicion.
- `Plan de estudio` legacy no aparece en el frontend de alumno.
- Profesor y admin pueden crear modulos Albacer.
- Un modulo publicado aparece al alumno si tiene acceso activo a la oposicion.
- El alumno ve modulos futuros bloqueados.
- El alumno puede iniciar el simulacro final desde el inicio del modulo.
- Superar el simulacro final desbloquea el siguiente modulo.
- Cuenta la mejor nota/porcentaje del simulacro final.
- Antes de superar modulo, no se muestran respuestas ni explicaciones de preguntas falladas.
- Despues de superar modulo, se puede mostrar revision completa del modulo.
- Estado revision Albacer: `GET /tests/:id/review` devuelve revision limitada hasta superar el modulo, ocultando explicaciones y opcion correcta no elegida.
- Tests sugeridos por profesor solo aparecen a alumnos con `tipo_alumno = albacer` en esa oposicion.
- Estado sugeridos: `/mis-tests` y `/simulacros` filtran por `tipo_alumno = albacer`; los accesos libres solo conservan visibilidad de `TEST DEMO` en tests.
- Estado simulacros Albacer: la pantalla generica de simulacros oculta la creacion libre en Modo Albacer y excluye simulacros finales de modulo del listado publico.
- Estado controladores alumno: tests sugeridos y simulacros publicados usan los ids ya validados por Zod antes de listar o iniciar contenido.
- Estado navegacion Albacer: Home, historial, resultado y revision no ofrecen acciones que creen tests libres fuera del plan; el historial reciente filtra por `modo_preparacion`.
- Estado CTAs Albacer: catalogo, oposicion, tema y bloque evitan botones de practica libre en Modo Albacer; `Favoritos` queda oculto/bloqueado porque genera tests libres.
- Estado favoritos: `modo marcadas` exige `oposicionId`, filtra preguntas marcadas por oposicion activa y muestra bloqueo si se accede a `/marcadas` en `Modo Albacer`.
- Estado generador libre: `/configurar-test` muestra bloqueo en `Modo Albacer` aunque se acceda por URL directa, redirigiendo al alumno a los modulos.
- Estado repaso: `modo repaso` exige `temaId` u `oposicionId`; los widgets envian la oposicion activa y el picker limita preguntas pendientes a esa oposicion.
- Estado pendientes repaso: `/repaso/pendientes` acepta `oposicion_id`; widgets/formulario consultan solo pendientes de la oposicion activa.
- Estado repaso por bloque: `modo repaso` acepta `bloqueId`; el picker limita pendientes al bloque seleccionado y el guard Albacer resuelve oposicion desde bloque.
- Estado refuerzo: `generate-refuerzo` exige `temaId` u `oposicionId`; el selector limita fallos por oposicion activa cuando se informa.
- Estado bloqueo backend: `/tests/generate`, `/tests/generate-refuerzo` y `/tests/generate-demo` bloquean tests libres si la oposicion resuelta esta en `Modo Albacer`; los demos publicos siguen disponibles para usuarios sin acceso activo y `/tests/continuar` devuelve una respuesta neutra de Modulo Albacer en ese modo.
- Estado recomendado: `/tests/recomendado` acepta `oposicion_id`, calcula la sugerencia con la oposicion activa y devuelve una respuesta neutra si esa oposicion esta en `Modo Albacer`.
- Estado validacion tests alumno: recomendado, continuar, pendientes y cierre de test usan queries/params normalizados por Zod antes de llegar al servicio.
- Estado perfil: el resumen de actividad de `/perfil` consulta `/stats/dashboard` con oposicion activa y `modo_preparacion`, evitando mezclar resultados de otras oposiciones o modos.
- Estado foco hoy: `/stats/foco-hoy` acepta oposicion activa, limita repaso/recientes/bloques debiles a esa oposicion y devuelve respuesta neutra en `Modo Albacer`.
- Estado temas debiles: `/stats/temas-debiles` calcula desde intentos finalizados y respeta oposicion activa, `modo_preparacion` y `albacer_modulo_id`.
- Estado progreso de contenido: resumen de oposicion, progreso por tema, detalle de tema y detalle de bloque respetan `modo_preparacion` y `albacer_modulo_id`.
- Estado racha por bloque: `/stats/racha-bloques` acepta oposicion activa, `modo_preparacion` y `albacer_modulo_id`, evitando mezclar bloques practicados de otras oposiciones o modulos.
- Estado validacion stats: los endpoints de widgets y progreso validan `oposicion_id`, `modo_preparacion`, `albacer_modulo_id`, `tema_id` e ids de bloque antes de ejecutar consultas.
- Estado validacion rendimiento stats: los controllers de rendimiento consumen contexto ya normalizado por Zod sin casteos manuales.
- Estado validacion progreso stats: los controllers de progreso consumen ids y contexto ya normalizados por Zod sin validaciones duplicadas.
- Estado validacion notificaciones: el listado recibe paginacion e indicador de no leidas ya normalizados por Zod.
- Estado validacion alumno: marcadas, tests sugeridos, simulacros publicados y consultas de tests validan ids y modo antes de entrar en los controladores.
- Estado validacion accesos: rutas de acceso por oposicion, cambio de modo/ranking y administracion de accesos validan ids, filtros, tipo de alumno y modo de preparacion.
- Estado controladores accesos: los controladores de accesos usan params, query y body ya normalizados por Zod antes de llamar al servicio.
- Estado validacion demo: `generate-demo` valida `oposicionId` antes de comprobar el bloqueo por modo Albacer y crear el test demo.
- Estado validacion modulos Albacer: los formularios de modulos, items, tests y generacion automatica normalizan ids, cantidades, duraciones y puntuaciones numericas antes del servicio.
- Estado validacion simulacros profesor: los formularios y controladores de simulacros propios normalizan ids, paginacion, bloques, preguntas y puntuaciones antes del servicio.
- Estado validacion simulacros admin: los formularios y controladores admin de simulacros normalizan ids, paginacion, bloques, preguntas y puntuaciones antes del servicio.
- Estado validacion tests admin: los formularios y rutas admin de tests normalizan ids, paginacion, temas, preguntas, duracion y puntuaciones antes del servicio.
- Estado validacion etiquetas admin: las rutas admin de etiquetas normalizan paginacion e ids de preguntas/etiquetas antes del servicio.
- Estado validacion medios admin/profesor: los endpoints de imagenes y audios de preguntas usan ids normalizados por Zod antes de gestionar archivos.
- Estado validacion catalogo admin: el listado admin de oposiciones usa la paginacion normalizada por Zod y los schemas cubren ids de temas/bloques.
- Estado validacion panel admin: los widgets del dashboard admin normalizan `limit` y `dias` por Zod antes de llegar a controladores.
- Estado validacion suscripciones: el controlador usa userId, limit y offset normalizados por Zod antes de llamar al servicio/repositorio.
- Estado validacion marcadas: el controlador usa preguntaId y oposicion_id normalizados por Zod antes del servicio.
- Estado validacion plan estudio legacy: los schemas salen de la ruta y el controlador usa id/oposicion_id normalizados por Zod.
- Estado validacion workspace profesor: los filtros, parametros e ids del workspace profesor quedan normalizados por Zod antes de llegar a servicios.
- Estado validacion billing: checkout y precios de oposicion normalizan ids y precios por Zod antes de llegar al servicio.
- Estado ranking: el backend rechaza `/stats/ranking` si el acceso activo esta en `Modo Albacer` y la pantalla `/ranking` muestra bloqueo sin consultar datos.
- Estado configurador libre: la disponibilidad del modo adaptativo se calcula con estadisticas de la oposicion activa en `Modo Experto`, evitando habilitarlo por historial de otra oposicion.
- Estado marcadas en test/revision: las pantallas de realizacion y revision cargan preguntas marcadas filtradas por la oposicion del test.
- Estadisticas e historial se filtran por modo y oposicion.

---

## Riesgos

- El plan legacy ya tiene integraciones con home, notificaciones, calendario y tests; hay que ocultarlo sin romper rutas existentes.
- El scoring Albacer usa `scoring_snapshot` al enviar: los intentos antiguos sin snapshot conservan el calculo historico.
- Muchas consultas de estadisticas usan `tests` sin filtrar por modo; deben auditarse antes de exponer Albacer.
- La reutilizacion de `admin_tests` y `simulacros` reduce duplicacion, pero exige campos `scope` bien aplicados para no cruzar contenido.
- Si un profesor cambia temas o preguntas de un modulo ya iniciado, hay que definir reglas de versionado en un sprint posterior.

---

## Fuera del MVP inicial

- Eliminacion fisica de tablas legacy de planificacion.
- Versionado completo de modulos.
- Modulos automaticos avanzados con IA.
- Heatmaps especificos por modulo.
- Recomendaciones inteligentes complejas en Modo Albacer.
- Ranking por niveles Albacer.

---

## Definition of Done del Sprint 134

- Documento de decisiones creado.
- Migraciones base definidas.
- Backlog por PR acordado.
- No se eliminan tablas legacy.
- Local actualizado desde GitHub antes de implementar.
- Cada PR posterior debe incluir build frontend y tests backend cuando toque backend.
