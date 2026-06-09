// ============================================================
// Hermes GitHub — Type Definitions
// ============================================================

// --- GitHub Types ---

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  due_on: string | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  user: GitHubUser;
  head: { ref: string; sha: string; repo: GitHubRepo };
  base: { ref: string; sha: string; repo: GitHubRepo };
  merged: boolean;
  mergeable: boolean | null;
  draft: boolean;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  html_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  head_branch: string;
  head_sha: string;
  event: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_attempt: number;
}

export interface GitHubWorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  steps: GitHubWorkflowStep[];
  started_at: string | null;
  completed_at: string | null;
}

export interface GitHubWorkflowStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface GitHubWorkflowDispatchInput {
  [key: string]: string;
}

export interface GitHubWebhookPayload {
  action: string;
  repository: GitHubRepo;
  sender: GitHubUser;
  [key: string]: unknown;
}

// --- Model Execution Types ---

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'cohere' | 'mistral';

export type ModelStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ModelExecutionRequest {
  provider: ModelProvider;
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  metadata?: Record<string, string>;
}

export interface ModelExecutionResponse {
  id: string;
  status: ModelStatus;
  workflowRunId: number;
  request: ModelExecutionRequest;
  result?: string;
  usage?: ModelUsage;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  durationMs?: number;
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  github: {
    connected: boolean;
    rateLimit: {
      remaining: number;
      limit: number;
      reset: string;
    } | null;
  };
}

// --- Configuration Types ---

export interface GitHubConfig {
  token: string;
  baseUrl: string;
  org?: string;
  defaultBranch: string;
  pollingIntervalMs: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  rateLimit: {
    windowMs: number;
    max: number;
  };
  github: GitHubConfig;
}

// --- Error Types ---

export class HermesError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'HermesError';
  }
}

export class GitHubAPIError extends HermesError {
  constructor(message: string, statusCode: number = 502, details?: unknown) {
    super(message, statusCode, 'GITHUB_API_ERROR', details);
    this.name = 'GitHubAPIError';
  }
}

export class ModelExecutionError extends HermesError {
  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message, statusCode, 'MODEL_EXECUTION_ERROR', details);
    this.name = 'ModelExecutionError';
  }
}

export class AuthenticationError extends HermesError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends HermesError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
