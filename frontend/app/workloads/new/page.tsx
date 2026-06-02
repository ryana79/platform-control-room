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
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">Launch Sequence</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Create Workload</h1>
        <p className="mt-2 text-slate-400">
          Submit a platform request and generate Terraform, Helm, ArgoCD, policy, and cost outputs.
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
            <Field label="Workload name"><Input name="name" defaultValue="payments-api" pattern="[a-z0-9-]+" required /></Field>
            <Field label="Team owner"><Input name="owner" defaultValue="platform-payments" required /></Field>
            <Field label="Environment"><Select name="environment" defaultValue="dev"><option>dev</option><option>staging</option><option>prod</option></Select></Field>
            <Field label="Region"><Select name="region" defaultValue="eastus"><option>eastus</option><option>westus2</option><option>centralus</option></Select></Field>
            <Field label="Runtime type"><Select name="runtime_type" defaultValue="api"><option value="api">API</option><option value="worker">worker</option><option value="frontend">frontend</option><option value="cronjob">cronjob</option></Select></Field>
            <Field label="Replicas"><Input name="replicas" type="number" min="1" max="20" defaultValue="2" /></Field>
            <Field label="CPU request"><Input name="cpu_request" defaultValue="250m" /></Field>
            <Field label="CPU limit"><Input name="cpu_limit" defaultValue="500m" /></Field>
            <Field label="Memory request"><Input name="memory_request" defaultValue="256Mi" /></Field>
            <Field label="Memory limit"><Input name="memory_limit" defaultValue="512Mi" /></Field>
            <Field label="Public access required"><Select name="public_access" defaultValue="false"><option value="false">No</option><option value="true">Yes</option></Select></Field>
            <Field label="Cost center"><Input name="cost_center" defaultValue="cc-platform-042" /></Field>
            <Field label="Data classification"><Select name="data_classification" defaultValue="internal"><option>public</option><option>internal</option><option>confidential</option><option>restricted</option></Select></Field>
            <div className="md:col-span-2">
              <Label>Required Azure services</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                {services.map((service) => (
                  <label key={service} className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-sm text-slate-300 transition hover:border-cyan-300/40">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selected.includes(service)}
                      onChange={(event) => updateSelectedService(service, event.target.checked)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Generate platform request</Button>
            </div>
          </form>
        </MissionPanel>
        <MissionPanel title="What happens next" eyebrow="automated platform actions">
          <div className="space-y-3 text-sm text-slate-300">
            {platformSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-cyan-300/10 bg-black/20 p-3">
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
