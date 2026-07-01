import { ok, created } from '../utils/response.js';
import { adminSimulacrosService } from '../services/adminSimulacros.service.js';

// ─── Simulacros ───────────────────────────────────────────────────────────────

export const listSimulacros = async (req, res, next) => {
  try {
    const { q, estado, oposicion_id, scope, page = 1, page_size = 20 } = req.query;
    const data = await adminSimulacrosService.listSimulacros({
      q: q || null,
      estado: estado || null,
      oposicionId: oposicion_id ?? null,
      scope: scope || null,
      page,
      pageSize: page_size,
    }, req.user);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const getSimulacro = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.getSimulacro(req.params.id, req.user);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const createSimulacro = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.createSimulacro(req.body, req.user);
    return created(res, data, 'Simulacro creado');
  } catch (e) { return next(e); }
};

export const updateSimulacro = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.updateSimulacro(req.params.id, req.body, req.user);
    return ok(res, data, 'Simulacro actualizado');
  } catch (e) { return next(e); }
};

export const deleteSimulacro = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.deleteSimulacro(req.params.id);
    return ok(res, data, 'Simulacro eliminado');
  } catch (e) { return next(e); }
};

// ─── Bloques ────────────────────────────────────────────────────────────────

export const createBloque = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.createBloque(
      req.params.id,
      req.body,
      req.user,
    );
    return created(res, data, 'Bloque creado');
  } catch (e) { return next(e); }
};

export const updateBloque = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.updateBloque(req.params.id, req.params.bloqueId, req.body, req.user);
    return ok(res, data, 'Bloque actualizado');
  } catch (e) { return next(e); }
};

export const deleteBloque = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.deleteBloque(req.params.id, req.params.bloqueId, req.user);
    return ok(res, data, 'Bloque eliminado');
  } catch (e) { return next(e); }
};

// ─── Preguntas del bloque ────────────────────────────────────────────────────

export const asignarPreguntas = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.asignarPreguntas(
      req.params.id,
      req.params.bloqueId,
      req.body.pregunta_ids,
      req.user,
    );
    return created(res, data, 'Preguntas asignadas');
  } catch (e) { return next(e); }
};

export const quitarPregunta = async (req, res, next) => {
  try {
    const data = await adminSimulacrosService.quitarPregunta(
      req.params.id,
      req.params.bloqueId,
      req.params.preguntaId,
      req.user,
    );
    return ok(res, data, 'Pregunta quitada del bloque');
  } catch (e) { return next(e); }
};
