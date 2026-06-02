"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingPanel, MissionPanel, StatusPill, type Tone } from "@/components/mission-control";

export default function PoliciesPage() {
  const [data, setData] = useState<any>();
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  useEffect(() => {
    api.policies().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <LoadingPanel label="Loading policy catalog..." />;
  }

  const selected = data.catalog.find((policy: any) => policy.id === selectedPolicy) ?? data.catalog[0];

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Policy Center</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Guardrail Control Room</h1>
        <p className="mt-2 text-slate-400">Click a control to explain how the platform blocks risky workload requests before deployment.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="grid gap-3">
          {data.catalog.map((policy: any) => (
            <button key={policy.id} type="button" onClick={() => setSelectedPolicy(policy.id)} className="text-left">
              <MissionPanel className={selected.id === policy.id ? "border-cyan-200/50" : ""}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{policy.id}</div>
                    <h2 className="mt-1 font-bold text-slate-50">{policy.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{policy.engine}</p>
                  </div>
                  <StatusPill tone={severityTone(policy.severity)}>{policy.severity}</StatusPill>
                </div>
              </MissionPanel>
            </button>
          ))}
        </div>

        <MissionPanel title={selected.name} eyebrow="selected control">
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">Why it matters</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{policyExplanation(selected.id)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ResultPanel label="Passing Workloads" values={data.passing_workloads} tone="good" />
              <ResultPanel label="Failed Workloads" values={data.failed_workloads} tone="bad" />
            </div>
          </div>
        </MissionPanel>
      </div>
    </div>
  );
}

function ResultPanel({ label, values, tone }: { label: string; values: string[]; tone: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
      <StatusPill tone={tone}>{label}</StatusPill>
      <div className="mt-3 space-y-2">
        {values.length ? values.map((value) => <div key={value} className="rounded-xl bg-slate-900/80 px-3 py-2 text-sm text-slate-200">{value}</div>) : <div className="text-sm text-slate-500">none</div>}
      </div>
    </div>
  );
}

function severityTone(severity: string): Tone {
  if (severity === "critical") {
    return "bad";
  }

  if (severity === "high") {
    return "warn";
  }

  return "neutral";
}

function policyExplanation(policyId: string): string {
  const explanations: Record<string, string> = {
    "require-resource-limits": "Prevents noisy-neighbor workloads by requiring Kubernetes CPU and memory limits before deployment.",
    "disallow-privileged-containers": "Blocks containers that could break node isolation or bypass normal runtime controls.",
    "require-platform-labels": "Keeps ownership, environment, and cost-center metadata attached to every workload for support and chargeback.",
    "deny-public-ip-unapproved": "Forces production exposure through review instead of letting a workload silently request public ingress.",
    "require-mandatory-tags": "Extends the same ownership model to Azure resources so governance survives outside Kubernetes.",
    "restrict-expensive-skus": "Stops teams from accidentally selecting large VM SKUs without platform approval.",
  };
  return explanations[policyId] ?? "This control is evaluated during onboarding and before deployment.";
}
