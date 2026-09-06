"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { MissionPanel, StatusPill } from "@/components/mission-control";

export default function DriftPage() {
  const [data, setData] = useState<any>();
  const [demo, setDemo] = useState<any>();
  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Configuration Drift</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Drift Detection</h1>
        <p className="mt-2 text-sm text-slate-400">Compare desired GitOps declarations against running cluster configurations to detect unauthorized modifications.</p>
      </div>

      <MissionPanel title="Drift Analysis" eyebrow="cluster comparison">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => api.drift().then(setData)}>Run Drift Scan</Button>
          <Button className="border-amber-500/40 bg-amber-600 hover:bg-amber-500" onClick={() => api.createDrift().then(setDemo)}>Simulate Replica Drift</Button>
        </div>
        {demo && (
          <div className="mt-4">
            <StatusPill tone={demo.ok ? "warn" : "bad"}>{demo.message}</StatusPill>
          </div>
        )}
      </MissionPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <MissionPanel title="Desired GitOps State" eyebrow="source of truth">
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm text-emerald-100">
            Generated manifests under `gitops/workloads` define replicas, image, labels, service type, and resource limits.
          </div>
        </MissionPanel>
        <MissionPanel title="Live Cluster State" eyebrow="kubectl inspection">
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            The backend reads live deployments with kubectl when a local kind cluster is available. Missing tools return setup guidance instead of crashing.
          </div>
        </MissionPanel>
      </div>

      {data && (
        <MissionPanel title="Findings" eyebrow="drift result">
          {!data.available && <p className="mt-2 text-slate-400">{data.message}</p>}
          <div className="mt-3 space-y-2">
            {data.findings?.length ? (
              data.findings.map((finding: any, index: number) => (
                <div key={`${finding.type}-${index}`} className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                  {finding.type}: {finding.resource}
                </div>
              ))
            ) : (
              <p className="text-slate-400">No drift findings detected.</p>
            )}
          </div>
        </MissionPanel>
      )}
    </div>
  );
}
