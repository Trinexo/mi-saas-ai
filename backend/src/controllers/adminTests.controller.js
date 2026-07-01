import { ok, created } from '../utils/response.js';
import { adminTestsService } from '../services/adminTests.service.js';
import { profesorWorkspaceSeleccionService } from '../services/profesorWorkspaceSeleccion.service.js';

export const listTests = async (req, res, next) => {
  try {
    const { q, estado, scope, oposicion_id, page = 1, page_size = 20 } = req.query;
    const data = await adminTestsService.listTests({
      q: q || null,
      estado: estado || null,
      scope: scope || null,
      oposicionId: oposicion_id ?? null,
      page,
      pageSize: page_size,
    }, req.user);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const getTest = async (req, res, next) => {
  try {
    const data = await adminTestsService.getTest(req.params.id, req.user);
    return ok(res, data);
  } catch (e) { return next(e); }
};

export const createTest = async (req, res, next) => {
  try {
    const data = await adminTestsService.createTest(req.body, req.user);
    return created(res, data, 'Test creado');
  } catch (e) { return next(e); }
};

export const updateTest = async (req, res, next) => {
  try {
    const data = await adminTestsService.updateTest(req.params.id, req.body, req.user);
    return ok(res, data, 'Test actualizado');
  } catch (e) { return next(e); }
};

export const deleteTest = async (req, res, next) => {
  try {
    await adminTestsService.deleteTest(req.params.id, req.user);
    return ok(res, null, 'Test eliminado');
  } catch (e) { return next(e); }
};

export const addPreguntas = async (req, res, next) => {
  try {
    const { pregunta_ids } = req.body;
    const data = await adminTestsService.addPreguntas(req.params.id, pregunta_ids, req.user);
    return ok(res, data, 'Preguntas añadidas');
  } catch (e) { return next(e); }
};

export const removePregunta = async (req, res, next) => {
  try {
    await adminTestsService.removePregunta(req.params.id, req.params.preguntaId, req.user);
    return ok(res, null, 'Pregunta eliminada del test');
  } catch (e) { return next(e); }
};

export const setDemoTest = async (req, res, next) => {
  try {
    const activate = req.body.es_demo === true;
    const data = await adminTestsService.setDemoTest(req.params.id, activate, req.user);
    return ok(res, data, activate ? 'Test marcado como demo' : 'Test desmarcado como demo');
  } catch (e) { return next(e); }
};

export const seleccionarPreguntasAdmin = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceSeleccionService.seleccionarAdmin(req.body);
    return ok(res, data);
  } catch (e) { return next(e); }
};
