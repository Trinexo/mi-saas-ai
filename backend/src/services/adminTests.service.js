import { adminTestsRepository } from '../repositories/adminTests.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const adminTestsService = {
  async getAllowedOposicionIds(caller = {}) {
    if (!isProfesor(caller)) return null;
    const ids = await profesorAccessRepository.listAssignedOposicionIds(caller.userId);
    if (ids.length === 0) throw new ApiError(403, 'No tienes oposiciones asignadas');
    return ids;
  },

  assertOposicionAllowed(oposicionId, allowedIds) {
    if (!allowedIds) return;
    if (!oposicionId || !allowedIds.includes(Number(oposicionId))) {
      throw new ApiError(403, 'No tienes asignada esa oposicion');
    }
  },

  async assertTemaMatchesOposicion(temaId, oposicionId) {
    if (!temaId) return;
    if (!oposicionId) throw new ApiError(400, 'El tema requiere oposicion');
    const temaOposicionId = await profesorAccessRepository.getTemaOposicionId(temaId);
    if (!temaOposicionId) throw new ApiError(404, 'Tema no encontrado');
    if (Number(temaOposicionId) !== Number(oposicionId)) {
      throw new ApiError(400, 'El tema no pertenece a la oposicion seleccionada');
    }
  },

  async assertPreguntasAllowed(preguntaIds, oposicionId, allowedIds) {
    if (!allowedIds) return;
    this.assertOposicionAllowed(oposicionId, allowedIds);
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(403, 'Solo puedes anadir preguntas de tus oposiciones asignadas');
    }
  },

  async assertExistingPreguntasMatchOposicion(testId, oposicionId) {
    const preguntaIds = await adminTestsRepository.getTestPreguntaIds(testId);
    if (preguntaIds.length === 0) return;
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(400, 'No puedes cambiar la oposicion mientras el test contiene preguntas de otra oposicion');
    }
  },

  async listTests({ q, estado, oposicionId, page, pageSize }, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    if (allowedOposicionIds && oposicionId) this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return adminTestsRepository.listTests({ q, estado, oposicionId, allowedOposicionIds, limit, offset });
  },

  async getTest(id, caller = {}) {
    const test = await adminTestsRepository.getTest(id);
    if (!test) throw new ApiError(404, 'Test no encontrado');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(test.oposicion_id, allowedOposicionIds);
    return test;
  },

  async createTest(body, caller = {}) {
    if (!body.nombre?.trim()) throw new ApiError(400, 'El nombre es obligatorio');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(body.oposicion_id, allowedOposicionIds);
    await this.assertTemaMatchesOposicion(body.tema_id, body.oposicion_id);
    const test = await adminTestsRepository.createTest(body, caller.userId);
    return this.getTest(test.id, caller);
  },

  async updateTest(id, body, caller = {}) {
    const current = await this.getTest(id, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    const oposicionId = hasOwn(body, 'oposicion_id') ? body.oposicion_id : current.oposicion_id;
    const temaId = hasOwn(body, 'tema_id') ? body.tema_id : current.tema_id;
    this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    await this.assertTemaMatchesOposicion(temaId, oposicionId);
    await this.assertExistingPreguntasMatchOposicion(id, oposicionId);
    const updated = await adminTestsRepository.updateTest(id, body);
    if (!updated) throw new ApiError(500, 'No se pudo actualizar el test');
    return this.getTest(id, caller);
  },

  async deleteTest(id, caller = {}) {
    await this.getTest(id, caller);
    await adminTestsRepository.deleteTest(id);
  },

  async addPreguntas(testId, preguntaIds, caller = {}) {
    const test = await this.getTest(testId, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    await this.assertPreguntasAllowed(preguntaIds, test.oposicion_id, allowedOposicionIds);
    await adminTestsRepository.addPreguntas(testId, preguntaIds);
    return adminTestsRepository.getTestPreguntas(testId);
  },

  async removePregunta(testId, preguntaId, caller = {}) {
    await this.getTest(testId, caller);
    await adminTestsRepository.removePregunta(testId, preguntaId);
  },
};
