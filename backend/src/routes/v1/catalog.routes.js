import { Router } from 'express';
import {
  getMaterias,
  getOposiciones,
  getPreguntas,
  getTemas,
} from '../../controllers/catalog.controller.js';

const router = Router();

router.get('/oposiciones', getOposiciones);
router.get('/materias', getMaterias);
router.get('/temas', getTemas);
router.get('/preguntas', getPreguntas);

export default router;