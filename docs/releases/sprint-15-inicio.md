# Sprint 15 — Inicio

Fecha: 16 de marzo de 2026  
Estado: completado

## Objetivo del sprint
Cerrar el ciclo post-test con valor real para el opositor y reducir la fricción de inicio:

1. `ResultPage` enriquecida: el usuario ve tiempo, % acierto, XP ganado y un CTA accionable.
2. Oposición predeterminada en perfil: el usuario configura una vez y la Home la preselecciona.
3. Filtros en revisión de test: el usuario puede centrarse en sus errores directamente.

## Base documental (fuente)
- `docs/44-ux-maximizar-uso.md` → reducir fricción de inicio, feedback inmediato tras test.
- `docs/05-diseno-ux-plataforma.md` → flujo post-test, mensaje de refuerzo y continuidad.
- `docs/40-motor-aprendizaje-anki.md` → ciclo completo: test → resultado → refuerzo.

## Alcance comprometido

### PR 01 — ResultPage enriquecida (Frontend) [P0]

**Cambios relevantes**
- Barra visual de % de acierto (calculado sobre total de preguntas).
- Tiempo empleado formateado (ya disponible en `tiempoSegundos` del resultado).
- XP ganado en este test calculado en cliente: `+10 fijo + 2 × aciertos`.
- Mensaje motivacional contextual:
  - nota ≥ 8 → "¡Excelente resultado!"
  - nota ≥ 6 → "Buen trabajo, sigue así"
  - nota < 6 → "Sigue practicando, puedes mejorar"
- CTA secundario "Hacer test de refuerzo" visible si `errores > 0`.
- Sin cambios en backend ni API; solo frontend.

### PR 02 — Oposición predeterminada en perfil (Backend + Frontend) [P0]

**Backend**
- `getUserById` devuelve `oposicion_preferida_id`.
- `updateProfile` acepta el campo `oposicion_preferida_id` (entero positivo o null).
- Endpoint afectado: `GET /api/v1/auth/profile` y `PATCH /api/v1/auth/profile`.
- No se necesita migración de esquema si la columna ya existe; si no, se añade con `ALTER TABLE`.

**Frontend**
- `ProfilePage`: selector de oposición predeterminada (lista del catálogo).
- `HomePage`: si el perfil devuelve `oposicion_preferida_id`, preseleccionar la oposición y cargar materias automáticamente al montar.

### PR 03 — Filtros en ReviewPage (Frontend) [P1]

**Cambios relevantes**
- Barra de resumen en la cabecera de `ReviewPage`: correctas / incorrectas / blancos en badges.
- Selector de filtro: "Todas" | "Solo errores" | "Solo correctas" | "Solo en blanco".
- La lista de preguntas se filtra en cliente; sin cambios en API.
- Navegación rápida: botones "Anterior" / "Siguiente" con contador "X de Y".

## Fuera de alcance en este sprint
- Persistencia server-side del tiempo por pregunta.
- Ranking entre usuarios.
- Exportar resultados a PDF.
- Configuración avanzada de objetivo diario.

## Criterios de Done
- `ResultPage` muestra % acierto, tiempo, XP y CTA de refuerzo.
- Perfil permite guardar y recuperar oposición predeterminada.
- `HomePage` autoselecciona la oposición del perfil al cargar.
- `ReviewPage` muestra resumen y filtros de preguntas.
- Backend tests sin regresiones (`npm test`).
- `npm run build` de frontend sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Frontend | ResultPage enriquecida |
| 02 | Backend + Frontend | Oposición predeterminada en perfil |
| 03 | Frontend | Filtros en ReviewPage |

## Estado actual
- ✅ Sprint completado. PR 01, PR 02 y PR 03 entregados.

## PR 01 — estado actual
- ✅ Completado: `ResultPage` enriquecida con mensaje motivacional, barra de % acierto, tiempo empleado, XP estimado y CTA de refuerzo.

## PR 02 — estado actual
- ✅ Completado: perfil de usuario con `oposicionPreferidaId`, selector en `ProfilePage` y preselección automática en `HomePage`.

## PR 03 — estado actual
- ✅ Completado: `ReviewPage` con badges de resumen (correctas/errores/blancos) y filtros rápidos por estado de respuesta.

### Endpoint PR 02 (request/response)
- **Request**: `GET /api/v1/auth/profile` (autenticado)
- **Response 200**:

```json
{
  "success": true,
  "data": {
    "id": 7,
    "nombre": "Usuario Demo",
    "email": "demo@test.com",
    "role": "alumno",
    "oposicionPreferidaId": 3
  }
}
```

- **Request**: `PUT /api/v1/auth/profile` (autenticado)
- **Body**:

```json
{
  "oposicionPreferidaId": 3
}
```

## Validaciones 16/03/2026
- `node --test tests/services/auth-perfil-oposicion.test.js`
- `npm test` (backend) → `tests 227`, `pass 227`, `fail 0`
- `npm run build` (frontend)
