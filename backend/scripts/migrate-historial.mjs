/**
 * Migra el historial completo de tests de un usuario de local a Railway.
 * Tablas: tests, tests_preguntas, respuestas_usuario, resultados_test,
 *         progreso_usuario, repeticion_espaciada
 *
 * Uso:
 *   $env:LOCAL_DB_URL="postgres://postgres:postgres@localhost:5432/plataforma_test"
 *   $env:RAILWAY_DB_URL="postgresql://postgres:...@monorail.proxy.rlwy.net:14080/railway"
 *   $env:USER_EMAIL="joxerau@gmail.com"
 *   node scripts/migrate-historial.mjs
 */
import pg from 'pg';

const { Client } = pg;

const LOCAL_URL   = process.env.LOCAL_DB_URL   || 'postgres://postgres:postgres@localhost:5432/plataforma_test';
const RAILWAY_URL = process.env.RAILWAY_DB_URL;
const USER_EMAIL  = process.env.USER_EMAIL      || 'joxerau@gmail.com';

if (!RAILWAY_URL) {
  console.error('ERROR: Define RAILWAY_DB_URL como variable de entorno.');
  process.exit(1);
}

const local   = new Client({ connectionString: LOCAL_URL });
const railway = new Client({ connectionString: RAILWAY_URL, ssl: { rejectUnauthorized: false } });

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Encuentra el ID del usuario en la BD destino por email */
async function resolveUserId(client, email) {
  const { rows } = await client.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [email],
  );
  if (!rows.length) throw new Error(`Usuario "${email}" no encontrado en Railway.`);
  return rows[0].id;
}

/** Mapa preguntaId_local → preguntaId_railway usando enunciado (bulk) */
async function buildPreguntaMap(localClient, railwayClient, preguntaIds) {
  if (!preguntaIds.length) return {};

  const { rows: localPqs } = await localClient.query(
    `SELECT id, enunciado FROM preguntas WHERE id = ANY($1::bigint[])`,
    [preguntaIds],
  );

  // Cargar TODAS las preguntas de Railway de una sola vez
  const enunciados = localPqs.map(p => p.enunciado);
  const { rows: rwPqs } = await railwayClient.query(
    `SELECT id, enunciado FROM preguntas WHERE enunciado = ANY($1::text[])`,
    [enunciados],
  );
  const rwByEnunciado = {};
  for (const rp of rwPqs) rwByEnunciado[rp.enunciado] = rp.id;

  const map = {};
  for (const lp of localPqs) {
    const rwId = rwByEnunciado[lp.enunciado];
    if (rwId) {
      map[lp.id] = rwId;
    } else {
      console.warn(`  ⚠️  Pregunta local #${lp.id} no encontrada en Railway (se omitirá)`);
    }
  }
  return map;
}

/** Mapa opcionId_local → opcionId_railway usando (preguntaId_railway, texto) (bulk) */
async function buildOpcionMap(localClient, railwayClient, opcionIds, preguntaMap) {
  if (!opcionIds.length) return {};

  const { rows: localOps } = await localClient.query(
    `SELECT id, pregunta_id, texto FROM opciones_respuesta WHERE id = ANY($1::bigint[])`,
    [opcionIds],
  );

  // IDs Railway de las preguntas implicadas
  const rwPreguntaIds = [...new Set(
    localOps.map(o => preguntaMap[o.pregunta_id]).filter(Boolean),
  )];

  const { rows: rwOps } = await railwayClient.query(
    `SELECT id, pregunta_id, texto FROM opciones_respuesta WHERE pregunta_id = ANY($1::bigint[])`,
    [rwPreguntaIds],
  );
  // key: "preguntaId|texto"
  const rwByKey = {};
  for (const ro of rwOps) rwByKey[`${ro.pregunta_id}|${ro.texto}`] = ro.id;

  const map = {};
  for (const lo of localOps) {
    const rwPqId = preguntaMap[lo.pregunta_id];
    if (!rwPqId) continue;
    const rwId = rwByKey[`${rwPqId}|${lo.texto}`];
    if (rwId) {
      map[lo.id] = rwId;
    } else {
      console.warn(`  ⚠️  Opción local #${lo.id} no encontrada en Railway`);
    }
  }
  return map;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  await local.connect();
  await railway.connect();
  console.log('✅ Conectado a ambas bases de datos\n');

  // 1. Resolver IDs de usuario
  const { rows: localUserRows } = await local.query('SELECT id FROM usuarios WHERE email = $1', [USER_EMAIL]);
  if (!localUserRows.length) throw new Error(`Usuario "${USER_EMAIL}" no encontrado en local.`);
  const localUserId   = localUserRows[0].id;
  const railwayUserId = await resolveUserId(railway, USER_EMAIL);
  console.log(`👤 Usuario: ${USER_EMAIL}`);
  console.log(`   Local ID: ${localUserId}  →  Railway ID: ${railwayUserId}\n`);

  // 2. Cargar todos los tests del usuario
  const { rows: tests } = await local.query(
    `SELECT * FROM tests WHERE usuario_id = $1 ORDER BY fecha_creacion`,
    [localUserId],
  );
  console.log(`📋 Tests encontrados en local: ${tests.length}`);

  if (!tests.length) {
    console.log('No hay tests que migrar.');
    await local.end();
    await railway.end();
    return;
  }

  // 3. Recopilar todas las pregunta_ids y opcion_ids implicadas
  const localTestIds = tests.map(t => t.id);

  const { rows: allTp } = await local.query(
    `SELECT * FROM tests_preguntas WHERE test_id = ANY($1::bigint[]) ORDER BY test_id, orden`,
    [localTestIds],
  );
  const { rows: allRu } = await local.query(
    `SELECT * FROM respuestas_usuario WHERE test_id = ANY($1::bigint[])`,
    [localTestIds],
  );
  const { rows: allRt } = await local.query(
    `SELECT * FROM resultados_test WHERE test_id = ANY($1::bigint[])`,
    [localTestIds],
  );

  const preguntaIdsSet = new Set([
    ...allTp.map(r => r.pregunta_id),
    ...allRu.map(r => r.pregunta_id),
  ]);
  const opcionIdsSet = new Set(
    allRu.filter(r => r.respuesta_id).map(r => r.respuesta_id),
  );

  console.log(`   tests_preguntas: ${allTp.length} filas`);
  console.log(`   respuestas_usuario: ${allRu.length} filas`);
  console.log(`   resultados_test: ${allRt.length} filas`);
  console.log(`\n🔄 Construyendo mapas de IDs...`);

  const preguntaMap = await buildPreguntaMap(local, railway, [...preguntaIdsSet]);
  const opcionMap   = await buildOpcionMap(local, railway, [...opcionIdsSet], preguntaMap);

  const mappedPqs  = Object.keys(preguntaMap).length;
  const mappedOps  = Object.keys(opcionMap).length;
  console.log(`   Preguntas mapeadas: ${mappedPqs}/${preguntaIdsSet.size}`);
  console.log(`   Opciones mapeadas:  ${mappedOps}/${opcionIdsSet.size}\n`);

  // 4. Migrar test por test
  let insertedTests = 0, skippedTests = 0;
  const testIdMap = {}; // localTestId → railwayTestId

  for (const test of tests) {
    // Determinar oposicion_id y tema_id en Railway (pueden diferir por el seed)
    let rwOposicionId = null;
    if (test.oposicion_id) {
      const { rows } = await local.query('SELECT nombre FROM oposiciones WHERE id = $1', [test.oposicion_id]);
      if (rows.length) {
        const { rows: rwRows } = await railway.query('SELECT id FROM oposiciones WHERE nombre = $1', [rows[0].nombre]);
        if (rwRows.length) rwOposicionId = rwRows[0].id;
      }
    }

    let rwTemaId = null;
    if (test.tema_id) {
      const { rows } = await local.query('SELECT nombre FROM temas WHERE id = $1', [test.tema_id]);
      if (rows.length) {
        const { rows: rwRows } = await railway.query('SELECT id FROM temas WHERE nombre = $1 LIMIT 1', [rows[0].nombre]);
        if (rwRows.length) rwTemaId = rwRows[0].id;
      }
    }

    // Insertar test en Railway
    const { rows: rwTest } = await railway.query(
      `INSERT INTO tests (usuario_id, tema_id, oposicion_id, tipo_test, numero_preguntas,
                          duracion_segundos, estado, fecha_creacion, fecha_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        railwayUserId,
        rwTemaId,
        rwOposicionId,
        test.tipo_test,
        test.numero_preguntas,
        test.duracion_segundos,
        test.estado,
        test.fecha_creacion,
        test.fecha_fin ?? null,
      ],
    );
    const rwTestId = rwTest[0].id;
    testIdMap[test.id] = rwTestId;
    insertedTests++;

    // tests_preguntas
    const tpRows = allTp.filter(r => r.test_id === test.id);
    for (const tp of tpRows) {
      const rwPqId = preguntaMap[tp.pregunta_id];
      if (!rwPqId) continue;
      await railway.query(
        `INSERT INTO tests_preguntas (test_id, pregunta_id, orden)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [rwTestId, rwPqId, tp.orden],
      );
    }

    // respuestas_usuario
    const ruRows = allRu.filter(r => r.test_id === test.id);
    for (const ru of ruRows) {
      const rwPqId  = preguntaMap[ru.pregunta_id];
      if (!rwPqId) continue;
      const rwOpId  = ru.respuesta_id ? (opcionMap[ru.respuesta_id] ?? null) : null;
      await railway.query(
        `INSERT INTO respuestas_usuario (test_id, pregunta_id, respuesta_id, correcta, fecha_respuesta)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [rwTestId, rwPqId, rwOpId, ru.correcta, ru.fecha_respuesta],
      );
    }

    // resultados_test
    const rtRow = allRt.find(r => r.test_id === test.id);
    if (rtRow) {
      await railway.query(
        `INSERT INTO resultados_test (test_id, aciertos, errores, blancos, nota, tiempo_segundos, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [rwTestId, rtRow.aciertos, rtRow.errores, rtRow.blancos, rtRow.nota, rtRow.tiempo_segundos, rtRow.fecha],
      );
    }
  }

  console.log(`✅ Tests insertados: ${insertedTests}  Omitidos: ${skippedTests}`);

  // 5. Migrar progreso_usuario
  const { rows: progreso } = await local.query(
    `SELECT * FROM progreso_usuario WHERE usuario_id = $1`,
    [localUserId],
  );

  let progresoCnt = 0;
  for (const p of progreso) {
    const { rows: rwTema } = await local.query('SELECT nombre FROM temas WHERE id = $1', [p.tema_id]);
    if (!rwTema.length) continue;
    const { rows: rwTemaRw } = await railway.query('SELECT id FROM temas WHERE nombre = $1 LIMIT 1', [rwTema[0].nombre]);
    if (!rwTemaRw.length) continue;
    const rwTemaId = rwTemaRw[0].id;

    await railway.query(
      `INSERT INTO progreso_usuario (usuario_id, tema_id, preguntas_vistas, aciertos, errores, tiempo_medio)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (usuario_id, tema_id) DO UPDATE SET
         preguntas_vistas = EXCLUDED.preguntas_vistas,
         aciertos = EXCLUDED.aciertos,
         errores = EXCLUDED.errores,
         tiempo_medio = EXCLUDED.tiempo_medio`,
      [railwayUserId, rwTemaId, p.preguntas_vistas, p.aciertos, p.errores, p.tiempo_medio],
    );
    progresoCnt++;
  }
  console.log(`✅ progreso_usuario: ${progresoCnt}/${progreso.length} filas`);

  // 6. Migrar repeticion_espaciada
  const { rows: repaso } = await local.query(
    `SELECT * FROM repeticion_espaciada WHERE usuario_id = $1`,
    [localUserId],
  );

  let repasoCnt = 0;
  for (const r of repaso) {
    const rwPqId = preguntaMap[r.pregunta_id];
    if (!rwPqId) continue;

    await railway.query(
      `INSERT INTO repeticion_espaciada (usuario_id, pregunta_id, nivel_memoria, proxima_revision, ultima_revision, racha_aciertos)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (usuario_id, pregunta_id) DO UPDATE SET
         nivel_memoria = EXCLUDED.nivel_memoria,
         proxima_revision = EXCLUDED.proxima_revision,
         ultima_revision = EXCLUDED.ultima_revision,
         racha_aciertos = EXCLUDED.racha_aciertos`,
      [railwayUserId, rwPqId, r.nivel_memoria, r.proxima_revision, r.ultima_revision, r.racha_aciertos],
    );
    repasoCnt++;
  }
  console.log(`✅ repeticion_espaciada: ${repasoCnt}/${repaso.length} filas`);

  await local.end();
  await railway.end();
  console.log('\n🎉 Migración de historial completada.');
}

main().catch(err => {
  console.error('ERROR FATAL:', err.message);
  process.exit(1);
});
