import type { Workload, WorkloadDetail } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
};

export type DeploymentSession = {
  session_id: string;
  deployment_type: string;
  name: string;
  status: string;
  current_question?: string | null;
  answers: Record<string, string>;
  spec: Record<string, unknown>;
  files: Record<string, string>;
  gitlab_result: Partial<GitLabPushResult>;
  branch_name: string;
  ai_available: boolean;
};

export type GitLabPushResult = {
  ok: boolean;
  configured: boolean;
  branch: string;
  message: string;
  web_url?: string | null;
  details: Record<string, unknown>;
};

type DeploymentSessionCreate = {
  deployment_type: string;
  name: string;
  owner: string;
  environment: string;
  region: string;
};

type DeploymentCatalogResponse = {
  catalog: CatalogItem[];
  ai_available: boolean;
};

type DeploymentGenerateResponse = {
  deployment: DeploymentSession;
  files: Record<string, string>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export const api = {
  summary: () => request<any>("/api/summary"),
  topology: () => request<any>("/api/topology"),
  workloads: () => request<Workload[]>("/api/workloads"),
  workload: (id: string) => request<WorkloadDetail>(`/api/workloads/${id}`),
  createWorkload: (payload: unknown) => request<WorkloadDetail>("/api/workloads", { method: "POST", body: JSON.stringify(payload) }),
  policies: () => request<any>("/api/policies"),
  argocd: () => request<any>("/api/argocd/apps"),
  kubernetes: () => request<any>("/api/kubernetes/status"),
  drift: () => request<any>("/api/drift/check", { method: "POST" }),
  createDrift: () => request<any>("/api/drift/create-demo-drift", { method: "POST" }),
  cost: () => request<any>("/api/cost/estimate"),
  report: () => request<any>("/api/reports/generate", { method: "POST" }),
  resetDemo: () => request<any>("/api/demo/reset", { method: "POST" }),
  advanceDemo: () => request<any>("/api/demo/advance", { method: "POST" }),
  activity: () => request<any[]>("/api/activity"),
  deploymentCatalog: () => request<DeploymentCatalogResponse>("/api/deployment-catalog"),
  startDeploymentSession: (payload: DeploymentSessionCreate) => request<DeploymentSession>("/api/deployments/session", { method: "POST", body: JSON.stringify(payload) }),
  answerDeploymentSession: (sessionId: string, answer: string) => request<DeploymentSession>(`/api/deployments/session/${sessionId}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
  generateDeployment: (sessionId: string) => request<DeploymentGenerateResponse>(`/api/deployments/${sessionId}/generate`, { method: "POST" }),
  pushDeploymentToGitLab: (sessionId: string) => request<GitLabPushResult>(`/api/deployments/${sessionId}/push-gitlab`, { method: "POST" }),
};
