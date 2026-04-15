import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { adminProfesoresGestionRepository } from '../repositories/adminProfesoresGestion.repository.js';

export const adminPanelProfesoresCrudService = {
  async listProfesores(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminProfesoresGestionRepository.listProfesores(
      { q: query.q },
      pageSize,
      offset,
    );
    return {
      items: rows.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        fechaRegistro: u.fecha_registro,
        oposicionesCount: u.oposiciones_count,
      })),
      pagination: { page, pageSize, total },
    };
  },

  async createProfesor({ nombre, email, password }) {
    const exists = await adminProfesoresGestionRepository.findByEmail(email);
    if (exists) throw new ApiError(409, 'El email ya está registrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await adminProfesoresGestionRepository.createProfesor({ nombre, email, passwordHash });
    return { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
  },

  async updateProfesor(id, { nombre, email }) {
    const existing = await adminProfesoresGestionRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Profesor no encontrado');
    if (email && email !== existing.email) {
      const taken = await adminProfesoresGestionRepository.findByEmail(email);
      if (taken) throw new ApiError(409, 'El email ya está en uso por otro usuario');
    }
    const updated = await adminProfesoresGestionRepository.updateProfesor(id, { nombre, email });
    if (!updated) throw new ApiError(404, 'Profesor no encontrado');
    return { id: updated.id, nombre: updated.nombre, email: updated.email };
  },

  async deleteProfesor(id, requestingUser) {
    if (String(requestingUser.userId) === String(id)) {
      throw new ApiError(400, 'No puedes eliminarte a ti mismo');
    }
    const deleted = await adminProfesoresGestionRepository.deleteProfesor(id);
    if (!deleted) throw new ApiError(404, 'Profesor no encontrado');
    return { id: deleted.id };
  },
};
