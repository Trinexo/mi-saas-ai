import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';
import { ApiError } from '../utils/api-error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Raíz del backend (backend/)
const BACKEND_DIR = path.join(__dirname, '../..');

// Multer: almacenamiento en memoria para procesarlo con Sharp antes de guardar
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Formato de imagen no permitido. Usa JPG, PNG o WebP.'));
    }
  },
}).single('imagen');

/**
 * Procesa la imagen subida con Sharp y la guarda organizada por oposición/tema:
 * - Ruta: uploads/preguntas/{oposicionId}/{temaId}/{preguntaId}.webp
 * - Convierte a WebP, calidad 75, máx 1200px de ancho
 *
 * @param {Buffer} buffer
 * @param {number} preguntaId
 * @param {number} oposicionId
 * @param {number} temaId
 * @returns {string} URL relativa, ej: /uploads/preguntas/1/3/42.webp
 */
export async function procesarImagenPregunta(buffer, preguntaId, oposicionId, temaId) {
  const dir = path.join(BACKEND_DIR, 'uploads', 'preguntas', String(oposicionId), String(temaId));
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${preguntaId}.webp`;
  const destPath = path.join(dir, filename);

  await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(destPath);

  return `/uploads/preguntas/${oposicionId}/${temaId}/${filename}`;
}

/**
 * Elimina el archivo de imagen a partir de su URL relativa almacenada en BD.
 * @param {string} imagenUrl  ej: /uploads/preguntas/1/3/42.webp
 */
export function eliminarImagenPorUrl(imagenUrl) {
  if (!imagenUrl) return;
  const filePath = path.join(BACKEND_DIR, imagenUrl.replace(/^\//, ''));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
