INSERT INTO usuarios (nombre, email, password_hash, role)
VALUES
  -- Contraseña: albacer2024
  ('Admin', 'admin@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'admin'),
  ('Alumno Demo', 'alumno@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'alumno')
ON CONFLICT (email) DO NOTHING;

INSERT INTO oposiciones (nombre, descripcion)
VALUES ('Auxiliar Administrativo', 'Preparación por test para auxiliar administrativo')
ON CONFLICT DO NOTHING;

INSERT INTO materias (oposicion_id, nombre)
SELECT o.id, 'Constitución'
FROM oposiciones o
WHERE o.nombre = 'Auxiliar Administrativo'
ON CONFLICT DO NOTHING;

INSERT INTO temas (materia_id, nombre)
SELECT m.id, 'Tema 1 - Principios Constitucionales'
FROM materias m
WHERE m.nombre = 'Constitución'
ON CONFLICT DO NOTHING;

WITH tema_obj AS (
  SELECT t.id AS tema_id
  FROM temas t
  WHERE t.nombre = 'Tema 1 - Principios Constitucionales'
  LIMIT 1
)
INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad)
SELECT tema_id,
       q.enunciado,
       q.explicacion,
       q.referencia,
       q.nivel
FROM tema_obj,
     (VALUES
       ('¿En qué año se aprobó la Constitución Española vigente?', 'La Constitución vigente se aprobó en 1978.', 'Constitución Española de 1978', 2),
       ('¿Cuál es la forma política del Estado español?', 'La Constitución define a España como Monarquía parlamentaria.', 'Art. 1.3 CE', 2),
       ('¿Quién ostenta la soberanía nacional según la CE?', 'La soberanía nacional reside en el pueblo español.', 'Art. 1.2 CE', 1),
       ('¿Cuál de estos no es un valor superior del ordenamiento jurídico?', 'Los valores superiores son libertad, justicia, igualdad y pluralismo político.', 'Art. 1.1 CE', 3),
       ('¿Qué artículo reconoce la dignidad de la persona?', 'La dignidad de la persona se reconoce en el artículo 10.1.', 'Art. 10.1 CE', 2)
     ) AS q(enunciado, explicacion, referencia, nivel);

WITH preguntas_insertadas AS (
  SELECT p.id, p.enunciado
  FROM preguntas p
  JOIN temas t ON t.id = p.tema_id
  WHERE t.nombre = 'Tema 1 - Principios Constitucionales'
)
INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
SELECT p.id, o.texto, o.correcta
FROM preguntas_insertadas p
JOIN LATERAL (
  VALUES
    (CASE WHEN p.enunciado LIKE '¿En qué año se aprobó%' THEN '1978' WHEN p.enunciado LIKE '¿Cuál es la forma política%' THEN 'Monarquía parlamentaria' WHEN p.enunciado LIKE '¿Quién ostenta la soberanía%' THEN 'El pueblo español' WHEN p.enunciado LIKE '¿Cuál de estos no es un valor%' THEN 'Seguridad jurídica' ELSE 'Artículo 10.1' END, TRUE),
    (CASE WHEN p.enunciado LIKE '¿En qué año se aprobó%' THEN '1982' WHEN p.enunciado LIKE '¿Cuál es la forma política%' THEN 'República federal' WHEN p.enunciado LIKE '¿Quién ostenta la soberanía%' THEN 'El Rey' WHEN p.enunciado LIKE '¿Cuál de estos no es un valor%' THEN 'Libertad' ELSE 'Artículo 9.3' END, FALSE),
    (CASE WHEN p.enunciado LIKE '¿En qué año se aprobó%' THEN '1975' WHEN p.enunciado LIKE '¿Cuál es la forma política%' THEN 'Monarquía absoluta' WHEN p.enunciado LIKE '¿Quién ostenta la soberanía%' THEN 'Las Cortes Generales' WHEN p.enunciado LIKE '¿Cuál de estos no es un valor%' THEN 'Igualdad' ELSE 'Artículo 14' END, FALSE),
    (CASE WHEN p.enunciado LIKE '¿En qué año se aprobó%' THEN '1992' WHEN p.enunciado LIKE '¿Cuál es la forma política%' THEN 'Estado confederal' WHEN p.enunciado LIKE '¿Quién ostenta la soberanía%' THEN 'El Gobierno' WHEN p.enunciado LIKE '¿Cuál de estos no es un valor%' THEN 'Pluralismo político' ELSE 'Artículo 1.1' END, FALSE)
) AS o(texto, correcta) ON TRUE;