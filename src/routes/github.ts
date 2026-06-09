// ============================================================
// Hermes GitHub — GitHub Routes (Repos, Issues, PRs, Workflows)
// ============================================================

import { Router, Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../middleware/errorHandler';
import {
  getRepo,
  listRepos,
  createIssue,
  listIssues,
  getIssue,
  updateIssue,
  addIssueComment,
  createPR,
  listPRs,
  getPR,
  mergePR,
  listWorkflows,
  triggerWorkflow,
  listWorkflowRuns,
  getWorkflowRun,
  getWorkflowRunLogs,
  getWorkflowRunJobs,
  rerunWorkflow,
  cancelWorkflowRun,
} from '../services/githubService';

const router = Router();

// ─── Repositories ────────────────────────

router.get(
  '/repos',
  asyncHandler(async (req: Request, res: Response) => {
    const perPage = parseInt(req.query.perPage as string, 10) || 30;
    const page = parseInt(req.query.page as string, 10) || 1;
    const repos = await listRepos(perPage, page);
    sendSuccess(res, repos);
  })
);

router.get(
  '/repos/:owner/:repo',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const result = await getRepo(owner, repo);
    sendSuccess(res, result);
  })
);

// ─── Issues ──────────────────────────────

router.post(
  '/repos/:owner/:repo/issues',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const { title, body, labels, assignees } = req.body;
    const issue = await createIssue(owner, repo, title, body, labels, assignees);
    sendSuccess(res, issue, 201);
  })
);

router.get(
  '/repos/:owner/:repo/issues',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const state = (req.query.state as 'open' | 'closed' | 'all') || 'open';
    const perPage = parseInt(req.query.perPage as string, 10) || 30;
    const page = parseInt(req.query.page as string, 10) || 1;
    const issues = await listIssues(owner, repo, state, perPage, page);
    sendSuccess(res, issues);
  })
);

router.get(
  '/repos/:owner/:repo/issues/:issueNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const issue = await getIssue(owner, repo, parseInt(issueNumber, 10));
    sendSuccess(res, issue);
  })
);

router.patch(
  '/repos/:owner/:repo/issues/:issueNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const updated = await updateIssue(owner, repo, parseInt(issueNumber, 10), req.body);
    sendSuccess(res, updated);
  })
);

router.post(
  '/repos/:owner/:repo/issues/:issueNumber/comments',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, issueNumber } = req.params;
    const { body } = req.body;
    const comment = await addIssueComment(owner, repo, parseInt(issueNumber, 10), body);
    sendSuccess(res, comment, 201);
  })
);

// ─── Pull Requests ───────────────────────

router.post(
  '/repos/:owner/:repo/pulls',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const { title, head, base, body, draft } = req.body;
    const pr = await createPR(owner, repo, title, head, base, body, draft);
    sendSuccess(res, pr, 201);
  })
);

router.get(
  '/repos/:owner/:repo/pulls',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const state = (req.query.state as 'open' | 'closed' | 'all') || 'open';
    const perPage = parseInt(req.query.perPage as string, 10) || 30;
    const page = parseInt(req.query.page as string, 10) || 1;
    const prs = await listPRs(owner, repo, state, perPage, page);
    sendSuccess(res, prs);
  })
);

router.get(
  '/repos/:owner/:repo/pulls/:prNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, prNumber } = req.params;
    const pr = await getPR(owner, repo, parseInt(prNumber, 10));
    sendSuccess(res, pr);
  })
);

router.post(
  '/repos/:owner/:repo/pulls/:prNumber/merge',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, prNumber } = req.params;
    const { method, commitTitle } = req.body;
    const result = await mergePR(owner, repo, parseInt(prNumber, 10), method, commitTitle);
    sendSuccess(res, result);
  })
);

// ─── Workflows ───────────────────────────

router.get(
  '/repos/:owner/:repo/workflows',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const workflows = await listWorkflows(owner, repo);
    sendSuccess(res, workflows);
  })
);

router.get(
  '/repos/:owner/:repo/workflows/runs',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string, 10) : undefined;
    const perPage = parseInt(req.query.perPage as string, 10) || 30;
    const page = parseInt(req.query.page as string, 10) || 1;
    const runs = await listWorkflowRuns(owner, repo, workflowId, perPage, page);
    sendSuccess(res, runs);
  })
);

router.post(
  '/repos/:owner/:repo/workflows/:workflowId/dispatch',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, workflowId } = req.params;
    const { ref, inputs } = req.body;
    await triggerWorkflow(owner, repo, workflowId, ref, inputs);
    sendSuccess(res, null, 202, 'Workflow dispatched');
  })
);

router.get(
  '/repos/:owner/:repo/workflows/runs/:runId',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, runId } = req.params;
    const run = await getWorkflowRun(owner, repo, parseInt(runId, 10));
    sendSuccess(res, run);
  })
);

router.get(
  '/repos/:owner/:repo/workflows/runs/:runId/logs',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, runId } = req.params;
    const logsUrl = await getWorkflowRunLogs(owner, repo, parseInt(runId, 10));
    sendSuccess(res, { logsUrl });
  })
);

router.get(
  '/repos/:owner/:repo/workflows/runs/:runId/jobs',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, runId } = req.params;
    const jobs = await getWorkflowRunJobs(owner, repo, parseInt(runId, 10));
    sendSuccess(res, jobs);
  })
);

router.post(
  '/repos/:owner/:repo/workflows/runs/:runId/rerun',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, runId } = req.params;
    await rerunWorkflow(owner, repo, parseInt(runId, 10));
    sendSuccess(res, null, 202, 'Workflow rerun triggered');
  })
);

router.post(
  '/repos/:owner/:repo/workflows/runs/:runId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { owner, repo, runId } = req.params;
    await cancelWorkflowRun(owner, repo, parseInt(runId, 10));
    sendSuccess(res, null, 202, 'Workflow cancelled');
  })
);

export default router;
