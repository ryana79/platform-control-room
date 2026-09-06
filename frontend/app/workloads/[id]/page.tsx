"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { WorkloadDetail } from "@/types/api";
import { ArtifactPreview, LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

const tabs = ["summary", "artifacts", "policy", "cost", "deployment"] as const;
type Tab = (typeof tabs)[number];

export default function WorkloadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workload, setWorkload] = useState<WorkloadDetail>();
  const [error, setError] = useState<string>();
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  useEffect(() => {
    api.workload(id)
      .then((data) => {
        setWorkload(data);
        setError(undefined);
      })
      .catch((err) => {
        console.error(err);
        setWorkload(undefined);
        setError("Workload could not be loaded. It may have been reset or removed from the demo database.");
      });
  }, [id]);

  if (error) {
    return (
      <MissionPanel title="Workload unavailable" eyebrow="control packet error">
        <p className="text-sm text-slate-300">{error}</p>
      </MissionPanel>
    );
  }

  if (!workload) {
    return <LoadingPanel label="Loading workload control packet..." />;
  }

  const policyResult = workload.policy_result as { summary?: string; violations?: Array<{ policy: string; message: string }> };
  const costResult = workload.cost_result as { monthly_estimate?: number; service_estimates?: Record<string, number>; recommendations?: string[] };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Workload Specification</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-100">{workload.name}</h1>
          <p className="mt-1 text-xs text-slate-400">
            Owner: {workload.owner} | Env: {workload.environment} | Runtime: {workload.runtime_type}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusPill tone={workload.policy_status === "passed" ? "good" : "bad"}>{workload.policy_status}</StatusPill>
          <StatusPill tone="warn">${workload.estimated_monthly_cost}/mo</StatusPill>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition ${activeTab === tab ? "bg-cyan-600 font-semibold text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Replicas" value={workload.replicas} />
          <Metric label="CPU" value={`${workload.cpu_request}/${workload.cpu_limit}`} />
          <Metric label="Memory" value={`${workload.memory_request}/${workload.memory_limit}`} />
          <Metric label="Services" value={workload.azure_services.length} detail={workload.azure_services.join(", ")} />
        </div>
      )}

      {activeTab === "artifacts" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ArtifactPreview title="Terraform tfvars" value={workload.files.terraform} />
          <ArtifactPreview title="Helm values" value={workload.files.helm_values} />
          <ArtifactPreview title="ArgoCD Application" value={workload.files.argocd_application} />
          <ArtifactPreview title="Kubernetes Manifest" value={workload.files.kubernetes_manifest} />
        </div>
      )}

      {activeTab === "policy" && (
        <MissionPanel title="Policy Evaluation" eyebrow="OPA & Gatekeeper Guardrails">
          <p className="text-sm text-slate-300">{policyResult.summary ?? "No policy summary available."}</p>
          <div className="mt-4 space-y-3">
            {policyResult.violations?.length ? (
              policyResult.violations.map((violation) => (
                <div key={`${violation.policy}-${violation.message}`} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5">
                  <StatusPill tone="bad">{violation.policy}</StatusPill>
                  <p className="mt-1.5 text-xs text-rose-200">{violation.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">All workload onboarding policies passed.</div>
            )}
          </div>
        </MissionPanel>
      )}

      {activeTab === "cost" && (
        <MissionPanel title="Cost Analysis" eyebrow="Projected Monthly Infrastructure">
          <div className="text-4xl font-bold text-amber-300">${costResult.monthly_estimate ?? workload.estimated_monthly_cost}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(costResult.service_estimates ?? {}).map(([service, cost]) => (
              <div key={service} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
                <div className="text-xs text-slate-400">{service}</div>
                <div className="mt-1 text-xl font-bold text-slate-100">${cost}</div>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            {(costResult.recommendations ?? []).map((recommendation) => (
              <li key={recommendation} className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">{recommendation}</li>
            ))}
          </ul>
        </MissionPanel>
      )}

      {activeTab === "deployment" && (
        <MissionPanel title="Deployment State" eyebrow="gitops and cluster status">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Workload" value={workload.status} />
            <Metric label="ArgoCD" value={workload.argocd_sync_status} />
            <Metric label="Public Access" value={workload.public_access ? "requested" : "private"} />
          </div>
        </MissionPanel>
      )}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <MissionPanel>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-50">{value}</div>
      {detail && <div className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</div>}
    </MissionPanel>
  );
}
