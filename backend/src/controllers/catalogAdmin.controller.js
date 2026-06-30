import { ok, created } from '../utils/response.js';
import { catalogAdminService } from '../services/catalogAdmin.service.js';

// --- OPOSICIONES ---
export const listOposiciones = async (req, res, next) => {
  try {
    const { q, estado, categoria, page = 1, page_size = 20 } = req.query;
    const data = await catalogAdminService.listOposicionesConStats({
      q: q || null,
      estado: estado || null,
      categoria: categoria || null,
      page,
      pageSize: page_size,
    });
    return ok(res, data);
  } catch (e) { return next(e); }
};

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

// --- TEMAS ---
export const createTema = async (req, res, next) => {
  try {
    const data = await catalogAdminService.createTema(req.body.oposicion_id, req.body.nombre);
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

// --- BLOQUES ---
export const createBloque = async (req, res, next) => {
  try {
    const data = await catalogAdminService.createBloque(req.body.tema_id, req.body.nombre);
    return created(res, data, 'Bloque creado');
  } catch (e) { return next(e); }
};

export const updateBloque = async (req, res, next) => {
  try {
    const data = await catalogAdminService.updateBloque(req.params.id, req.body.nombre);
    return ok(res, data, 'Bloque actualizado');
  } catch (e) { return next(e); }
};

export const deleteBloque = async (req, res, next) => {
  try {
    const data = await catalogAdminService.deleteBloque(req.params.id);
    return ok(res, data, 'Bloque eliminado');
  } catch (e) { return next(e); }
};
