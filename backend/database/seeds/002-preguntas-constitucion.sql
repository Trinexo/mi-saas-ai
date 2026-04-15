-- =============================================================
-- SEED 002: Preguntas reales - Constitución Española
-- Oposición: Auxiliar Administrativo (id=1)
-- Materia:   Constitución (id=1)
-- 50 nuevas preguntas en 5 temas
-- =============================================================

BEGIN;

-- -----------------------------------------------------------
-- NUEVOS TEMAS dentro de la materia Constitución (id=1)
-- -----------------------------------------------------------
INSERT INTO temas (materia_id, nombre) VALUES
  (1, 'Tema 2 - Derechos y Deberes Fundamentales'),
  (1, 'Tema 3 - Las Cortes Generales'),
  (1, 'Tema 4 - El Gobierno y la Administración'),
  (1, 'Tema 5 - Organización Territorial y Tribunal Constitucional')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------
-- HELPER: añadimos preguntas vía DO para capturar el id
-- -----------------------------------------------------------
DO $$
DECLARE q bigint;
        t2 bigint; t3 bigint; t4 bigint; t5 bigint;
BEGIN

  -- IDs de los temas recién creados
  SELECT id INTO t2 FROM temas WHERE nombre = 'Tema 2 - Derechos y Deberes Fundamentales' LIMIT 1;
  SELECT id INTO t3 FROM temas WHERE nombre = 'Tema 3 - Las Cortes Generales' LIMIT 1;
  SELECT id INTO t4 FROM temas WHERE nombre = 'Tema 4 - El Gobierno y la Administración' LIMIT 1;
  SELECT id INTO t5 FROM temas WHERE nombre = 'Tema 5 - Organización Territorial y Tribunal Constitucional' LIMIT 1;

  -- =========================================================
  -- TEMA 1 (id=1) - Principios Constitucionales (+4 preguntas)
  -- =========================================================

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (1, '¿En cuántos títulos se divide la Constitución Española de 1978?',
    'La CE se estructura en un preámbulo, 10 títulos, 169 artículos, 4 disposiciones adicionales, 9 transitorias, 1 derogatoria y 1 final.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '10 títulos', true), (q, '8 títulos', false), (q, '12 títulos', false), (q, '9 títulos', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (1, '¿Quiénes son los titulares del poder constituyente según la CE?',
    'El art. 1.2 CE establece que la soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El pueblo español', true), (q, 'El Rey', false), (q, 'Las Cortes Generales', false), (q, 'El Gobierno', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (1, '¿Cuál es el procedimiento de reforma previsto en el art. 168 CE?',
    'El art. 168 regula la reforma agravada: aprobación por 2/3 de ambas Cámaras, disolución de las Cortes, ratificación por las nuevas Cámaras y referéndum obligatorio.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Aprobación por 2/3 de ambas Cámaras, disolución y referéndum', true),
    (q, 'Mayoría absoluta del Congreso y ratificación del Senado', false),
    (q, 'Referéndum directo convocado por el Rey', false),
    (q, 'Unanimidad de las Cortes Generales', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (1, '¿Qué artículo de la CE proclama España como un Estado social y democrático de Derecho?',
    'El art. 1.1 CE establece: "España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político".',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 1', true), (q, 'Art. 2', false), (q, 'Art. 9', false), (q, 'Art. 14', false);

  -- =========================================================
  -- TEMA 2 - Derechos y Deberes Fundamentales (12 preguntas)
  -- =========================================================

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué artículo de la CE consagra el principio de igualdad ante la ley?',
    'El art. 14 CE establece que los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 14', true), (q, 'Art. 1', false), (q, 'Art. 17', false), (q, 'Art. 24', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Cuál es el plazo máximo de detención preventiva sin pasar ante el juez?',
    'El art. 17.2 CE establece que la detención preventiva no podrá durar más del tiempo estrictamente necesario para los fines investigadores y, en todo caso, en el plazo máximo de 72 horas el detenido deberá ser puesto en libertad o a disposición de la autoridad judicial.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '72 horas', true), (q, '48 horas', false), (q, '24 horas', false), (q, '96 horas', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué recurso protege los derechos fundamentales ante el Tribunal Constitucional?',
    'El recurso de amparo, regulado en el art. 53.2 CE, es el mecanismo extraordinario para proteger los derechos y libertades del art. 14 y la Sección 1ª del Capítulo II ante el TC.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Recurso de amparo', true), (q, 'Recurso contencioso-administrativo', false),
    (q, 'Recurso de inconstitucionalidad', false), (q, 'Recurso de casación', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿A qué edad termina la enseñanza obligatoria en España según la CE?',
    'El art. 27.4 CE establece que la enseñanza básica es obligatoria y gratuita. La Ley Orgánica de Educación fija en 16 años el fin de la enseñanza obligatoria.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '16 años', true), (q, '14 años', false), (q, '18 años', false), (q, '12 años', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Cuáles son los derechos protegidos por el hábeas corpus?',
    'El hábeas corpus, regulado en el art. 17.4 CE, protege la libertad personal frente a detenciones o internamientos ilegales o contrarios a derecho, garantizando la puesta a disposición judicial del detenido.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'La libertad personal frente a detenciones ilegales', true),
    (q, 'El derecho a la vida e integridad física', false),
    (q, 'El derecho al honor y a la intimidad', false),
    (q, 'La libertad de expresión y de información', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Cuál de los siguientes NO es un derecho fundamental de la Sección 1ª del Capítulo II del Título I?',
    'El derecho a la vivienda está reconocido en el art. 47 CE, que forma parte del Capítulo III (principios rectores), no del Capítulo II, Sección 1ª donde se ubican los derechos fundamentales.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Derecho a una vivienda digna', true),
    (q, 'Derecho a la vida', false),
    (q, 'Derecho a la libertad religiosa', false),
    (q, 'Derecho a la educación', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué artículo de la CE reconoce el derecho a la libertad de expresión?',
    'El art. 20 CE reconoce y protege el derecho a expresar y difundir libremente los pensamientos, ideas y opiniones, aunque con el límite de los derechos al honor, a la intimidad y a la propia imagen.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 20', true), (q, 'Art. 16', false), (q, 'Art. 18', false), (q, 'Art. 22', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué artículo reconoce el derecho de huelga de los trabajadores?',
    'El art. 28.2 CE reconoce el derecho a la huelga de los trabajadores para la defensa de sus intereses, debiendo la ley garantizar el mantenimiento de los servicios esenciales de la comunidad.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 28', true), (q, 'Art. 35', false), (q, 'Art. 37', false), (q, 'Art. 22', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué denominación reciben los derechos del Capítulo III del Título I CE?',
    'El Capítulo III del Título I CE (arts. 39-52) contiene los "Principios rectores de la política social y económica". Tienen menor protección que los derechos fundamentales y solo pueden alegarse ante la jurisdicción ordinaria de acuerdo con las leyes que los desarrollen.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Principios rectores de la política social y económica', true),
    (q, 'Derechos fundamentales y libertades públicas', false),
    (q, 'Derechos y deberes de los ciudadanos', false),
    (q, 'Derechos económicos y sociales básicos', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Ante qué órgano pueden suspenderse los derechos fundamentales en estados de excepción y sitio?',
    'Art. 55 CE: en los estados de excepción y de sitio podrán suspenderse los derechos reconocidos en los arts. 17, 18, 19, 20.1, 20.5, 21, 28.2 y 37.2.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Pueden suspenderse por el Congreso al declarar el estado de excepción o sitio', true),
    (q, 'Nunca pueden suspenderse bajo ninguna circunstancia', false),
    (q, 'Solo el Tribunal Constitucional puede suspenderlos', false),
    (q, 'Solo el Rey puede suspenderlos mediante decreto', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Cuál es la edad mínima para ejercer el derecho de sufragio activo en España?',
    'El art. 68.5 CE establece que son electores y elegibles todos los españoles que estén en pleno uso de sus derechos políticos. La legislación electoral fija la mayoría de edad en 18 años.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '18 años', true), (q, '16 años', false), (q, '21 años', false), (q, '20 años', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t2, '¿Qué artículo de la CE reconoce el derecho a la tutela judicial efectiva?',
    'El art. 24 CE garantiza el derecho a obtener la tutela efectiva de los jueces y tribunales, incluyendo el derecho a no sufrir indefensión y las garantías del proceso.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 24', true), (q, 'Art. 17', false), (q, 'Art. 25', false), (q, 'Art. 14', false);

  -- =========================================================
  -- TEMA 3 - Las Cortes Generales (12 preguntas)
  -- =========================================================

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿De cuántas Cámaras se compone el Parlamento español?',
    'Las Cortes Generales representan al pueblo español y están formadas por el Congreso de los Diputados y el Senado (art. 66 CE). Es un sistema bicameral con predominio del Congreso.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Dos Cámaras: Congreso y Senado', true),
    (q, 'Una sola Cámara: el Congreso', false),
    (q, 'Tres Cámaras: Congreso, Senado y Consejo de Estado', false),
    (q, 'Dos Cámaras: Congreso y Consejo de Estado', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué número mínimo y máximo de diputados puede tener el Congreso según la CE?',
    'El art. 68 CE establece que el Congreso se compone de un mínimo de 300 y un máximo de 400 Diputados. Actualmente tiene 350 diputados.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Entre 300 y 400 diputados', true),
    (q, 'Entre 200 y 300 diputados', false),
    (q, 'Exactamente 350 diputados fijados por la CE', false),
    (q, 'Entre 250 y 350 diputados', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Cuál es la duración del mandato de diputados y senadores?',
    'Los arts. 68.4 y 69.6 CE establecen que el Congreso y el Senado son elegidos por cuatro años. El mandato termina cuando finaliza la legislatura o cuando se produce la disolución de las Cámaras.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '4 años', true), (q, '5 años', false), (q, '3 años', false), (q, '6 años', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué Cámara tiene prevalencia en el proceso legislativo ordinario?',
    'El Congreso de los Diputados tiene posición prevalente en el proceso legislativo: puede levantar el veto del Senado por mayoría absoluta o, tras dos meses, por mayoría simple (art. 90 CE).',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Congreso de los Diputados', true),
    (q, 'El Senado', false),
    (q, 'Ambas Cámaras por igual', false),
    (q, 'Depende del tipo de proyecto de ley', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Cuántas firmas se requieren para ejercer la iniciativa legislativa popular?',
    'El art. 87.3 CE reconoce la iniciativa popular mediante la presentación de proposiciones de ley con un mínimo de 500.000 firmas acreditadas.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '500.000 firmas', true), (q, '1.000.000 de firmas', false),
    (q, '250.000 firmas', false), (q, '100.000 firmas', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué tipo de leyes exigen mayoría absoluta del Congreso de los Diputados?',
    'El art. 81 CE establece que son leyes orgánicas las relativas al desarrollo de los derechos fundamentales y libertades públicas, los Estatutos de Autonomía, el régimen electoral general y las demás previstas en la CE. Su aprobación, modificación o derogación exige mayoría absoluta del Congreso en una votación final.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Las leyes orgánicas', true),
    (q, 'Las leyes ordinarias en segunda lectura', false),
    (q, 'Los decretos legislativos', false),
    (q, 'Todos los proyectos de ley del Gobierno', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué es la Diputación Permanente de las Cortes?',
    'La Diputación Permanente (art. 78 CE) es el órgano que vela por los poderes de las Cámaras cuando estas no están reunidas (entre periodos de sesiones, entre legislaturas o cuando las Cortes han sido disueltas).',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Órgano que garantiza la continuidad de los poderes de las Cámaras cuando no están reunidas', true),
    (q, 'La reunión extraordinaria de las Cámaras en verano', false),
    (q, 'Comisión permanente de legislación', false),
    (q, 'Órgano consultivo del Presidente del Gobierno', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Quién puede disolver las Cortes Generales?',
    'El art. 115 CE atribuye al Presidente del Gobierno la facultad de proponer la disolución del Congreso, del Senado o de ambas Cámaras, que es decretada por el Rey.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Rey, a propuesta del Presidente del Gobierno', true),
    (q, 'El Presidente del Congreso con acuerdo del Senado', false),
    (q, 'El Tribunal Constitucional', false),
    (q, 'La Mesa del Congreso de los Diputados', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué artículo de la CE regula los Presupuestos Generales del Estado?',
    'El art. 134 CE establece que el Gobierno elabora los Presupuestos Generales del Estado y las Cortes Generales los examinan, enmienden y aprueban. Deben presentarse antes del 1 de octubre de cada año.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 134', true), (q, 'Art. 131', false), (q, 'Art. 120', false), (q, 'Art. 149', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿En qué Cámara se tramitan preferentemente los Estatutos de Autonomía?',
    'El Senado es la Cámara de representación territorial (art. 69.1 CE). Los proyectos de Estatuto de Autonomía se tramitan en la Comisión Constitucional del Congreso y pasan luego al Senado.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Congreso de los Diputados (con debate en Senado como Cámara territorial)', true),
    (q, 'El Senado, por ser la Cámara territorial', false),
    (q, 'Ambas Cámaras simultáneamente', false),
    (q, 'Directamente el pleno de las Cortes Generales', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Qué mecanismo parlamentario puede ejercer el Congreso para controlar al Gobierno preguntando sobre asuntos puntuales?',
    'Las preguntas parlamentarias (formuladas oralmente o por escrito) son uno de los principales instrumentos de control al Gobierno por parte de las Cámaras, junto con las interpelaciones, que tienen mayor alcance político.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Las preguntas e interpelaciones parlamentarias', true),
    (q, 'La moción de censura', false),
    (q, 'El recurso de inconstitucionalidad', false),
    (q, 'La cuestión de confianza', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t3, '¿Cuántos periodos de sesiones ordinarios tienen las Cortes cada año?',
    'El art. 73 CE establece dos periodos de sesiones ordinarios: de septiembre a diciembre y de febrero a junio. Fuera de estos periodos, las Cámaras pueden reunirse en sesiones extraordinarias.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Dos periodos anuales de sesiones ordinarias', true),
    (q, 'Un solo periodo que abarca todo el año', false),
    (q, 'Tres periodos: enero-marzo, mayo-julio y octubre-diciembre', false),
    (q, 'Las Cortes están en sesión permanente todo el año', false);

  -- =========================================================
  -- TEMA 4 - El Gobierno y la Administración (12 preguntas)
  -- =========================================================

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Quién propone al candidato a Presidente del Gobierno tras las elecciones generales?',
    'El art. 99 CE establece que el Rey, previa consulta con los representantes de los grupos políticos con representación parlamentaria, propone a través del Presidente del Congreso al candidato a la Presidencia del Gobierno.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Rey, previa consulta con los grupos parlamentarios', true),
    (q, 'El partido con mayor número de escaños directamente', false),
    (q, 'El Presidente del Congreso de los Diputados', false),
    (q, 'Las Cortes Generales en sesión conjunta', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Qué mayoría se requiere en primera votación de investidura del Presidente del Gobierno?',
    'El art. 99.3 CE establece que si el candidato obtiene la confianza de la mayoría absoluta del Congreso será investido. Si no la obtiene, se realiza una nueva votación 48 horas después, en la que basta la mayoría simple.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Mayoría absoluta en la primera votación', true),
    (q, 'Mayoría simple en la primera votación', false),
    (q, 'Dos tercios del Congreso', false),
    (q, 'Mayoría absoluta de las Cortes Generales reunidas en sesión conjunta', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Qué tipo de moción de censura establece la Constitución española?',
    'La CE recoge la moción de censura constructiva (art. 113): para prosperar debe incluir un candidato alternativo a la Presidencia del Gobierno, lo que asegura la continuidad gubernamental.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Moción de censura constructiva', true),
    (q, 'Moción de censura simple o destructiva', false),
    (q, 'Moción de censura por mayoría cualificada', false),
    (q, 'Moción de censura con referéndum posterior', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Quién puede plantear la cuestión de confianza al Congreso?',
    'El art. 112 CE establece que el Presidente del Gobierno, previa deliberación del Consejo de Ministros, puede plantear ante el Congreso de los Diputados la cuestión de confianza sobre su programa o política general.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Presidente del Gobierno', true),
    (q, 'Cualquier Ministro del Gobierno', false),
    (q, 'El Congreso a iniciativa propia', false),
    (q, 'El Rey previa propuesta del Gobierno', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Qué disposición normativa puede dictar el Gobierno en casos de extraordinaria y urgente necesidad?',
    'El art. 86 CE permite al Gobierno dictar Decretos-leyes en casos de extraordinaria y urgente necesidad. Deben ser convalidados o derogados por el Congreso en el plazo de 30 días desde su promulgación.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Decreto-Ley', true),
    (q, 'Ley orgánica de urgencia', false),
    (q, 'Decreto legislativo', false),
    (q, 'Real Decreto con rango de ley', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Cuáles son los principios de actuación de la Administración Pública según el art. 103 CE?',
    'El art. 103.1 CE establece que la Administración Pública sirve con objetividad los intereses generales y actúa de acuerdo con los principios de eficacia, jerarquía, descentralización, desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Eficacia, jerarquía, descentralización, desconcentración y coordinación', true),
    (q, 'Legalidad, publicidad y seguridad jurídica', false),
    (q, 'Imparcialidad, neutralidad y eficiencia presupuestaria', false),
    (q, 'Transparencia, participación ciudadana y buen gobierno', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Ante qué órgano responde políticamente el Gobierno?',
    'El art. 108 CE establece que el Gobierno responde solidariamente en su gestión política ante el Congreso de los Diputados, que es la Cámara que otorga la confianza al Presidente del Gobierno.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Congreso de los Diputados', true),
    (q, 'El Senado', false),
    (q, 'Las Cortes Generales en sesión conjunta', false),
    (q, 'El Tribunal Constitucional', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Qué organismo consultivo supremo del Estado asesora al Gobierno en materia jurídica?',
    'El Consejo de Estado (art. 107 CE) es el supremo órgano consultivo del Gobierno. Una ley orgánica regulará su composición y competencia.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Consejo de Estado', true),
    (q, 'El Tribunal Supremo', false),
    (q, 'El Consejo General del Poder Judicial', false),
    (q, 'El Defensor del Pueblo', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Cómo se denomina el acto por el que el Rey refrenda los actos del Gobierno?',
    'El refrendo es el mecanismo por el que los actos del Rey requieren la firma del Presidente del Gobierno o del Ministro competente, que asumen la responsabilidad política de dichos actos (art. 64 CE).',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Refrendo', true),
    (q, 'Ratificación', false),
    (q, 'Promulgación', false),
    (q, 'Sanción', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Cómo se denomina la norma con rango de ley que elabora el Gobierno a partir de una delegación expresa de las Cortes?',
    'El Decreto Legislativo (art. 85 CE) es la norma con rango de ley que el Gobierno elabora en virtud de una delegación expresa de las Cortes para refundir textos legales o para elaborar un texto articulado a partir de unas bases aprobadas por las Cortes.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Decreto Legislativo', true),
    (q, 'Decreto-Ley', false),
    (q, 'Reglamento delegado', false),
    (q, 'Ley de delegación', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Cuánto tiempo tiene el Congreso para convalidar o derogar un Decreto-Ley?',
    'El art. 86.2 CE establece que los Decretos-leyes deberán ser sometidos de inmediato al Congreso para que se pronuncie expresamente sobre su convalidación o derogación en el plazo de los treinta días siguientes a su promulgación.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '30 días desde su promulgación', true),
    (q, '15 días desde su promulgación', false),
    (q, '60 días desde su promulgación', false),
    (q, 'En la siguiente sesión ordinaria del Congreso', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t4, '¿Qué sucede si transcurren dos meses desde la primera votación de investidura sin que ningún candidato haya obtenido la confianza del Congreso?',
    'El art. 99.5 CE establece que si transcurridos dos meses desde la primera votación de investidura ningún candidato hubiere obtenido la confianza, el Rey disolverá las Cortes y convocará nuevas elecciones con el refrendo del Presidente del Congreso.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Rey disuelve las Cortes y convoca nuevas elecciones', true),
    (q, 'El Rey nombra directamente a un Presidente de Gobierno provisional', false),
    (q, 'El Gobierno en funciones continúa indefinidamente', false),
    (q, 'Se repite el proceso de consultas durante otros dos meses', false);

  -- =========================================================
  -- TEMA 5 - Organización Territorial y Tribunal Constitucional (10 pr.)
  -- =========================================================

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Cuántas Comunidades Autónomas tiene España?',
    'España está organizada territorialmente en 17 Comunidades Autónomas más las Ciudades Autónomas de Ceuta y Melilla. El Título VIII CE (arts. 137-158) regula la organización territorial.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '17 Comunidades Autónomas', true), (q, '16 Comunidades Autónomas', false),
    (q, '19 Comunidades Autónomas', false), (q, '15 Comunidades Autónomas', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Qué documento regula la autonomía de cada Comunidad Autónoma?',
    'El Estatuto de Autonomía es la norma institucional básica de cada Comunidad Autónoma (art. 147.1 CE). Se aprueba mediante ley orgánica por las Cortes Generales.',
    1) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Estatuto de Autonomía', true),
    (q, 'La Constitución directamente', false),
    (q, 'Un decreto del Estado', false),
    (q, 'Una ley autonómica ordinaria', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Cuántos magistrados componen el Tribunal Constitucional?',
    'El art. 159 CE establece que el Tribunal Constitucional se compone de 12 miembros nombrados por el Rey. 4 a propuesta del Congreso, 4 a propuesta del Senado, 2 a propuesta del Gobierno y 2 a propuesta del Consejo General del Poder Judicial.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '12 magistrados', true), (q, '9 magistrados', false),
    (q, '15 magistrados', false), (q, '7 magistrados', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Cuál es el mandato de los magistrados del Tribunal Constitucional?',
    'El art. 159.3 CE establece que los miembros del Tribunal Constitucional son designados por un período de nueve años y se renuevan por terceras partes cada tres años.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '9 años', true), (q, '6 años', false), (q, '12 años', false), (q, '4 años', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Quiénes están legitimados para interponer un recurso de inconstitucionalidad?',
    'El art. 162.1 CE legitima para interponer el recurso de inconstitucionalidad al Presidente del Gobierno, al Defensor del Pueblo, a 50 Diputados, a 50 Senadores y a los órganos ejecutivos y asambleas de las Comunidades Autónomas.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'El Presidente del Gobierno, el Defensor del Pueblo, 50 diputados o 50 senadores, o los órganos autonómicos', true),
    (q, 'Cualquier ciudadano español mayor de edad', false),
    (q, 'Solo el Gobierno o las Comunidades Autónomas', false),
    (q, 'El Tribunal Supremo y los Tribunales Superiores de Justicia', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿En qué plazo debe interponerse el recurso de inconstitucionalidad?',
    'El art. 33 LOTC establece que el recurso de inconstitucionalidad se interpondrá dentro de los tres meses siguientes a la publicación de la ley, disposición o acto con fuerza de ley impugnado.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, '3 meses desde la publicación de la norma', true),
    (q, '6 meses desde la publicación de la norma', false),
    (q, '1 mes desde la publicación de la norma', false),
    (q, '1 año desde la aplicación de la norma', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Qué Título de la CE regula la organización territorial del Estado?',
    'El Título VIII de la Constitución Española, denominado "De la Organización Territorial del Estado", comprende los arts. 137 a 158 y regula los principios de organización, las Comunidades Autónomas y la Hacienda Local.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Título VIII', true), (q, 'Título VII', false), (q, 'Título IX', false), (q, 'Título VI', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Cómo se denomina el principio que indica que las normas estatales prevalecen sobre las autonómicas en caso de conflicto?',
    'El art. 149.3 CE recoge el principio de prevalencia del derecho estatal: "El derecho estatal será, en todo caso, supletorio del derecho de las Comunidades Autónomas". En caso de conflicto prevalecen las normas del Estado.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Principio de prevalencia del derecho estatal', true),
    (q, 'Principio de subsidiariedad', false),
    (q, 'Principio de coordinación', false),
    (q, 'Principio de solidaridad', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Qué instrumento permite al Estado impugnar disposiciones y resoluciones autonómicas ante el TC?',
    'El art. 161.2 CE permite al Gobierno impugnar ante el TC las disposiciones y resoluciones adoptadas por las CCAA. La impugnación produce la suspensión automática por un plazo de 5 meses mientras el TC resuelve.',
    3) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'La impugnación prevista en el art. 161.2 CE ante el Tribunal Constitucional', true),
    (q, 'El recurso contencioso-administrativo ante el Tribunal Supremo', false),
    (q, 'La cuestión de inconstitucionalidad promovida de oficio', false),
    (q, 'El conflicto positivo de competencias ante el Senado', false);

  INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad)
  VALUES (t5, '¿Qué artículo de la CE establece el principio de solidaridad entre los territorios?',
    'El art. 138 CE establece la solidaridad como principio básico de la organización territorial: el Estado vela por el equilibrio económico de todas las partes del territorio español, atendiendo a las circunstancias del hecho insular.',
    2) RETURNING id INTO q;
  INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES
    (q, 'Art. 138 CE', true), (q, 'Art. 143 CE', false), (q, 'Art. 156 CE', false), (q, 'Art. 2 CE', false);

END;
$$;

COMMIT;

-- Verificación final
SELECT t.nombre AS tema, COUNT(p.id) AS preguntas
FROM temas t
LEFT JOIN preguntas p ON p.tema_id = t.id
GROUP BY t.id, t.nombre
ORDER BY t.id;
