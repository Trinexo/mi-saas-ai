import { ApiError } from '../utils/api-error.js';

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
};

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};