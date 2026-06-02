"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Boxes, Bot, CloudCog, Command, DollarSign, GitBranch, Home, Moon, Radar, ServerCog, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/workloads/new", label: "Create Workload", icon: CloudCog },
  { href: "/deployments", label: "AI Azure Deployments", icon: Bot },
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 border-r border-cyan-300/15 bg-[#030711]/90 p-5 backdrop-blur-xl lg:block">
        <div className="mission-glow cut-corners mb-6 border border-cyan-300/20 bg-slate-950/80 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
              <Radar className="h-6 w-6 text-cyan-200" />
              <div className="radar-sweep absolute inset-0 rounded-full opacity-80" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300">Platform</div>
              <div className="text-lg font-black tracking-tight text-slate-50">Control Room</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-2"><span className="block text-cyan-100">local</span>mode</div>
            <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/5 p-2"><span className="block text-emerald-100">api</span>live</div>
            <div className="rounded-xl border border-amber-300/10 bg-amber-300/5 p-2"><span className="block text-amber-100">gitops</span>ready</div>
          </div>
        </div>
        <nav className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold text-slate-400 transition hover:border-cyan-300/20 hover:bg-cyan-300/5 hover:text-cyan-50",
                  active && "border-cyan-300/30 bg-cyan-300/10 text-cyan-50 shadow-glow",
                )}
              >
                <Icon className="h-4 w-4 text-cyan-300/80" />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-200" />}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-cyan-300/15 bg-black/25 p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-100">
            <Command className="h-4 w-4" />
            Demo Script
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">Create request, review generated artifacts, validate policy, trigger drift, explain hosted vs local controls.</p>
        </div>
      </aside>
      <main className="lg:pl-80">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-300/15 bg-[#030711]/75 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Internal Developer Platform</div>
            <div className="text-sm text-slate-400">Azure-ready workload onboarding, policy, GitOps, drift, and cost control</div>
          </div>
          <button onClick={() => setDark(!dark)} className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-2 text-cyan-100">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </header>
        <div className="mx-auto max-w-7xl p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
