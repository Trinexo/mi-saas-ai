import { ok, created } from '../utils/response.js';
import { albacerModulosService } from '../services/albacerModulos.service.js';

export const listAlbacerModulos = async (req, res, next) => {
  try {
    const { q, estado, oposicion_id, page = 1, page_size = 20 } = req.query;
    const data = await albacerModulosService.list({
      q: q || null,
      estado: estado || null,
      oposicionId: oposicion_id ? Number(oposicion_id) : null,
      page: Number(page),
      pageSize: Number(page_size),
    }, req.user);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getAlbacerModulo = async (req, res, next) => {
  try {
    const data = await albacerModulosService.get(req.params.id, req.user);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const createAlbacerModulo = async (req, res, next) => {
  try {
    const data = await albacerModulosService.create(req.body, req.user);
    return created(res, data, 'Modulo Albacer creado');
  } catch (error) {
    return next(error);
  }
};

export const updateAlbacerModulo = async (req, res, next) => {
  try {
    const data = await albacerModulosService.update(req.params.id, req.body, req.user);
    return ok(res, data, 'Modulo Albacer actualizado');
  } catch (error) {
    return next(error);
  }
};

export const deleteAlbacerModulo = async (req, res, next) => {
  try {
    await albacerModulosService.delete(req.params.id, req.user);
    return ok(res, null, 'Modulo Albacer eliminado');
  } catch (error) {
    return next(error);
  }
};

export const listAlbacerModuloItems = async (req, res, next) => {
  try {
    const data = await albacerModulosService.listItems(req.params.id, req.user);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const createAlbacerModuloItem = async (req, res, next) => {
  try {
    const data = await albacerModulosService.createItem(req.params.id, req.body, req.user);
    return created(res, data, 'Contenido anadido al modulo');
  } catch (error) {
    return next(error);
  }
};

export const updateAlbacerModuloItem = async (req, res, next) => {
  try {
    const data = await albacerModulosService.updateItem(req.params.id, req.params.itemId, req.body, req.user);
    return ok(res, data, 'Contenido del modulo actualizado');
  } catch (error) {
    return next(error);
  }
};

export const deleteAlbacerModuloItem = async (req, res, next) => {
  try {
    await albacerModulosService.deleteItem(req.params.id, req.params.itemId, req.user);
    return ok(res, null, 'Contenido eliminado del modulo');
  } catch (error) {
    return next(error);
  }
};
