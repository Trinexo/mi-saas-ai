-- Migracion 024: quitar etiquetas especificas de tests administrados.
-- El sistema general de etiquetas para preguntas se mantiene.

DROP TABLE IF EXISTS admin_tests_etiquetas;
