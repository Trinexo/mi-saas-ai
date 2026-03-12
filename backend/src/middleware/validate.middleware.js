import { ApiError } from '../utils/api-error.js';

export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return next(new ApiError(400, 'Payload inválido', parsed.error.flatten()));
  }

  req.body = parsed.data;
  next();
};