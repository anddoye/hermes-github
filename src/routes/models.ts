// ============================================================
// Hermes GitHub — Models Routes (Brain)
// ============================================================

import { Router, Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';
import {
  submitModelExecution,
  getModelExecution,
  listModelExecutions,
  cancelModelExecution,
} from '../services/modelService';
import { ModelStatus } from '../types';

const router = Router();

/**
 * POST /api/models/execute
 * Submit a model execution request.
 */
router.post(
  '/execute',
  asyncHandler(async (req: Request, res: Response) => {
    const { provider, model, prompt, systemPrompt, maxTokens, temperature, topP, metadata } =
      req.body;

    if (!provider || !model || !prompt) {
      res.status(400).json({
        success: false,
        error: 'provider, model, and prompt are required',
      });
      return;
    }

    const execution = await submitModelExecution({
      provider,
      model,
      prompt,
      systemPrompt,
      maxTokens,
      temperature,
      topP,
      metadata,
    });

    sendSuccess(res, execution, 202, 'Model execution submitted');
  })
);

/**
 * GET /api/models/executions/:id
 * Get a model execution by ID.
 */
router.get(
  '/executions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const execution = await getModelExecution(id);
    sendSuccess(res, execution);
  })
);

/**
 * GET /api/models/executions
 * List model executions.
 */
router.get(
  '/executions',
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as ModelStatus | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const executions = await listModelExecutions(status, limit, offset);
    sendSuccess(res, executions);
  })
);

/**
 * POST /api/models/executions/:id/cancel
 * Cancel a model execution.
 */
router.post(
  '/executions/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const execution = await cancelModelExecution(id);
    sendSuccess(res, execution);
  })
);

/**
 * GET /api/models/providers
 * List available model providers and their models.
 */
router.get(
  '/providers',
  asyncHandler(async (_req: Request, res: Response) => {
    const providers = {
      openai: {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      },
      anthropic: {
        name: 'Anthropic',
        models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3.5-sonnet'],
      },
      google: {
        name: 'Google',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      },
      meta: {
        name: 'Meta',
        models: ['llama-3.1-405b', 'llama-3.1-70b', 'llama-3-8b'],
      },
      mistral: {
        name: 'Mistral',
        models: ['mistral-large', 'mistral-medium', 'mistral-small'],
      },
    };

    sendSuccess(res, providers);
  })
);

export default router;
