# Protocolo De Desarrollo Con VS Copilot Y Codex

## 4.1. Objetivo

Este documento establece un flujo único para que VS Copilot y Codex puedan trabajar alternativamente sobre el mismo repositorio sin perder cambios, duplicar trabajo ni afectar main o producción.

Ambas herramientas deben seguir `AGENTS.md`. Copilot debe seguir también `.github/copilot-instructions.md`. El código y Git prevalecen sobre documentación desactualizada. Los documentos archivados en `docs/_archive/2026-07-15/` no son fuente de verdad por defecto: deben verificarse contra el código real, Git y la configuración actual.

---

## 4.2. Principios Obligatorios

- Una tarea por rama.
- Una sola herramienta trabajando en una rama en cada momento.
- No trabajar simultáneamente con Copilot y Codex sobre la misma rama.
- Partir siempre de main limpia, sincronizada y sin divergencias.
- No hacer cambios directamente en main.
- Mantener cambios pequeños y trazables.
- Respetar la arquitectura existente (backend por capas, frontend React/Vite, base de datos PostgreSQL).
- No modificar producción, base de datos, migraciones, dependencias, despliegue o scripts SQL sin autorización explícita.
- No incluir secretos, tokens, URLs con credenciales ni datos sensibles en commits.
- No ejecutar operaciones Git destructivas (reset, clean, rebase forzado, force push).
- No usar `git add .`.
- No usar force push.
- No fusionar sin checks verdes.
- Usar Squash and merge.

---

## 4.3. Inicio De Una Tarea

Procedimiento obligatorio antes de comenzar:

1. Identificar el repositorio y rama local.
2. Comprobar rama actual: `git branch --show-current`.
3. Ejecutar `git status` para revisar el estado general.
4. Revisar cambios no confirmados: `git diff` y `git diff --cached`.
5. Ejecutar `git fetch origin --prune --tags` para sincronizar con remoto.
6. Comparar main local y origin/main: `git rev-parse main` y `git rev-parse origin/main`.
7. Si main está por detrás, actualizar solo mediante fast-forward: `git switch main && git pull --ff-only origin main`.
8. Crear una rama nueva desde origin/main: `git switch -c <nombre-rama> origin/main`.
9. Leer completamente las instrucciones y documentación activa.
10. Inspeccionar el código real en los ámbitos afectados antes de modificar.

Comandos seguros de referencia:

```bash
git rev-parse --show-toplevel
git branch --show-current
git status
git status --short
git diff
git diff --cached
git fetch origin --prune --tags
git rev-parse main
git rev-parse origin/main
git log --oneline --left-right origin/main...main
git log --oneline --decorate -5
git switch -c docs/nueva-tarea origin/main
```

---

## 4.4. Nombres De Ramas

Ejemplos de nombres válidos:

- `feat/<descripcion-tarea>` para nuevas funcionalidades.
- `fix/<descripcion-tarea>` para correcciones.
- `test/<descripcion-tarea>` para pruebas o validación.
- `docs/<descripcion-tarea>` para documentación.
- `audit/<descripcion-tarea>` para auditorías o validaciones técnicas.
- `chore/<descripcion-tarea>` para tareas de mantenimiento.

El nombre debe describir una única tarea de forma clara y concisa. No usar caracteres especiales ni espacios.

---

## 4.5. Trabajo Durante La Tarea

- Revisar `git diff` periódicamente para no acumular cambios no deseados.
- No mezclar cambios no relacionados en el mismo commit.
- No modificar archivos ajenos al alcance de la tarea sin justificación clara.
- No borrar trabajo previo que no sea propio.
- No asumir que una funcionalidad existe sin leer el código correspondiente.
- Añadir pruebas enfocadas cuando haya cambios funcionales (tests backend, build frontend, validaciones E2E).
- Mantener backend, frontend y base de datos dentro de sus capas y arquitectura actuales.
- Documentar decisiones relevantes que no puedan deducirse del código.

---

## 4.6. Traspaso Entre Copilot Y Codex

**Esta sección es esencial.**

### Herramienta Saliente (Finalizando)

Antes de cambiar a la otra herramienta, la herramienta saliente debe:

1. Finalizar una unidad coherente de trabajo.
2. Revisar `git status` para confirmar cambios.
3. Revisar `git diff` para validar contenido.
4. Ejecutar las validaciones correspondientes (tests, build, E2E si aplica).
5. Añadir archivos individualmente, nunca mediante `git add .`.
6. Revisar `git diff --cached` antes de confirmar.
7. Crear un commit descriptivo con mensaje claro.
8. Hacer push de la rama: `git push -u origin <rama>`.
9. Dejar el working tree limpio: `git status --short` debe estar vacío.
10. Informar:
    - Rama exacta.
    - Commit SHA.
    - Archivos modificados.
    - Validaciones ejecutadas.
    - Trabajo completado.
    - Trabajo pendiente.
    - Riesgos o decisiones abiertas.

### Herramienta Entrante (Recibiendo)

Antes de continuar, la herramienta entrante debe:

1. Ejecutar `git fetch origin --prune --tags` para sincronizar.
2. Recuperar o cambiar a la rama exacta indicada: `git switch <rama>` o `git switch -c <rama> origin/<rama>`.
3. Ejecutar `git status` para verificar estado local.
4. Verificar que la rama local coincide con origin: `git log --oneline --left-right origin/<rama>...HEAD` debe estar vacío.
5. Revisar `git log` para ver el historial de commits.
6. Revisar el commit anterior: `git show HEAD` o `git show HEAD~1`.
7. Revisar el diff contra origin/main: `git diff origin/main`.
8. Leer completamente los archivos modificados.
9. Confirmar que comprende el trabajo anterior antes de continuar.
10. No reescribir ni hacer amend del commit de la otra herramienta.
11. Añadir su trabajo en un commit independiente.
12. Mantener el alcance original de la tarea.

**Regla crítica:** No se entrega una rama entre herramientas con cambios sin commit o sin push.

---

## 4.7. Matriz Mínima De Validación

| Tipo de cambio | Validación mínima |
|---|---|
| Solo documentación | `git diff --check` y revisión del diff |
| Backend | Tests backend enfocados y suite aplicable |
| Frontend | Build `npm run build` y tests frontend aplicables |
| E2E | Listar spec, ejecución aislada y verificación CI |
| Workflow GitHub Actions | Revisión YAML y ejecución en PR |
| Base de datos | Validación contra esquema y entorno aislado |
| Despliegue | Autorización explícita y verificación posterior |

**Aclaración:** La validación real depende del alcance de la tarea. Nunca debe declararse que una prueba ha sido ejecutada si no se ha realizado efectivamente.

---

## 4.8. Commits

- Mensajes descriptivos, claros y en español.
- Un propósito coherente por commit.
- Añadir archivos individualmente con `git add <archivo>`.
- No hacer amend de commits ya compartidos en origin.
- No reescribir el historial de commits.
- Revisar `git diff --cached` antes de confirmar.

Ejemplos de mensajes válidos:

```
feat: agregar soporte para nuevo tipo de oposición
fix: corregir cálculo de progreso en dashboard
test: validar flujo completo del test del alumno
docs: documentar protocolo Copilot-Codex
chore: actualizar dependencias de desarrollo
```

---

## 4.9. Pull Request

- PR siempre contra `main`.
- Descripción con:
  - Resumen ejecutivo.
  - Alcance de cambios.
  - Pruebas realizadas.
  - Riesgos identificados.
- Revisar el diff real antes de crear la PR.
- Todos los checks obligatorios deben estar verdes.
- No fusionar con jobs pendientes.
- Resolver comentarios de revisión antes de fusionar.
- Utilizar **Squash and merge**.
- Sincronizar main local después de la fusión.

---

## 4.10. Producción Y Datos

- No usar producción para pruebas destructivas.
- No ejecutar migraciones, seeds, dumps, reimports o scripts destructivos sin autorización explícita.
- Utilizar PostgreSQL efímero o datos E2E aislados para pruebas.
- No exponer secretos, tokens ni variables sensibles en commits.
- No incluir URLs con credenciales reales.
- No usar Stripe live en pruebas; usar modo sandbox o mock local.
- Verificar producción únicamente cuando la tarea lo requiera y esté autorizada.
- Registrar cualquier verificación de producción en el informe de entrega.

---

## 4.11. Plantilla De Entrega

Usar esta plantilla al cambiar de herramienta:

```
## Entrega De Tarea

**Herramienta saliente:** [Copilot o Codex]
**Rama:** [nombre-rama]
**Base:** main
**Commit entregado:** [SHA]
**Archivos modificados:** [listar]
**Trabajo completado:** [describir]
**Validaciones ejecutadas:** [listar]
**Trabajo pendiente:** [describir si aplica]
**Riesgos:** [listar si existen]
**Working tree:** Limpio
**Push:** Realizado a origin
**PR:** [no aplica, será creada posteriormente]
**Merge:** [no aplica]
**Etiquetas:** Ninguna
**Producción utilizada:** [No / Verificada en ...] 
**Datos reales utilizados:** No
```

---

## 4.12. Condición De Cierre

Una tarea queda cerrada cuando:

- El alcance está completado y validado.
- Las pruebas correspondientes han pasado.
- La PR ha sido revisada sin comentarios pendientes.
- Todos los checks obligatorios están verdes.
- Se ha fusionado mediante squash a main.
- main local está sincronizada con origin.
- La documentación activa refleja cambios relevantes (si aplica).
