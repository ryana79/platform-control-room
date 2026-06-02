import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mission-glow cut-corners border border-cyan-300/15 bg-slate-950/78 p-5 backdrop-blur-xl", className)} {...props} />;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "border border-slate-500/30 bg-slate-500/10 text-slate-200",
    good: "border border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    warn: "border border-amber-300/45 bg-amber-300/10 text-amber-100",
    bad: "border border-rose-400/45 bg-rose-400/10 text-rose-100",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]", tones[tone])}>{children}</span>;
}

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("cut-corners border border-cyan-200/40 bg-cyan-300 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-xl border border-cyan-300/20 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/20 transition placeholder:text-slate-600 focus:border-cyan-200/60 focus:ring-4" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-xl border border-cyan-300/20 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/20 transition focus:border-cyan-200/60 focus:ring-4" {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-100/70", className)} {...props} />;
}

export function CodeBlock({ value }: { value: string }) {
  return <pre className="max-h-[520px] overflow-auto rounded-2xl border border-cyan-300/15 bg-[#050914] p-4 text-xs leading-relaxed text-cyan-50"><code>{value || "No generated file yet."}</code></pre>;
}
