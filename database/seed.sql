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
