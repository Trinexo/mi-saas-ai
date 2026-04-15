/**
 * Seed: Preguntas reales de Constitución Española
 * Oposición: Auxiliar Administrativo (id=1) | Materia: Constitución (id=1)
 *
 * Usa la conexión pg del backend para garantizar UTF-8 correcto.
 * Ejecutar desde la carpeta backend/:
 *   node database/seeds/run-seed-constitucion.mjs
 */

import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// DATOS
// ─────────────────────────────────────────────────────────────────────────────
// Nivel dificultad: 1=fácil  2=media  3=difícil
// Cada pregunta: { enunciado, explicacion, nivel, tema (nombre clave), opciones:[{texto,correcta}] }

const TEMAS = [
  { clave: 't1', nombre: 'Tema 1 - Principios Constitucionales' },
  { clave: 't2', nombre: 'Tema 2 - Derechos y Deberes Fundamentales' },
  { clave: 't3', nombre: 'Tema 3 - Las Cortes Generales' },
  { clave: 't4', nombre: 'Tema 4 - El Gobierno y la Administración' },
  { clave: 't5', nombre: 'Tema 5 - Organización Territorial y Tribunal Constitucional' },
];

const PREGUNTAS = [

  // ── TEMA 1: Principios Constitucionales ──────────────────────────────────
  {
    tema: 't1', nivel: 2,
    enunciado: '¿En qué año se aprobó la Constitución Española vigente?',
    explicacion: 'La Constitución Española fue aprobada por las Cortes el 31 de octubre de 1978, ratificada en referéndum el 6 de diciembre de 1978 y sancionada por el Rey el 27 de diciembre de 1978.',
    opciones: [
      { texto: '1978', correcta: true },
      { texto: '1982', correcta: false },
      { texto: '1975', correcta: false },
      { texto: '1992', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 2,
    enunciado: '¿Cuál es la forma política del Estado español?',
    explicacion: 'El art. 1.3 CE establece que la forma política del Estado español es la Monarquía parlamentaria.',
    opciones: [
      { texto: 'Monarquía parlamentaria', correcta: true },
      { texto: 'República federal', correcta: false },
      { texto: 'Monarquía absoluta', correcta: false },
      { texto: 'Estado confederal', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 1,
    enunciado: '¿Quién ostenta la soberanía nacional según la CE?',
    explicacion: 'El art. 1.2 CE establece que la soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
    opciones: [
      { texto: 'El pueblo español', correcta: true },
      { texto: 'El Rey', correcta: false },
      { texto: 'Las Cortes Generales', correcta: false },
      { texto: 'El Gobierno', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 3,
    enunciado: '¿Cuál de estos NO es un valor superior del ordenamiento jurídico según el art. 1.1 CE?',
    explicacion: 'El art. 1.1 CE establece como valores superiores la libertad, la justicia, la igualdad y el pluralismo político. La seguridad jurídica es un principio (art. 9.3) pero no un valor superior del art. 1.1.',
    opciones: [
      { texto: 'Seguridad jurídica', correcta: true },
      { texto: 'Libertad', correcta: false },
      { texto: 'Igualdad', correcta: false },
      { texto: 'Pluralismo político', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 2,
    enunciado: '¿Qué artículo de la CE reconoce la dignidad de la persona?',
    explicacion: 'El art. 10.1 CE consagra la dignidad de la persona, los derechos inviolables que le son inherentes, el libre desarrollo de la personalidad, el respeto a la ley y a los derechos de los demás como fundamento del orden político y de la paz social.',
    opciones: [
      { texto: 'Artículo 10.1', correcta: true },
      { texto: 'Artículo 9.3', correcta: false },
      { texto: 'Artículo 14', correcta: false },
      { texto: 'Artículo 1.1', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 2,
    enunciado: '¿En cuántos títulos se divide la Constitución Española de 1978?',
    explicacion: 'La CE se estructura en un preámbulo, 10 títulos (del 0 al IX), 169 artículos, 4 disposiciones adicionales, 9 transitorias, 1 derogatoria y 1 final.',
    opciones: [
      { texto: '10 títulos', correcta: true },
      { texto: '8 títulos', correcta: false },
      { texto: '12 títulos', correcta: false },
      { texto: '9 títulos', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 1,
    enunciado: '¿Quiénes son los titulares del poder constituyente según la CE?',
    explicacion: 'El art. 1.2 CE establece que la soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.',
    opciones: [
      { texto: 'El pueblo español', correcta: true },
      { texto: 'El Rey', correcta: false },
      { texto: 'Las Cortes Generales', correcta: false },
      { texto: 'El Gobierno', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 3,
    enunciado: '¿Cuál es el procedimiento de reforma constitucional previsto en el art. 168 CE?',
    explicacion: 'El art. 168 CE regula la reforma agravada: aprobación por 2/3 de ambas Cámaras, disolución automática de las Cortes, ratificación por las nuevas Cámaras y referéndum obligatorio.',
    opciones: [
      { texto: 'Aprobación por 2/3 de ambas Cámaras, disolución y referéndum obligatorio', correcta: true },
      { texto: 'Mayoría absoluta del Congreso y ratificación del Senado', correcta: false },
      { texto: 'Referéndum directo convocado por el Rey', correcta: false },
      { texto: 'Unanimidad de las Cortes Generales', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 2,
    enunciado: '¿Qué artículo de la CE proclama España como un Estado social y democrático de Derecho?',
    explicacion: 'El art. 1.1 CE establece: "España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político".',
    opciones: [
      { texto: 'Art. 1', correcta: true },
      { texto: 'Art. 2', correcta: false },
      { texto: 'Art. 9', correcta: false },
      { texto: 'Art. 14', correcta: false },
    ],
  },
  {
    tema: 't1', nivel: 2,
    enunciado: '¿Qué principios recoge el art. 9.3 CE?',
    explicacion: 'El art. 9.3 CE garantiza el principio de legalidad, la jerarquía normativa, la publicidad de las normas, la irretroactividad de las disposiciones sancionadoras no favorables, la seguridad jurídica, la responsabilidad y la interdicción de la arbitrariedad de los poderes públicos.',
    opciones: [
      { texto: 'Legalidad, jerarquía normativa, publicidad y seguridad jurídica, entre otros', correcta: true },
      { texto: 'Únicamente legalidad y jerarquía normativa', correcta: false },
      { texto: 'Igualdad, justicia y pluralismo político', correcta: false },
      { texto: 'Dignidad, libre desarrollo y respeto a los derechos ajenos', correcta: false },
    ],
  },

  // ── TEMA 2: Derechos y Deberes Fundamentales ─────────────────────────────
  {
    tema: 't2', nivel: 1,
    enunciado: '¿Qué artículo de la CE consagra el principio de igualdad ante la ley?',
    explicacion: 'El art. 14 CE establece que los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición o circunstancia personal o social.',
    opciones: [
      { texto: 'Art. 14', correcta: true },
      { texto: 'Art. 1', correcta: false },
      { texto: 'Art. 17', correcta: false },
      { texto: 'Art. 24', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿Cuál es el plazo máximo de detención preventiva sin pasar ante el juez?',
    explicacion: 'El art. 17.2 CE establece que la detención preventiva no podrá durar más del tiempo estrictamente necesario para los fines investigadores y, en todo caso, en el plazo máximo de 72 horas el detenido deberá ser puesto en libertad o a disposición de la autoridad judicial.',
    opciones: [
      { texto: '72 horas', correcta: true },
      { texto: '48 horas', correcta: false },
      { texto: '24 horas', correcta: false },
      { texto: '96 horas', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿Qué recurso protege los derechos fundamentales ante el Tribunal Constitucional?',
    explicacion: 'El recurso de amparo, regulado en el art. 53.2 CE, es el mecanismo extraordinario para proteger los derechos y libertades del art. 14 y la Sección 1ª del Capítulo II ante el Tribunal Constitucional.',
    opciones: [
      { texto: 'Recurso de amparo', correcta: true },
      { texto: 'Recurso contencioso-administrativo', correcta: false },
      { texto: 'Recurso de inconstitucionalidad', correcta: false },
      { texto: 'Recurso de casación', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿A qué edad termina la enseñanza obligatoria en España según la normativa educativa derivada de la CE?',
    explicacion: 'El art. 27.4 CE establece que la enseñanza básica es obligatoria y gratuita. La Ley Orgánica de Educación fija en 16 años el fin de la enseñanza obligatoria.',
    opciones: [
      { texto: '16 años', correcta: true },
      { texto: '14 años', correcta: false },
      { texto: '18 años', correcta: false },
      { texto: '12 años', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿Cuáles son los derechos protegidos por el hábeas corpus?',
    explicacion: 'El hábeas corpus (art. 17.4 CE) protege la libertad personal frente a detenciones o internamientos ilegales o contrarios a derecho, garantizando la puesta a disposición judicial del detenido.',
    opciones: [
      { texto: 'La libertad personal frente a detenciones ilegales o indebidas', correcta: true },
      { texto: 'El derecho a la vida e integridad física', correcta: false },
      { texto: 'El derecho al honor y a la intimidad', correcta: false },
      { texto: 'La libertad de expresión y de información', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 3,
    enunciado: '¿Cuál de los siguientes NO es un derecho fundamental de la Sección 1ª del Capítulo II del Título I?',
    explicacion: 'El derecho a una vivienda digna (art. 47 CE) está en el Capítulo III (principios rectores de la política social y económica), no en la Sección 1ª del Capítulo II donde figuran los derechos fundamentales.',
    opciones: [
      { texto: 'Derecho a una vivienda digna (art. 47)', correcta: true },
      { texto: 'Derecho a la vida (art. 15)', correcta: false },
      { texto: 'Derecho a la libertad religiosa (art. 16)', correcta: false },
      { texto: 'Derecho a la educación (art. 27)', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿Qué artículo de la CE reconoce el derecho a la libertad de expresión?',
    explicacion: 'El art. 20 CE reconoce y protege el derecho a expresar y difundir libremente los pensamientos, ideas y opiniones, aunque con el límite de los derechos al honor, a la intimidad y a la propia imagen.',
    opciones: [
      { texto: 'Art. 20', correcta: true },
      { texto: 'Art. 16', correcta: false },
      { texto: 'Art. 18', correcta: false },
      { texto: 'Art. 22', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 3,
    enunciado: '¿Qué artículo de la CE reconoce el derecho de huelga de los trabajadores?',
    explicacion: 'El art. 28.2 CE reconoce el derecho a la huelga de los trabajadores para la defensa de sus intereses. La ley garantizará el mantenimiento de los servicios esenciales de la comunidad.',
    opciones: [
      { texto: 'Art. 28', correcta: true },
      { texto: 'Art. 35', correcta: false },
      { texto: 'Art. 37', correcta: false },
      { texto: 'Art. 22', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 3,
    enunciado: '¿Qué denominación reciben los derechos del Capítulo III del Título I CE?',
    explicacion: 'El Capítulo III del Título I CE (arts. 39-52) contiene los "Principios rectores de la política social y económica". Solo pueden alegarse ante la jurisdicción ordinaria según las leyes que los desarrollen.',
    opciones: [
      { texto: 'Principios rectores de la política social y económica', correcta: true },
      { texto: 'Derechos fundamentales y libertades públicas', correcta: false },
      { texto: 'Derechos y deberes de los ciudadanos', correcta: false },
      { texto: 'Derechos económicos básicos', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 3,
    enunciado: '¿Qué ocurre con algunos derechos fundamentales durante el estado de excepción?',
    explicacion: 'Art. 55 CE: en los estados de excepción y de sitio podrán suspenderse ciertos derechos como la libertad personal (art. 17), la inviolabilidad del domicilio (art. 18.2), la libertad de residencia (art. 19) y otros expresamente previstos.',
    opciones: [
      { texto: 'Algunos derechos pueden suspenderse según los arts. 55 y 116 CE', correcta: true },
      { texto: 'Nunca pueden suspenderse bajo ninguna circunstancia', correcta: false },
      { texto: 'Solo el Tribunal Constitucional puede suspenderlos', correcta: false },
      { texto: 'Solo el Rey puede suspenderlos mediante decreto', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 1,
    enunciado: '¿Cuál es la edad mínima para ejercer el derecho de sufragio activo en España?',
    explicacion: 'La Ley Orgánica del Régimen Electoral General (LOREG) fija la mayoría de edad electoral en 18 años, conforme al art. 12 CE que establece la mayoría de edad a esa edad.',
    opciones: [
      { texto: '18 años', correcta: true },
      { texto: '16 años', correcta: false },
      { texto: '21 años', correcta: false },
      { texto: '20 años', correcta: false },
    ],
  },
  {
    tema: 't2', nivel: 2,
    enunciado: '¿Qué artículo de la CE reconoce el derecho a la tutela judicial efectiva?',
    explicacion: 'El art. 24 CE garantiza el derecho a obtener la tutela efectiva de jueces y tribunales, sin que en ningún caso pueda producirse indefensión, incluyendo las garantías del proceso.',
    opciones: [
      { texto: 'Art. 24', correcta: true },
      { texto: 'Art. 17', correcta: false },
      { texto: 'Art. 25', correcta: false },
      { texto: 'Art. 14', correcta: false },
    ],
  },

  // ── TEMA 3: Las Cortes Generales ─────────────────────────────────────────
  {
    tema: 't3', nivel: 1,
    enunciado: '¿De cuántas Cámaras se compone el Parlamento español?',
    explicacion: 'Las Cortes Generales representan al pueblo español y están formadas por el Congreso de los Diputados y el Senado (art. 66 CE). Es un bicameralismo imperfecto con predominio del Congreso.',
    opciones: [
      { texto: 'Dos Cámaras: Congreso de los Diputados y Senado', correcta: true },
      { texto: 'Una sola Cámara: el Congreso', correcta: false },
      { texto: 'Tres Cámaras: Congreso, Senado y Consejo de Estado', correcta: false },
      { texto: 'Dos Cámaras: Congreso y Consejo de Estado', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Qué número mínimo y máximo de diputados puede tener el Congreso según la CE?',
    explicacion: 'El art. 68 CE establece que el Congreso se compone de un mínimo de 300 y un máximo de 400 Diputados. La LOREG fija actualmente 350 diputados.',
    opciones: [
      { texto: 'Entre 300 y 400 diputados', correcta: true },
      { texto: 'Entre 200 y 300 diputados', correcta: false },
      { texto: 'Exactamente 350, fijados por la CE', correcta: false },
      { texto: 'Entre 250 y 350 diputados', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 1,
    enunciado: '¿Cuál es la duración del mandato de diputados y senadores?',
    explicacion: 'Los arts. 68.4 y 69.6 CE establecen que el Congreso y el Senado son elegidos por cuatro años. El mandato termina al finalizar la legislatura o con la disolución de las Cámaras.',
    opciones: [
      { texto: '4 años', correcta: true },
      { texto: '5 años', correcta: false },
      { texto: '3 años', correcta: false },
      { texto: '6 años', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Qué Cámara tiene prevalencia en el proceso legislativo ordinario?',
    explicacion: 'El Congreso tiene posición prevalente: puede levantar el veto del Senado por mayoría absoluta de inmediato, o por mayoría simple transcurridos dos meses (art. 90 CE).',
    opciones: [
      { texto: 'El Congreso de los Diputados', correcta: true },
      { texto: 'El Senado', correcta: false },
      { texto: 'Ambas Cámaras tienen el mismo peso', correcta: false },
      { texto: 'Depende del tipo de proyecto de ley', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Cuántas firmas se requieren para ejercer la iniciativa legislativa popular?',
    explicacion: 'El art. 87.3 CE reconoce la iniciativa popular mediante proposiciones de ley con un mínimo de 500.000 firmas acreditadas.',
    opciones: [
      { texto: '500.000 firmas', correcta: true },
      { texto: '1.000.000 de firmas', correcta: false },
      { texto: '250.000 firmas', correcta: false },
      { texto: '100.000 firmas', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Qué tipo de leyes exigen mayoría absoluta del Congreso de los Diputados para su aprobación?',
    explicacion: 'El art. 81 CE establece que son leyes orgánicas las relativas a derechos fundamentales y libertades públicas, Estatutos de Autonomía, régimen electoral general y otras previstas en la CE. Su aprobación exige mayoría absoluta del Congreso en votación final sobre el conjunto.',
    opciones: [
      { texto: 'Las leyes orgánicas', correcta: true },
      { texto: 'Las leyes ordinarias en segunda lectura', correcta: false },
      { texto: 'Los decretos legislativos', correcta: false },
      { texto: 'Todos los proyectos de ley del Gobierno', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Qué es la Diputación Permanente de las Cortes?',
    explicacion: 'La Diputación Permanente (art. 78 CE) vela por los poderes de las Cámaras entre periodos de sesiones, entre legislaturas o cuando las Cortes hayan sido disueltas.',
    opciones: [
      { texto: 'Órgano que garantiza la continuidad de los poderes de las Cámaras cuando no están reunidas', correcta: true },
      { texto: 'La reunión extraordinaria de las Cámaras en verano', correcta: false },
      { texto: 'Comisión permanente de legislación', correcta: false },
      { texto: 'Órgano consultivo del Presidente del Gobierno', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Quién puede disolver las Cortes Generales?',
    explicacion: 'El art. 115 CE atribuye al Presidente del Gobierno la facultad de proponer la disolución del Congreso, del Senado o de ambas Cámaras, que es decretada por el Rey.',
    opciones: [
      { texto: 'El Rey, a propuesta del Presidente del Gobierno', correcta: true },
      { texto: 'El Presidente del Congreso con acuerdo del Senado', correcta: false },
      { texto: 'El Tribunal Constitucional', correcta: false },
      { texto: 'La Mesa del Congreso de los Diputados', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 3,
    enunciado: '¿Qué artículo de la CE regula los Presupuestos Generales del Estado?',
    explicacion: 'El art. 134 CE establece que el Gobierno elabora los PGE y las Cortes Generales los examinan, enmienden y aprueban. Deben presentarse antes del 1 de octubre de cada año.',
    opciones: [
      { texto: 'Art. 134', correcta: true },
      { texto: 'Art. 131', correcta: false },
      { texto: 'Art. 120', correcta: false },
      { texto: 'Art. 149', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 3,
    enunciado: '¿En qué Cámara se tramitan preferentemente los Estatutos de Autonomía?',
    explicacion: 'Los proyectos de Estatuto de Autonomía se tramitan en la Comisión Constitucional del Congreso y pasan luego al Senado como Cámara de representación territorial (art. 69 CE).',
    opciones: [
      { texto: 'Se inician en el Congreso y pasan al Senado como Cámara territorial', correcta: true },
      { texto: 'Se tramitan exclusivamente en el Senado por ser la Cámara territorial', correcta: false },
      { texto: 'Ambas Cámaras los tramitan simultáneamente', correcta: false },
      { texto: 'Se aprueban directamente en pleno de las Cortes Generales', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Qué instrumento de control parlamentario consiste en una pregunta de mayor alcance político dirigida al Gobierno?',
    explicacion: 'La interpelación es un instrumento de control que, a diferencia de la simple pregunta, puede concluir en una moción en la que la Cámara manifiesta su posición ante la política del Gobierno.',
    opciones: [
      { texto: 'La interpelación parlamentaria', correcta: true },
      { texto: 'La moción de censura', correcta: false },
      { texto: 'El recurso de inconstitucionalidad', correcta: false },
      { texto: 'La cuestión de confianza', correcta: false },
    ],
  },
  {
    tema: 't3', nivel: 2,
    enunciado: '¿Cuántos periodos ordinarios de sesiones tienen las Cortes cada año?',
    explicacion: 'El art. 73 CE establece dos periodos de sesiones ordinarios: de septiembre a diciembre y de febrero a junio. Fuera de estos periodos se puede convocar sesiones extraordinarias.',
    opciones: [
      { texto: 'Dos: septiembre-diciembre y febrero-junio', correcta: true },
      { texto: 'Un solo periodo que abarca todo el año', correcta: false },
      { texto: 'Tres periodos anuales', correcta: false },
      { texto: 'Las Cortes están en sesión permanente', correcta: false },
    ],
  },

  // ── TEMA 4: El Gobierno y la Administración ───────────────────────────────
  {
    tema: 't4', nivel: 1,
    enunciado: '¿Quién propone al candidato a Presidente del Gobierno tras las elecciones generales?',
    explicacion: 'El art. 99 CE establece que el Rey, previa consulta con los representantes de los grupos políticos con representación parlamentaria, propone al candidato a la Presidencia del Gobierno a través del Presidente del Congreso.',
    opciones: [
      { texto: 'El Rey, previa consulta con los grupos parlamentarios', correcta: true },
      { texto: 'El partido con mayor número de escaños, directamente', correcta: false },
      { texto: 'El Presidente del Congreso de los Diputados', correcta: false },
      { texto: 'Las Cortes Generales en sesión conjunta', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Qué mayoría se requiere en la primera votación de investidura del Presidente del Gobierno?',
    explicacion: 'El art. 99.3 CE exige mayoría absoluta del Congreso en la primera votación. Si no se obtiene, se celebra nueva votación 48 horas después, en la que basta la mayoría simple.',
    opciones: [
      { texto: 'Mayoría absoluta del Congreso', correcta: true },
      { texto: 'Mayoría simple del Congreso', correcta: false },
      { texto: 'Dos tercios del Congreso', correcta: false },
      { texto: 'Mayoría absoluta de las Cortes Generales en sesión conjunta', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Qué tipo de moción de censura establece la Constitución española?',
    explicacion: 'La CE recoge la moción de censura constructiva (art. 113): para prosperar debe incluir un candidato alternativo a la Presidencia del Gobierno, asegurando la continuidad gubernamental.',
    opciones: [
      { texto: 'Moción de censura constructiva', correcta: true },
      { texto: 'Moción de censura simple o destructiva', correcta: false },
      { texto: 'Moción de censura por mayoría cualificada', correcta: false },
      { texto: 'Moción de censura con referéndum posterior', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Quién puede plantear la cuestión de confianza al Congreso?',
    explicacion: 'El art. 112 CE establece que el Presidente del Gobierno, previa deliberación del Consejo de Ministros, puede plantear ante el Congreso la cuestión de confianza sobre su programa o sobre una declaración de política general.',
    opciones: [
      { texto: 'El Presidente del Gobierno', correcta: true },
      { texto: 'Cualquier Ministro del Gobierno', correcta: false },
      { texto: 'El Congreso a iniciativa propia', correcta: false },
      { texto: 'El Rey previa propuesta del Gobierno', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Qué disposición normativa puede dictar el Gobierno en casos de extraordinaria y urgente necesidad?',
    explicacion: 'El art. 86 CE permite al Gobierno dictar Decretos-leyes en casos de extraordinaria y urgente necesidad. Deben ser convalidados o derogados por el Congreso en el plazo de 30 días desde su promulgación.',
    opciones: [
      { texto: 'Decreto-Ley', correcta: true },
      { texto: 'Ley orgánica de urgencia', correcta: false },
      { texto: 'Decreto legislativo', correcta: false },
      { texto: 'Real Decreto con rango de ley', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 3,
    enunciado: '¿Cuáles son los principios de actuación de la Administración Pública según el art. 103 CE?',
    explicacion: 'El art. 103.1 CE establece que la Administración Pública actúa con objetividad según los principios de eficacia, jerarquía, descentralización, desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho.',
    opciones: [
      { texto: 'Eficacia, jerarquía, descentralización, desconcentración y coordinación', correcta: true },
      { texto: 'Legalidad, publicidad y seguridad jurídica', correcta: false },
      { texto: 'Imparcialidad, neutralidad y eficiencia presupuestaria', correcta: false },
      { texto: 'Transparencia, participación ciudadana y buen gobierno', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 1,
    enunciado: '¿Ante qué órgano responde políticamente el Gobierno?',
    explicacion: 'El art. 108 CE establece que el Gobierno responde solidariamente en su gestión política ante el Congreso de los Diputados, que es quien otorga la confianza al Presidente del Gobierno.',
    opciones: [
      { texto: 'El Congreso de los Diputados', correcta: true },
      { texto: 'El Senado', correcta: false },
      { texto: 'Las Cortes Generales en sesión conjunta', correcta: false },
      { texto: 'El Tribunal Constitucional', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 3,
    enunciado: '¿Qué organismo es el supremo órgano consultivo del Gobierno en materia jurídica?',
    explicacion: 'El Consejo de Estado (art. 107 CE) es el supremo órgano consultivo del Gobierno. Una ley orgánica regula su composición y competencia.',
    opciones: [
      { texto: 'El Consejo de Estado', correcta: true },
      { texto: 'El Tribunal Supremo', correcta: false },
      { texto: 'El Consejo General del Poder Judicial', correcta: false },
      { texto: 'El Defensor del Pueblo', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 3,
    enunciado: '¿Cómo se denomina el mecanismo por el que un ministro asume la responsabilidad política de los actos del Rey?',
    explicacion: 'El refrendo (art. 64 CE) es el mecanismo por el que los actos del Rey requieren la firma del Presidente del Gobierno o del Ministro competente, quienes asumen la responsabilidad política de dichos actos.',
    opciones: [
      { texto: 'Refrendo', correcta: true },
      { texto: 'Ratificación', correcta: false },
      { texto: 'Promulgación', correcta: false },
      { texto: 'Sanción', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Cómo se denomina la norma con rango de ley elaborada por el Gobierno a partir de una delegación expresa de las Cortes?',
    explicacion: 'El Decreto Legislativo (art. 85 CE) es elaborado por el Gobierno en virtud de delegación de las Cortes, ya sea para refundir textos o elaborar un texto articulado a partir de unas bases.',
    opciones: [
      { texto: 'Decreto Legislativo', correcta: true },
      { texto: 'Decreto-Ley', correcta: false },
      { texto: 'Reglamento delegado', correcta: false },
      { texto: 'Ley de delegación', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 2,
    enunciado: '¿Cuánto tiempo tiene el Congreso para convalidar o derogar un Decreto-Ley?',
    explicacion: 'El art. 86.2 CE establece que los Decretos-leyes deben ser sometidos al Congreso para su convalidación o derogación en el plazo de los treinta días siguientes a su promulgación.',
    opciones: [
      { texto: '30 días desde su promulgación', correcta: true },
      { texto: '15 días desde su promulgación', correcta: false },
      { texto: '60 días desde su promulgación', correcta: false },
      { texto: 'En la siguiente sesión ordinaria del Congreso', correcta: false },
    ],
  },
  {
    tema: 't4', nivel: 3,
    enunciado: '¿Qué sucede si transcurren dos meses desde la primera votación de investidura sin que ningún candidato consiga la confianza del Congreso?',
    explicacion: 'El art. 99.5 CE establece que transcurridos dos meses desde la primera votación de investidura sin que ningún candidato obtenga la confianza, el Rey disolverá las Cortes y convocará nuevas elecciones, con el refrendo del Presidente del Congreso.',
    opciones: [
      { texto: 'El Rey disuelve las Cortes y convoca nuevas elecciones', correcta: true },
      { texto: 'El Rey nombra directamente un Presidente de Gobierno provisional', correcta: false },
      { texto: 'El Gobierno en funciones continúa indefinidamente', correcta: false },
      { texto: 'Se repite el proceso durante otros dos meses', correcta: false },
    ],
  },

  // ── TEMA 5: Organización Territorial y TC ────────────────────────────────
  {
    tema: 't5', nivel: 1,
    enunciado: '¿Cuántas Comunidades Autónomas tiene España?',
    explicacion: 'España está organizada en 17 Comunidades Autónomas y 2 Ciudades Autónomas (Ceuta y Melilla). El Título VIII CE (arts. 137-158) regula la organización territorial del Estado.',
    opciones: [
      { texto: '17 Comunidades Autónomas', correcta: true },
      { texto: '16 Comunidades Autónomas', correcta: false },
      { texto: '19 Comunidades Autónomas', correcta: false },
      { texto: '15 Comunidades Autónomas', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 1,
    enunciado: '¿Qué norma regula la autonomía de cada Comunidad Autónoma?',
    explicacion: 'El Estatuto de Autonomía es la norma institucional básica de cada Comunidad Autónoma (art. 147.1 CE) y se aprueba mediante ley orgánica por las Cortes Generales.',
    opciones: [
      { texto: 'El Estatuto de Autonomía', correcta: true },
      { texto: 'La Constitución directamente', correcta: false },
      { texto: 'Un decreto del Gobierno central', correcta: false },
      { texto: 'Una ley autonómica ordinaria', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 2,
    enunciado: '¿Cuántos magistrados compone el Tribunal Constitucional?',
    explicacion: 'El art. 159 CE establece que el TC se compone de 12 miembros nombrados por el Rey: 4 a propuesta del Congreso, 4 del Senado, 2 del Gobierno y 2 del Consejo General del Poder Judicial.',
    opciones: [
      { texto: '12 magistrados', correcta: true },
      { texto: '9 magistrados', correcta: false },
      { texto: '15 magistrados', correcta: false },
      { texto: '7 magistrados', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 2,
    enunciado: '¿Cuál es el mandato de los magistrados del Tribunal Constitucional?',
    explicacion: 'El art. 159.3 CE establece que los magistrados del TC son designados por un período de 9 años y se renuevan por terceras partes cada 3 años.',
    opciones: [
      { texto: '9 años', correcta: true },
      { texto: '6 años', correcta: false },
      { texto: '12 años', correcta: false },
      { texto: '4 años', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 3,
    enunciado: '¿Quiénes están legitimados para interponer un recurso de inconstitucionalidad?',
    explicacion: 'El art. 162.1 CE legitima al Presidente del Gobierno, al Defensor del Pueblo, a 50 Diputados, a 50 Senadores y a los órganos ejecutivos y asambleas legislativas de las Comunidades Autónomas.',
    opciones: [
      { texto: 'Presidente del Gobierno, Defensor del Pueblo, 50 diputados o senadores, y órganos autonómicos', correcta: true },
      { texto: 'Cualquier ciudadano español mayor de edad', correcta: false },
      { texto: 'Solo el Gobierno o las Comunidades Autónomas', correcta: false },
      { texto: 'El Tribunal Supremo y los Tribunales Superiores de Justicia', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 3,
    enunciado: '¿En qué plazo debe interponerse el recurso de inconstitucionalidad?',
    explicacion: 'El art. 33 LOTC establece que el recurso de inconstitucionalidad se interpondrá en el plazo de tres meses desde la publicación de la ley o norma impugnada en el BOE.',
    opciones: [
      { texto: '3 meses desde la publicación de la norma', correcta: true },
      { texto: '6 meses desde la publicación de la norma', correcta: false },
      { texto: '1 mes desde la publicación de la norma', correcta: false },
      { texto: '1 año desde la aplicación de la norma', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 2,
    enunciado: '¿Qué Título de la CE regula la organización territorial del Estado?',
    explicacion: 'El Título VIII "De la Organización Territorial del Estado" (arts. 137-158) regula los principios de organización, las Comunidades Autónomas y la Hacienda de las Entidades Locales.',
    opciones: [
      { texto: 'Título VIII', correcta: true },
      { texto: 'Título VII', correcta: false },
      { texto: 'Título IX', correcta: false },
      { texto: 'Título VI', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 3,
    enunciado: '¿Cómo se denomina el principio por el que el derecho estatal prevalece sobre el autonómico en caso de conflicto?',
    explicacion: 'El art. 149.3 CE recoge el principio de prevalencia: "En caso de conflicto, el derecho del Estado prevalecerá sobre el de las Comunidades Autónomas en todo lo que no esté atribuido a la exclusiva competencia de éstas".',
    opciones: [
      { texto: 'Principio de prevalencia del derecho estatal', correcta: true },
      { texto: 'Principio de subsidiariedad', correcta: false },
      { texto: 'Principio de coordinación', correcta: false },
      { texto: 'Principio de solidaridad', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 3,
    enunciado: '¿Qué instrumento permite al Estado impugnar disposiciones y resoluciones autonómicas ante el TC con efecto suspensivo?',
    explicacion: 'El art. 161.2 CE permite al Gobierno impugnar ante el TC disposiciones y resoluciones adoptadas por las CCAA. La impugnación produce suspensión automática de 5 meses mientras el TC resuelve.',
    opciones: [
      { texto: 'La impugnación del art. 161.2 CE ante el Tribunal Constitucional', correcta: true },
      { texto: 'El recurso contencioso-administrativo ante el Tribunal Supremo', correcta: false },
      { texto: 'La cuestión de inconstitucionalidad promovida de oficio', correcta: false },
      { texto: 'El conflicto positivo de competencias ante el Senado', correcta: false },
    ],
  },
  {
    tema: 't5', nivel: 2,
    enunciado: '¿Qué artículo de la CE establece el principio de solidaridad entre los territorios?',
    explicacion: 'El art. 138 CE establece la solidaridad como principio básico de organización territorial: el Estado vela por el equilibrio económico, justo y solidario entre las diversas partes del territorio español.',
    opciones: [
      { texto: 'Art. 138 CE', correcta: true },
      { texto: 'Art. 143 CE', correcta: false },
      { texto: 'Art. 156 CE', correcta: false },
      { texto: 'Art. 2 CE', correcta: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EJECUCIÓN
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Corregir nombres de temas con encoding roto
    for (const t of TEMAS) {
      await client.query(
        `UPDATE temas SET nombre = $1 WHERE materia_id = 1 AND nombre ILIKE $2`,
        [t.nombre, `%${t.nombre.substring(0, 12)}%`],
      );
    }
    // Asegurarse de que los temas existen con nombre exacto
    for (const t of TEMAS) {
      await client.query(
        `UPDATE temas SET nombre = $1 WHERE materia_id = 1 AND (nombre ~ '[\\xC0-\\xFF]{2}' OR nombre = $1)`,
        [t.nombre],
      );
    }

    // 2. Eliminar registros dependientes y luego las preguntas
    await client.query('DELETE FROM repeticion_espaciada');
    await client.query('DELETE FROM preguntas_marcadas');
    await client.query('DELETE FROM reportes_preguntas');
    await client.query('DELETE FROM respuestas_usuario');
    await client.query('DELETE FROM tests_preguntas');
    await client.query('DELETE FROM tests');
    const del = await client.query('DELETE FROM preguntas RETURNING id');
    console.log(`  Eliminadas ${del.rowCount} preguntas y sus opciones.`);

    // 3. Obtener mapa de claves a IDs reales de temas
    const temasRes = await client.query(`SELECT id, nombre FROM temas WHERE materia_id = 1 ORDER BY id`);
    const temaMap = {};
    for (const t of TEMAS) {
      const row = temasRes.rows.find(r => r.nombre === t.nombre);
      if (!row) throw new Error(`Tema no encontrado: "${t.nombre}". Filas: ${JSON.stringify(temasRes.rows.map(r => r.nombre))}`);
      temaMap[t.clave] = row.id;
    }
    console.log('  Mapa de temas:', temaMap);

    // 4. Insertar preguntas y opciones
    let total = 0;
    for (const p of PREGUNTAS) {
      const temaId = temaMap[p.tema];
      const res = await client.query(
        `INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad, estado)
         VALUES ($1, $2, $3, $4, 'aprobada') RETURNING id`,
        [temaId, p.enunciado, p.explicacion, p.nivel],
      );
      const preguntaId = res.rows[0].id;
      for (const o of p.opciones) {
        await client.query(
          `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES ($1, $2, $3)`,
          [preguntaId, o.texto, o.correcta],
        );
      }
      total++;
    }

    // 5. Resetear secuencias
    await client.query(`SELECT setval('preguntas_id_seq', (SELECT MAX(id) FROM preguntas))`);
    await client.query(`SELECT setval('opciones_respuesta_id_seq', (SELECT MAX(id) FROM opciones_respuesta))`);

    await client.query('COMMIT');
    console.log(`\n✓ Seed completado: ${total} preguntas insertadas correctamente.\n`);

    // Resumen
    const resumen = await client.query(`
      SELECT t.nombre AS tema, COUNT(p.id) AS preguntas
      FROM temas t
      LEFT JOIN preguntas p ON p.tema_id = t.id
      WHERE t.materia_id = 1
      GROUP BY t.id, t.nombre
      ORDER BY t.id
    `);
    console.log('Resumen por tema:');
    for (const r of resumen.rows) {
      console.log(`  [${r.preguntas}] ${r.tema}`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR – rollback efectuado:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
