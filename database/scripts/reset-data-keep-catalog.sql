-- ─────────────────────────────────────────────────────────────────────────────
-- RESET DE DATOS DE USO — conserva catálogo, usuarios, roles y accesos
-- ─────────────────────────────────────────────────────────────────────────────
-- QUÉ BORRA:  historial de tests, respuestas, progreso, repetición espaciada,
--             reportes, auditoría y actividad global.
-- QUÉ CONSERVA: usuarios (con roles), oposiciones, temas, bloques, preguntas,
--               opciones_respuesta, accesos_oposicion, profesores_oposiciones,
--               etiquetas, simulacros, configuracion_sistema.
-- ─────────────────────────────────────────────────────────────────────────────
-- INSTRUCCIONES:
--   Railway: Panel de proyecto → PostgreSQL → "Query" → pega y ejecuta.
--   CLI:  psql $RAILWAY_DB_URL -f reset-data-keep-catalog.sql
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Actividad global (no tiene hijos)
DELETE FROM actividad_global;

-- 2. Auditoría de preguntas
DELETE FROM auditoria_preguntas;

-- 3. Repetición espaciada
DELETE FROM repeticion_espaciada;

-- 4. Progreso de usuario por bloque/tema
DELETE FROM progreso_usuario;

-- 5. Reportes de preguntas (los reportes son de uso, no de contenido)
DELETE FROM reportes_preguntas;

-- 6. Respuestas de usuario (depende de tests)
DELETE FROM respuestas_usuario;

-- 7. Preguntas del test (depende de tests)
DELETE FROM tests_preguntas;

-- 8. Resultados del test (depende de tests)
DELETE FROM resultados_test;

-- 9. Tests — el DELETE en cascada limpia tests_preguntas, respuestas_usuario y resultados_test
--    que ya borramos arriba; DELETE directo para evitar doble borrado innecesario.
DELETE FROM tests;

-- 10. Limpiar preferencia de oposición activa de cada usuario
--     (se recalcula la próxima vez que entren)
UPDATE usuarios SET oposicion_preferida_id = NULL;

COMMIT;

-- Verificación rápida
SELECT
  (SELECT COUNT(*) FROM usuarios)              AS usuarios,
  (SELECT COUNT(*) FROM oposiciones)           AS oposiciones,
  (SELECT COUNT(*) FROM temas)                 AS temas,
  (SELECT COUNT(*) FROM bloques)               AS bloques,
  (SELECT COUNT(*) FROM preguntas)             AS preguntas,
  (SELECT COUNT(*) FROM accesos_oposicion)     AS accesos,
  (SELECT COUNT(*) FROM profesores_oposiciones) AS asignaciones_profesor,
  (SELECT COUNT(*) FROM tests)                 AS tests_restantes,
  (SELECT COUNT(*) FROM progreso_usuario)      AS progreso_restante;
