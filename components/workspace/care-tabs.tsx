"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CheckCircle2, Circle, Copy, Pencil, Plus, RotateCcw, Save } from "lucide-react";
import type { MarieAction } from "@/lib/ai/marie-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { labelFor } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

const flowSteps = [
  { key: "PREPARATION", label: "Preparação" },
  { key: "ANAMNESIS", label: "Anamnese" },
  { key: "ASSESSMENT", label: "Avaliação" },
  { key: "CARE_PLAN", label: "Plano de cuidado" },
  { key: "EXECUTION", label: "Execução" },
  { key: "EVOLUTION", label: "Evolução" },
  { key: "COMPLETION", label: "Finalização" }
] as const;

const visibleFlowSteps = [
  { key: "ANAMNESIS", label: "Anamnese", shortLabel: "Anamnese" },
  { key: "ASSESSMENT", label: "Avaliação", shortLabel: "Avaliação" },
  { key: "CARE_PLAN", label: "Plano de cuidado", shortLabel: "Plano" },
  { key: "EXECUTION", label: "Execução", shortLabel: "Execução" },
  { key: "EVOLUTION", label: "Evolução", shortLabel: "Evolução" },
  { key: "COMPLETION", label: "Finalização", shortLabel: "Finalização" }
] as const;

type StepKey = (typeof flowSteps)[number]["key"];

type CareTabsProps = {
  data: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  draftAction?: MarieAction | null;
  clearDraftAction?: () => void;
};

function labelFromStep(step?: string | null) {
  return flowSteps.find((item) => item.key === step)?.label ?? "Anamnese";
}

function stepFromLabel(label: string): StepKey {
  return flowSteps.find((item) => item.label === label)?.key ?? "ANAMNESIS";
}

function pickPayload(action?: MarieAction | null) {
  return (action?.payload ?? {}) as Record<string, any>;
}

function formObject(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([key, value]) => [key, value === "" ? null : value]));
}

function TextField({ label, name, value, textarea, required, type = "text" }: { label: string; name: string; value?: string | null; textarea?: boolean; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      {textarea ? <Textarea name={name} defaultValue={value ?? ""} required={required} /> : <Input type={type} name={name} defaultValue={value ?? ""} required={required} />}
    </label>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-[14px] border border-border bg-white p-3.5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">{value || "Não informado"}</p>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
    </div>
  );
}

export function CareTabs({ data, activeTab, setActiveTab, draftAction, clearDraftAction }: CareTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingSuggestion, setEditingSuggestion] = useState<any>(null);
  const [editingProtocol, setEditingProtocol] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [message, setMessage] = useState("");
  const patient = data.patient;
  const appointment = data.currentAppointment;
  const anamnesis = patient.anamneses?.[0];
  const assessment = appointment?.assessment;
  const execution = appointment?.execution;
  const followUps = appointment?.followUps ?? [];
  const marieSuggestions = appointment?.marieSuggestions ?? [];
  const suggestion = patient.suggestions?.find((item: any) => item.appointmentId === appointment?.id) ?? patient.suggestions?.[0];
  const protocol = patient.protocols?.find((item: any) => item.appointmentId === appointment?.id) ?? patient.protocols?.[0];
  const stepStates = appointment?.stepStates ?? [];
  const currentStep = appointment?.currentStep ?? "ANAMNESIS";
  const activeStep = stepFromLabel(activeTab);
  const draftPayload = pickPayload(draftAction);

  useEffect(() => {
    if (!appointment) return;
    setActiveTab(labelFromStep(appointment.currentStep === "PREPARATION" ? "ANAMNESIS" : appointment.currentStep));
  }, [appointment, setActiveTab]);

  useEffect(() => {
    if (!draftAction) return;
    if (draftAction.type.includes("PROTOCOL")) {
      setActiveTab("Plano de cuidado");
      setShowSuggestionForm(true);
    }
    if (draftAction.type.includes("EVOLUTION")) {
      setActiveTab("Evolução");
    }
  }, [draftAction, setActiveTab]);

  const pendings = useMemo(() => {
    const items: string[] = [];
    if (!anamnesis) items.push("Anamnese ausente");
    if (!assessment) items.push("Avaliação ausente");
    if (!protocol || !["APPROVED", "APPLIED"].includes(protocol.status)) items.push("Protocolo não aprovado");
    if (!execution) items.push("Execução não registrada");
    if (!patient.evolutions?.some((item: any) => item.appointmentId === appointment?.id)) items.push("Evolução ausente");
    return items;
  }, [anamnesis, assessment, protocol, execution, patient.evolutions, appointment?.id]);

  function stateFor(step: StepKey) {
    return stepStates.find((item: any) => item.step === step)?.status ?? (step === currentStep ? "CURRENT" : "PENDING");
  }

  async function submit(endpoint: string, method: "POST" | "PUT", payload: any, success: string) {
    setMessage("");
    const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      setMessage("Não foi possível salvar. Revise os campos e tente novamente.");
      return null;
    }
    const result = await response.json();
    setMessage(success);
    clearDraftAction?.();
    router.refresh();
    return result;
  }

  function run(action: () => Promise<void>) {
    startTransition(action);
  }

  async function chooseStep(step: StepKey) {
    setActiveTab(labelFromStep(step));
    if (!appointment || appointment.currentStep === step) return;
    let reason: string | null = null;
    if (appointment.status === "FINISHED") {
      reason = window.prompt("Motivo da reabertura do atendimento:");
      if (!reason) return;
    } else if (flowSteps.findIndex((item) => item.key === step) < flowSteps.findIndex((item) => item.key === appointment.currentStep)) {
      const ok = window.confirm("Voltar para esta etapa atualizará a etapa atual e poderá marcar etapas posteriores como 'precisa revisão'. Continuar?");
      if (!ok) return;
    }
    await submit(`/api/appointments/${appointment.id}/step`, "PUT", { step, reason }, "Etapa atualizada.");
  }

  async function finishAppointment(force = false) {
    if (!appointment) return;
    if (!force && pendings.length > 0) {
      const ok = window.confirm(`Há pendências antes de finalizar:\n\n${pendings.join("\n")}\n\nDeseja finalizar mesmo assim?`);
      if (!ok) return;
    }
    await submit(`/api/appointments/${appointment.id}`, "PUT", { status: "FINISHED", currentStep: "COMPLETION" }, "Atendimento finalizado.");
    setActiveTab("Finalização");
  }

  async function createNewAppointment() {
    const response = await fetch(`/api/patients/${patient.id}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    if (!response.ok) return setMessage("Não foi possível criar novo atendimento.");
    const created = await response.json();
    router.push(`/patients/${patient.id}/workspace?appointmentId=${created.id}`);
  }

  async function duplicateProtocol(sourceProtocol: any) {
    const created = await submit(`/api/patients/${patient.id}/protocols`, "POST", {
      title: `${sourceProtocol.title} (cópia)`,
      objective: sourceProtocol.objective,
      indication: sourceProtocol.indication,
      contraindications: sourceProtocol.contraindications,
      postProcedureCare: sourceProtocol.postProcedureCare,
      source: sourceProtocol.source,
      status: "DRAFT",
      appointmentId: appointment?.id ?? null
    }, "Protocolo duplicado.");
    if (!created) return;
    await Promise.all((sourceProtocol.steps ?? []).map((step: any) => fetch(`/api/protocols/${created.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: step.order, title: step.title, description: step.description, product: step.product, duration: step.duration, notes: step.notes })
    })));
    router.refresh();
  }

  function Stepper() {
    const activeStepLabel = activeTab === "Preparação" ? "Anamnese" : activeTab;

    function StepIcon({ status, active }: { status: string; active: boolean }) {
      if (status === "COMPLETED") return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white"><Check className="h-3 w-3" /></span>;
      if (status === "NEEDS_REVIEW") return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-warning"><AlertTriangle className="h-3.5 w-3.5" /></span>;
      if (active || status === "CURRENT") return <span className="flex h-6 w-6 items-center justify-center rounded-full border-4 border-orange-100 bg-senac-orange text-white"><Circle className="h-1.5 w-1.5 fill-white text-white" /></span>;
      return <span className="h-5 w-5 rounded-full border border-slate-300 bg-white" />;
    }

    return (
      <div className="border-b border-border bg-white px-6 py-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Etapa atual</p>
            <p className="text-lg font-bold leading-6 text-dark-accent">{activeStepLabel}</p>
          </div>
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">Fluxo</p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative flex min-w-[560px] items-start justify-between gap-3">
            <div className="absolute left-4 right-4 top-2.5 h-1 rounded-full bg-slate-100" />
          {visibleFlowSteps.map((step) => {
            const status = stateFor(step.key);
            const active = activeTab === step.label;
            return (
              <div key={step.key} className="relative z-10 flex min-w-0 flex-1 flex-col items-center">
                <button
                  type="button"
                  onClick={() => run(async () => chooseStep(step.key))}
                  title={`${step.label} · ${labelFor(status)}`}
                  className={`group flex flex-col items-center gap-2 text-[12px] font-semibold transition ${
                    active
                      ? "text-senac-orange"
                      : status === "NEEDS_REVIEW"
                        ? "text-amber-800"
                        : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <StepIcon status={status} active={active} />
                  <span className="whitespace-nowrap">{step.shortLabel}</span>
                </button>
                {active && <span className="mt-1 h-1 w-10 rounded-full bg-senac-orange" />}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Stepper />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFD] p-3.5 2xl:p-4">
        {message && <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}

        {activeTab === "Preparação" && (
          <div className="space-y-4">
            <SectionHeader title="Preparação" description="Organize o contexto antes de iniciar ou continuar o atendimento." />
            <Field label="Paciente" value={patient.name} />
            <Field label="Status do atendimento" value={labelFor(appointment?.status)} />
            {!appointment && <Button variant="primary" onClick={() => run(createNewAppointment)}>Novo atendimento</Button>}
          </div>
        )}

        {activeTab === "Anamnese" && (
          <StepForm title="Anamnese" description="Dados clínicos iniciais. A Marie pode sugerir perguntas ou alertas, mas o registro é profissional.">
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              const payload = formObject(new FormData(event.currentTarget));
              run(async () => {
                await submit(anamnesis ? `/api/anamneses/${anamnesis.id}` : `/api/patients/${patient.id}/anamneses`, anamnesis ? "PUT" : "POST", payload, "Anamnese salva.");
                if (appointment) await submit(`/api/appointments/${appointment.id}/step`, "PUT", { step: "ASSESSMENT" }, "Próxima etapa: avaliação.");
                setActiveTab("Avaliação");
              });
            }}>
              <TextField label="Queixa principal" name="chiefComplaint" value={anamnesis?.chiefComplaint} textarea required />
              <TextField label="Objetivo do tratamento" name="treatmentGoal" value={anamnesis?.treatmentGoal} textarea />
              <TextField label="Alergias" name="allergies" value={anamnesis?.allergies} textarea />
              <TextField label="Medicamentos" name="medications" value={anamnesis?.medications} textarea />
              <TextField label="Contraindicações" name="contraindications" value={anamnesis?.contraindications} textarea />
              <TextField label="Observações" name="notes" value={anamnesis?.notes} textarea />
              <Button size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar anamnese</Button>
            </form>
          </StepForm>
        )}

        {activeTab === "Avaliação" && (
          <StepForm title="Avaliação" description="Revise achados técnicos. Alterações aqui marcam o plano de cuidado para revisão.">
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              if (!appointment) return setMessage("Inicie um atendimento antes de salvar avaliação.");
              run(async () => {
                await submit(assessment ? `/api/assessments/${assessment.id}` : `/api/appointments/${appointment.id}/assessment`, assessment ? "PUT" : "POST", formObject(new FormData(event.currentTarget)), "Avaliação salva.");
                setActiveTab("Plano de cuidado");
              });
            }}>
              <label className="grid gap-1.5 text-sm font-medium">Área avaliada
                <select name="assessedArea" defaultValue={assessment?.assessedArea ?? "FACIAL"} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
                  <option value="FACIAL">Facial</option>
                  <option value="BODY">Corporal</option>
                  <option value="BOTH">Facial e corporal</option>
                </select>
              </label>
              <TextField label="Análise profissional" name="professionalAnalysis" value={assessment?.professionalAnalysis} textarea />
              <TextField label="Condição da pele" name="skinCondition" value={assessment?.skinCondition} textarea />
              <TextField label="Riscos percebidos" name="perceivedRisks" value={assessment?.perceivedRisks} textarea />
              <TextField label="Observações técnicas" name="technicalNotes" value={assessment?.technicalNotes} textarea />
              <Button size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar avaliação</Button>
            </form>
          </StepForm>
        )}

        {activeTab === "Plano de cuidado" && (
          <div className="space-y-4">
            <SectionHeader title="Plano de cuidado" description="Sugestões, revisão profissional e protocolo aprovado vivem aqui. A Marie apoia, mas a decisão é profissional." />
            <CarePlanSection
              appointment={appointment}
              patient={patient}
              suggestion={suggestion}
              protocol={protocol}
              marieSuggestions={marieSuggestions}
              draftPayload={draftPayload}
              editingSuggestion={editingSuggestion}
              setEditingSuggestion={setEditingSuggestion}
              showSuggestionForm={showSuggestionForm || draftAction?.type === "CREATE_PROTOCOL_SUGGESTION"}
              setShowSuggestionForm={setShowSuggestionForm}
              editingProtocol={editingProtocol}
              setEditingProtocol={setEditingProtocol}
              isPending={isPending}
              run={run}
              submit={submit}
              duplicateProtocol={duplicateProtocol}
            />
          </div>
        )}

        {activeTab === "Execução" && (
          <StepForm title="Execução" description="Registre procedimento, produtos, parâmetros e intercorrências. Alterações aqui podem exigir revisão da evolução.">
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              if (!appointment) return;
              run(async () => {
                await submit(`/api/appointments/${appointment.id}/execution`, "POST", formObject(new FormData(event.currentTarget)), "Execução registrada.");
                setActiveTab("Evolução");
              });
            }}>
              <TextField label="Procedimento realizado" name="procedurePerformed" value={execution?.procedurePerformed} textarea required />
              <TextField label="Produtos utilizados" name="productsUsed" value={execution?.productsUsed} textarea />
              <TextField label="Parâmetros de equipamentos" name="equipmentParameters" value={execution?.equipmentParameters} textarea />
              <TextField label="Duração" name="duration" value={execution?.duration} />
              <TextField label="Observações profissionais" name="professionalNotes" value={execution?.professionalNotes} textarea />
              <TextField label="Intercorrências" name="incidents" value={execution?.incidents} textarea />
              <TextField label="Cuidados pós-procedimento entregues" name="postCareGiven" value={execution?.postCareGiven} textarea />
              <Button size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar execução</Button>
            </form>
          </StepForm>
        )}

        {activeTab === "Evolução" && (
          <StepForm title="Evolução" description="Registre resposta clínica, ajustes e próximos passos.">
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              run(async () => submit(`/api/patients/${patient.id}/evolutions`, "POST", { ...formObject(new FormData(event.currentTarget)), appointmentId: appointment?.id ?? null }, "Evolução registrada."));
            }}>
              <TextField label="Resumo / procedimento realizado" name="summary" value={draftPayload.summary} textarea required />
              <TextField label="Resposta do paciente" name="patientResponse" value={draftPayload.patientResponse} textarea />
              <TextField label="Observações clínicas" name="professionalNotes" value={draftPayload.professionalNotes} textarea />
              <TextField label="Ajustes realizados" name="adjustmentsMade" value={draftPayload.adjustmentsMade} textarea />
              <TextField label="Próximos passos" name="nextSteps" value={draftPayload.nextSteps} textarea />
              <TextField label="Data de retorno" name="returnDate" type="date" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar evolução</Button>
                {appointment?.status !== "FINISHED" && <Button type="button" size="sm" variant="success" onClick={() => run(async () => finishAppointment())}>Finalizar atendimento</Button>}
              </div>
            </form>
            <div className="mt-3 space-y-3">
              {patient.evolutions?.map((item: any) => <Field key={item.id} label={formatDate(item.createdAt)} value={`${item.summary}\n${item.nextSteps ?? ""}`} />)}
            </div>
          </StepForm>
        )}

        {activeTab === "Finalização" && (
          <div className="space-y-4">
            <SectionHeader title="Finalização" description="Ao finalizar, escolha entre reabrir, novo atendimento ou acompanhamento do mesmo tratamento." />
            <Field label="Status" value={labelFor(appointment?.status)} />
            <Field label="Pendências" value={pendings.length ? pendings.join("\n") : "Nenhuma pendência crítica identificada."} />
            {appointment?.status !== "FINISHED" && <Button variant="success" onClick={() => run(async () => finishAppointment(true))}>Finalizar atendimento</Button>}
            {appointment?.status === "FINISHED" && (
              <div className="grid gap-3">
                <ActionInfo title="Reabrir atendimento" text="Use para corrigir ou complementar um atendimento já finalizado." action={<Button onClick={() => run(async () => chooseStep("ANAMNESIS"))}><RotateCcw className="h-4 w-4" />Reabrir</Button>} />
                <ActionInfo title="Novo atendimento" text="Use para iniciar um novo ciclo de atendimento para este paciente." action={<Button variant="primary" onClick={() => run(createNewAppointment)}><Plus className="h-4 w-4" />Novo atendimento</Button>} />
                <ActionInfo title="Registrar retorno/acompanhamento" text="Use para acompanhar evolução, revisar resposta clínica ou ajustar conduta do mesmo tratamento." action={<Button onClick={() => setShowFollowUp((value) => !value)}>Registrar retorno</Button>} />
                {showFollowUp && <FollowUpForm appointment={appointment} isPending={isPending} submit={submit} />}
                {followUps.map((item: any) => <Field key={item.id} label={`${labelFor(item.type)} · ${formatDate(item.date)}`} value={`${item.summary}\n${item.nextSteps ?? ""}`} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepForm({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <SectionHeader title={title} description={description} />
      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">{children}</div>
    </div>
  );
}

function CarePlanSection(props: any) {
  const { appointment, patient, suggestion, protocol, marieSuggestions, draftPayload, editingSuggestion, setEditingSuggestion, showSuggestionForm, setShowSuggestionForm, editingProtocol, setEditingProtocol, isPending, run, submit, duplicateProtocol } = props;
  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-dark-accent">1. Sugestões</p>
            <p className="text-xs text-muted">Marie e sugestões manuais ficam no contexto do plano.</p>
          </div>
          <Button size="sm" onClick={() => setShowSuggestionForm(true)}><Plus className="h-4 w-4" />Criar sugestão</Button>
        </div>
        {showSuggestionForm && <SuggestionForm draftPayload={draftPayload} editingSuggestion={editingSuggestion ?? suggestion} appointment={appointment} isAi={!!draftPayload.title} disabled={isPending} onSubmit={(payload: Record<string, unknown>) => run(async () => {
          await submit(editingSuggestion ? `/api/suggestions/${editingSuggestion.id}` : `/api/patients/${patient.id}/suggestions`, editingSuggestion ? "PUT" : "POST", payload, "Sugestão salva no plano de cuidado.");
          setEditingSuggestion(null);
          setShowSuggestionForm(false);
        })} />}
        <div className="mt-3 space-y-2">
          {marieSuggestions.map((item: any) => <Field key={item.id} label={`Marie · ${labelFor(item.step)}`} value={`${item.title}\n${item.content ?? ""}`} />)}
          {patient.suggestions?.map((item: any) => (
            <div key={item.id} className="rounded-[14px] border border-border bg-[#F8FAFD] p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p><Badge tone={item.status === "REJECTED" ? "red" : item.status === "APPROVED" ? "green" : "amber"}>{labelFor(item.status)}</Badge></div>
              <p className="mt-1 text-sm text-muted">{item.objective}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setEditingSuggestion(item); setShowSuggestionForm(true); }}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => run(async () => submit(`/api/suggestions/${item.id}`, "PUT", { status: "REJECTED" }, "Sugestão rejeitada."))}>Rejeitar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-dark-accent">2. Revisão profissional</p>
        {suggestion ? (
          <form className="mt-3 space-y-3" onSubmit={(event) => {
            event.preventDefault();
            run(async () => submit(`/api/suggestions/${suggestion.id}/validation`, "POST", formObject(new FormData(event.currentTarget)), "Revisão salva. Protocolo aprovado criado no plano."));
          }}>
            <label className="grid gap-1.5 text-sm font-medium">Decisão
              <select name="decision" defaultValue={suggestion?.validation?.decision ?? "APPROVED"} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
                <option value="APPROVED">Aprovar como protocolo</option>
                <option value="APPROVED_WITH_ADJUSTMENTS">Aprovar com ajustes</option>
                <option value="REJECTED">Rejeitar</option>
              </select>
            </label>
            <TextField label="Justificativa" name="justification" value={suggestion?.validation?.justification} textarea required />
            <TextField label="Análise crítica / ajustes" name="criticalAnalysis" value={suggestion?.validation?.criticalAnalysis} textarea />
            <Button size="sm" variant="success" disabled={isPending}><CheckCircle2 className="h-4 w-4" />Salvar revisão</Button>
          </form>
        ) : <p className="mt-2 text-sm text-muted">Crie uma sugestão antes da revisão profissional.</p>}
      </div>

      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-dark-accent">3. Protocolo aprovado</p>
            <p className="text-xs text-muted">Plano oficial validado e pronto para aplicação.</p>
          </div>
          {protocol && <Button size="sm" onClick={() => setEditingProtocol((value: boolean) => !value)}><Pencil className="h-4 w-4" />Editar</Button>}
        </div>
        {(editingProtocol || !protocol) ? (
          <ProtocolForm protocol={protocol} suggestion={suggestion} appointment={appointment} patient={patient} disabled={isPending} onSubmit={(payload: Record<string, unknown>) => run(async () => {
            await submit(protocol ? `/api/protocols/${protocol.id}` : `/api/patients/${patient.id}/protocols`, protocol ? "PUT" : "POST", payload, "Protocolo salvo.");
            setEditingProtocol(false);
          })} />
        ) : (
          <div className="space-y-3">
            <Field label="Status" value={labelFor(protocol.status)} />
            <Field label="Título" value={protocol.title} />
            <Field label="Cuidados pós-procedimento" value={protocol.postProcedureCare} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => run(async () => submit(`/api/protocols/${protocol.id}`, "PUT", { status: "APPLIED" }, "Protocolo aplicado. Próxima etapa: execução."))}>Aplicar protocolo</Button>
              <Button size="sm" variant="ghost" onClick={() => run(async () => duplicateProtocol(protocol))}><Copy className="h-4 w-4" />Duplicar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionForm({ draftPayload, editingSuggestion, appointment, isAi, disabled, onSubmit }: any) {
  return (
    <form className="space-y-3 rounded-[14px] border border-border bg-white p-4 shadow-soft" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ ...formObject(new FormData(event.currentTarget)), appointmentId: appointment?.id ?? null, source: isAi ? "AI" : (editingSuggestion?.source ?? "MANUAL"), status: "WAITING_REVIEW" });
    }}>
      <TextField label="Título" name="title" value={draftPayload.title ?? editingSuggestion?.title ?? ""} required />
      <TextField label="Objetivo" name="objective" value={draftPayload.objective ?? editingSuggestion?.objective ?? ""} textarea />
      <label className="grid gap-1.5 text-sm font-medium">Área
        <select name="area" defaultValue={draftPayload.area ?? editingSuggestion?.area ?? "FACIAL"} className="h-10 rounded-md border border-border bg-white px-3 text-sm">
          <option value="FACIAL">Facial</option>
          <option value="BODY">Corporal</option>
          <option value="BOTH">Facial e corporal</option>
        </select>
      </label>
      <TextField label="Ativos sugeridos" name="suggestedActives" value={draftPayload.suggestedActives ?? editingSuggestion?.suggestedActives ?? ""} textarea />
      <TextField label="Técnicas sugeridas" name="suggestedTechniques" value={draftPayload.suggestedTechniques ?? editingSuggestion?.suggestedTechniques ?? ""} textarea />
      <TextField label="Equipamentos" name="suggestedEquipments" value={draftPayload.suggestedEquipments ?? editingSuggestion?.suggestedEquipments ?? ""} textarea />
      <TextField label="Contraindicações" name="contraindications" value={draftPayload.contraindications ?? editingSuggestion?.contraindications ?? ""} textarea />
      <TextField label="Alertas" name="warnings" value={draftPayload.warnings ?? editingSuggestion?.warnings ?? ""} textarea />
      <Button size="sm" variant="primary" disabled={disabled}><Save className="h-4 w-4" />Salvar sugestão</Button>
    </form>
  );
}

function ProtocolForm({ protocol, suggestion, appointment, patient, disabled, onSubmit }: any) {
  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ ...formObject(new FormData(event.currentTarget)), appointmentId: appointment?.id ?? null });
    }}>
      <TextField label="Título" name="title" value={protocol?.title ?? suggestion?.title} required />
      <TextField label="Objetivo" name="objective" value={protocol?.objective ?? suggestion?.objective} textarea />
      <TextField label="Indicação" name="indication" value={protocol?.indication ?? suggestion?.suggestedTechniques} textarea />
      <TextField label="Contraindicações" name="contraindications" value={protocol?.contraindications ?? suggestion?.contraindications} textarea />
      <TextField label="Cuidados pós-procedimento" name="postProcedureCare" value={protocol?.postProcedureCare ?? suggestion?.warnings} textarea />
      <input type="hidden" name="source" value={protocol?.source ?? "AI_ASSISTED"} />
      <input type="hidden" name="status" value={protocol?.status ?? "APPROVED"} />
      <Button size="sm" variant="primary" disabled={disabled}><Save className="h-4 w-4" />Salvar protocolo</Button>
    </form>
  );
}

function FollowUpForm({ appointment, isPending, submit }: any) {
  return (
    <form className="space-y-3 rounded-[14px] border border-border bg-white p-4 shadow-soft" onSubmit={(event) => {
      event.preventDefault();
      submit(`/api/appointments/${appointment.id}/follow-ups`, "POST", formObject(new FormData(event.currentTarget)), "Retorno registrado.");
    }}>
      <label className="grid gap-1.5 text-sm font-medium">Tipo
        <select name="type" className="h-10 rounded-md border border-border bg-white px-3 text-sm">
          <option value="RETURN">Retorno</option>
          <option value="FOLLOW_UP">Acompanhamento</option>
          <option value="PROTOCOL_REVIEW">Revisão de protocolo</option>
          <option value="EVOLUTION_CHECK">Checagem de evolução</option>
          <option value="INTERCURRENCE">Intercorrência</option>
        </select>
      </label>
      <TextField label="Resumo" name="summary" textarea required />
      <TextField label="Resposta do paciente" name="patientResponse" textarea />
      <TextField label="Observações profissionais" name="professionalNotes" textarea />
      <TextField label="Ajustes" name="adjustments" textarea />
      <TextField label="Próximos passos" name="nextSteps" textarea />
      <Button size="sm" variant="primary" disabled={isPending}>Salvar retorno</Button>
    </form>
  );
}

function ActionInfo({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{text}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}
