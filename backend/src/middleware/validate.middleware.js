import { ApiError } from '../utils/api-error.js';

const sourceErrorMessage = {
  body: 'Payload inválido',
  query: 'Query inválida',
  params: 'Parámetros inválidos',
};

export const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);

  if (!parsed.success) {
    const message = sourceErrorMessage[source] ?? 'Request inválido';
    return next(new ApiError(400, message, parsed.error.flatten()));
  }

  req[source] = parsed.data;
  next();
};