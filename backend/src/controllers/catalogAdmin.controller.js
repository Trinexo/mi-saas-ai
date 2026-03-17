import { ok, created } from '../utils/response.js';
import { catalogAdminService } from '../services/catalogAdmin.service.js';

// --- OPOSICIONES ---
export const createOposicion = async (req, res, next) => {
  try {
    const data = await catalogAdminService.createOposicion(req.body.nombre, req.body.descripcion);
    return created(res, data, 'Oposición creada');
  } catch (e) { return next(e); }
};

export const updateOposicion = async (req, res, next) => {
  try {
    const data = await catalogAdminService.updateOposicion(req.params.id, req.body);
    return ok(res, data, 'Oposición actualizada');
  } catch (e) { return next(e); }
};

export const deleteOposicion = async (req, res, next) => {
  try {
    const data = await catalogAdminService.deleteOposicion(req.params.id);
    return ok(res, data, 'Oposición eliminada');
  } catch (e) { return next(e); }
};

// --- MATERIAS ---
export const createMateria = async (req, res, next) => {
  try {
    const data = await catalogAdminService.createMateria(req.body.oposicion_id, req.body.nombre);
    return created(res, data, 'Materia creada');
  } catch (e) { return next(e); }
};

export const updateMateria = async (req, res, next) => {
  try {
    const data = await catalogAdminService.updateMateria(req.params.id, req.body.nombre);
    return ok(res, data, 'Materia actualizada');
  } catch (e) { return next(e); }
};

export const deleteMateria = async (req, res, next) => {
  try {
    const data = await catalogAdminService.deleteMateria(req.params.id);
    return ok(res, data, 'Materia eliminada');
  } catch (e) { return next(e); }
};

// --- TEMAS ---
export const createTema = async (req, res, next) => {
  try {
    const data = await catalogAdminService.createTema(req.body.materia_id, req.body.nombre);
    return created(res, data, 'Tema creado');
  } catch (e) { return next(e); }
};

export const updateTema = async (req, res, next) => {
  try {
    const data = await catalogAdminService.updateTema(req.params.id, req.body.nombre);
    return ok(res, data, 'Tema actualizado');
  } catch (e) { return next(e); }
};

export const deleteTema = async (req, res, next) => {
  try {
    const data = await catalogAdminService.deleteTema(req.params.id);
    return ok(res, data, 'Tema eliminado');
  } catch (e) { return next(e); }
};
