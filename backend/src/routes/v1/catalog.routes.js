import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getBloques,
  getColecciones,
  getOposiciones,
  getPreguntas,
  getTemas,
} from '../../controllers/catalog.controller.js';
import { bloquesQuerySchema, preguntasQuerySchema, temasByOposicionQuerySchema } from '../../schemas/catalog.schema.js';

const router = Router();

router.get('/oposiciones', getOposiciones);
router.get('/temas', validate(temasByOposicionQuerySchema, 'query'), getTemas);
router.get('/bloques', validate(bloquesQuerySchema, 'query'), getBloques);
router.get('/colecciones', validate(bloquesQuerySchema, 'query'), getColecciones);
router.get('/preguntas', validate(preguntasQuerySchema, 'query'), getPreguntas);

export default router;