import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleDashed, ExternalLink, RadioTower, ShieldAlert, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "good" | "warn" | "bad" | "info";

type MissionPanelProps = {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

type StatusPillProps = {
  children: ReactNode;
  tone?: Tone;
};

type CommandButtonProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  detail: string;
  tone?: Tone;
};

type TopologyNode = {
  label: string;
  value: string;
  tone?: Tone;
};

type ActivityItem = {
  id: number;
  event_type: string;
  message: string;
  severity: string;
  created_at: string;
};

const toneClasses: Record<Tone, string> = {
  neutral: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  warn: "border-amber-300/45 bg-amber-300/10 text-amber-100",
  bad: "border-rose-400/45 bg-rose-400/10 text-rose-100",
  info: "border-cyan-300/45 bg-cyan-300/10 text-cyan-100",
};

export function MissionPanel({
  title,
  eyebrow,
  action,
  className,
  children,
}: MissionPanelProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/90 p-5 shadow-sm", className)}>
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div>
            {eyebrow && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">{eyebrow}</div>}
            {title && <h2 className="mt-1 text-base font-bold tracking-tight text-slate-100">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide", toneClasses[tone])}>{children}</span>;
}

export function CommandButton({
  href,
  onClick,
  label,
  detail,
  tone = "info",
}: CommandButtonProps) {
  const content = (
    <div className={cn("group flex h-full items-center justify-between gap-4 rounded-lg border p-3.5 text-left transition hover:border-slate-600 bg-slate-900/80", toneClasses[tone])}>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Action</div>
        <div className="mt-1 text-sm font-semibold text-slate-100">{label}</div>
        <div className="mt-0.5 text-xs text-slate-400">{detail}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-200" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}

export function TopologyMap({ nodes }: { nodes: TopologyNode[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/30 p-5">
      <div className="radar-sweep pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60" />
      <div className="relative grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {nodes.map((node, index) => (
          <div key={node.label} className="relative">
            <div className={cn("min-h-28 rounded-2xl border bg-slate-950/70 p-4", toneClasses[node.tone ?? "info"])}>
              <RadioTower className="h-4 w-4" />
              <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">{node.label}</div>
              <div className="mt-1 text-xl font-black text-slate-50">{node.value}</div>
            </div>
            {index < nodes.length - 1 && <div className="absolute left-full top-1/2 z-10 hidden h-px w-3 bg-cyan-200/50 xl:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item) => (
          <div key={item.id} className="grid grid-cols-[auto_1fr] gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
              {item.severity === "warning" ? <ShieldAlert className="h-4 w-4 text-amber-200" /> : <CheckCircle2 className="h-4 w-4 text-emerald-200" />}
            </div>
            <div className="rounded-2xl border border-cyan-300/10 bg-slate-900/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusPill tone={item.severity === "warning" ? "warn" : "good"}>{item.event_type}</StatusPill>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{new Date(item.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-cyan-300/20 p-6 text-sm text-slate-400">No activity yet. Launch a workload request to populate the operations log.</div>
      )}
    </div>
  );
}

export function ArtifactPreview({ title, value }: { title: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#050914]">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan-100">
          <TerminalSquare className="h-4 w-4" />
          {title}
        </div>
        <StatusPill tone={value ? "good" : "neutral"}>{value ? "generated" : "empty"}</StatusPill>
      </div>
      <pre className="max-h-[520px] overflow-auto p-4 text-xs leading-relaxed text-cyan-50/90">
        <code>{value || "No generated artifact yet."}</code>
      </pre>
    </div>
  );
}

export function ExternalAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/60">
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export function LoadingPanel({ label }: { label: string }) {
  return (
    <MissionPanel>
      <div className="flex items-center gap-3 text-slate-300">
        <CircleDashed className="h-5 w-5 animate-spin text-cyan-200" />
        {label}
      </div>
    </MissionPanel>
  );
}
