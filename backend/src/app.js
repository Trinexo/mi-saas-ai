import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

// En producción restringe CORS al origen del frontend.
// FRONTEND_URL puede ser una lista separada por comas: https://a.com,https://b.com
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true,
  }),
);

// Para el webhook de Stripe se necesita el body crudo; lo guardamos en req.rawBody
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;