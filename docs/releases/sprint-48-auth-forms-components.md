# Sprint 48 — Descomposicion de LoginPage y RegisterPage

**PR:** #153  
**Rama:** `sprint-48/pr-153-auth-forms`  
**Fecha merge:** 2026

---

## Objetivo

Descomponer `LoginPage.jsx` (44 lineas) y `RegisterPage.jsx` (42 lineas) extrayendo la logica de formulario a componentes reutilizables y creando un wrapper visual compartido.

---

## Cambios

### Paginas refactorizadas

| Archivo | Antes | Despues | Reduccion |
|---|---|---|---|
| `frontend/src/pages/LoginPage.jsx` | 44 lineas | 5 lineas | -89% |
| `frontend/src/pages/RegisterPage.jsx` | 42 lineas | 5 lineas | -88% |

### Componentes creados

#### `frontend/src/components/auth/AuthCard.jsx`

- **Props:** `children`
- **Razon:** Ambas paginas compartian un `div` identico con `maxWidth: 400`, `margin: 4rem auto`, `padding: 2rem`, `borderRadius: 12` y `boxShadow`
- **Extrae:** la constante `CARD_STYLE` y el wrapper `div` para evitar duplicacion

#### `frontend/src/components/auth/LoginForm.jsx`

- **Props:** ninguna (auto-contenido)
- **Mueve desde LoginPage:** estado `form` y `error`, funcion `onSubmit` con llamada a `authApi.login`, `useNavigate`, `useAuth`
- **Renderiza:** `<AuthCard>` con h2, inputs email/password, mensaje de error condicional, boton Entrar, link a /register

#### `frontend/src/components/auth/RegisterForm.jsx`

- **Props:** ninguna (auto-contenido)
- **Mueve desde RegisterPage:** estado `form` y `error`, funcion `onSubmit` con llamada a `authApi.register`, `useNavigate`
- **Renderiza:** `<AuthCard>` con h2, inputs nombre/email/password, mensaje de error condicional, boton Crear cuenta, link a /login

---

## Estructura resultante

```
frontend/src/
  pages/
    LoginPage.jsx       # 5 lineas — import + return <LoginForm />
    RegisterPage.jsx    # 5 lineas — import + return <RegisterForm />
  components/
    auth/
      AuthCard.jsx      # wrapper visual compartido
      LoginForm.jsx     # logica + UI del login
      RegisterForm.jsx  # logica + UI del registro
```

---

## Notas tecnicas

- Los caracteres especiales espanol (`sesion`, `contrasena`, signos de interrogacion) se escribieron con entidades HTML para evitar problemas de codificacion en PowerShell (`&oacute;`, `&ntilde;`, `&iquest;`).
- Build verificado: 130 modulos (5 nuevos), 0 errores.
- `AuthCard` es el primer componente compartido entre dos flujos de autenticacion, preparando la base para futuros cambios visuales centralizados.
