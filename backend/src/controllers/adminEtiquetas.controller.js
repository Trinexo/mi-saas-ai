import { ok, created } from '../utils/response.js';
import { adminEtiquetasService } from '../services/adminEtiquetas.service.js';

// ─── Catálogo de etiquetas ────────────────────────────────────────────────────

export const listEtiquetas = async (req, res, next) => {
  try {
    const { q, page = 1, page_size = 50 } = req.query;
    const data = await adminEtiquetasService.listEtiquetas({
      q: q || null,
      page,
      pageSize: page_size,
    });
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const getEtiqueta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.getEtiqueta(req.params.id);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const createEtiqueta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.createEtiqueta(req.body, req.user.userId);
    return created(res, data, 'Etiqueta creada');
  } catch (e) { return next(e); }
};

export const updateEtiqueta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.updateEtiqueta(req.params.id, req.body);
    return ok(res, data, 'Etiqueta actualizada');
  } catch (e) { return next(e); }
};

export const deleteEtiqueta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.deleteEtiqueta(req.params.id);
    return ok(res, data, 'Etiqueta eliminada');
  } catch (e) { return next(e); }
};

// ─── Etiquetas de una pregunta ────────────────────────────────────────────────

export const getEtiquetasDePregunta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.getEtiquetasDePregunta(req.params.preguntaId);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const setEtiquetasDePregunta = async (req, res, next) => {
  try {
    const data = await adminEtiquetasService.setEtiquetasDePregunta(
      req.params.preguntaId,
      req.body.etiqueta_ids,
    );
    return ok(res, data, 'Etiquetas de la pregunta actualizadas');
  } catch (e) { return next(e); }
};
