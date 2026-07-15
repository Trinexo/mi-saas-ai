# Decisiones Vigentes

Ultima consolidacion documental: 2026-07-15.

## DEC-001 Fuente De Verdad

El codigo, Git, tests y configuracion real prevalecen sobre documentos historicos.

Consecuencia: cualquier documento en `docs/_archive/2026-07-15/` se considera referencia historica hasta ser verificado.

## DEC-002 Documentacion Activa Minima

La documentacion viva queda reducida a:

- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/PROJECT_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`

## DEC-003 Archivo Historico

Los documentos antiguos no se eliminan. Se archivan en `docs/_archive/2026-07-15/` preservando procedencia por carpetas.

## DEC-004 Backend Monolitico Modular

Se mantiene Node.js/Express con separacion por capas. No hay decision vigente de migrar a microservicios.

## DEC-005 PostgreSQL Como Base Principal

PostgreSQL sigue siendo la base de datos principal. Scripts SQL y migraciones deben tratarse como cambios delicados.

## DEC-006 Produccion Railway/Vercel

El estado verificado durante la auditoria usa Railway para backend y PostgreSQL, y Vercel para frontend.

## DEC-007 Rama De Produccion

Railway y Vercel estaban conectados a `main` durante la auditoria. Cualquier afirmacion futura debe verificarse de nuevo.

## DEC-008 Seguridad De Datos

Dumps, reimports y logs de importacion no deben versionarse. Se protegen con `.gitignore` y backup externo.

## DEC-009 Tests

El backend usa `node --test` con suites enfocadas en servicios, schemas, repositorios y smoke tests. Los cambios funcionales deben acompanarse de tests proporcionales al riesgo.

## DEC-010 Consolidacion Sin Cambios Funcionales

La fase 3 es exclusivamente documental. No debe alterar codigo, dependencias, migraciones, scripts SQL ni configuracion de produccion.

## Contradicciones Resueltas Provisionalmente

- Documentos historicos prometian arquitecturas de gran escala, 80/120 tablas o bancos masivos de preguntas. La implementacion real es monolito modular con PostgreSQL y dominio ya amplio, pero no confirma esas cifras objetivo.
- Documentos de sprints daban cierres y estados parciales duplicados. Se conservan como cronologia, no como estado vigente.
- Instrucciones antiguas en `.github/agents`, `.github/instructions` y `.github/skills` podian competir con `AGENTS.md`. Quedan archivadas.
- README de subproyectos podia quedar incompleto o desalineado. Se archiva y el README raiz pasa a ser entrada unica.
