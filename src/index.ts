// ============================================================
// Hermes GitHub — Point d'entrée Express
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { appConfig, validateConfig } from './config/github';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import modelsRoutes from './routes/models';
import githubRoutes from './routes/github';
import { HealthCheckResponse } from './types';

dotenv.config();

const app = express();

// ─── Security & Middleware ─────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (appConfig.nodeEnv !== 'test') {
  app.use(morgan(appConfig.nodeEnv === 'development' ? 'dev' : 'combined'));
}

app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ─── Health Check ──────────────────────────────────────────

const startTime = Date.now();

app.get('/health', async (_req, res) => {
  let githubConnected = false;
  let rateLimitInfo = null;

  try {
    const { getRateLimitStatus } = await import('./config/github');
    const rateLimit = await getRateLimitStatus();
    githubConnected = true;
    rateLimitInfo = {
      remaining: rateLimit.remaining,
      limit: rateLimit.limit,
      reset: rateLimit.reset.toISOString(),
    };
  } catch {
    // GitHub not reachable — service is degraded
  }

  const health: HealthCheckResponse = {
    status: githubConnected ? 'healthy' : 'degraded',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    github: {
      connected: githubConnected,
      rateLimit: rateLimitInfo,
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ─── API Routes ────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/github', githubRoutes);

// ─── API Documentation ─────────────────────────────────────

app.get('/api', (_req, res) => {
  res.json({
    name: 'Hermes GitHub API',
    version: '1.0.0',
    description: 'GitHub API for Hermes Agent - Brain intelligence via GitHub Actions',
    endpoints: {
      health: 'GET /health',
      auth: {
        status: 'GET /api/auth/status',
        validateToken: 'POST /api/auth/validate',
      },
      models: {
        providers: 'GET /api/models/providers',
        execute: 'POST /api/models/execute',
        getExecution: 'GET /api/models/executions/:id',
        listExecutions: 'GET /api/models/executions',
        cancelExecution: 'POST /api/models/executions/:id/cancel',
      },
      github: {
        repos: 'GET /api/github/repos',
        getRepo: 'GET /api/github/repos/:owner/:repo',
        issues: 'GET/POST /api/github/repos/:owner/:repo/issues',
        pullRequests: 'GET/POST /api/github/repos/:owner/:repo/pulls',
        workflows: 'GET /api/github/repos/:owner/:repo/workflows',
        workflowRuns: 'GET /api/github/repos/:owner/:repo/workflows/runs',
        dispatchWorkflow: 'POST /api/github/repos/:owner/:repo/workflows/:id/dispatch',
      },
    },
    docs: 'https://github.com/anddoye/hermes-github#readme',
  });
});

// ─── Error Handling ────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Startup ───────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║      🧠  Hermes GitHub API v1.0.0           ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Environment : ${appConfig.nodeEnv.padEnd(30)}║`);
    console.log(`║  Port        : ${String(appConfig.port).padEnd(30)}║`);
    console.log(`║  GitHub API  : ${appConfig.github.baseUrl.padEnd(30)}║`);
    console.log('╚══════════════════════════════════════════════╝');

    app.listen(appConfig.port, () => {
      console.log(`\n✨ Server running at http://localhost:${appConfig.port}`);
      console.log(`📖 API docs at    http://localhost:${appConfig.port}/api`);
      console.log(`💚 Health check : http://localhost:${appConfig.port}/health\n`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Only start if this is the main module (not imported in tests)
if (require.main === module) {
  start();
}

export { app, start };
