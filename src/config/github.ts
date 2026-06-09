// ============================================================
// Hermes GitHub — Configuration GitHub & Octokit
// ============================================================

import { Octokit } from 'octokit';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { AppConfig, GitHubConfig } from '../types';

dotenv.config();

/**
 * Get GitHub token from environment or gh CLI keyring.
 */
function getGitHubToken(): string {
  // Try environment variable first
  if (process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes('${')) {
    return process.env.GITHUB_TOKEN;
  }

  // Fallback to gh CLI keyring
  try {
    const token = execSync('gh auth token', { encoding: 'utf8' }).trim();
    if (token && !token.includes('${')) {
      return token;
    }
  } catch (err) {
    // gh CLI not available
  }

  return '';
}

/**
 * GitHub configuration from environment variables or gh CLI.
 */
export const githubConfig: GitHubConfig = {
  token: getGitHubToken(),
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
