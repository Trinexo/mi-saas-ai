import { ApiError } from '../utils/api-error.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);

  if (!parsed.success) {
    return next(new ApiError(400, 'Payload inválido', parsed.error.flatten()));
  }

  req[source] = parsed.data;
  next();
};