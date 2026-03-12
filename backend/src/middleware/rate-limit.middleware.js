import { ApiError } from '../utils/api-error.js';

const buckets = new Map();

const buildDefaultKey = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown';

export const rateLimit = ({
  windowMs,
  max,
  keyBuilder = buildDefaultKey,
  message = 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${keyBuilder(req)}`;
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return next(new ApiError(429, message, { retryAfterSeconds }));
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
