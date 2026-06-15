import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

const isOposicionPrimaryKeySequenceCollision = (error) => (
  error?.code === '23505'
  && (
    error?.table === 'oposiciones'
    || error?.constraint === 'oposiciones_pkey'
    || String(error?.message ?? '').includes('oposiciones_pkey')
  )
);

const isOposicionSlugCollision = (error) => (
  error?.code === '23505'
  && (
    error?.constraint === 'oposiciones_slug_idx'
    || String(error?.message ?? '').includes('oposiciones_slug_idx')
  )
);

const buildSlug = (nombre) => (
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
  || 'oposicion'
);

export const catalogAdminOposicionService = {
  async listOposicionesConStats({ q, estado, categoria, page, pageSize }) {
    const limit  = pageSize;
    const offset = (page - 1) * pageSize;
    return catalogAdminRepository.listOposicionesConStats({ q, estado, categoria, limit, offset });
  },

  async createOposicion(nombre, descripcion) {
    const baseSlug = buildSlug(nombre);
    let slug = baseSlug;
    let sequenceSynced = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await catalogAdminRepository.createOposicion(nombre, descripcion, slug);
      } catch (error) {
        if (isOposicionPrimaryKeySequenceCollision(error) && !sequenceSynced) {
          await catalogAdminRepository.syncOposicionIdSequence();
          sequenceSynced = true;
          continue;
        }

        if (isOposicionSlugCollision(error) && slug === baseSlug) {
          slug = `${baseSlug}-${Date.now().toString(36)}`;
          continue;
        }

        throw error;
      }
    }

    throw new ApiError(500, 'No se pudo crear la oposicion');
  },

  async updateOposicion(id, fields) {
    const result = await catalogAdminRepository.updateOposicion(id, fields);
    if (!result) throw new ApiError(404, 'Oposición no encontrada');
    return result;
  },

  async deleteOposicion(id) {
    const result = await catalogAdminRepository.deleteOposicion(id);
    if (!result) throw new ApiError(404, 'Oposición no encontrada');
    return result;
  },
};
