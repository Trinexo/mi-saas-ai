import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.MIGRATION_040_TEST_DATABASE_URL;
const explicitConfirm = process.env.MIGRATION_040_TEST_CONFIRM === 'ISOLATED';
const explicitIsolation = process.env.MIGRATION_040_TEST_DATABASE_ISOLATED === 'true';

function validateDisposableDatabaseUrl(value) {
  if (!explicitIsolation) {
    throw new Error(
      'Pruebas 040 bloqueadas: exige MIGRATION_040_TEST_DATABASE_ISOLATED=true; la base debe ser efimera y desechable',
    );
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Pruebas 040 bloqueadas: MIGRATION_040_TEST_DATABASE_URL no es una URL PostgreSQL valida');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Pruebas 040 bloqueadas: la URL debe usar el protocolo PostgreSQL');
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')).toLowerCase();
  const forbidden = /(^|[.\-_])(railway|production|prod|postgres)([.\-_]|$)/i;
  if (forbidden.test(hostname) || /(^|[.\-_])(railway|production|prod|postgres)([.\-_]|$)/i.test(databaseName)) {
    throw new Error('Pruebas 040 bloqueadas: host o nombre de base reservado para Railway/produccion');
  }
  if (hostname === 'railway.app' || hostname.endsWith('.railway.app')
    || hostname === 'railway.internal' || hostname.endsWith('.railway.internal')
    || hostname === 'proxy.rlwy.net' || hostname.endsWith('.proxy.rlwy.net')) {
    throw new Error('Pruebas 040 bloqueadas: no se permiten endpoints Railway');
  }

  const allowlist = (process.env.MIGRATION_040_TEST_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (!localHost && !allowlist.includes(hostname)) {
    throw new Error('Pruebas 040 bloqueadas: el host no es local ni pertenece a MIGRATION_040_TEST_ALLOWED_HOSTS');
  }
}

if (databaseUrl && explicitConfirm) validateDisposableDatabaseUrl(databaseUrl);
const enabled = Boolean(databaseUrl && explicitConfirm && explicitIsolation);
const testOptions = { skip: !enabled, concurrency: false };
const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../database/migrations/040_access_context_models_history.sql',
);

const legacySchema = `
  CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    deleted_at TIMESTAMP
  );
  CREATE TABLE oposiciones (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa'
  );
  CREATE TABLE accesos_oposicion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'activo'
      CHECK (estado IN ('activo', 'expirado', 'cancelado')),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    precio_pagado NUMERIC(8,2),
    notas TEXT,
    tipo_alumno TEXT NOT NULL DEFAULT 'libre',
    modo_preparacion TEXT NOT NULL DEFAULT 'albacer',
    ranking_publico BOOLEAN NOT NULL DEFAULT FALSE,
    creada_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizada_en TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, oposicion_id)
  );
`;

async function resetDatabase(client) {
  // Esta base debe ser efimera y desechable. Nunca apuntar a Railway o produccion.
  await client.query('ROLLBACK').catch(() => {});
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.query('GRANT ALL ON SCHEMA public TO public');
  await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER');
  const schemaCheck = await client.query("SELECT to_regnamespace('public') IS NOT NULL AS exists");
  assert.equal(schemaCheck.rows[0].exists, true);
  await client.query(legacySchema);
  await client.query("INSERT INTO usuarios (nombre, email) VALUES ('Alumno 1', 'a1@test.local'), ('Alumno 2', 'a2@test.local')");
  await client.query("INSERT INTO oposiciones (nombre) VALUES ('Oposicion 1'), ('Oposicion 2')");
}

async function cleanupDatabase(client) {
  await client.query('ROLLBACK').catch(() => {});
  await client.query('DROP SCHEMA IF EXISTS public CASCADE').catch(() => {});
  await client.end().catch(() => {});
}

async function dropLegacyEstadoConstraint(client) {
  const result = await client.query(`
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'accesos_oposicion'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ~* 'estado'
      AND pg_get_constraintdef(c.oid) ~* 'activo'
      AND pg_get_constraintdef(c.oid) ~* 'expirado'
      AND pg_get_constraintdef(c.oid) ~* 'cancelado'
      AND pg_get_constraintdef(c.oid) !~* 'pendiente_modo'
      AND pg_get_constraintdef(c.oid) !~* 'revocado'
  `);
  assert.equal(result.rows.length, 1);
  await client.query(`ALTER TABLE accesos_oposicion DROP CONSTRAINT \"${result.rows[0].conname.replaceAll('"', '""')}\"`);
}

async function createCompatibleModelTable(client) {
  await client.query(`
    CREATE TABLE acceso_oposicion_modelos (
      id BIGSERIAL,
      acceso_id BIGINT NOT NULL,
      modelo TEXT NOT NULL,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT pk_acceso_oposicion_modelos PRIMARY KEY (id),
      CONSTRAINT fk_acceso_oposicion_modelos_acceso FOREIGN KEY (acceso_id)
        REFERENCES accesos_oposicion(id) ON DELETE CASCADE,
      CONSTRAINT chk_acceso_oposicion_modelos_modelo
        CHECK (modelo IN ('experto', 'guiado')),
      CONSTRAINT uq_acceso_oposicion_modelos_acceso_modelo UNIQUE (acceso_id, modelo)
    )
  `);
}

async function createCompatibleHistoryTable(client) {
  await client.query(`
    CREATE TABLE accesos_oposicion_historial (
      id BIGSERIAL,
      acceso_id BIGINT NOT NULL,
      tipo_evento TEXT NOT NULL,
      estado_anterior TEXT,
      estado_nuevo TEXT,
      modo_activo_anterior TEXT,
      modo_activo_nuevo TEXT,
      modelos_anteriores JSONB,
      modelos_nuevos JSONB,
      actor_usuario_id BIGINT,
      motivo TEXT,
      metadata JSONB,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT pk_accesos_oposicion_historial PRIMARY KEY (id),
      CONSTRAINT fk_accesos_oposicion_historial_acceso FOREIGN KEY (acceso_id)
        REFERENCES accesos_oposicion(id) ON DELETE RESTRICT,
      CONSTRAINT fk_accesos_oposicion_historial_actor FOREIGN KEY (actor_usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT,
      CONSTRAINT chk_accesos_oposicion_historial_tipo_evento CHECK (tipo_evento IN (
        'migracion_legacy', 'creado', 'modelos_actualizados', 'modo_activo_cambiado',
        'vigencia_actualizada', 'expirado', 'renovado', 'revocado', 'cancelado', 'reactivado'
      ))
    )
  `);
}

async function assertMigrationRollback(client, tableName = 'acceso_oposicion_modelos') {
  assert.equal(
    (await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'accesos_oposicion' AND column_name = 'modo_activo'")).rowCount,
    0,
  );
  assert.equal((await client.query(`SELECT to_regclass('public.${tableName}') AS name`)).rows[0].name, null);
  assert.equal((await client.query("SELECT to_regclass('public.accesos_oposicion_historial') AS name")).rows[0].name, null);
}

async function runMigration(client) {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function count(client, table, where = '', params = []) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table} ${where}`, params);
  return result.rows[0].count;
}

async function createClient() {
  const client = new Client({ connectionString: databaseUrl, ssl: false });
  await client.connect();
  return client;
}

test('040: backfill legacy, invariantes, datos conservados y segunda ejecucion', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query(`
      INSERT INTO accesos_oposicion
        (usuario_id, oposicion_id, estado, fecha_fin, precio_pagado, notas, modo_preparacion)
      VALUES
        (1, 1, 'activo', NULL, 19.95, 'experto legacy', 'experto'),
        (2, 2, 'expirado', '2026-01-01', 29.95, 'albacer legacy', 'albacer')
    `);

    await runMigration(client);
    const firstHistoryCount = await count(client, 'accesos_oposicion_historial', "WHERE tipo_evento = 'migracion_legacy'");
    const firstModelCount = await count(client, 'acceso_oposicion_modelos');

    const rows = await client.query(`
      SELECT a.id, a.estado, a.fecha_fin, a.precio_pagado, a.notas,
             a.modo_preparacion, a.modo_activo, m.modelo
      FROM accesos_oposicion a
      JOIN acceso_oposicion_modelos m ON m.acceso_id = a.id
      ORDER BY a.id
    `);
    assert.deepEqual(rows.rows.map((row) => ({
      estado: row.estado,
      modoPreparacion: row.modo_preparacion,
      modoActivo: row.modo_activo,
      modelo: row.modelo,
      precio: Number(row.precio_pagado),
      notas: row.notas,
    })), [
      { estado: 'activo', modoPreparacion: 'experto', modoActivo: 'experto', modelo: 'experto', precio: 19.95, notas: 'experto legacy' },
      { estado: 'expirado', modoPreparacion: 'albacer', modoActivo: 'guiado', modelo: 'guiado', precio: 29.95, notas: 'albacer legacy' },
    ]);
    assert.equal(firstModelCount, 2);
    assert.equal(firstHistoryCount, 2);
    const duplicateModelGroups = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT acceso_id
        FROM acceso_oposicion_modelos
        GROUP BY acceso_id
        HAVING COUNT(*) <> 1
      ) AS invalid_groups
    `);
    assert.equal(duplicateModelGroups.rows[0].count, 0);

    await runMigration(client);
    assert.equal(await count(client, 'accesos_oposicion_historial', "WHERE tipo_evento = 'migracion_legacy'"), firstHistoryCount);
    assert.equal(await count(client, 'acceso_oposicion_modelos'), firstModelCount);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rollback completo ante datos legacy invalidos', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'modo_invalido')");
    await assert.rejects(() => runMigration(client), /Datos legacy invalidos/);
    assert.equal((await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'accesos_oposicion' AND column_name = 'modo_activo'")).rowCount, 0);
    assert.equal((await client.query("SELECT to_regclass('public.acceso_oposicion_modelos') AS name")).rows[0].name, null);
    assert.equal((await client.query("SELECT to_regclass('public.accesos_oposicion_historial') AS name")).rows[0].name, null);
    assert.equal((await client.query(`
      SELECT COUNT(*)::int AS count
      FROM pg_constraint
      WHERE conrelid = 'accesos_oposicion'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ~* 'estado'
        AND pg_get_constraintdef(oid) ~* 'activo'
        AND pg_get_constraintdef(oid) ~* 'expirado'
        AND pg_get_constraintdef(oid) ~* 'cancelado'
        AND pg_get_constraintdef(oid) !~* 'pendiente_modo'
        AND pg_get_constraintdef(oid) !~* 'revocado'
    `)).rows[0].count, 1);
    assert.equal((await client.query("SELECT modo_preparacion FROM accesos_oposicion WHERE usuario_id = 1 AND oposicion_id = 1")).rows[0].modo_preparacion, 'modo_invalido');
  } finally {
    await cleanupDatabase(client);
  }
});

for (const [label, value] of [['NULL', null], ['desconocido', 'modo_desconocido']]) {
  test(`040: rollback completo ante modo_preparacion ${label}`, testOptions, async () => {
    const client = await createClient();
    try {
      await resetDatabase(client);
      if (value === null) {
        await client.query('ALTER TABLE accesos_oposicion ALTER COLUMN modo_preparacion DROP NOT NULL');
      }
      await client.query(
        'INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, $1)',
        [value],
      );
      await assert.rejects(() => runMigration(client), /Datos legacy invalidos|NOT NULL/);
      await assertMigrationRollback(client);
      const preserved = await client.query('SELECT modo_preparacion FROM accesos_oposicion WHERE usuario_id = 1 AND oposicion_id = 1');
      assert.equal(preserved.rows[0].modo_preparacion, value);
    } finally {
    await cleanupDatabase(client);
    }
  });
}

test('040: rechaza modo_activo preexistente incoherente', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query('ALTER TABLE accesos_oposicion ADD COLUMN modo_activo TEXT');
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion, modo_activo) VALUES (1, 1, 'experto', 'guiado')");
    await assert.rejects(() => runMigration(client), /modo_activo incompatible/);
    assert.equal((await client.query("SELECT modo_activo FROM accesos_oposicion WHERE usuario_id = 1")).rows[0].modo_activo, 'guiado');
    assert.equal((await client.query("SELECT to_regclass('public.accesos_oposicion_historial') AS name")).rows[0].name, null);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rechaza multiples modelos preexistentes', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
    await createCompatibleModelTable(client);
    await client.query("INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES (1, 'experto'), (1, 'guiado')");
    await assert.rejects(() => runMigration(client), /Modelos preexistentes incompatibles/);
    assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM acceso_oposicion_modelos')).rows[0].count, 2);
    assert.equal((await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'accesos_oposicion' AND column_name = 'modo_activo'")).rowCount, 0);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rechaza ausencia, duplicidad y coexistencia del CHECK legacy', testOptions, async () => {
  const scenarios = ['missing', 'duplicate', 'new-incompatible', 'coexistence'];
  for (const scenario of scenarios) {
    const client = await createClient();
    try {
      await resetDatabase(client);
      if (scenario === 'missing') {
        await dropLegacyEstadoConstraint(client);
      } else if (scenario === 'duplicate') {
        await client.query("ALTER TABLE accesos_oposicion ADD CONSTRAINT chk_estado_legacy_segundo CHECK (estado IN ('activo', 'expirado', 'cancelado'))");
      } else if (scenario === 'new-incompatible') {
        await client.query("ALTER TABLE accesos_oposicion ADD CONSTRAINT chk_accesos_oposicion_estado_fase1 CHECK (estado IN ('activo', 'expirado', 'cancelado'))");
      } else {
        await client.query("ALTER TABLE accesos_oposicion ADD CONSTRAINT chk_accesos_oposicion_estado_fase1 CHECK (estado IN ('pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado'))");
      }
      await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
      await assert.rejects(() => runMigration(client), /No se encontro|Se encontraron|Coexisten|Estructura incompatible/);
      assert.equal((await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'accesos_oposicion' AND column_name = 'modo_activo'")).rowCount, 0);
    } finally {
    await cleanupDatabase(client);
    }
  }
});

test('040: rollback explicito ante estructuras incompatibles', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query('CREATE TABLE acceso_oposicion_modelos (id BIGSERIAL PRIMARY KEY, acceso_id BIGINT, modelo INTEGER, creado_en TIMESTAMP)');
    await assert.rejects(() => runMigration(client), /Estructura incompatible: acceso_oposicion_modelos/);
    assert.equal((await client.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'accesos_oposicion' AND column_name = 'modo_activo'")).rowCount, 0);
    assert.equal((await client.query("SELECT to_regclass('public.accesos_oposicion_historial') AS name")).rows[0].name, null);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: nombres, tipos, constraints, FKs, indices y trigger exactos', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
    await runMigration(client);

    const columns = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('acceso_oposicion_modelos', 'accesos_oposicion_historial')
      ORDER BY table_name, ordinal_position
    `);
    assert.equal(columns.rows.find((row) => row.table_name === 'acceso_oposicion_modelos' && row.column_name === 'creado_en').data_type, 'timestamp without time zone');
    assert.equal(columns.rows.find((row) => row.table_name === 'accesos_oposicion_historial' && row.column_name === 'creado_en').data_type, 'timestamp without time zone');

    const constraints = await client.query(`
      SELECT conname, contype, confdeltype, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
        WHERE conrelid IN ('accesos_oposicion'::regclass, 'acceso_oposicion_modelos'::regclass, 'accesos_oposicion_historial'::regclass)
        AND conname IN (
          'chk_accesos_oposicion_estado_fase1',
          'chk_accesos_oposicion_modo_activo',
          'chk_accesos_oposicion_activo_modo',
          'pk_acceso_oposicion_modelos',
          'fk_acceso_oposicion_modelos_acceso',
          'chk_acceso_oposicion_modelos_modelo',
          'uq_acceso_oposicion_modelos_acceso_modelo',
          'fk_accesos_oposicion_historial_acceso',
          'fk_accesos_oposicion_historial_actor',
          'chk_accesos_oposicion_historial_tipo_evento',
          'pk_accesos_oposicion_historial'
        )
    `);
    assert.equal(constraints.rows.length, 11);
    assert.equal(constraints.rows.find((row) => row.conname === 'fk_acceso_oposicion_modelos_acceso').confdeltype, 'c');
    assert.equal(constraints.rows.find((row) => row.conname === 'fk_accesos_oposicion_historial_acceso').confdeltype, 'r');
    assert.equal(constraints.rows.find((row) => row.conname === 'fk_accesos_oposicion_historial_actor').confdeltype, 'r');

    const index = await client.query("SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_accesos_oposicion_historial_acceso_fecha'");
    assert.equal(index.rows.length, 1);
    assert.match(index.rows[0].indexdef, /acceso_id.*creado_en.*id/i);

    const trigger = await client.query(`
      SELECT pg_get_triggerdef(t.oid) AS definition, t.tgtype, t.tgenabled
      FROM pg_trigger t
      WHERE t.tgrelid = 'accesos_oposicion_historial'::regclass
        AND t.tgname = 'trg_accesos_oposicion_historial_immutable'
    `);
    assert.equal(trigger.rows.length, 1);
    assert.equal(trigger.rows[0].tgtype, 27);
    assert.equal(trigger.rows[0].tgenabled, 'O');
    assert.match(trigger.rows[0].definition, /BEFORE (?:UPDATE OR DELETE|DELETE OR UPDATE)/i);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: el historial rechaza UPDATE y DELETE', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'albacer')");
    await runMigration(client);
    const history = await client.query("SELECT id FROM accesos_oposicion_historial WHERE tipo_evento = 'migracion_legacy'");
    await client.query(`
      INSERT INTO accesos_oposicion_historial
        (acceso_id, tipo_evento, actor_usuario_id, metadata)
      VALUES (1, 'creado', 2, '{"origin":"test"}')
    `);
    await assert.rejects(() => client.query('UPDATE accesos_oposicion_historial SET motivo = $1 WHERE id = $2', ['no', history.rows[0].id]), /inmutable/);
    await assert.rejects(() => client.query('DELETE FROM accesos_oposicion_historial WHERE id = $1', [history.rows[0].id]), /inmutable/);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: FK RESTRICT del actor protege el historial y permite desactivacion logica', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query("INSERT INTO usuarios (nombre, email) VALUES ('Actor aislado', 'actor@test.local')");
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
    await runMigration(client);
    await client.query(`
      INSERT INTO accesos_oposicion_historial
        (acceso_id, tipo_evento, actor_usuario_id, metadata)
      VALUES (1, 'creado', 3, '{"origin":"test"}')
    `);
    await assert.rejects(() => client.query('DELETE FROM usuarios WHERE id = 3'), /accesos_oposicion_historial|violates foreign key constraint/);
    await client.query("UPDATE usuarios SET deleted_at = NOW() WHERE id = 3");
    assert.equal(Number((await client.query("SELECT actor_usuario_id, metadata FROM accesos_oposicion_historial WHERE tipo_evento = 'creado' ORDER BY id DESC LIMIT 1")).rows[0].actor_usuario_id), 3);
    await assert.rejects(() => client.query('DELETE FROM accesos_oposicion WHERE id = 1'), /accesos_oposicion_historial|violates foreign key constraint/);
    await assert.rejects(() => client.query('DELETE FROM usuarios WHERE id = 1'), /accesos_oposicion_historial|violates foreign key constraint/);
    await assert.rejects(() => client.query('DELETE FROM oposiciones WHERE id = 1'), /accesos_oposicion_historial|violates foreign key constraint/);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rechaza una funcion de historial preexistente incompatible', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await client.query(`
      CREATE FUNCTION fn_prevent_accesos_oposicion_historial_mutation()
      RETURNS trigger LANGUAGE plpgsql
      AS $function$
      BEGIN
        RETURN NEW;
      END;
      $function$
    `);
    await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
    await assert.rejects(() => runMigration(client), /fn_prevent_accesos_oposicion_historial_mutation/);
    await assertMigrationRollback(client);
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rechaza trigger de historial FOR EACH STATEMENT o con otra funcion', testOptions, async () => {
  const client = await createClient();
  try {
    await resetDatabase(client);
    await createCompatibleHistoryTable(client);
    await client.query(`
      CREATE FUNCTION other_history_trigger() RETURNS trigger LANGUAGE plpgsql
      AS $function$ BEGIN RETURN NEW; END; $function$
    `);
    await client.query(`
      CREATE TRIGGER trg_accesos_oposicion_historial_immutable
      BEFORE UPDATE OR DELETE ON accesos_oposicion_historial
      FOR EACH STATEMENT EXECUTE FUNCTION other_history_trigger()
    `);
    await assert.rejects(() => runMigration(client), /trg_accesos_oposicion_historial_immutable/);
    assert.equal((await client.query("SELECT to_regclass('public.accesos_oposicion_historial') AS name")).rows[0].name, 'accesos_oposicion_historial');
  } finally {
    await cleanupDatabase(client);
  }
});

test('040: rechaza historial legacy duplicado o con payload incompatible', testOptions, async () => {
  for (const duplicate of [true, false]) {
    const client = await createClient();
    try {
      await resetDatabase(client);
      await client.query("INSERT INTO accesos_oposicion (usuario_id, oposicion_id, modo_preparacion) VALUES (1, 1, 'experto')");
      await createCompatibleModelTable(client);
      await client.query("INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES (1, 'experto')");
      await createCompatibleHistoryTable(client);
      await client.query(`
        INSERT INTO accesos_oposicion_historial
          (acceso_id, tipo_evento, estado_anterior, estado_nuevo,
           modelos_anteriores, modelos_nuevos, metadata)
        VALUES
          (1, 'migracion_legacy', 'activo', 'activo', '[]', '[{"modelo":"experto"}]', '{"origin":"system","process":"migration_040"}')
      `);
      if (duplicate) {
        await client.query(`
          INSERT INTO accesos_oposicion_historial
            (acceso_id, tipo_evento, estado_anterior, estado_nuevo,
             modelos_anteriores, modelos_nuevos, metadata)
          VALUES
            (1, 'migracion_legacy', 'activo', 'activo', '[]', '[{"modelo":"experto"}]', '{"origin":"system","process":"migration_040"}')
        `);
      } else {
        await client.query("UPDATE accesos_oposicion_historial SET metadata = '{\"origin\":\"wrong\"}' WHERE id = 1");
      }
      await assert.rejects(() => runMigration(client), duplicate ? /mas de un evento/ : /Payload incompatible/);
      assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM accesos_oposicion_historial')).rows[0].count, duplicate ? 2 : 1);
    } finally {
    await cleanupDatabase(client);
    }
  }
});
