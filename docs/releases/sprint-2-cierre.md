# Release note — Cierre Sprint 2

Fecha: 12 de marzo de 2026
Estado: cerrado

## Resumen
Sprint 2 queda cerrado con alcance funcional cumplido, hardening aplicado y flujo de trabajo en GitHub estabilizado para continuar con Sprint 3 sin bloqueos operativos.

## Entregado
- TKT-025 implementado: alta, edición y eliminación de preguntas en panel admin.
- TKT-030 implementado: smoke E2E estabilizado y validado.
- CI activa y consistente con checks obligatorios: test-backend y build-frontend.
- Protección de rama main validada con flujo PR.
- Plantillas de PR simplificadas y separadas por tipo:
  - default
  - feature
  - hotfix
- Guía de contribución añadida para estandarizar el proceso de PR.

## Mejoras de proceso
- Regla explícita para usar plantilla específica en PR de feature y hotfix.
- Checklist mínimo de calidad unificado en plantillas y guía de contribución.
- Limpieza de artefactos locales y prevención de ruido en gitignore (frontend/.vite/).

## Riesgos abiertos
- Sin bloqueos críticos abiertos para cierre de Sprint 2.
- Riesgo residual bajo: disciplina de equipo en selección de plantilla PR (mitigado con documentación y avisos en plantilla).

## Criterio de paso a Sprint 3
- Merge del PR de cierre en main con checks en verde.
- Confirmación final de reglas de protección activas.
- Backlog de Sprint 3 priorizado y listo para ejecución.
