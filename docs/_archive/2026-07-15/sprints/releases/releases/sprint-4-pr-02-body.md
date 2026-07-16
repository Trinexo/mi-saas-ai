## Resumen
PR 02 de Sprint 4 para estandarizar codificación UTF-8 y evitar caracteres españoles corruptos.

## Qué cambia
- Añade `.editorconfig` con `charset = utf-8` como estándar de repositorio.
- Añade `.gitattributes` para forzar UTF-8 en archivos de texto clave.
- Ajusta `start-dev.ps1` para forzar entrada/salida UTF-8 en consola Windows (`chcp 65001`).
- Documenta la recomendación en `docs/README.md`.

## Alcance
- Consistencia de codificación y visualización de caracteres en entorno Windows.
- Prevención de regressiones de tildes/ñ dañadas.

## Fuera de alcance
- Cambios funcionales de negocio.
- Cambios de UI o API.

## Tipo de cambio
- [ ] feat
- [ ] fix
- [x] docs
- [x] chore
- [ ] test

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Verificación manual recomendada
- Ejecutar `chcp 65001` en terminal Windows
- Arrancar `start-dev.ps1`
- Confirmar que mensajes con tildes se renderizan correctamente
