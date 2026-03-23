import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { createPreguntaSchema } from '../schemas/admin.schema.js';

const normalizeHeader = (value) => value.trim().toLowerCase();

const parseCsvLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const requiredHeaders = [
  'tema_id',
  'enunciado',
  'explicacion',
  'referencia_normativa',
  'nivel_dificultad',
  'opcion_1',
  'opcion_2',
  'opcion_3',
  'opcion_4',
  'opcion_correcta',
];

export const adminService = {
  async listPreguntas(query) {
    const {
      page,
      page_size: pageSize,
      oposicion_id: oposicionId,
      materia_id: materiaId,
      tema_id: temaId,
      nivel_dificultad: nivelDificultad,
    } = query;

    const filters = {
      oposicionId: oposicionId ?? null,
      materiaId: materiaId ?? null,
      temaId: temaId ?? null,
      nivelDificultad: nivelDificultad ?? null,
    };

    const [items, total] = await Promise.all([
      adminRepository.listPreguntas(filters, pageSize, (page - 1) * pageSize),
      adminRepository.countPreguntas(filters),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },

  async createPregunta(payload, userId, userRole) {
    const client = await pool.connect();

    // Editores crean preguntas en estado pendiente; admins las crean directamente aprobadas
    const estadoInicial = userRole === 'editor' ? 'pendiente' : 'aprobada';

    try {
      await client.query('BEGIN');
      const pregunta = await adminRepository.createPregunta(client, { ...payload, estado: estadoInicial });
      await adminRepository.createOpciones(client, pregunta.id, payload.opciones);
      await client.query('COMMIT');
      adminRepository.insertAuditoria({ accion: 'create', preguntaId: pregunta.id, userId, userRole }).catch(() => {});
      return { id: pregunta.id, estado: estadoInicial };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getPregunta(preguntaId) {
    const pregunta = await adminRepository.getFullPreguntaById(preguntaId);
    if (!pregunta) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return pregunta;
  },

  async updatePregunta(preguntaId, payload, userId, userRole) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const exists = await adminRepository.getPreguntaById(client, preguntaId);
      if (!exists) {
        throw new ApiError(404, 'Pregunta no encontrada');
      }

      await adminRepository.updatePregunta(client, preguntaId, payload);
      await adminRepository.deleteOpciones(client, preguntaId);
      await adminRepository.createOpciones(client, preguntaId, payload.opciones);

      await client.query('COMMIT');
      adminRepository.insertAuditoria({ accion: 'update', preguntaId, userId, userRole, datosAnteriores: exists }).catch(() => {});
      return { id: preguntaId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePregunta(preguntaId, userId, userRole) {
    const snapshot = await adminRepository.getFullPreguntaById(preguntaId);
    if (!snapshot) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    await adminRepository.deletePregunta(preguntaId);
    adminRepository.insertAuditoria({ accion: 'delete', preguntaId, userId, userRole, datosAnteriores: snapshot }).catch(() => {});
    return { id: preguntaId };
  },

  async listAuditoria(query, actor) {
    if (!actor || actor.role !== 'admin') {
      throw new ApiError(403, 'Acceso denegado');
    }

    const { page, page_size: pageSize, pregunta_id: preguntaId, usuario_id: usuarioId, accion } = query;
    const filters = {
      preguntaId: preguntaId ?? null,
      usuarioId: usuarioId ?? null,
      accion: accion ?? null,
    };

    const [items, total] = await Promise.all([
      adminRepository.listAuditoria(filters, pageSize, (page - 1) * pageSize),
      adminRepository.countAuditoria(filters),
    ]);

    return {
      items,
      pagination: { page, pageSize, total },
    };
  },

  async importPreguntasCsv(payload) {
    const delimiter = payload.delimiter || ',';
    const lines = payload.csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new ApiError(400, 'CSV sin datos para importar');
    }

    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

    if (missingHeaders.length > 0) {
      throw new ApiError(400, `Faltan columnas obligatorias: ${missingHeaders.join(', ')}`);
    }

    const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
    const errors = [];
    let inserted = 0;

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index];
      const values = parseCsvLine(line, delimiter);
      const rowNumber = index + 1;

      try {
        const correctOption = Number(values[indexes.opcion_correcta]);
        const item = {
          temaId: Number(values[indexes.tema_id]),
          enunciado: values[indexes.enunciado],
          explicacion: values[indexes.explicacion],
          referenciaNormativa: values[indexes.referencia_normativa] || null,
          nivelDificultad: Number(values[indexes.nivel_dificultad]),
          opciones: [1, 2, 3, 4].map((optionIndex) => ({
            texto: values[indexes[`opcion_${optionIndex}`]],
            correcta: optionIndex === correctOption,
          })),
        };

        const parsed = createPreguntaSchema.safeParse(item);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw new Error(issue?.message || 'Fila inválida');
        }

        const temaExists = await adminRepository.existsTema(item.temaId);
        if (!temaExists) {
          throw new Error(`Tema ${item.temaId} no existe`);
        }

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const pregunta = await adminRepository.createPregunta(client, parsed.data);
          await adminRepository.createOpciones(client, pregunta.id, parsed.data.opciones);
          await client.query('COMMIT');
          inserted += 1;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        errors.push({ row: rowNumber, message: error.message });
      }
    }

    return {
      totalRows: lines.length - 1,
      imported: inserted,
      failed: errors.length,
      errors,
    };
  },

  async listReportes(query) {
    const { page, page_size: pageSize, estado = null } = query;

    const [items, total] = await Promise.all([
      adminRepository.listReportes({ estado }, pageSize, (page - 1) * pageSize),
      adminRepository.countReportes({ estado }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },

  async updateReporteEstado(reporteId, estado) {
    const updated = await adminRepository.updateReporteEstado(reporteId, estado);
    if (!updated) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    return { id: reporteId, estado };
  },

  async getAdminStats() {
    return adminRepository.getAdminStats();
  },

  async listUsers(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminRepository.listUsers(
      { role: query.role, q: query.q },
      pageSize,
      offset,
    );
    return {
      items: rows.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        role: u.role,
        fechaRegistro: u.fecha_registro,
      })),
      pagination: { page, pageSize, total },
    };
  },

  async updateUserRole(userId, role, requestingUser) {
    if (Number(userId) === requestingUser.id) {
      throw new ApiError(400, 'No puedes cambiar tu propio rol');
    }
    const updated = await adminRepository.updateUserRole(userId, role);
    if (!updated) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    return updated;
  },

  async getTemasConMasErrores(limit = 10) {
    return adminRepository.getTemasConMasErrores(limit);
  },

  async listPreguntasSinRevisar(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminRepository.listPreguntasSinRevisar(
      {
        oposicionId: query.oposicion_id,
        materiaId: query.materia_id,
        temaId: query.tema_id,
      },
      pageSize,
      offset,
    );
    return {
      items: rows.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        nivelDificultad: p.nivel_dificultad,
        estado: p.estado,
        fechaActualizacion: p.fecha_actualizacion,
        temaNombre: p.tema_nombre,
        materiaNombre: p.materia_nombre,
        oposicionNombre: p.oposicion_nombre,
      })),
      pagination: { page, pageSize, total },
    };
  },

  async updatePreguntaEstado(preguntaId, estado, requestingUser) {
    const allowed = ['revisor', 'admin'];
    if (!allowed.includes(requestingUser.role)) {
      throw new ApiError(403, 'Solo revisores y admins pueden cambiar el estado de preguntas');
    }
    const updated = await adminRepository.updatePreguntaEstado(preguntaId, estado);
    if (!updated) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return updated;
  },
};