"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api, type CatalogItem, type DeploymentSession } from "@/lib/api";
import { Button, Input, Select } from "@/components/ui";
import { ArtifactPreview, LoadingPanel, MissionPanel, StatusPill } from "@/components/mission-control";

export default function DeploymentsPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>();
  const [selectedType, setSelectedType] = useState("resource_group");
  const [session, setSession] = useState<DeploymentSession>();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.deploymentCatalog().then((data) => {
      setCatalog(data.catalog);
      setSelectedType(data.catalog[0]?.id ?? "resource_group");
    }).catch(console.error);
  }, []);

  async function startSession(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      deployment_type: selectedType,
      name: formValue(form, "name"),
      owner: formValue(form, "owner"),
      environment: formValue(form, "environment"),
      region: formValue(form, "region"),
    };
    try {
      setSession(await api.startDeploymentSession(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start deployment session");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(): Promise<void> {
    if (!session || !answer.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      setSession(await api.answerDeploymentSession(session.session_id, answer));
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save answer");
    } finally {
      setBusy(false);
    }
  }

  async function generate(): Promise<void> {
    if (!session) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api.generateDeployment(session.session_id);
      setSession(result.deployment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate deployment files");
    } finally {
      setBusy(false);
    }
  }

  async function pushGitLab(): Promise<void> {
    if (!session) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api.pushDeploymentToGitLab(session.session_id);
      setSession({ ...session, gitlab_result: result, status: result.ok ? "pushed_to_gitlab" : "gitlab_not_configured" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to push to GitLab");
    } finally {
      setBusy(false);
    }
  }

  if (!catalog) {
    return <LoadingPanel label="Loading Azure deployment catalog..." />;
  }

  const selected = catalog.find((item) => item.id === selectedType) ?? catalog[0];

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">Automated Provisioning</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Azure Pipeline Builder</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Select workload infrastructure type, complete configuration requirements, and generate validated Terraform and GitLab CI automation pipelines.
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <MissionPanel title="Deployment Type" eyebrow="user request">
            <div className="space-y-3">
              {catalog.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedType(item.id)} className="w-full text-left">
                  <div className={`rounded-2xl border p-4 transition ${selectedType === item.id ? "border-cyan-200/60 bg-cyan-300/10" : "border-cyan-300/10 bg-black/20 hover:border-cyan-300/30"}`}>
                    <div className="font-bold text-slate-50">{item.name}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </MissionPanel>

          <MissionPanel title="Start Intake" eyebrow={selected?.name ?? "template"}>
            <form onSubmit={startSession} className="space-y-3">
              <Input name="name" defaultValue="team-landing-zone" placeholder="deployment-name" required pattern="[a-z0-9-]+" />
              <Input name="owner" defaultValue="platform-team" placeholder="owner" required />
              <Select name="environment" defaultValue="dev">
                <option>dev</option>
                <option>staging</option>
                <option>prod</option>
              </Select>
              <Select name="region" defaultValue="eastus">
                <option>eastus</option>
                <option>westus2</option>
                <option>centralus</option>
              </Select>
              <Button type="submit" disabled={busy}>Start AI intake</Button>
            </form>
          </MissionPanel>
        </div>

        <div className="space-y-4">
          <MissionPanel title="Grok Intake" eyebrow="follow-up questions" action={session && <StatusPill tone={session.ai_available ? "good" : "warn"}>{session.ai_available ? "Grok ready" : "deterministic fallback"}</StatusPill>}>
            {session ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Metric label="Session" value={session.session_id.slice(0, 8)} />
                  <Metric label="Status" value={session.status} />
                  <Metric label="Branch" value={session.branch_name || "pending"} />
                </div>

                {session.current_question ? (
                  <div className="rounded-2xl border border-cyan-300/15 bg-black/20 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">Next question</div>
                    <p className="mt-2 text-lg font-semibold">{session.current_question}</p>
                    <div className="mt-4 flex gap-2">
                      <Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer..." />
                      <Button type="button" onClick={submitAnswer} disabled={busy}>Answer</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={generate} disabled={busy}>Generate Terraform</Button>
                    <Button type="button" onClick={pushGitLab} disabled={busy || !Object.keys(session.files ?? {}).length}>Push to GitLab</Button>
                  </div>
                )}

                <div className="rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">Captured answers</div>
                  <pre className="mt-2 overflow-auto text-xs text-cyan-50">{JSON.stringify(session.answers, null, 2)}</pre>
                </div>

                {session.gitlab_result?.message && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                    {session.gitlab_result.message}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Start an intake session to let the assistant collect deployment requirements.</p>
            )}
          </MissionPanel>

          {session?.spec && Object.keys(session.spec).length > 0 && (
            <MissionPanel title="Generated Spec" eyebrow="normalized Azure request">
              <pre className="overflow-auto rounded-2xl border border-cyan-300/10 bg-black/30 p-4 text-xs text-cyan-50">{JSON.stringify(session.spec, null, 2)}</pre>
            </MissionPanel>
          )}

          {session?.files && Object.keys(session.files).length > 0 && (
            <div className="grid gap-4 xl:grid-cols-2">
              {Object.entries(session.files).map(([path, content]) => (
                <ArtifactPreview key={path} title={path} value={content} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formValue(form: FormData, key: string): string {
  return String(form.get(key) ?? "");
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 break-all text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}
