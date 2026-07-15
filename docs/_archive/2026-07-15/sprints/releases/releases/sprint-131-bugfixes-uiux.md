# Sprint 131 — Bugfixes UX y errores backend

**Fecha de apertura:** 13 de mayo de 2026  
**Tipo:** Backend + Frontend / Bugfixes  
**Estado:** Completado

---

## Objetivo

Resolver 4 problemas críticos identificados en producción:
1. Error 400 al asignar preguntas a bloques de simulacro (profesor)
2. Warning de Recharts en dashboard del profesor
3. Card de simulacros vacío en home del alumno
4. Error 500 al editar preguntas con opciones ya respondidas

---

## Problemas identificados y fixes

### 1. Error 400 "Payload inválido" en asignar preguntas a bloque (AdminSimulacroWizardPage)

**Problema:** Al guardar la selección de preguntas en un bloque de simulacro, el endpoint `POST /api/profesor/mis-simulacros/:id/bloques/:bloqueId/preguntas` devolvía 500 → "Payload inválido".

**Causa raíz:** La columna `preguntas.id` es `BIGINT` en PostgreSQL. Node-postgres serializa `BIGINT` como **string** en JavaScript. El array `anadir` contenía strings, pero el schema Zod exigía `z.array(z.number().int().positive())`.

**Fix:** [AdminSimulacroWizardPage.jsx](frontend/src/pages/admin/AdminSimulacroWizardPage.jsx#L151)

```javascript
// Antes:
if (anadir.length > 0) {
  if (isProfesor) {
    await profesorApi.asignarPreguntasMiSimulacro(token, simulacroId, bloque.id, anadir);
  }
  // ...
}

// Después:
if (anadir.length > 0) {
  // bigint IDs llegan como strings desde pg; convertir a number antes de enviar
  const anadirNums = anadir.map(Number);
  if (isProfesor) {
    await profesorApi.asignarPreguntasMiSimulacro(token, simulacroId, bloque.id, anadirNums);
  }
  // ...
}
```

**Verificado:** El endpoint ahora acepta arrays de numbers y asigna correctamente.

---

### 2. Warning de Recharts "width(-1) height(-1)" en ProfesorDashboardPage

**Problema:** Los gráficos de LineChart y AreaChart lanzaban warning en consola sobre contenedor con dimensiones negativas.

**Causa raíz:** `<ResponsiveContainer width="100%" height="100%">` intenta calcular las dimensiones del padre al primer render, pero el grid aún no ha asignado altura. En ese momento, el contenedor tiene width=0 o negativo.

**Fix:** [ProfesorDashboardPage.jsx](frontend/src/pages/profesor/ProfesorDashboardPage.jsx)

Línea 69 (LineChart — "Evolución del rendimiento"):
```javascript
// Antes:
<div style={{ height: 258, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height="100%">

// Después:
<div style={{ height: 258, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height={258}>
```

Línea 137 (AreaChart — "Alertas"):
```javascript
// Antes:
<div style={{ height: 112, marginTop: 14, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height="100%">

// Después:
<div style={{ height: 112, marginTop: 14, minWidth: 0 }}>
  <ResponsiveContainer width="100%" height={112}>
```

**Resultado:** No hay warning; Recharts calcula correctamente con altura fija en píxeles.

---

### 3. Card "Simulacros" vacío en HomePage

**Problema:** El card del KPI "Simulacros" mostraba `—` aunque el usuario había realizado simulacros.

**Causa raíz:** El endpoint `GET /api/stats/user` no incluía en su SELECT el conteo de simulacros. El campo `simulacros` llegaba como `undefined` al frontend, que muestra `—` por defecto.

**Fix:** [progressGeneralStats.repository.js](backend/src/repositories/progressGeneralStats.repository.js#L4)

```javascript
// Antes:
SELECT COUNT(rt.test_id)::int AS total_tests,
       COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
       // ...

// Después:
SELECT COUNT(rt.test_id)::int AS total_tests,
       COUNT(CASE WHEN t.tipo_test = 'simulacro' THEN 1 END)::int AS simulacros,
       COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
       // ...
```

Y en el mapeo del resultado:
```javascript
// Antes:
return {
  totalTests: Number(row.total_tests ?? 0),
  aciertos: Number(row.aciertos ?? 0),
  // ...
};

// Después:
return {
  totalTests: Number(row.total_tests ?? 0),
  simulacros: Number(row.simulacros ?? 0),
  aciertos: Number(row.aciertos ?? 0),
  // ...
};
```

**Verificado:** Usuario joxerau@gmail.com con 2 simulacros finalizados ahora ve `simulacros: 2` en el endpoint y el card muestra correctamente `2`.

---

### 4. Error 500 al editar preguntas con opciones ya respondidas

**Problema:** Al editar una pregunta desde el banco del profesor, el endpoint `PUT /api/admin/preguntas/:id` devolvía 500 si alguna de sus opciones ya había sido usada en respuestas de alumnos.

**Causa raíz:** La edición borraba todas las filas de `opciones_respuesta` y las recreaba. Si una opción estaba referenciada por `respuestas_usuario.respuesta_id`, PostgreSQL bloqueaba el `DELETE` por integridad referencial.

**Fix:** [adminPreguntasEntityWrite.repository.js](backend/src/repositories/adminPreguntasEntityWrite.repository.js)

```javascript
// Antes:
await adminRepository.updatePregunta(client, preguntaId, payload);
await adminRepository.deleteOpciones(client, preguntaId);
await adminRepository.createOpciones(client, preguntaId, payload.opciones);

// Después:
await adminRepository.updatePregunta(client, preguntaId, payload);
await adminRepository.updateOpciones(client, preguntaId, payload.opciones);
```

`updateOpciones` lee los IDs actuales de las opciones y actualiza texto/correcta por posición, preservando los IDs históricos. Además, `imagen_url` y `audio_url` se conservan si el formulario de profesor no los envía.

**Verificado:** Reproducción directa con pregunta `157` devuelve `OK {"id":157}` y la suite backend queda en verde.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/admin/AdminSimulacroWizardPage.jsx` | +4 líneas: conversión bigint → number |
| `frontend/src/pages/profesor/ProfesorDashboardPage.jsx` | 2 reemplazos: altura fija en ResponsiveContainer |
| `backend/src/repositories/progressGeneralStats.repository.js` | +2 líneas: conteo de simulacros en SELECT y mapeo |
| `backend/src/repositories/adminPreguntasEntityWrite.repository.js` | Añade `updateOpciones` y preserva media al editar |
| `backend/src/services/adminPreguntasCrudWriteMutationUpdateDelete.service.js` | Usa actualización in-place de opciones |
| `backend/tests/services/admin-preguntas-update-options.test.js` | Test de regresión para no borrar opciones existentes |
| `backend/tests/services/admin-preguntas-query.test.js` | Alinea dificultad textual `facil/media/dificil` |
| `backend/tests/services/test-dificultad-service.test.js` | Alinea expectativas de dificultad textual |
| `backend/package.json` | Incluye el nuevo test de opciones en `npm test` |

---

## Testing

✅ **Backend:** `npm.cmd test` → 206 tests pass / 0 fail.  
✅ **Backend:** `PUT /api/admin/preguntas/:id` ya no borra opciones referenciadas por respuestas históricas.  
✅ **Backend:** `GET /stats/user` devuelve `simulacros: N` donde N es el count de tests tipo 'simulacro' con estado 'finalizado'.  
✅ **Frontend:** Card simulacros muestra el valor correcto sin ser `—`.  
✅ **Frontend:** No hay warning de Recharts en browser console del dashboard profesor.  
✅ **Frontend:** Modal de asignación de preguntas guarda sin error 400.

---

## Nota técnica

El problema de BIGINT→string afecta a cualquier endpoint que reciba arrays de IDs de preguntas desde el frontend. Se recomienda:
- Convertir a number en el frontend antes de enviar, O
- Usar `z.coerce.number()` en schemas Zod para conversión automática.

Por consistencia, se eligió la conversión en frontend (más explícita).
