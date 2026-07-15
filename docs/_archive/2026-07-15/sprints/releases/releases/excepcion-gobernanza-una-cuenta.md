# Excepción controlada — repositorio con una sola cuenta con permisos

Fecha: 12 de marzo de 2026
Repositorio: Trinexo/mi-saas-ai
Motivo: solo existe una cuenta con permisos de mantenimiento/admin para aprobar y mergear.

## Decisión
No crear una segunda cuenta artificial para aprobar PR propios.

## Procedimiento aplicado
1. Mantener checks obligatorios activos.
2. Mantener PR obligatorio.
3. Reducir temporalmente `required_approving_review_count` de 1 a 0.
4. Hacer merge del PR con CI en verde.
5. Restaurar inmediatamente `required_approving_review_count` a 1.
6. Dejar trazabilidad en PR y documentación.

## Justificación
- Evita una aprobación ficticia.
- Mantiene evidencia auditable.
- Minimiza el tiempo de exposición de la excepción.
- Es válida mientras el equipo no disponga de un segundo revisor con permisos.

## Recomendación futura
Añadir al menos una segunda cuenta real con permisos `Write` o `Maintain` para revisión cruzada y eliminar esta excepción operativa.