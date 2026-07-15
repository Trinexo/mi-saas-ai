# Sprint 93 – Refactor adminPreguntasImport.service

## Fecha
2026-04-08

## Objetivo
Reducir complejidad de `adminPreguntasImport.service.js` extrayendo parsing de CSV y persistencia transaccional a sub-servicios, sin cambiar la API pública (`importPreguntasCsv`).

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPreguntasImportCsv.service.js` | Nuevo | Parsing CSV, validación de cabeceras y mapeo de fila a item |
| `adminPreguntasImportPersist.service.js` | Nuevo | Validación de existencia de tema y persistencia transaccional |
| `adminPreguntasImport.service.js` | Refactor | Orquestador principal del flujo de importación |

## Cambios clave
- Se extrae `parseCsvPayload(payload)` para:
  - separar líneas
  - validar filas mínimas
  - validar columnas obligatorias
  - calcular índices de cabeceras
- Se extrae `buildItem(values, indexes)` para mapear una fila CSV al DTO de pregunta.
- Se extrae `insertPreguntaConOpciones(payload)` para encapsular `BEGIN/COMMIT/ROLLBACK`.
- `importPreguntasCsv` mantiene contrato de entrada/salida y estructura de errores por fila.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #242 mergeado
