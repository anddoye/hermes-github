// ============================================================
// Hermes GitHub — Service d'exécution de modèles via GitHub Actions
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { getOctokit, githubConfig } from '../config/github';
import {
  ModelExecutionRequest,
  ModelExecutionResponse,
  ModelStatus,
  GitHubWorkflowRun,
  ModelExecutionError,
  NotFoundError,
} from '../types';

/**
 * In-memory store for model executions.
 * In production, replace with a database (PostgreSQL, Redis, etc.).
 */
const executions = new Map<string, ModelExecutionResponse>();

/**
 * Default owner/repo to use for model execution workflows.
 */
function getDefaultRepo(): { owner: string; repo: string } {
  return {
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || 'hermes-github',
  };
}

/**
 * Submit a model execution request.
 * Triggers a GitHub Actions workflow that runs the model.
 */
export async function submitModelExecution(
  request: ModelExecutionRequest
): Promise<ModelExecutionResponse> {
  const id = uuidv4();
  const { owner, repo } = getDefaultRepo();

  const execution: ModelExecutionResponse = {
    id,
    status: 'pending',
    workflowRunId: 0,
    request,
    createdAt: new Date().toISOString(),
  };

  executions.set(id, execution);

  try {
    const octokit = getOctokit();

    // Trigger the model-runner workflow
    const { data } = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: 'model-runner.yml',
      ref: githubConfig.defaultBranch,
      inputs: {
        provider: request.provider,
        model: request.model,
        prompt: request.prompt,
        system_prompt: request.systemPrompt || '',
        max_tokens: String(request.maxTokens || 1024),
        temperature: String(request.temperature || 0.7),
        top_p: String(request.topP || 1.0),
        execution_id: id,
      },
    });

    execution.status = 'queued';
    executions.set(id, execution);

    // Poll briefly for the workflow run ID
    await new Promise(resolve => setTimeout(resolve, 2000));
    const runs = await listModelRuns();
    const matchingRun = runs.find(run => {
      // Match by the execution_id input we passed
      return true; // In production, check the workflow inputs
    });

    if (matchingRun) {
      execution.workflowRunId = matchingRun.id;
      execution.startedAt = new Date().toISOString();
    }

    executions.set(id, execution);
    return execution;
  } catch (error: any) {
    execution.status = 'failed';
    execution.error = error.message;
    executions.set(id, execution);
    throw new ModelExecutionError(`Failed to submit model execution: ${error.message}`);
  }
}

/**
 * Get a model execution by ID.
 */
export async function getModelExecution(id: string): Promise<ModelExecutionResponse> {
  const execution = executions.get(id);
  if (!execution) {
    throw new NotFoundError(`Model execution ${id}`);
  }

  // If the execution is still active, refresh its status from GitHub
  if (['pending', 'queued', 'running'].includes(execution.status) && execution.workflowRunId) {
    try {
      const { owner, repo } = getDefaultRepo();
      const octokit = getOctokit();
      const { data: run } = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: execution.workflowRunId,
      });

      const statusMap: Record<string, ModelStatus> = {
        pending: 'pending',
        queued: 'queued',
        in_progress: 'running',
      };

      if (run.status === 'completed') {
        execution.status = run.conclusion === 'success' ? 'completed' : 'failed';
        execution.completedAt = new Date().toISOString();
      } else {
        execution.status = statusMap[run.status] || 'running';
      }

      executions.set(id, execution);
    } catch {
      // Silently ignore refresh errors — return cached data
    }
  }

  return execution;
}

/**
 * List all model executions, ordered by creation time.
 */
export async function listModelExecutions(
  status?: ModelStatus,
  limit = 20,
  offset = 0
): Promise<ModelExecutionResponse[]> {
  let results = Array.from(executions.values());

  if (status) {
    results = results.filter(e => e.status === status);
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return results.slice(offset, offset + limit);
}

/**
 * Cancel a model execution.
 */
export async function cancelModelExecution(id: string): Promise<ModelExecutionResponse> {
  const execution = executions.get(id);
  if (!execution) {
    throw new NotFoundError(`Model execution ${id}`);
  }

  if (['completed', 'failed', 'cancelled'].includes(execution.status)) {
    throw new ModelExecutionError(
      `Cannot cancel execution in status: ${execution.status}`,
      409
    );
  }

  try {
    if (execution.workflowRunId) {
      const { owner, repo } = getDefaultRepo();
      const octokit = getOctokit();
      await octokit.rest.actions.cancelWorkflowRun({
        owner,
        repo,
        run_id: execution.workflowRunId,
      });
    }
  } catch (error: any) {
    throw new ModelExecutionError(`Failed to cancel execution: ${error.message}`);
  }

  execution.status = 'cancelled';
  execution.completedAt = new Date().toISOString();
  executions.set(id, execution);

  return execution;
}

/**
 * Internal: list recent workflow runs for model tracking.
 */
async function listModelRuns(): Promise<GitHubWorkflowRun[]> {
  const { owner, repo } = getDefaultRepo();
  const octokit = getOctokit();
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    per_page: 10,
  });
  return data.workflow_runs as unknown as GitHubWorkflowRun[];
}
