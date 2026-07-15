# Sprint 102 – Split adminPreguntasImportCsv.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPreguntasImportCsv.service.js` en dos sub-servicios por dominio (parsing CSV y mapeo de fila a entidad), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPreguntasImportCsvParser.service.js` | Nuevo | Parseo de payload CSV, cabeceras y filas |
| `adminPreguntasImportCsvMapper.service.js` | Nuevo | Mapeo de valores de fila a estructura de pregunta |
| `adminPreguntasImportCsv.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPreguntasImportCsvParser.service.js`
- `parseCsvPayload`
- `parseRow`

### `adminPreguntasImportCsvMapper.service.js`
- `buildItem`

## Barrel de compatibilidad

```js
import { adminPreguntasImportCsvParserService } from './adminPreguntasImportCsvParser.service.js';
import { adminPreguntasImportCsvMapperService } from './adminPreguntasImportCsvMapper.service.js';

export const adminPreguntasImportCsvService = {
  ...adminPreguntasImportCsvParserService,
  ...adminPreguntasImportCsvMapperService,
};

export { adminPreguntasImportCsvParserService, adminPreguntasImportCsvMapperService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
