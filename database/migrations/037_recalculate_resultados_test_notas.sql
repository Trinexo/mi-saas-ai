-- Recalcula las notas historicas de tests finalizados usando la penalizacion
-- por numero real de opciones de cada pregunta:
-- 3 opciones => -0.5, 4 opciones => -0.33, 5 opciones => -0.25.
--
-- No modifica fechas ni intentos; solo normaliza aciertos/errores/blancos/nota
-- a partir de tests_preguntas, respuestas_usuario y opciones_respuesta.

BEGIN;

WITH recalculo AS (
  SELECT
    rt.test_id,
    COUNT(tp.pregunta_id)::int AS total_preguntas,
    COUNT(*) FILTER (
      WHERE ru.respuesta_id IS NOT NULL AND ru.correcta = TRUE
    )::int AS aciertos,
    COUNT(*) FILTER (
      WHERE ru.respuesta_id IS NOT NULL AND ru.correcta = FALSE
    )::int AS errores,
    COUNT(*) FILTER (
      WHERE ru.respuesta_id IS NULL
    )::int AS blancos,
    COALESCE(SUM(
      CASE
        WHEN ru.respuesta_id IS NOT NULL AND ru.correcta = FALSE
          THEN 1::numeric / GREATEST(opciones.total_opciones - 1, 1)
        ELSE 0::numeric
      END
    ), 0::numeric) AS penalizacion_total
  FROM resultados_test rt
  JOIN tests_preguntas tp ON tp.test_id = rt.test_id
  LEFT JOIN respuestas_usuario ru
    ON ru.test_id = rt.test_id
   AND ru.pregunta_id = tp.pregunta_id
  JOIN LATERAL (
    SELECT COUNT(*)::numeric AS total_opciones
    FROM opciones_respuesta o
    WHERE o.pregunta_id = tp.pregunta_id
  ) opciones ON TRUE
  GROUP BY rt.test_id
)
UPDATE resultados_test rt
SET
  aciertos = recalculo.aciertos,
  errores = recalculo.errores,
  blancos = recalculo.blancos,
  nota = CASE
    WHEN recalculo.total_preguntas > 0 THEN
      ROUND(
        GREATEST(
          0::numeric,
          ((recalculo.aciertos::numeric - recalculo.penalizacion_total)
            / recalculo.total_preguntas::numeric) * 10
        ),
        2
      )
    ELSE 0
  END
FROM recalculo
WHERE rt.test_id = recalculo.test_id;

COMMIT;
