import { profesorSimulacrosService } from '../services/profesorSimulacros.service.js';
import { ok, created } from '../utils/response.js';

export const getMisTests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { oposicion_id, q, page = 1, page_size = 20 } = req.query;
    const data = await profesorSimulacrosService.getMisTests(userId, {
      oposicionId: oposicion_id ? Number(oposicion_id) : undefined,
      q,
      page: Number(page),
      pageSize: Number(page_size),
    });
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const getMisSimulacros = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { oposicion_id, estado, q, page = 1, page_size = 20 } = req.query;
    const data = await profesorSimulacrosService.getMisSimulacros(userId, {
      oposicionId: oposicion_id ? Number(oposicion_id) : undefined,
      estado,
      q,
      page: Number(page),
      pageSize: Number(page_size),
    });
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const getSimulacro = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.getSimulacro(req.user.userId, Number(req.params.id));
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const createSimulacro = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.createSimulacro(req.user.userId, req.body);
    created(res, data, 'Simulacro creado');
  } catch (err) {
    next(err);
  }
};

export const updateSimulacro = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.updateSimulacro(
      req.user.userId,
      Number(req.params.id),
      req.body
    );
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const deleteSimulacro = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.deleteSimulacro(req.user.userId, Number(req.params.id));
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const createBloque = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.createBloque(
      req.user.userId,
      Number(req.params.id),
      req.body
    );
    created(res, data, 'Bloque creado');
  } catch (err) {
    next(err);
  }
};

export const updateBloque = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.updateBloque(
      req.user.userId,
      Number(req.params.id),
      Number(req.params.bloqueId),
      req.body
    );
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const deleteBloque = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.deleteBloque(
      req.user.userId,
      Number(req.params.id),
      Number(req.params.bloqueId)
    );
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const asignarPreguntas = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.asignarPreguntas(
      req.user.userId,
      Number(req.params.id),
      Number(req.params.bloqueId),
      req.body.pregunta_ids
    );
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const quitarPregunta = async (req, res, next) => {
  try {
    const data = await profesorSimulacrosService.quitarPregunta(
      req.user.userId,
      Number(req.params.id),
      Number(req.params.bloqueId),
      Number(req.params.preguntaId)
    );
    ok(res, data);
  } catch (err) {
    next(err);
  }
};
