import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;