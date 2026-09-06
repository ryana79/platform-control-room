import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-slate-800 bg-slate-900/90 p-5 shadow-sm", className)} {...props} />;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "border border-slate-700 bg-slate-800/60 text-slate-300",
    good: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warn: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
    bad: "border border-rose-500/30 bg-rose-500/10 text-rose-300",
  };
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-medium tracking-wide", tones[tone])}>{children}</span>;
}

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("rounded-md border border-cyan-500/40 bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("font-mono text-xs font-medium uppercase tracking-wider text-slate-300", className)} {...props} />;
}

export function CodeBlock({ value }: { value: string }) {
  return <pre className="max-h-[520px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200"><code>{value || "No generated file yet."}</code></pre>;
}
