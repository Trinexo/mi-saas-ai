# Instrucciones Para Asistentes

## Ambito

Este archivo aplica a todo el repositorio. Las instrucciones activas de mayor relevancia son:

1. Instrucciones del usuario en el chat.
2. `AGENTS.md`.
3. `.github/copilot-instructions.md`.
4. Documentacion activa en `docs/`.

La documentacion archivada en `docs/_archive/2026-07-15/` es historica. No prevalece sobre codigo, Git, configuracion real ni instrucciones activas.

## Reglas Criticas

- Responder en espanol salvo peticion contraria.
- No tratar ningun documento historico como fuente de verdad por defecto.
- No modificar codigo funcional, base de datos, migraciones, dependencias, configuracion de despliegue o scripts SQL salvo solicitud explicita.
- No ejecutar migraciones, reimports, dumps ni scripts destructivos sin autorizacion expresa.
- No exponer secretos, tokens, URLs con credenciales ni datos sensibles.
- No usar `git add .`, `git clean`, `git reset --hard` ni operaciones Git destructivas sin peticion clara.
- Antes de cambios amplios, revisar `git status`, rama y diffs para proteger trabajo ajeno.

## Forma De Trabajo

- Verificar primero la estructura real del repositorio.
- Contrastar afirmaciones documentales contra implementacion y Git.
- Mantener cambios pequenos y trazables.
- Conservar documentacion historica moviendola a archivo cuando proceda, no borrandola.
- En backend, respetar capas existentes: routes, controllers, services, repositories, schemas y middleware.
- En frontend, respetar React/Vite, rutas, componentes y estilos existentes.
- En base de datos, diferenciar migraciones, schema, seed, dumps y scripts de mantenimiento.

## Documentacion Activa

- `README.md`: orientacion general.
- `docs/PROJECT_STATUS.md`: estado del producto.
- `docs/ARCHITECTURE.md`: arquitectura real.
- `docs/DECISIONS.md`: decisiones vigentes.
- `docs/BACKLOG.md`: pendientes priorizados.

## Produccion

Produccion conocida durante la auditoria:

- Frontend: `https://mi-saas-ai.vercel.app`
- Backend API: `https://mi-saas-ai-production.up.railway.app/api`
- Railway: servicio `mi-saas-ai`, root directory `/backend`, rama `main`.

Verificar siempre antes de afirmar estado actual de produccion.
