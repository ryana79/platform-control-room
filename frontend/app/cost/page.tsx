"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

export default function CostPage() {
  const [data, setData] = useState<any>();
  const [report, setReport] = useState<any>();

  useEffect(() => {
    api.cost().then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <LoadingPanel label="Loading cost governance brief..." />;
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Financial Operations</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Cost Governance</h1>
        <p className="mt-2 text-sm text-slate-400">Pre-provisioning cost estimation calculated from workload capacity, environment tiers, and attached cloud services.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <MissionPanel title="Monthly Forecast" eyebrow="estimated usd">
          <div className="text-4xl font-bold tracking-tight text-amber-300">${data.monthly_total}</div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">Pre-provisioning infrastructure estimate to evaluate resource allocation before deployment.</p>
          <Button className="mt-4" onClick={() => api.report().then(setReport)}>Export Cost Report</Button>
          {report && <p className="mt-2.5 text-xs text-cyan-300">Report saved: {report.path}</p>}
        </MissionPanel>

        <MissionPanel title="Workload Cost Distribution" eyebrow="chargeback lanes">
          <div className="h-72 min-h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={220}>
              <BarChart data={data.workloads}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 249, 255, .13)" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: "#050914", border: "1px solid rgba(103,232,249,.2)", color: "#e2e8f0" }} />
                <Bar dataKey="cost" fill="#fbbf24" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MissionPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.workloads.map((workload: any) => (
          <MissionPanel key={workload.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{workload.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{workload.environment}</p>
              </div>
              <StatusPill tone="warn">${workload.cost}</StatusPill>
            </div>
          </MissionPanel>
        ))}
      </div>
    </div>
  );
}
