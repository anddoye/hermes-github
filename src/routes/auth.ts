// ============================================================
// Hermes GitHub — Auth Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { getRateLimitStatus, getOctokit } from '../config/github';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';
import { AuthenticationError } from '../types';

const router = Router();

/**
 * GET /api/auth/status
 * Check authentication status and rate limits.
 */
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const rateLimit = await getRateLimitStatus();
      const octokit = getOctokit();

      let user: { login: string; name: string } | null = null;
      try {
        const { data } = await octokit.rest.users.getAuthenticated();
        user = { login: data.login, name: data.name || data.login };
      } catch {
        // User info fetch failed — token may be invalid
      }

      sendSuccess(res, {
        authenticated: !!user,
        user,
        rateLimit: {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          reset: rateLimit.reset.toISOString(),
          percentUsed: Math.round(
            ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100
          ),
        },
      });
    } catch (error: any) {
      throw new AuthenticationError(error.message);
    }
  })
);

/**
 * POST /api/auth/validate
 * Validate a GitHub token.
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new AuthenticationError('Token is required');
    }

    try {
      const { Octokit } = await import('octokit');
      const testOctokit = new Octokit({ auth: token });
      const { data: user } = await testOctokit.rest.users.getAuthenticated();
      const { data: rateLimit } = await testOctokit.rest.rateLimit.get();

      sendSuccess(res, {
        valid: true,
        user: { login: user.login, name: user.name || user.login },
        scopes: (testOctokit as any).auth?.tokenType === 'oauth'
          ? [] // OAuth tokens — scopes not easily introspected
          : ['repo', 'workflow', 'read:org'], // PAT — assume standard scopes
        rateLimit: {
          remaining: rateLimit.resources.core.remaining,
          limit: rateLimit.resources.core.limit,
        },
      });
    } catch (error: any) {
      sendSuccess(res, {
        valid: false,
        error: error.message,
      });
    }
  })
);

export default router;
