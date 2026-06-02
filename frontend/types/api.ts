export type Workload = {
  id: number;
  name: string;
  owner: string;
  environment: "dev" | "staging" | "prod";
  region: string;
  runtime_type: "api" | "worker" | "frontend" | "cronjob";
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  replicas: number;
  public_access: boolean;
  cost_center: string;
  data_classification: string;
  azure_services: string[];
  status: string;
  policy_status: string;
  argocd_sync_status: string;
  estimated_monthly_cost: number;
  updated_at: string;
  created_at: string;
};

export type WorkloadDetail = Workload & {
  policy_result: Record<string, unknown>;
  cost_result: Record<string, unknown>;
  files: Record<string, string>;
};
