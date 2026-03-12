import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getMaterias,
  getOposiciones,
  getPreguntas,
  getTemas,
} from '../../controllers/catalog.controller.js';
import { materiasQuerySchema, preguntasQuerySchema, temasQuerySchema } from '../../schemas/catalog.schema.js';

const router = Router();

router.get('/oposiciones', getOposiciones);
router.get('/materias', validate(materiasQuerySchema, 'query'), getMaterias);
router.get('/temas', validate(temasQuerySchema, 'query'), getTemas);
router.get('/preguntas', validate(preguntasQuerySchema, 'query'), getPreguntas);

export default router;