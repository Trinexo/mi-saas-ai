import { examenesOficialesRepository } from '../repositories/examenesOficiales.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';
import { accessContextService } from './accessContext.service.js';

const isProfessor = (caller) => caller?.role === 'profesor';

export const examenesOficialesService = {
  async allowed(caller) {
    if (!isProfessor(caller)) return null;
    const ids = await profesorAccessRepository.listAssignedOposicionIds(caller.userId);
    if (!ids.length) throw new ApiError(403, 'No tienes oposiciones asignadas');
    return ids.map(String);
  },

  async assertAllowed(oposicionId, caller) {
    const ids = await this.allowed(caller);
    if (ids && !ids.includes(String(oposicionId))) throw new ApiError(403, 'No tienes acceso a esta oposición');
  },

  async list(query, caller) {
    const ids = await this.allowed(caller);
    if (caller?.role === 'alumno' && !query.oposicionId) return [];
    if (caller?.role === 'alumno' && query.oposicionId) {
      const contexto = await accessContextService.obtenerContextoUsuario({
        usuarioId: caller.userId,
        oposicionId: query.oposicionId,
        principal: { tipo: 'alumno', usuarioId: caller.userId },
      });
      if (!contexto?.puede_acceder_contenido) throw new ApiError(403, 'No tienes acceso');
    }
    if (ids && query.oposicionId && !ids.includes(String(query.oposicionId))) throw new ApiError(403, 'No tienes acceso a esta oposición');
    const rows = await examenesOficialesRepository.list({ ...query, oposicionId: query.oposicionId ?? (ids?.length === 1 ? ids[0] : null) });
    if (!ids) return rows;
    return rows.filter((row) => ids.includes(String(row.oposicion_id)));
  },

  async get(id, caller) {
    const exam = await examenesOficialesRepository.getById(id);
    if (!exam) throw new ApiError(404, 'Examen oficial no encontrado');
    await this.assertAllowed(exam.oposicion_id, caller);
    return exam;
  },

  async create(payload, caller) {
    await this.assertAllowed(payload.oposicionId, caller);
    const result = await examenesOficialesRepository.create(payload);
    if (!result) throw new ApiError(400, 'El año oficial no existe para esta oposición');
    return result;
  },

  async update(id, payload, caller) {
    const exam = await this.get(id, caller);
    if (payload.oposicionId != null) await this.assertAllowed(payload.oposicionId, caller);
    return examenesOficialesRepository.update(id, payload, exam);
  },

  async remove(id, caller) { await this.get(id, caller); return examenesOficialesRepository.remove(id); },

  async attach(id, payload, caller) {
    const exam = await this.get(id, caller);
    const ids = payload.preguntaIds ?? [];
    if (!ids.length) throw new ApiError(400, 'Debe indicar al menos una pregunta');
    return examenesOficialesRepository.attach(id, ids, payload.ordenes ?? []);
  },

  async forPregunta(preguntaId, caller) {
    const rows = await examenesOficialesRepository.listForPregunta(preguntaId);
    const ids = await this.allowed(caller);
    if (!ids) return rows;
    return rows.filter((row) => ids.includes(String(row.oposicion_id)));
  },

  async years(oposicionId, caller) {
    await this.assertAllowed(oposicionId, caller);
    if (caller?.role === 'alumno') {
      const contexto = await accessContextService.obtenerContextoUsuario({
        usuarioId: caller.userId,
        oposicionId,
        principal: { tipo: 'alumno', usuarioId: caller.userId },
      });
      if (!contexto?.puede_acceder_contenido) throw new ApiError(403, 'No tienes acceso a esta oposición');
    }
    return examenesOficialesRepository.yearsForOposicion(oposicionId);
  },

  async createYear(oposicionId, anio, caller) {
    await this.assertAllowed(oposicionId, caller);
    return examenesOficialesRepository.createYear(oposicionId, anio);
  },

  async questionYears(preguntaId, caller) {
    const oposicionId = await examenesOficialesRepository.getPreguntaOposicionId(preguntaId);
    if (!oposicionId) throw new ApiError(404, 'Pregunta no encontrada');
    await this.assertAllowed(oposicionId, caller);
    return examenesOficialesRepository.listYearsForPregunta(preguntaId);
  },

  async setQuestionYears(preguntaId, yearIds, caller) {
    const oposicionId = await examenesOficialesRepository.getPreguntaOposicionId(preguntaId);
    if (!oposicionId) throw new ApiError(404, 'Pregunta no encontrada');
    await this.assertAllowed(oposicionId, caller);
    return examenesOficialesRepository.setYearsForPregunta(preguntaId, yearIds);
  },

  async listForOposicion(query, caller) {
    await this.assertAllowed(query.oposicionId, caller);
    if (caller?.role === 'alumno') {
      const contexto = await accessContextService.obtenerContextoUsuario({
        usuarioId: caller.userId,
        oposicionId: query.oposicionId,
        principal: { tipo: 'alumno', usuarioId: caller.userId },
      });
      if (!contexto?.puede_acceder_contenido) throw new ApiError(403, 'No tienes acceso');
    }
    const anioIds = query.anio_ids ? query.anio_ids.split(',') : [];
    return examenesOficialesRepository.listForOposicion({ ...query, anioIds });
  },

  async questionExams(preguntaId, caller) {
    const oposicionId = await examenesOficialesRepository.getPreguntaOposicionId(preguntaId);
    if (!oposicionId) throw new ApiError(404, 'Pregunta no encontrada');
    await this.assertAllowed(oposicionId, caller);
    return examenesOficialesRepository.listForPregunta(preguntaId);
  },

  async setQuestionExams(preguntaId, examIds, caller) {
    const oposicionId = await examenesOficialesRepository.getPreguntaOposicionId(preguntaId);
    if (!oposicionId) throw new ApiError(404, 'Pregunta no encontrada');
    await this.assertAllowed(oposicionId, caller);
    const candidates = await examenesOficialesRepository.listForOposicion({ oposicionId });
    const allowed = new Map(candidates.map((exam) => [String(exam.id), exam]));
    for (const examId of examIds) {
      if (!allowed.has(String(examId))) throw new ApiError(400, 'El examen oficial no pertenece a la oposición');
    }
    return examenesOficialesRepository.setForPregunta(preguntaId, [...new Set(examIds.map(String))]);
  },
};
