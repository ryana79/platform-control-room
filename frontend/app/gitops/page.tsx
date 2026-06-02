"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ArtifactPreview, LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

export default function GitOpsPage() {
  const [data, setData] = useState<any>();

  useEffect(() => {
    api.argocd().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <LoadingPanel label="Loading GitOps controller view..." />;
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">GitOps / ArgoCD</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Desired State Dispatch</h1>
        <p className="mt-2 text-slate-400">Generated Applications plus graceful local CLI detection.</p>
      </div>

      <MissionPanel title="Local ArgoCD UI" eyebrow="operator access">
        <p className="text-sm text-slate-300">{data.instructions}</p>
        {!data.cli.available && <div className="mt-3"><StatusPill tone="warn">{data.cli.message}</StatusPill></div>}
      </MissionPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.generated_apps.map((app: any) => (
          <MissionPanel key={app.name} title={app.name} eyebrow={`namespace ${app.desired_namespace}`}>
            <ArtifactPreview title="Application path" value={app.path} />
          </MissionPanel>
        ))}
        {!data.generated_apps.length && <MissionPanel><p className="text-sm text-slate-400">Create a workload to generate ArgoCD Applications.</p></MissionPanel>}
      </div>
    </div>
  );
}
