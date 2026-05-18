import { profesorWorkspacePlanificacionRepository } from '../repositories/profesorWorkspacePlanificacion.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { notificacionesRepository } from '../repositories/notificaciones.repository.js';
import { ApiError } from '../utils/api-error.js';

const uniqNumbers = (items = []) => [...new Set(items.map(Number).filter(Boolean))];

const shouldNotify = (planificacion, previous = null) => {
  if (!planificacion.notificar_alumnos || planificacion.notificada_en) return false;
  if (planificacion.estado !== 'publicada') return false;
  if (!previous) return true;
  return previous.estado !== 'publicada';
};

export const profesorWorkspacePlanificacionService = {
  async list(userId, query) {
    return profesorWorkspacePlanificacionRepository.listForProfesor({
      userId,
      oposicionId: query.oposicion_id ?? null,
      desde: query.desde ?? null,
      hasta: query.hasta ?? null,
    });
  },

  async get(userId, id) {
    const item = await profesorWorkspacePlanificacionRepository.getForProfesor(id, userId);
    if (!item) throw new ApiError(404, 'Planificacion no encontrada');
    return item;
  },

  async resultados(userId, id, query = {}) {
    const item = await this.get(userId, id);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const { items, total } = await profesorWorkspacePlanificacionRepository.listResultados({
      planificacionId: Number(id),
      oposicionId: Number(item.oposicion_id),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      planificacion: item,
      items: items.map((row) => {
        const completados = Number(row.completados || 0);
        const intentos = Number(row.intentos || 0);
        return {
          alumnoId: Number(row.alumno_id),
          alumnoNombre: row.alumno_nombre,
          alumnoEmail: row.alumno_email,
          estado: completados > 0 ? 'completado' : intentos > 0 ? 'iniciado' : 'pendiente',
          intentos,
          completados,
          notaMedia: row.nota_media == null ? null : Number(row.nota_media),
          mejorNota: row.mejor_nota == null ? null : Number(row.mejor_nota),
          ultimaActividad: row.ultima_actividad,
          ultimoTestId: row.ultimo_test_id ? Number(row.ultimo_test_id) : null,
          ultimoEstado: row.ultimo_estado,
          ultimaNota: row.ultima_nota == null ? null : Number(row.ultima_nota),
          ultimosAciertos: row.ultimos_aciertos == null ? null : Number(row.ultimos_aciertos),
          ultimosErrores: row.ultimos_errores == null ? null : Number(row.ultimos_errores),
          ultimosBlancos: row.ultimos_blancos == null ? null : Number(row.ultimos_blancos),
          ultimoTiempoSegundos: row.ultimo_tiempo_segundos == null ? null : Number(row.ultimo_tiempo_segundos),
        };
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  async enviarRecordatorio(userId, id) {
    const item = await this.get(userId, id);
    const alumnoIds = await profesorWorkspacePlanificacionRepository.listAlumnoIdsPendientes(
      Number(id),
      Number(item.oposicion_id),
    );

    if (alumnoIds.length === 0) {
      return { enviados: 0, mensaje: 'No hay alumnos pendientes de completar esta actividad' };
    }

    const titulo = 'Recordatorio de Plan de estudio';
    const mensaje = `Tienes pendiente "${item.titulo}" en tu Plan de estudio.`;
    await Promise.all(alumnoIds.map((usuarioId) => notificacionesRepository.crear({
      usuarioId,
      tipo: 'plan_estudio_recordatorio',
      titulo,
      mensaje,
      datosExtra: {
        planificacionId: Number(item.id),
        oposicionId: Number(item.oposicion_id),
        oposicionNombre: item.oposicion_nombre,
        tipo: item.tipo,
      },
    })));

    return { enviados: alumnoIds.length, mensaje: 'Recordatorio enviado' };
  },

  async validatePayload(userId, payload) {
    const hasOposicion = await profesorAccessRepository.hasAssignedOposicion(userId, payload.oposicion_id);
    if (!hasOposicion) throw new ApiError(403, 'No tienes asignada esa oposicion');

    if (payload.tipo === 'plantilla_test') {
      const dependency = await profesorWorkspacePlanificacionRepository.getDependencyOposicion({
        tipo: payload.tipo,
        plantillaTestId: payload.plantilla_test_id,
      });
      if (!dependency) throw new ApiError(404, 'Plantilla de test no encontrada');
      if (Number(dependency.oposicion_id) !== Number(payload.oposicion_id)) {
        throw new ApiError(400, 'La plantilla de test no pertenece a la oposicion indicada');
      }
    }

    if (payload.tipo === 'simulacro') {
      const dependency = await profesorWorkspacePlanificacionRepository.getDependencyOposicion({
        tipo: payload.tipo,
        simulacroId: payload.simulacro_id,
      });
      if (!dependency) throw new ApiError(404, 'Simulacro no encontrado');
      if (Number(dependency.creado_por) !== Number(userId)) {
        throw new ApiError(403, 'Solo puedes planificar simulacros creados por ti');
      }
      if (Number(dependency.oposicion_id) !== Number(payload.oposicion_id)) {
        throw new ApiError(400, 'El simulacro no pertenece a la oposicion indicada');
      }
    }

    if (payload.tipo === 'tema_recomendado') {
      const temaIds = uniqNumbers(payload.tema_ids);
      const total = await profesorWorkspacePlanificacionRepository.countTemasInOposicion(payload.oposicion_id, temaIds);
      if (total !== temaIds.length) {
        throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
      }
    }
  },

  async create(userId, payload, role = 'profesor') {
    await this.validatePayload(userId, payload);
    const created = await profesorWorkspacePlanificacionRepository.create({
      ...payload,
      creado_por_usuario_id: userId,
      creado_por_rol: role,
    });
    if (payload.tipo === 'tema_recomendado') {
      await profesorWorkspacePlanificacionRepository.replaceTemas(created.id, uniqNumbers(payload.tema_ids));
    }

    const full = await this.get(userId, created.id);
    if (shouldNotify(full)) await this.notifyAlumnos(full);
    return this.get(userId, created.id);
  },

  async update(userId, id, payload) {
    const previous = await this.get(userId, id);
    const merged = { ...previous, ...payload };
    await this.validatePayload(userId, {
      ...merged,
      oposicion_id: Number(merged.oposicion_id),
      simulacro_id: merged.simulacro_id ? Number(merged.simulacro_id) : null,
      plantilla_test_id: merged.plantilla_test_id ? Number(merged.plantilla_test_id) : null,
      tema_ids: payload.tema_ids ?? previous.temas?.map((tema) => tema.id) ?? [],
    });

    await profesorWorkspacePlanificacionRepository.update(id, payload);
    if (payload.tipo && payload.tipo !== 'tema_recomendado') {
      await profesorWorkspacePlanificacionRepository.replaceTemas(id, []);
    } else if (payload.tipo === 'tema_recomendado' || payload.tema_ids) {
      await profesorWorkspacePlanificacionRepository.replaceTemas(id, uniqNumbers(payload.tema_ids ?? []));
    }

    const full = await this.get(userId, id);
    if (shouldNotify(full, previous)) await this.notifyAlumnos(full);
    return this.get(userId, id);
  },

  async archive(userId, id) {
    await this.get(userId, id);
    await profesorWorkspacePlanificacionRepository.archive(id);
    return { id: Number(id), estado: 'archivada' };
  },

  async notifyAlumnos(planificacion) {
    const alumnoIds = await profesorWorkspacePlanificacionRepository.listActiveAlumnoIds(planificacion.oposicion_id);
    if (alumnoIds.length === 0) {
      await profesorWorkspacePlanificacionRepository.markNotificada(planificacion.id);
      return;
    }

    const titulo = 'Nueva actividad en tu Plan de estudio';
    const mensaje = `${planificacion.titulo} ya esta disponible en tu Plan de estudio.`;
    await Promise.all(alumnoIds.map((usuarioId) => notificacionesRepository.crear({
      usuarioId,
      tipo: 'plan_estudio',
      titulo,
      mensaje,
      datosExtra: {
        planificacionId: planificacion.id,
        oposicionId: planificacion.oposicion_id,
        oposicionNombre: planificacion.oposicion_nombre,
        tipo: planificacion.tipo,
      },
    })));
    await profesorWorkspacePlanificacionRepository.markNotificada(planificacion.id);
  },
};
