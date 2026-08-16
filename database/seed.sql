INSERT INTO usuarios (nombre, email, password_hash, role)
VALUES
  -- Contraseña: albacer2024
  ('Admin', 'admin@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'admin'),
  ('Alumno Demo', 'alumno@albacer.test', '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2', 'alumno')
ON CONFLICT (email) DO NOTHING;

INSERT INTO oposiciones (nombre, descripcion, slug)
VALUES ('Auxiliar Administrativo', 'Preparación por test para auxiliar administrativo', 'auxiliar-administrativo')
ON CONFLICT DO NOTHING;

INSERT INTO temas (oposicion_id, nombre)
SELECT o.id, 'Constitución'
FROM oposiciones o
WHERE o.nombre = 'Auxiliar Administrativo'
ON CONFLICT DO NOTHING;

INSERT INTO colecciones (tema_id, nombre)
SELECT t.id, 'Bloque 1 - Principios Constitucionales'
FROM temas t
WHERE t.nombre = 'Constitución'
ON CONFLICT DO NOTHING;

-- Pregunta de prueba para CI (garantiza que haya al menos 1 oposición con preguntas)
INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
SELECT t.id,
       '¿Cuántos artículos tiene la Constitución Española de 1978?',
       'La Constitución Española de 1978 consta de 169 artículos.',
       'facil'
FROM temas t
WHERE t.nombre = 'Constitución'
ON CONFLICT DO NOTHING;

INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
SELECT p.id, '169', TRUE
FROM preguntas p
WHERE p.enunciado = '¿Cuántos artículos tiene la Constitución Española de 1978?'
  AND NOT EXISTS (SELECT 1 FROM opciones_respuesta WHERE pregunta_id = p.id AND texto = '169');

INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
SELECT p.id, '200', FALSE
FROM preguntas p
WHERE p.enunciado = '¿Cuántos artículos tiene la Constitución Española de 1978?'
  AND NOT EXISTS (SELECT 1 FROM opciones_respuesta WHERE pregunta_id = p.id AND texto = '200');
