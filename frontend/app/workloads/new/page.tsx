"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Label, Select } from "@/components/ui";
import { MissionPanel, StatusPill } from "@/components/mission-control";

const services = ["AKS", "ACR", "Key Vault", "Storage", "Log Analytics"];
const platformSteps = [
  "Persist request to database",
  "Generate Terraform tfvars",
  "Generate Helm values",
  "Generate ArgoCD app",
  "Run policy checks",
  "Estimate monthly cost",
];

export default function NewWorkloadPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(["AKS", "ACR", "Log Analytics"]);
  const [error, setError] = useState("");

  function updateSelectedService(service: string, checked: boolean): void {
    setSelected((current) => {
      if (checked) {
        return [...current, service];
      }

      return current.filter((item) => item !== service);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, unknown>;

    payload.replicas = Number(payload.replicas);
    payload.public_access = payload.public_access === "true";
    payload.azure_services = selected;

    try {
      const created = await api.createWorkload(payload);
      router.push(`/workloads/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create workload");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Workload Provisioning</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Create Workload</h1>
        <p className="mt-2 text-sm text-slate-400">
          Submit workload requirements to generate verified Terraform, Helm values, ArgoCD manifests, and policy evaluations.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <MissionPanel title="Workload Request" eyebrow="self-service intake">
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
            {error && (
              <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <Field label="Workload name"><Input name="name" defaultValue="payments-api" pattern="[a-z0-9-]+" placeholder="e.g. payments-api" required /></Field>
            <Field label="Team owner"><Input name="owner" defaultValue="platform-payments" placeholder="e.g. platform-payments" required /></Field>
            <Field label="Environment"><Select name="environment" defaultValue="dev"><option value="dev">Development (dev)</option><option value="staging">Staging (staging)</option><option value="prod">Production (prod)</option></Select></Field>
            <Field label="Region"><Select name="region" defaultValue="eastus"><option value="eastus">East US</option><option value="westus2">West US 2</option><option value="centralus">Central US</option></Select></Field>
            <Field label="Runtime type"><Select name="runtime_type" defaultValue="api"><option value="api">API Service</option><option value="worker">Background Worker</option><option value="frontend">Frontend Web</option><option value="cronjob">Scheduled CronJob</option></Select></Field>
            <Field label="Replicas"><Input name="replicas" type="number" min="1" max="20" defaultValue="2" /></Field>
            <Field label="CPU request"><Input name="cpu_request" defaultValue="250m" placeholder="250m" /></Field>
            <Field label="CPU limit"><Input name="cpu_limit" defaultValue="500m" placeholder="500m" /></Field>
            <Field label="Memory request"><Input name="memory_request" defaultValue="256Mi" placeholder="256Mi" /></Field>
            <Field label="Memory limit"><Input name="memory_limit" defaultValue="512Mi" placeholder="512Mi" /></Field>
            <Field label="Public access"><Select name="public_access" defaultValue="false"><option value="false">Internal Only (Cluster IP)</option><option value="true">Public Ingress (Requires approval in prod)</option></Select></Field>
            <Field label="Cost center"><Input name="cost_center" defaultValue="cc-platform-042" placeholder="e.g. cc-platform-042" /></Field>
            <Field label="Data classification"><Select name="data_classification" defaultValue="internal"><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential (Requires Key Vault)</option><option value="restricted">Restricted (Requires Key Vault)</option></Select></Field>
            <div className="md:col-span-2">
              <Label>Required Azure services</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                {services.map((service) => (
                  <label key={service} className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 transition hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                      checked={selected.includes(service)}
                      onChange={(event) => updateSelectedService(service, event.target.checked)}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <Button type="submit">Submit Workload Request</Button>
            </div>
          </form>
        </MissionPanel>
        <MissionPanel title="Provisioning Pipeline" eyebrow="automated actions">
          <div className="space-y-2 text-xs text-slate-300">
            {platformSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2.5 rounded-md border border-slate-800 bg-slate-900/40 p-2.5">
                <StatusPill tone="info">{String(index + 1).padStart(2, "0")}</StatusPill>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </MissionPanel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
