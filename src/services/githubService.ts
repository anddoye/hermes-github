// ============================================================
// Hermes GitHub — Service GitHub (Issues, PRs, Workflows)
// ============================================================

import { getOctokit, githubConfig } from '../config/github';
import {
  GitHubRepo,
  GitHubIssue,
  GitHubPullRequest,
  GitHubWorkflowRun,
  GitHubWorkflowJob,
  GitHubAPIError,
  NotFoundError,
} from '../types';

// ─── Repository Operations ─────────────────────────────────

export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data as unknown as GitHubRepo;
  } catch (error: any) {
    if (error.status === 404) throw new NotFoundError(`Repository ${owner}/${repo}`);
    throw new GitHubAPIError(`Failed to get repo: ${error.message}`, error.status);
  }
}

export async function listRepos(perPage = 30, page = 1): Promise<GitHubRepo[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: perPage,
      page,
      sort: 'updated',
    });
    return data as unknown as GitHubRepo[];
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to list repos: ${error.message}`, error.status);
  }
}

// ─── Issue Operations ──────────────────────────────────────

export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[],
  assignees?: string[]
): Promise<GitHubIssue> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees,
    });
    return data as unknown as GitHubIssue;
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to create issue: ${error.message}`, error.status);
  }
}

export async function listIssues(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30,
  page = 1
): Promise<GitHubIssue[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: perPage,
      page,
    });
    return data as unknown as GitHubIssue[];
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to list issues: ${error.message}`, error.status);
  }
}

export async function getIssue(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssue> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.get({ owner, repo, issue_number: issueNumber });
    return data as unknown as GitHubIssue;
  } catch (error: any) {
    if (error.status === 404) throw new NotFoundError(`Issue #${issueNumber}`);
    throw new GitHubAPIError(`Failed to get issue: ${error.message}`, error.status);
  }
}

export async function updateIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  updates: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }
): Promise<GitHubIssue> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...updates,
    });
    return data as unknown as GitHubIssue;
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to update issue: ${error.message}`, error.status);
  }
}

export async function addIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<{ id: number; body: string; html_url: string }> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
    return { id: data.id, body: data.body || '', html_url: data.html_url };
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to add comment: ${error.message}`, error.status);
  }
}

// ─── Pull Request Operations ───────────────────────────────

export async function createPR(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string = githubConfig.defaultBranch,
  body?: string,
  draft = false
): Promise<GitHubPullRequest> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
    });
    return data as unknown as GitHubPullRequest;
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to create PR: ${error.message}`, error.status);
  }
}

export async function listPRs(
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30,
  page = 1
): Promise<GitHubPullRequest[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: perPage,
      page,
    });
    return data as unknown as GitHubPullRequest[];
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to list PRs: ${error.message}`, error.status);
  }
}

export async function getPR(
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPullRequest> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
    return data as unknown as GitHubPullRequest;
  } catch (error: any) {
    if (error.status === 404) throw new NotFoundError(`PR #${prNumber}`);
    throw new GitHubAPIError(`Failed to get PR: ${error.message}`, error.status);
  }
}

export async function mergePR(
  owner: string,
  repo: string,
  prNumber: number,
  method: 'merge' | 'squash' | 'rebase' = 'merge',
  commitTitle?: string
): Promise<{ merged: boolean; message: string; sha: string }> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      merge_method: method,
      commit_title: commitTitle,
    });
    return { merged: data.merged, message: data.message, sha: data.sha };
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to merge PR: ${error.message}`, error.status);
  }
}

// ─── Workflow Operations ───────────────────────────────────

export async function listWorkflows(
  owner: string,
  repo: string
): Promise<{ id: number; name: string; path: string; state: string }[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
    return data.workflows.map(w => ({
      id: w.id,
      name: w.name,
      path: w.path,
      state: w.state,
    }));
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to list workflows: ${error.message}`, error.status);
  }
}

export async function triggerWorkflow(
  owner: string,
  repo: string,
  workflowId: number | string,
  ref: string = githubConfig.defaultBranch,
  inputs?: Record<string, string>
): Promise<void> {
  try {
    const octokit = getOctokit();
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: typeof workflowId === 'number' ? workflowId : workflowId,
      ref,
      inputs,
    });
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to trigger workflow: ${error.message}`, error.status);
  }
}

export async function listWorkflowRuns(
  owner: string,
  repo: string,
  workflowId?: number,
  perPage = 30,
  page = 1
): Promise<GitHubWorkflowRun[]> {
  try {
    const octokit = getOctokit();
    const params: any = { owner, repo, per_page: perPage, page };
    if (workflowId) params.workflow_id = workflowId;
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo(params);
    return data.workflow_runs as unknown as GitHubWorkflowRun[];
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to list workflow runs: ${error.message}`, error.status);
  }
}

export async function getWorkflowRun(
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubWorkflowRun> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.actions.getWorkflowRun({ owner, repo, run_id: runId });
    return data as unknown as GitHubWorkflowRun;
  } catch (error: any) {
    if (error.status === 404) throw new NotFoundError(`Workflow run ${runId}`);
    throw new GitHubAPIError(`Failed to get workflow run: ${error.message}`, error.status);
  }
}

export async function getWorkflowRunLogs(
  owner: string,
  repo: string,
  runId: number
): Promise<string> {
  try {
    const octokit = getOctokit();
    const response = await octokit.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId,
    });
    // response.data is a redirect to the zip download
    // For now, return the redirect URL
    return response.url;
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to get workflow logs: ${error.message}`, error.status);
  }
}

export async function getWorkflowRunJobs(
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubWorkflowJob[]> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return data.jobs as unknown as GitHubWorkflowJob[];
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to get workflow jobs: ${error.message}`, error.status);
  }
}

export async function rerunWorkflow(
  owner: string,
  repo: string,
  runId: number
): Promise<void> {
  try {
    const octokit = getOctokit();
    await octokit.rest.actions.reRunWorkflow({ owner, repo, run_id: runId });
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to rerun workflow: ${error.message}`, error.status);
  }
}

export async function cancelWorkflowRun(
  owner: string,
  repo: string,
  runId: number
): Promise<void> {
  try {
    const octokit = getOctokit();
    await octokit.rest.actions.cancelWorkflowRun({ owner, repo, run_id: runId });
  } catch (error: any) {
    throw new GitHubAPIError(`Failed to cancel workflow: ${error.message}`, error.status);
  }
}
