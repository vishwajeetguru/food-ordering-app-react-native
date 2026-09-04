import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { env } from './config/env';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import apiRoutes from './routes';

const app = express();

// Trust proxy for correct IP when behind Railway/Vercel/Nginx (rate-limit needs real IP)
app.set('trust proxy', 1);

// Security — Helmet with sensible defaults, CORS strict in prod
app.use(
  helmet({
    contentSecurityPolicy: false, // API only, no CSP needed
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// Explicit CORS handling — fail-closed in production
const corsOrigins = env.CORS_ORIGIN;
const isWildcard = corsOrigins === '*';
if (isWildcard && env.NODE_ENV === 'production') {
  throw new Error('CORS_ORIGIN=* not allowed in production');
}
app.use(
  cors({
    origin: isWildcard ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    credentials: !isWildcard, // credentials:true with * is invalid; disable when wildcard
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing — increased to 100kb for orders with images (was 10kb too low for items[]+address)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request ID for tracing — crypto-secure UUID, attached to res header and logger context
app.use((req, res, next) => {
  const id = crypto.randomUUID();
  (req as any).id = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// Health endpoint (public, no rate limit)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Foody backend is running',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Foody API v1',
    data: {
      version: '1.0.0',
      docs: '/api/v1',
      health: '/health',
    },
  });
});

// API v1 — single versioned base path (canonical)
app.use('/api/v1', apiLimiter, apiRoutes);

// Note: /api alias removed for security/clarity — use /api/v1 only

// 404
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
