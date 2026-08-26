import express from 'express';
import cors from 'cors';
import calculationRoutes from './routes/calculationRoutes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Calculation CRUD API
app.use('/api/calculations', calculationRoutes);

// Global Error Handler
app.use(errorHandler);
