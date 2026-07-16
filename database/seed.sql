INSERT INTO usuarios (nombre, email, password_hash, role)
VALUES
  -- ContraseÃ±a: albacer2024
  ('Admin', 'admin@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'admin'),
  ('Alumno Demo', 'alumno@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'alumno')
ON CONFLICT (email) DO NOTHING;

INSERT INTO oposiciones (nombre, descripcion)
VALUES ('Auxiliar Administrativo', 'PreparaciÃ³n por test para auxiliar administrativo')
ON CONFLICT DO NOTHING;

INSERT INTO temas (oposicion_id, nombre)
SELECT o.id, 'ConstituciÃ³n'
FROM oposiciones o
WHERE o.nombre = 'Auxiliar Administrativo'
ON CONFLICT DO NOTHING;

INSERT INTO bloques (tema_id, nombre)
SELECT t.id, 'Bloque 1 - Principios Constitucionales'
FROM temas t
WHERE t.nombre = 'ConstituciÃ³n'
ON CONFLICT DO NOTHING;

-- Pregunta de prueba para CI (garantiza que haya al menos 1 oposición con preguntas)
INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
SELECT t.id,
       'ÂżCuÃ¡ntos artÃ­culos tiene la ConstituciÃ³n EspaÃ±ola de 1978?',
       'La ConstituciÃ³n EspaÃ±ola de 1978 consta de 169 artÃ­culos.',
       1
FROM temas t
WHERE t.nombre = 'ConstituciÃ³n'
ON CONFLICT DO NOTHING;

INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
SELECT p.id, '169', TRUE
FROM preguntas p
WHERE p.enunciado = 'ÂżCuÃ¡ntos artÃ­culos tiene la ConstituciÃ³n EspaÃ±ola de 1978?'
  AND NOT EXISTS (SELECT 1 FROM opciones_respuesta WHERE pregunta_id = p.id AND texto = '169');

INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
SELECT p.id, '200', FALSE
FROM preguntas p
WHERE p.enunciado = 'ÂżCuÃ¡ntos artÃ­culos tiene la ConstituciÃ³n EspaÃ±ola de 1978?'
  AND NOT EXISTS (SELECT 1 FROM opciones_respuesta WHERE pregunta_id = p.id AND texto = '200');
