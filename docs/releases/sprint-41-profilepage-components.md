# Sprint 41 — Descomposición ProfilePage en componentes self-contained

## Objetivo

Reducir `ProfilePage.jsx` de 167 a 18 líneas extrayendo sus dos secciones independientes como componentes self-contained que gestionan su propio estado y llamadas a API.

## Contexto

`ProfilePage` contiene dos formularios completamente independientes entre sí:
1. **Datos personales**: carga perfil desde API, gestiona 5 campos, llama a `authApi.updateProfile`
2. **Cambiar contraseña**: gestiona 3 campos, valida en cliente, llama a `authApi.changePassword`

La independencia total entre secciones permite el patrón self-contained (mismo que Sprint 37), a diferencia de los Sprints 38-40 donde el estado compartido forzaba el patrón presentacional con props.

## Componentes creados

| Archivo | Líneas | Props | Patrón |
|---|---|---|---|
| `components/profile/ProfileFormSection.jsx` | 95 | `token`, `refreshUser` | Self-contained |
| `components/profile/PasswordFormSection.jsx` | 62 | `token` | Self-contained |

### ProfileFormSection
- Carga perfil (`authApi.getProfile`) y oposiciones (`catalogApi.getOposiciones`) en `useEffect`
- Gestiona: `nombre`, `email`, `oposicionPreferidaId`, `objetivoDiario`, `oposiciones`, `profileLoaded`
- Renderiza estado de carga interno ("Cargando perfil...")
- Llama `refreshUser` tras actualizar para sincronizar contexto global

### PasswordFormSection
- Gestiona: `passwordActual`, `passwordNuevo`, `passwordConfirm`
- Valida en cliente: coincidencia y longitud mínima 8 caracteres
- Sin llamada de carga inicial

## Decisiones de diseño

### ¿Por qué self-contained y no presentacional?
Las dos secciones no comparten estado. Extraer el estado a la página padre y pasarlo como props añadiría complejidad sin beneficio.

### refreshUser sigue siendo prop
`refreshUser` viene del contexto global de auth. Se pasa como prop a `ProfileFormSection` para sincronizar el estado global tras actualizar el perfil. Solo `ProfileFormSection` lo necesita; `PasswordFormSection` es completamente autónoma.

### inputStyle / labelStyle / hintStyle
Objetos de estilo definidos en el módulo para evitar duplicación entre los 4/5 campos de cada formulario. No se extraen a un archivo compartido (MVP: simplicidad).

## Métricas

| Fichero | Antes | Después | Reducción |
|---|---|---|---|
| `ProfilePage.jsx` | 167 líneas | 18 líneas | -149 líneas (-89%) |

## Verificación

- Build Vite: 109 módulos, 0 errores, 2.00s
- PR #141 mergeado en main

## Serie de descomposición de páginas

| Sprint | Página | Antes | Después | Patrón | Componentes |
|---|---|---|---|---|---|
| 37 | ProgressPage | 613 | 25 | Self-contained | 9 |
| 38 | HistorialPage | 295 | 191 | Presentacional | 3 |
| 39 | ReviewPage | 285 | 137 | Presentacional | 7 |
| 40 | TestPage | 187 | 111 | Presentacional | 4 |
| **41** | **ProfilePage** | **167** | **18** | **Self-contained** | **2** |

## Próximas páginas candidatas

| Página | Líneas actuales |
|---|---|
| `OposicionPage.jsx` | ~160 |
| `TemaPage.jsx` | ~154 |
