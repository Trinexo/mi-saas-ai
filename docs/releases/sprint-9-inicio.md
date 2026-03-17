# Sprint 9 — Inicio

Fecha: 14 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Añadir dos capacidades de alto valor para la retención del usuario: (1) marcar preguntas de interés desde la pantalla de revisión post-test para poder repasarlas después en un test dedicado, y (2) permitir al usuario consultar y editar su perfil (nombre, contraseña).

## Base técnica disponible
- `ReviewPage.jsx` — muestra cada pregunta con su estado post-test (Sprint 8 PR 02)
- `GET /tests/:testId/review` — devuelve preguntas con opciones y respuesta del usuario (Sprint 8 PR 01)
- `usuarios` — tabla con `nombre`, `email`, `password_hash` (Sprint 2-3)
- `requireAuth` middleware — `req.user.userId` disponible en rutas protegidas
- `authRepository` / `authService` — patrón establecido para operaciones de usuario
- `useAuth` / `state/auth.jsx` — contexto global de autenticación con `user.nombre`

## Alcance comprometido

### P0 — Marcado de preguntas (PR 01 + PR 02)

**PR 01 — Backend:**
- Nueva tabla `preguntas_marcadas(usuario_id, pregunta_id, fecha_marcado)` en `schema.sql`.
  - `UNIQUE(usuario_id, pregunta_id)` — un usuario no puede marcar la misma pregunta dos veces.
  - Índice `idx_marcadas_usuario` sobre `(usuario_id, fecha_marcado DESC)`.
- `marcadasRepository.js` con 3 métodos:
  - `marcar(userId, preguntaId)` — INSERT ON CONFLICT DO NOTHING
  - `desmarcar(userId, preguntaId)` — DELETE
  - `getMarcadas(userId)` — SELECT preguntas marcadas con enunciado y tema
- `marcadasService.js` — delega en repository; `marcar` y `desmarcar` devuelven `{ marcada: true/false }`.
- `marcadasSchema.js` — `marcadaParamsSchema` con `preguntaId` entero positivo.
- Rutas en nuevo fichero `marcadas.routes.js` montado bajo `/api/v1/marcadas`:
  - `POST /marcadas/:preguntaId` — marcar
  - `DELETE /marcadas/:preguntaId` — desmarcar
  - `GET /marcadas` — listar preguntas marcadas del usuario

**PR 02 — Frontend:**
- `marcadasApi.js` con `marcar`, `desmarcar` y `getMarcadas`.
- `ReviewPage.jsx`: botón ★/☆ por pregunta que llama a `marcar`/`desmarcar`; estado local `marcadas` (Set de IDs) iniciado vacío (no precarga para no bloquear la carga de la revisión).
- Nueva página `MarcadasPage.jsx` accesible desde `/marcadas`:
  - Lista las preguntas marcadas con enunciado y tema.
  - Botón "☆ Quitar marca" por cada pregunta.
  - Enlace a la página desde `MainLayout` o `ProgressPage`.
- Ruta `/marcadas` añadida a `App.jsx`.
- Link "Mis preguntas marcadas" en `ProgressPage.jsx` (debajo del historial de simulacros).

### P1 — Perfil de usuario (PR 03)
- `profileSchema.js` (o en `auth.schema.js`):
  - `updateProfileSchema` — `nombre: string.min(2)` + `email: string.email()` (ambos opcionales pero al menos uno).
  - `changePasswordSchema` — `passwordActual: string.min(1)` + `passwordNuevo: string.min(8)`.
- `authRepository` extendido:
  - `getUserById(userId)` — SELECT id, nombre, email, role
  - `updateProfile(userId, { nombre, email })` — UPDATE; lanza conflicto si el email ya está en uso por otro usuario.
  - `updatePassword(userId, newHash)` — UPDATE password_hash.
- `authService` extendido:
  - `getProfile(userId)` — llama a `getUserById`.
  - `updateProfile(userId, payload)` — verifica unicidad de email.
  - `changePassword(userId, { passwordActual, passwordNuevo })` — verifica contraseña actual con bcrypt antes de actualizar.
- Nuevas rutas en `auth.routes.js` (protegidas con `requireAuth`):
  - `GET /auth/profile`
  - `PUT /auth/profile`
  - `PUT /auth/password`
- `ProfilePage.jsx`:
  - Formulario con nombre y email actual; botón guardar.
  - Sección separada "Cambiar contraseña" con contraseña actual + nueva + confirmar.
  - Muestra mensajes de éxito/error con `useAsyncAction`.
- Link "Mi perfil" en `MainLayout.jsx`.
- Ruta `/perfil` en `App.jsx`.

## Fuera de alcance en este sprint
- Generar un test a partir de las preguntas marcadas (Sprint futuro — requiere modo `'marcadas'` en el test engine).
- Foto de perfil / avatar.
- Eliminar cuenta.
- Suscripciones / diferenciación de planes (Sprint de monetización).

## Criterios de Done
- Un usuario puede marcar/desmarcar preguntas desde la revisión y verlas en `/marcadas`.
- `GET /marcadas` devuelve las preguntas marcadas del usuario autenticado.
- Un usuario puede ver y actualizar su nombre/email en `/perfil`.
- Un usuario puede cambiar su contraseña (verificando la actual).
- Suite backend sin regresiones (≥112 pass, 0 fail).
- `vite build` sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | DB + Backend | Tabla `preguntas_marcadas` + repo/service/schema/rutas para marcar/desmarcar/listar |
| 02 | Frontend | `MarcadasPage` + botón ★ en `ReviewPage` + link en `ProgressPage` |
| 03 | Backend + Frontend | Perfil de usuario: ver/editar nombre+email + cambiar contraseña |

## Trazabilidad de PR ejecutados (Sprint 9)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 9 | Tabla `preguntas_marcadas` + `marcadasRepository`/`Service`/`Controller`/`Routes` + `marcadaParamsSchema` (10 tests, suite 122 pass) | Completado |
| 02 | Sprint 9 | `MarcadasPage.jsx` + botón ★/☆ en `ReviewPage` + ruta `/marcadas` en `App.jsx` + link en `ProgressPage` + `marcadasApi.js` (vite build ✓) | Completado |
| 03 | Sprint 9 | Perfil de usuario: `updateProfileSchema`/`changePasswordSchema`, `authRepository` (`getUserById`, `updateProfile`, `updatePassword`), `authService`/`authController` (`getProfile`, `updateProfile`, `changePassword`), rutas `GET /auth/profile`, `PUT /auth/profile`, `PUT /auth/password`, `ProfilePage.jsx` + link "Mi perfil" en `MainLayout` + ruta `/perfil` en `App.jsx` (15 tests, suite 137 pass / 0 fail, vite build ✓) | Completado |
