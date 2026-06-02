"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Workload } from "@/types/api";
import { LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

export default function WorkloadsPage() {
  const [workloads, setWorkloads] = useState<Workload[]>();

  useEffect(() => {
    api.workloads().then(setWorkloads).catch(console.error);
  }, []);

  if (!workloads) {
    return <LoadingPanel label="Loading workload registry..." />;
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Workload Registry</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Platform Requests</h1>
        <p className="mt-2 text-slate-400">Live workload requests from the backend database with generated artifacts and guardrail status.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {["dev", "staging", "prod"].map((environment) => {
          const count = workloads.filter((workload) => workload.environment === environment).length;
          return (
            <MissionPanel key={environment}>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">{environment} lane</div>
              <div className="mt-2 text-4xl font-black">{count}</div>
              <div className="text-xs text-slate-500">active request{count === 1 ? "" : "s"}</div>
            </MissionPanel>
          );
        })}
      </div>

      <MissionPanel className="overflow-hidden p-0">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-cyan-300/10 bg-cyan-300/5 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">
            <tr>
              <th className="p-4">Name</th>
              <th>Environment</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Policy</th>
              <th>ArgoCD</th>
              <th>Cost</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {workloads.map((workload) => (
              <tr key={workload.id} className="transition hover:bg-cyan-300/5">
                <td className="p-4 font-semibold">
                  <Link href={`/workloads/${workload.id}`} className="text-cyan-100 hover:text-cyan-200">
                    {workload.name}
                  </Link>
                  <div className="mt-1 text-xs font-normal text-slate-500">{workload.runtime_type}</div>
                </td>
                <td>
                  <StatusPill tone="info">{workload.environment}</StatusPill>
                </td>
                <td className="text-slate-300">{workload.owner}</td>
                <td>
                  <StatusPill>{workload.status}</StatusPill>
                </td>
                <td>
                  <StatusPill tone={policyTone(workload.policy_status)}>{workload.policy_status}</StatusPill>
                </td>
                <td className="text-slate-300">{workload.argocd_sync_status}</td>
                <td className="font-mono text-amber-100">${workload.estimated_monthly_cost}</td>
                <td className="text-slate-500">{new Date(workload.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!workloads.length && <div className="p-8 text-slate-400">No workloads yet. Create one from the sidebar.</div>}
      </MissionPanel>
    </div>
  );
}

function policyTone(policyStatus: string): "neutral" | "good" | "bad" | "warn" {
  if (policyStatus === "passed") {
    return "good";
  }

  if (policyStatus === "failed") {
    return "bad";
  }

  return "neutral";
}
