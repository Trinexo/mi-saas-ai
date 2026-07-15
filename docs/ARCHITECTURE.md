# Arquitectura

Ultima consolidacion documental: 2026-07-15.

## Vista General

La aplicacion es un SaaS monolitico modular para entrenamiento por test de oposiciones.

- Frontend React/Vite desplegado en Vercel.
- Backend Node.js/Express desplegado en Railway.
- PostgreSQL en Railway.
- API REST bajo `/api`.

## Backend

Ruta principal: `backend/src`.

Componentes observados:

- `app.js` y `server.js`: arranque Express.
- `config/`: conexion PostgreSQL y configuracion de planes.
- `routes/index.js`: agregador de rutas.
- `controllers/`: capa HTTP.
- `services/`: logica de aplicacion.
- `repositories/`: consultas SQL y acceso a datos.
- `middleware/`: autenticacion, planes, acceso, rate limit, validacion y errores.
- `schemas/`: validaciones con Zod.
- `tests/`: tests Node `node --test`.

Dominios implementados o parcialmente implementados:

- autenticacion y perfil;
- catalogo de oposiciones, materias, temas y bloques;
- generacion, realizacion, revision e historial de tests;
- simulacros;
- progreso, rendimiento, widgets y estadisticas;
- preguntas marcadas y repaso;
- administracion de preguntas, catalogo, usuarios, reportes, etiquetas, simulacros, tests y ajustes;
- profesor, workspace profesor, planificaciones y asignaciones;
- modo Albacer;
- ranking publico con consentimiento;
- billing, planes y suscripciones;
- notificaciones;
- multimedia de preguntas.

## Frontend

Ruta principal: `frontend/src`.

Componentes observados:

- `App.jsx` y `main.jsx`: entrada React.
- `pages/`: pantallas de alumno, admin y profesor.
- `components/`: UI reutilizable.
- `services/`: cliente API y servicios de dominio.
- `hooks/`: hooks de estado y consultas.
- `utils/`: utilidades.
- `styles.css`: estilos globales.

Pantallas relevantes observadas:

- login, registro, recuperacion y reseteo de password;
- home, catalogo, seleccion y mis oposiciones;
- configuracion, ejecucion, resultado y revision de tests;
- progreso, ranking, simulacros, marcadas, historial, perfil y notificaciones;
- admin dashboard, preguntas, revision, catalogo, oposiciones, precios, profesores, accesos, simulacros, tests y ajustes;
- profesor layout, dashboard/workspace, alumnos, oposiciones, planificaciones, simulacros y estadisticas.

## Base De Datos

Ruta principal: `database/`.

Elementos observados:

- `schema.sql`
- `seed.sql`
- `migrations/001...038`
- scripts de mantenimiento versionados;
- dumps y reimports ignorados tras la fase de proteccion.

Tablas y conceptos deducidos por migraciones y codigo:

- usuarios, oposiciones, materias/temas/bloques;
- preguntas, opciones, etiquetas, imagen/audio;
- tests, resultados y progreso;
- suscripciones, accesos y planes;
- simulacros;
- profesor, alumnos, planificaciones y asignaciones;
- notificaciones, reportes y actividad.

## Flujo Principal

1. El usuario accede desde React.
2. El frontend llama a la API con `VITE_API_URL`.
3. Express valida peticion y autenticacion.
4. Controlador delega en servicio.
5. Servicio usa repositorios SQL.
6. PostgreSQL devuelve datos.
7. API responde JSON al frontend.

## Configuracion De Produccion Verificada

- Railway backend: root directory `/backend`, rama `main`, dominio `mi-saas-ai-production.up.railway.app`.
- Vercel frontend: dominio `mi-saas-ai.vercel.app`, rama `main`.
- `VITE_API_URL` apunta a `https://mi-saas-ai-production.up.railway.app/api`.

## Riesgos Arquitectonicos

- Algunas consultas agregadas de profesor/progreso pueden ser costosas si faltan indices o filtros.
- La documentacion historica describia arquitecturas objetivo mucho mas grandes que la implementacion real.
- Hay scripts SQL sensibles que no deben ejecutarse sin backup y autorizacion.
- La cobertura automatizada existe principalmente en backend; la verificacion frontend depende mas de build y pruebas manuales.
