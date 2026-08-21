import { ok, created } from '../utils/response.js';
import { examenesOficialesService } from '../services/examenesOficiales.service.js';

export const listExamenesOficiales = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.list(req.query, req.user)); } catch (e) { return next(e); }
};
export const getExamenOficial = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.get(req.params.id, req.user)); } catch (e) { return next(e); }
};
export const createExamenOficial = async (req, res, next) => {
  try { return created(res, await examenesOficialesService.create(req.body, req.user), 'Examen oficial creado'); } catch (e) { return next(e); }
};
export const updateExamenOficial = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.update(req.params.id, req.body, req.user)); } catch (e) { return next(e); }
};
export const deleteExamenOficial = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.remove(req.params.id, req.user)); } catch (e) { return next(e); }
};
export const setPreguntasExamenOficial = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.attach(req.params.id, req.body, req.user)); } catch (e) { return next(e); }
};
export const listExamenesPregunta = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.forPregunta(req.params.preguntaId, req.user)); } catch (e) { return next(e); }
};
export const listAniosExamenesOficiales = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.years(req.params.oposicionId, req.user)); } catch (e) { return next(e); }
};
export const createAnioOficial = async (req, res, next) => {
  try { return created(res, await examenesOficialesService.createYear(req.params.oposicionId, req.body.anio, req.user), 'Año oficial creado'); } catch (e) { return next(e); }
};
export const listAniosPregunta = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.questionYears(req.params.preguntaId, req.user)); } catch (e) { return next(e); }
};
export const setAniosPregunta = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.setQuestionYears(req.params.preguntaId, req.body.anioIds, req.user)); } catch (e) { return next(e); }
};
export const listExamenesOposicion = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.listForOposicion({ ...req.query, oposicionId: req.params.oposicionId }, req.user)); } catch (e) { return next(e); }
};
export const listExamenesPreguntaCanonic = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.questionExams(req.params.preguntaId, req.user)); } catch (e) { return next(e); }
};
export const setExamenesPregunta = async (req, res, next) => {
  try { return ok(res, await examenesOficialesService.setQuestionExams(req.params.preguntaId, req.body.examenIds, req.user)); } catch (e) { return next(e); }
};
