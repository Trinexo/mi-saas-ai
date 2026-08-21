import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

const isTemaPrimaryKeySequenceCollision = (error) => (
  error?.code === '23505'
  && (
    error?.table === 'temas'
    || ['temas_pkey', 'materias_pkey'].includes(error?.constraint)
    || String(error?.message ?? '').includes('temas_pkey')
    || String(error?.message ?? '').includes('materias_pkey')
  )
);

export const catalogAdminTaxonomiaService = {
  async createTema(oposicionId, nombre) {
    try {
      return await catalogAdminRepository.createTema(oposicionId, nombre);
    } catch (error) {
      if (!isTemaPrimaryKeySequenceCollision(error)) throw error;

      await catalogAdminRepository.syncTemaIdSequence();
      return catalogAdminRepository.createTema(oposicionId, nombre);
    }
  },

  async updateTema(id, nombre) {
    const result = await catalogAdminRepository.updateTema(id, nombre);
    if (!result) throw new ApiError(404, 'Tema no encontrado');
    return result;
  },

  async deleteTema(id) {
    const dependencies = await catalogAdminRepository.getTemaDeleteDependencies(id);
    const preguntas = Number(dependencies.preguntas ?? 0);
    const colecciones = Number(dependencies.colecciones ?? 0);
    const otrasDependencias = [
      ['admin_tests', 'tests administrativos'],
      ['admin_tests_temas', 'relaciones de tests administrativos'],
      ['albacer_modulo_temas', 'módulos Albacer'],
      ['planificacion_academica_temas', 'planificaciones académicas'],
      ['progreso_usuario', 'registros de progreso'],
      ['simulacros_configuracion_temas', 'configuraciones de simulacros'],
      ['tests', 'tests'],
    ];

    if (preguntas > 0) {
      throw new ApiError(409, `No se puede eliminar este tema porque tiene ${preguntas} ${preguntas === 1 ? 'pregunta asociada' : 'preguntas asociadas'}. Reasigna o elimina las preguntas antes de eliminarlo.`);
    }
    if (colecciones > 0) {
      throw new ApiError(409, `No se puede eliminar este tema porque tiene ${colecciones} ${colecciones === 1 ? 'colección asociada' : 'colecciones asociadas'}. Elimina las colecciones antes de eliminarlo.`);
    }

    const dependencia = otrasDependencias
      .map(([key, label]) => ({ count: Number(dependencies[key] ?? 0), label }))
      .find(({ count }) => count > 0);
    if (dependencia) {
      throw new ApiError(409, `No se puede eliminar este tema porque tiene ${dependencia.count} ${dependencia.label} asociadas. Elimina las dependencias antes de eliminarlo.`);
    }

    let result;
    try {
      result = await catalogAdminRepository.deleteTema(id);
    } catch (error) {
      if (error?.code === '23503') {
        throw new ApiError(409, 'No se puede eliminar este tema porque tiene contenido asociado. Reasigna o elimina las dependencias antes de eliminarlo.');
      }
      throw error;
    }
    if (!result) {
      const remaining = await catalogAdminRepository.getTemaDeleteDependencies(id);
      if (Object.values(remaining).some((count) => Number(count ?? 0) > 0)) {
        throw new ApiError(409, 'No se puede eliminar este tema porque tiene contenido asociado. Reasigna o elimina las dependencias antes de eliminarlo.');
      }
      throw new ApiError(404, 'Tema no encontrado');
    }
    return result;
  },

  async createBloque(temaId, nombre) {
    return catalogAdminRepository.createBloque(temaId, nombre);
  },

  async updateBloque(id, nombre) {
    const result = await catalogAdminRepository.updateBloque(id, nombre);
    if (!result) throw new ApiError(404, 'Bloque no encontrado');
    return result;
  },

  async deleteBloque(id) {
    const result = await catalogAdminRepository.deleteBloque(id);
    if (!result) throw new ApiError(404, 'Bloque no encontrado');
    return result;
  },
};
