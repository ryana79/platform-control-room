"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

export default function KubernetesPage() {
  const [data, setData] = useState<any>();

  useEffect(() => {
    api.kubernetes().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <LoadingPanel label="Polling local Kubernetes..." />;
  }

  if (!data.available) {
    return (
      <MissionPanel title="Hosted Demo Mode" eyebrow="local cluster telemetry">
        <p className="mt-2 text-slate-300">
          The public site is connected to the hosted API and database, but live Kubernetes telemetry is intentionally local-only.
        </p>
        <p className="mt-2 text-sm text-cyan-100">
          To enable live cluster data on your machine, install kind and kubectl, then run <code className="font-mono">./scripts/create-kind-cluster.sh</code>.
        </p>
      </MissionPanel>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Cluster Infrastructure</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Kubernetes Status</h1>
        <p className="mt-2 text-sm text-slate-400">Live operational telemetry from cluster API endpoints and local kind environments.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Namespaces" items={data.namespaces} />
        <Panel title="Deployments" items={data.deployments} />
        <Panel title="Pods" items={data.pods} />
        <Panel title="Services" items={data.services} />
      </div>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: any[] }) {
  return (
    <MissionPanel title={title} eyebrow="kubectl live">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex justify-between rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-sm">
            <span className="text-slate-200">{item.namespace ? `${item.namespace}/` : ""}{item.name}</span>
            <StatusPill>{item.status ?? item.phase ?? item.type ?? `${item.ready}/${item.desired}`}</StatusPill>
          </div>
        ))}
        {!items.length && <div className="text-sm text-slate-500">No resources returned.</div>}
      </div>
    </MissionPanel>
  );
}
