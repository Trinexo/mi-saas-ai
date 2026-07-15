# Sprint 130 — Ranking real del alumno

**Fecha de apertura:** 11 de mayo de 2026  
**Tipo:** Backend + Frontend / Analitica / Gamificacion  
**Estado:** Completado

---

## Objetivo

Reemplazar los datos hardcoded de la pagina de Ranking del alumno por datos reales calculados desde la base de datos, usando la formula de puntuacion definida en la arquitectura del producto.

---

## Formula de puntuacion

```
score = rendimiento * 0.60 + actividad * 0.25 + evolucion * 0.15
```

- **rendimiento**: porcentaje medio de aciertos en la oposicion (0–100).
- **actividad**: `min(100, tests_realizados * 5)`.
- **evolucion**: 80 si hubo actividad en los ultimos 14 dias; 20 en caso contrario.

---

## Implementado

### Backend

**`backend/src/repositories/ranking.repository.js`** — nuevo archivo con tres metodos:

- `getUserScore(userId, oposicionId)` — calcula el score individual del usuario para esa oposicion. Devuelve `{ rendimiento, actividad, evolucion, score, testsRealizados, ultimaActividad }`.
- `getTopByOposicion(oposicionId, userId, limit = 10)` — devuelve el top N anonimizado mas la fila propia del usuario aunque no aparezca en el top. El alias publico es `Opositor_XXXX` (ultimos 4 digitos del `user_id`). Cuando `isMe = true` el alias se envia como `null`.
- `countParticipantes(oposicionId)` — total de usuarios con al menos un test finalizado en la oposicion.

**`backend/src/services/ranking.service.js`** — nuevo archivo:

- Valida que se pase `oposicion_id`; lanza `ApiError(400)` si falta.
- Verifica que el usuario tenga acceso a la oposicion via `accesoOposicionRepository.tieneAcceso`; lanza `ApiError(403)` si no tiene acceso.
- Orquesta las tres llamadas al repositorio en paralelo con `Promise.all`.
- Calcula `percentilSuperado = ((totalParticipantes - miPosicion) / totalParticipantes) * 100`.
- Devuelve `{ miScore, miPosicion, totalParticipantes, percentilSuperado, top }`.

**`backend/src/controllers/statsProgresoTema.controller.js`** — modificado:

- Import anadido: `import { rankingService } from '../services/ranking.service.js'`.
- Export nuevo `getRanking` que llama a `rankingService.getRanking(req.user.userId, oposicionId)`.

**`backend/src/routes/v1/stats.routes.js`** — modificado:

- Import de `getRanking` anadido.
- Ruta `GET /ranking` registrada con `requireAuth`.

### Frontend

**`frontend/src/services/testApi.js`** — modificado:

- Metodo `getRanking(token, oposicionId)` anadido.

**`frontend/src/pages/RankingPage.jsx`** — reescrito completamente:

- Sustituye `TOP_DEMO` (datos hardcoded) por llamada real a `testApi.getRanking(token, oposicionActiva.id)`.
- `PercentilGauge` usa `ranking.percentilSuperado` real.
- KPIs muestran `miScore.testsRealizados`, `miScore.rendimiento`, `miScore.score` y `totalParticipantes`.
- Tabla de posiciones renderiza `ranking.top[]` con campos `posicion`, `alias`, `rendimiento`, `testsRealizados`, `score`.
- Cuando `isMe = true` el alias se muestra como `— Tu —` con color naranja.
- Columna "Racha" eliminada (no disponible por oposicion en la API actual).
- Estado vacio cuando no hay oposicion activa seleccionada.
- Estado vacio cuando no hay participantes en la oposicion.
- Nota de privacidad: el ranking muestra alias anonimos.

---

## Shape de respuesta del endpoint

```
GET /api/stats/ranking?oposicion_id=1
Authorization: Bearer <token>

{
  "miScore": {
    "rendimiento": 75,
    "actividad": 50,
    "evolucion": 80,
    "score": 67,
    "testsRealizados": 10,
    "ultimaActividad": "2026-05-10T..."
  },
  "miPosicion": 3,
  "totalParticipantes": 25,
  "percentilSuperado": 88,
  "top": [
    { "posicion": 1, "alias": "Opositor_0042", "rendimiento": 90, "testsRealizados": 18, "score": 82, "isMe": false },
    { "posicion": 2, "alias": "Opositor_0015", "rendimiento": 80, "testsRealizados": 14, "score": 72, "isMe": false },
    { "posicion": 3, "alias": null,             "rendimiento": 75, "testsRealizados": 10, "score": 67, "isMe": true  }
  ]
}
```

---

## Verificacion

- Sin errores de compilacion en todos los archivos modificados.
- Build frontend: correcto.
- Import backend: correcto.
- El alumno sin oposicion activa ve el mensaje "Selecciona una oposicion activa".
- El alumno sin accesos es redirigido al catalogo por `OposicionGuard` (comportamiento esperado).

---

## Archivos modificados o creados

| Archivo | Operacion |
|---|---|
| `backend/src/repositories/ranking.repository.js` | Creado |
| `backend/src/services/ranking.service.js` | Creado |
| `backend/src/controllers/statsProgresoTema.controller.js` | Modificado — import y export `getRanking` |
| `backend/src/routes/v1/stats.routes.js` | Modificado — ruta `GET /ranking` |
| `frontend/src/services/testApi.js` | Modificado — metodo `getRanking` |
| `frontend/src/pages/RankingPage.jsx` | Reescrito — datos reales |
