"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Boxes, Bot, CloudCog, Command, DollarSign, GitBranch, Home, Moon, Radar, ServerCog, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/workloads/new", label: "Create Workload", icon: CloudCog },
  { href: "/deployments", label: "Azure Deployments", icon: ServerCog },
  { href: "/workloads", label: "Workloads", icon: Boxes },
  { href: "/policies", label: "Policy Center", icon: ShieldCheck },
  { href: "/gitops", label: "GitOps / ArgoCD", icon: GitBranch },
  { href: "/kubernetes", label: "Kubernetes", icon: ServerCog },
  { href: "/cost", label: "Cost Governance", icon: DollarSign },
  { href: "/drift", label: "Drift Detection", icon: Activity },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <div className="min-h-screen grid-paper">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 flex-col border-r border-slate-800 bg-slate-950/95 p-5 backdrop-blur-xl lg:flex">
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <ServerCog className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Platform Portal</div>
              <div className="text-base font-bold tracking-tight text-slate-100">Control Room</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
            <div className="rounded border border-slate-800 bg-slate-950 p-1.5"><span className="block text-slate-200">Local</span>mode</div>
            <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-1.5"><span className="block text-emerald-400">API</span>live</div>
            <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-1.5"><span className="block text-cyan-400">GitOps</span>ready</div>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-100",
                  active && "border border-cyan-500/30 bg-cyan-500/10 font-semibold text-cyan-300",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200")} />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            <Command className="h-3.5 w-3.5 text-slate-300" />
            Execution Workflow
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">Ingest workload specs, generate IaC/GitOps manifests, evaluate policies, and track drift.</p>
        </div>
      </aside>
      <main className="lg:pl-80">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/85 px-6 py-3.5 backdrop-blur-xl">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Internal Developer Platform</div>
            <div className="text-xs text-slate-300">Azure-ready workload onboarding, policy enforcement, GitOps, and cost governance</div>
          </div>
          <button onClick={() => setDark(!dark)} aria-label="Toggle theme" className="rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-slate-200">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </header>
        <div className="mx-auto max-w-7xl p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
