/**
 * Script temporal: migra oposiciones, materias, temas, preguntas
 * y opciones_respuesta de la BD local a Railway.
 * Uso: node scripts/migrate-content.mjs
 */
import pg from 'pg';

const { Client } = pg;

const LOCAL_URL  = 'postgres://postgres:postgres@localhost:5432/plataforma_test';
const REMOTE_URL = 'postgresql://postgres:xaUbGIcQGmTrrRKmUSiVAmnrtNNqmcgE@monorail.proxy.rlwy.net:14080/railway';

async function run() {
  const local  = new Client({ connectionString: LOCAL_URL });
  const remote = new Client({ connectionString: REMOTE_URL, ssl: { rejectUnauthorized: false } });

  await local.connect();
  await remote.connect();
  console.log('Conectado a BD local y Railway\n');

  // ── Mapas de IDs locales → remotos ─────────────────────────────────────────
  const oposicionMap = {};
  const materiaMap   = {};
  const temaMap      = {};
  const preguntaMap  = {};

  // ── 1. Oposiciones ──────────────────────────────────────────────────────────
  const { rows: oposiciones } = await local.query('SELECT * FROM oposiciones ORDER BY id');
  console.log(`Oposiciones: ${oposiciones.length}`);
  for (const o of oposiciones) {
    // Buscar si ya existe por nombre, si no insertar
    const { rows: existing } = await remote.query(
      'SELECT id FROM oposiciones WHERE nombre = $1', [o.nombre]
    );
    let remoteId;
    if (existing.length > 0) {
      remoteId = existing[0].id;
      console.log(`  ~ Oposición ya existe: ${o.nombre}`);
    } else {
      const { rows } = await remote.query(
        'INSERT INTO oposiciones (nombre, descripcion) VALUES ($1, $2) RETURNING id',
        [o.nombre, o.descripcion]
      );
      remoteId = rows[0].id;
      console.log(`  ✓ Oposición: ${o.nombre}`);
    }
    oposicionMap[o.id] = remoteId;
  }

  // ── 2. Materias ─────────────────────────────────────────────────────────────
  const { rows: materias } = await local.query('SELECT * FROM materias ORDER BY id');
  console.log(`\nMaterias: ${materias.length}`);
  for (const m of materias) {
    const remoteOpId = oposicionMap[m.oposicion_id];
    const { rows } = await remote.query(`
      INSERT INTO materias (oposicion_id, nombre)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [remoteOpId, m.nombre]);

    if (rows.length > 0) {
      materiaMap[m.id] = rows[0].id;
    } else {
      // Ya existía — buscar el id remoto
      const { rows: existing } = await remote.query(
        'SELECT id FROM materias WHERE oposicion_id = $1 AND nombre = $2',
        [remoteOpId, m.nombre]
      );
      materiaMap[m.id] = existing[0].id;
    }
    console.log(`  ✓ Materia: ${m.nombre}`);
  }

  // ── 3. Temas ────────────────────────────────────────────────────────────────
  const { rows: temas } = await local.query('SELECT * FROM temas ORDER BY id');
  console.log(`\nTemas: ${temas.length}`);
  for (const t of temas) {
    const remoteMatId = materiaMap[t.materia_id];
    const { rows } = await remote.query(`
      INSERT INTO temas (materia_id, nombre)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [remoteMatId, t.nombre]);

    if (rows.length > 0) {
      temaMap[t.id] = rows[0].id;
    } else {
      const { rows: existing } = await remote.query(
        'SELECT id FROM temas WHERE materia_id = $1 AND nombre = $2',
        [remoteMatId, t.nombre]
      );
      temaMap[t.id] = existing[0].id;
    }
    console.log(`  ✓ Tema: ${t.nombre}`);
  }

  // ── 4. Preguntas ────────────────────────────────────────────────────────────
  const { rows: preguntas } = await local.query('SELECT * FROM preguntas ORDER BY id');
  console.log(`\nPreguntas: ${preguntas.length}`);
  let pregInsertadas = 0;
  for (const p of preguntas) {
    const remoteTemaId = temaMap[p.tema_id];
    const { rows } = await remote.query(`
      INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad, fecha_actualizacion)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [remoteTemaId, p.enunciado, p.explicacion, p.referencia_normativa, p.nivel_dificultad, p.fecha_actualizacion]);

    if (rows.length > 0) {
      preguntaMap[p.id] = rows[0].id;
      pregInsertadas++;
    } else {
      // Buscar por enunciado + tema
      const { rows: existing } = await remote.query(
        'SELECT id FROM preguntas WHERE tema_id = $1 AND enunciado = $2',
        [remoteTemaId, p.enunciado]
      );
      if (existing.length > 0) preguntaMap[p.id] = existing[0].id;
    }
  }
  console.log(`  ✓ ${pregInsertadas} preguntas insertadas`);

  // ── 5. Opciones de respuesta ────────────────────────────────────────────────
  const { rows: opciones } = await local.query('SELECT * FROM opciones_respuesta ORDER BY id');
  console.log(`\nOpciones de respuesta: ${opciones.length}`);
  let opInsertadas = 0;
  for (const op of opciones) {
    const remotePregId = preguntaMap[op.pregunta_id];
    if (!remotePregId) continue;
    await remote.query(`
      INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [remotePregId, op.texto, op.correcta]);
    opInsertadas++;
  }
  console.log(`  ✓ ${opInsertadas} opciones insertadas`);

  await local.end();
  await remote.end();
  console.log('\n✅ Migración de contenido completada.');
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
