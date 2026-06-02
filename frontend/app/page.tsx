"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Boxes, DollarSign, GitBranch, ShieldAlert, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ActivityTimeline, CommandButton, LoadingPanel, MissionPanel, StatusPill, TopologyMap, type Tone } from "@/components/mission-control";

type Summary = {
  total_workloads: number;
  running_workloads: number;
  failed_policy_checks: number;
  estimated_monthly_cost: number;
  drift_findings: number;
  last_argocd_sync: string;
  cost_trend: Array<{ month: string; cost: number }>;
  workload_status: Array<{ name: string; value: number }>;
  recent_activity: Array<{ id: number; event_type: string; message: string; severity: string; created_at: string }>;
};

type TopologyResponse = {
  nodes?: Array<{ label: string; value: string; status: string }>;
};

type DashboardStat = {
  label: string;
  value: string | number;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary>();
  const [topology, setTopology] = useState<TopologyResponse>();
  const [demoMessage, setDemoMessage] = useState("");

  async function refreshDashboard() {
    const [summary, topologyData] = await Promise.all([api.summary(), api.topology()]);
    setData(summary);
    setTopology(topologyData);
  }

  useEffect(() => {
    Promise.all([api.summary(), api.topology()])
      .then(([summary, topologyData]) => {
        setData(summary);
        setTopology(topologyData);
      })
      .catch(console.error);
  }, []);

  async function runDemoAction(action: "advance" | "reset") {
    const result = action === "advance" ? await api.advanceDemo() : await api.resetDemo();
    setDemoMessage(result.message);
    await refreshDashboard();
  }

  if (!data) {
    return <LoadingPanel label="Synchronizing platform control plane..." />;
  }

  const stats: DashboardStat[] = [
    { label: "Workloads", value: data.total_workloads, detail: "requests in SQLite", icon: Boxes, tone: "info" },
    { label: "Running", value: data.running_workloads, detail: "healthy or synced", icon: GitBranch, tone: "good" },
    { label: "Policy Fails", value: data.failed_policy_checks, detail: "blocked controls", icon: ShieldAlert, tone: data.failed_policy_checks ? "warn" : "good" },
    { label: "Monthly Burn", value: `$${data.estimated_monthly_cost}`, detail: "estimated USD", icon: DollarSign, tone: "info" },
    { label: "Drift", value: data.drift_findings, detail: "live findings", icon: AlertTriangle, tone: data.drift_findings ? "bad" : "good" },
  ];

  const topologyNodes = topology?.nodes?.map((node) => {
    return { label: node.label, value: node.value, tone: topologyTone(node.status) };
  }) ?? [
    { label: "Portal", value: `${data.total_workloads} requests`, tone: "info" as const },
    { label: "API", value: "FastAPI", tone: "good" as const },
    { label: "Policy", value: `${data.failed_policy_checks} fail`, tone: data.failed_policy_checks ? ("warn" as const) : ("good" as const) },
    { label: "GitOps", value: data.last_argocd_sync.includes("unavailable") ? "local only" : "synced", tone: "info" as const },
    { label: "Cluster", value: `${data.running_workloads} running`, tone: "good" as const },
    { label: "Cost", value: `$${data.estimated_monthly_cost}`, tone: "warn" as const },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="mission-glow cut-corners relative overflow-hidden border border-cyan-300/20 bg-[#050914] p-8">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-300/20 bg-cyan-300/5" />
        <div className="absolute right-10 top-10 hidden h-28 w-28 rounded-full border border-amber-300/20 bg-amber-300/5 md:block" />
        <div className="relative max-w-4xl">
          <StatusPill tone="good">Live local control plane</StatusPill>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.06em] text-slate-50 md:text-7xl">
            Cloud workload launch control, built for platform teams.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This demo is not a static dashboard. Requests are persisted, platform artifacts are generated, policy failures are explainable, and the same control plane can run locally or against a free hosted database.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CommandButton href="/workloads/new" label="Launch workload" detail="Generate IaC and GitOps" tone="good" />
            <CommandButton href="/policies" label="Inspect guardrails" detail="OPA and platform controls" tone="warn" />
            <CommandButton onClick={() => runDemoAction("advance")} label="Advance demo" detail="Simulate workflow progress" tone="info" />
            <CommandButton onClick={() => runDemoAction("reset")} label="Reset scenario" detail="Reseed the platform state" tone="neutral" />
          </div>
          {demoMessage && <div className="mt-4"><StatusPill tone="good">{demoMessage}</StatusPill></div>}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <MissionPanel key={stat.label} className="min-h-36">
            <div className="flex items-start justify-between">
              <stat.icon className="h-5 w-5 text-cyan-200" />
              <StatusPill tone={stat.tone}>{stat.label}</StatusPill>
            </div>
            <div className="mt-7 text-4xl font-black tracking-tight text-slate-50">{stat.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{stat.detail}</div>
          </MissionPanel>
        ))}
      </div>

      <MissionPanel title="Workload Delivery Topology" eyebrow="desired state pipeline" action={<StatusPill tone="info"><Sparkles className="h-3 w-3" /> generated from API state</StatusPill>}>
        <TopologyMap nodes={topologyNodes} />
      </MissionPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <MissionPanel title="Cost Telemetry" eyebrow="monthly estimate" className="lg:col-span-2">
          <div className="h-80 min-h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
              <AreaChart data={data.cost_trend}>
                <defs>
                  <linearGradient id="cost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 249, 255, .13)" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: "#050914", border: "1px solid rgba(103,232,249,.2)", color: "#e2e8f0" }} />
                <Area type="monotone" dataKey="cost" stroke="#22d3ee" fill="url(#cost)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MissionPanel>
        <MissionPanel title="Environment Lanes" eyebrow="workload spread">
          <div className="h-80 min-h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={240}>
              <BarChart data={data.workload_status}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 249, 255, .13)" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis allowDecimals={false} stroke="#64748b" />
                <Tooltip contentStyle={{ background: "#050914", border: "1px solid rgba(103,232,249,.2)", color: "#e2e8f0" }} />
                <Bar dataKey="value" fill="#fbbf24" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MissionPanel>
      </div>

      <MissionPanel title="Operations Timeline" eyebrow="latest backend events">
        <ActivityTimeline items={data.recent_activity} />
      </MissionPanel>
    </div>
  );
}

function topologyTone(status: string): Tone {
  if (status === "guarded") {
    return "warn";
  }

  if (status === "online") {
    return "good";
  }

  return "info";
}
