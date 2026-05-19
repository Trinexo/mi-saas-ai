import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { ApiError } from '../utils/api-error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.join(__dirname, '../..');

// Formatos de audio que admite el navegador vía MediaRecorder
const ALLOWED_AUDIO = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
];

// Extensión para guardar el fichero según el mimetype recibido
function extensionFromMime(mime) {
  if (mime.startsWith('audio/webm')) return 'webm';
  if (mime.startsWith('audio/ogg')) return 'ogg';
  if (mime.startsWith('audio/mp4')) return 'mp4';
  if (mime.startsWith('audio/mpeg')) return 'mp3';
  if (mime.startsWith('audio/wav') || mime.startsWith('audio/x-wav')) return 'wav';
  return 'webm'; // fallback
}

export const uploadAudioMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB máximo (holgado para grabaciones largas)
  fileFilter: (_req, file, cb) => {
    const mimeBase = file.mimetype.split(';')[0].trim();
    if (ALLOWED_AUDIO.some((a) => a.startsWith(mimeBase))) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Formato de audio no permitido.'));
    }
  },
}).single('audio');

/**
 * Guarda el audio grabado en disco organizado por oposición y tema.
 * No re-procesa el audio — el navegador ya entrega Opus comprimido (~32kbps).
 *
 * Ruta: uploads/audios/{oposicionId}/{temaId}/{preguntaId}.{ext}
 *
 * @param {Buffer}  buffer
 * @param {string}  mimetype
 * @param {number}  preguntaId
 * @param {number}  oposicionId
 * @param {number}  temaId
 * @returns {string} URL relativa, ej: /uploads/audios/1/3/42.webm
 */
export function guardarAudioPregunta(buffer, mimetype, preguntaId, oposicionId, temaId) {
  const ext = extensionFromMime(mimetype);
  const dir = path.join(BACKEND_DIR, 'uploads', 'audios', String(oposicionId), String(temaId));
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${preguntaId}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  return `/uploads/audios/${oposicionId}/${temaId}/${filename}`;
}

/**
 * Elimina el archivo de audio a partir de su URL relativa almacenada en BD.
 * @param {string} audioUrl  ej: /uploads/audios/1/3/42.webm
 */
export function eliminarAudioPorUrl(audioUrl) {
  if (!audioUrl) return;
  const filePath = path.join(BACKEND_DIR, audioUrl.replace(/^\//, ''));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
