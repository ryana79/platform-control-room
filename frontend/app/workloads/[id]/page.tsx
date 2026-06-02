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
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Workload Control Packet</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{workload.name}</h1>
          <p className="mt-2 text-slate-400">
            {workload.owner} / {workload.environment} / {workload.runtime_type}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusPill tone={workload.policy_status === "passed" ? "good" : "bad"}>{workload.policy_status}</StatusPill>
          <StatusPill tone="warn">${workload.estimated_monthly_cost}/mo</StatusPill>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-cyan-300/15 bg-black/20 p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition ${activeTab === tab ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-cyan-300/10 hover:text-cyan-100"}`}
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
        <MissionPanel title="Policy Decision" eyebrow="guardrail explanation">
          <p className="text-sm text-slate-300">{policyResult.summary ?? "No policy summary available."}</p>
          <div className="mt-4 space-y-3">
            {policyResult.violations?.length ? (
              policyResult.violations.map((violation) => (
                <div key={`${violation.policy}-${violation.message}`} className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4">
                  <StatusPill tone="bad">{violation.policy}</StatusPill>
                  <p className="mt-2 text-sm text-rose-100">{violation.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">All workload onboarding policies passed.</div>
            )}
          </div>
        </MissionPanel>
      )}

      {activeTab === "cost" && (
        <MissionPanel title="Cost Estimate" eyebrow="service level estimate">
          <div className="text-5xl font-black text-amber-100">${costResult.monthly_estimate ?? workload.estimated_monthly_cost}</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(costResult.service_estimates ?? {}).map(([service, cost]) => (
              <div key={service} className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4">
                <div className="text-sm text-slate-400">{service}</div>
                <div className="mt-1 text-2xl font-black">${cost}</div>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {(costResult.recommendations ?? []).map((recommendation) => (
              <li key={recommendation} className="rounded-xl border border-amber-300/15 bg-amber-300/10 p-3">{recommendation}</li>
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
