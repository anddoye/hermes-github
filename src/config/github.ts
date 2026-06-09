// ============================================================
// Hermes GitHub — Configuration GitHub & Octokit
// ============================================================

import { Octokit } from 'octokit';
import dotenv from 'dotenv';
import { AppConfig, GitHubConfig } from '../types';

dotenv.config();

/**
 * GitHub configuration from environment variables.
 */
export const githubConfig: GitHubConfig = {
  token: process.env.GITHUB_TOKEN || '',
  baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
  org: process.env.GITHUB_ORG,
  defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main',
  pollingIntervalMs: parseInt(process.env.GITHUB_POLLING_INTERVAL || '5000', 10),
};

/**
 * Application configuration.
 */
export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  github: githubConfig,
};

/**
 * Validate that required configuration is present.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!githubConfig.token || githubConfig.token === 'ghp_your_token_here') {
    errors.push('GITHUB_TOKEN is required. Set it in .env file.');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

/**
 * Create an authenticated Octokit instance.
 * Cached for reuse across the application.
 */
let _octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({
      auth: githubConfig.token,
      baseUrl: githubConfig.baseUrl,
      request: {
        timeout: 30000,
      },
    });
  }
  return _octokit;
}

/**
 * Reset Octokit instance (e.g., after token rotation).
 */
export function resetOctokit(): void {
  _octokit = null;
}

/**
 * Check GitHub rate limit status.
 */
export async function getRateLimitStatus(): Promise<{
  remaining: number;
  limit: number;
  reset: Date;
}> {
  const octokit = getOctokit();
  const { data } = await octokit.rest.rateLimit.get();
  return {
    remaining: data.resources.core.remaining,
    limit: data.resources.core.limit,
    reset: new Date(data.resources.core.reset * 1000),
  };
}
