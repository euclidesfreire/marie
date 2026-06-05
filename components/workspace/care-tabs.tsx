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
import { getMarieActionTargetStep, mapMarieActionToStepDraft, stepToCareTab } from "@/lib/ai/marie-action-drafts";
import {
  getTreatmentConcernOptionsForArea,
  isTreatmentConcernCompatible,
  type MarieArea,
  type MarieProtocolKey
} from "@/lib/ai/marie-knowledge-base";

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
  if (step === "ASSESSMENT") return "Anamnese";
  return flowSteps.find((item) => item.key === step)?.label ?? "Anamnese";
}

function stepFromLabel(label: string): StepKey {
  return flowSteps.find((item) => item.label === label)?.key ?? "ANAMNESIS";
}

function formObject(formData: FormData) {
  return [...new Set([...formData.keys()])].reduce<Record<string, any>>((payload, key) => {
    const values = formData.getAll(key).map((value) => String(value)).filter((value) => value !== "");
    payload[key] = values.length > 1 ? values.join(", ") : values[0] ?? null;
    return payload;
  }, {});
}

function pickFields(source: Record<string, any>, fields: string[]) {
  return fields.reduce<Record<string, any>>((payload, field) => {
    payload[field] = source[field] ?? null;
    return payload;
  }, {});
}

const anamnesisFields = ["chiefComplaint", "treatmentGoal", "allergies", "medications", "preExistingConditions", "previousProcedures", "skinType", "skinSensitivity", "contraindications", "habits", "notes"];
const assessmentFields = [
  "assessedArea",
  "primaryTreatmentConcern",
  "primaryFinding",
  "mainFinding",
  "photoprotection",
  "sunExposure",
  "acidUse",
  "acidRetinoidUse",
  "sensitizingMedication",
  "structuredContraindications",
  "structuredHabits",
  "professionalAnalysis",
  "skinCondition",
  "bodyCondition",
  "perceivedRisks",
  "technicalNotes"
];

const skinTypeOptions = [
  ["", "Não informado"],
  ["Normal", "Normal"],
  ["Oleosa", "Oleosa"],
  ["Seca / alípica", "Seca / alípica"],
  ["Mista", "Mista"],
  ["Sensível", "Sensível"],
  ["Acneica", "Acneica"]
];

const sensitivityOptions = [
  ["", "Não informado"],
  ["Baixa", "Baixa"],
  ["Moderada", "Moderada"],
  ["Alta", "Alta"],
  ["Pele sensibilizada / reativa", "Pele sensibilizada / reativa"]
];

const photoprotectionOptions = [
  ["", "Não informado"],
  ["Usa diariamente", "Usa diariamente"],
  ["Usa irregularmente", "Usa irregularmente"],
  ["Não usa", "Não usa"],
  ["Exposição solar frequente", "Exposição solar frequente"]
];

const sunExposureOptions = [
  ["", "Não informado"],
  ["Baixa", "Baixa"],
  ["Moderada", "Moderada"],
  ["Frequente", "Frequente"],
  ["Intensa", "Intensa"]
];

const acidUseOptions = [
  ["", "Não informado"],
  ["Não", "Não"],
  ["Sim", "Sim"],
  ["Sim, com sensibilidade", "Sim, com sensibilidade"],
  ["Suspenso recentemente", "Suspenso recentemente"]
];

const sensitizingMedicationOptions = [
  ["", "Não informado"],
  ["Não", "Não"],
  ["Sim, Roacutan/isotretinoína", "Sim, Roacutan/isotretinoína"],
  ["Sim, outro medicamento sensibilizante", "Sim, outro medicamento sensibilizante"]
];

const contraindicationOptions = [
  "Gestação",
  "Marca-passo",
  "Alterações cardíacas",
  "Alergias",
  "Sensibilidade intensa",
  "Lesão ativa / ferida aberta",
  "Alterações vasculares/circulatórias",
  "Histórico de reação a procedimento",
  "Uso recente de ácidos",
  "Roacutan/isotretinoína",
  "Nenhuma informada"
];

const habitOptions = [
  "Baixa ingestão de água",
  "Sedentarismo",
  "Tabagismo",
  "Sono irregular",
  "Alimentação rica em açúcar",
  "Exposição solar frequente",
  "Nenhum relevante informado"
];

const findingOptionsByConcern: Partial<Record<MarieProtocolKey, string[]>> = {
  facial_acne: ["Comedões/cravos", "Pústulas/lesões inflamadas", "Oleosidade predominante", "Pele sensibilizada", "Manchas pós-acne"],
  facial_clareamento: ["Melasma", "HPI", "Efélides", "Melanose solar", "Manchas pós-acne"],
  facial_rejuvenescimento: ["Linhas finas", "Rugas", "Pele desvitalizada", "Pele sensível", "Pele ressecada"],
  facial_olheiras: ["Olheira vascular", "Olheira pigmentada", "Edema periocular", "Sensibilidade periocular", "Flacidez associada"],
  facial_flacidez_papada: ["Papada", "Contorno mandibular", "Flacidez facial leve", "Flacidez com envelhecimento", "Flacidez com sensibilidade"],
  facial_sinais_cicatrizes: ["Cicatriz atrófica", "Verruga", "Nevo", "Siringoma", "Cicatriz pós-acne"],
  facial_outras: ["Limpeza de pele", "Revitalização", "Drenagem facial", "Detox facial", "Pele opaca"],
  corporal_gordura: ["Abdômen", "Flancos", "Culote", "Associada à flacidez", "Associada a sedentarismo"],
  corporal_celulite: ["Retenção hídrica", "Fibrose", "Sensibilidade local", "Associada à flacidez", "Associada a sedentarismo"],
  corporal_estrias: ["Estrias recentes", "Estrias antigas", "Estrias avermelhadas", "Estrias brancas", "Pele sensível"],
  corporal_flacidez: ["Flacidez leve", "Pós-emagrecimento", "Tonificação", "Associada à gordura localizada", "Contraindicação para correntes"],
  corporal_clareamento: ["Axila", "Virilha", "Interno de coxa", "Glúteos", "Joelho", "Cotovelo"],
  corporal_relaxamento: ["Relaxamento", "Retenção hídrica", "Drenagem linfática", "Detox corporal", "Spa dos pés", "Tensão muscular"]
};

function withStructuredSkinNotes(payload: Record<string, any>) {
  const extras = [
    ["Uso recente de ácidos/retinoides", payload.acidUseNotes],
    ["Exposição solar recente", payload.sunExposureNotes],
    ["Fotoproteção", payload.photoprotectionNotes]
  ].filter(([, value]) => typeof value === "string" && value.trim().length > 0);

  if (!extras.length) return payload;
  const details = extras.map(([label, value]) => `${label}: ${value}`).join("\n");
  return {
    ...payload,
    notes: [payload.notes, `Pele e sensibilidade:\n${details}`].filter(Boolean).join("\n\n")
  };
}

function withAssessmentAliases(payload: Record<string, any>) {
  const finding = payload.primaryFinding ?? payload.mainFinding ?? null;
  const acidUse = payload.acidUse ?? payload.acidRetinoidUse ?? null;
  return {
    ...payload,
    primaryFinding: finding,
    mainFinding: finding,
    acidUse,
    acidRetinoidUse: acidUse
  };
}

function withSafeComplaint(payload: Record<string, any>, concernLabel?: string) {
  if (typeof payload.chiefComplaint === "string" && payload.chiefComplaint.trim()) return payload;
  const fallback = [concernLabel, payload.primaryFinding ?? payload.mainFinding].filter(Boolean).join(" - ");
  return { ...payload, chiefComplaint: fallback || "Queixa estruturada em avaliação inicial" };
}

function TextField({ label, name, value, textarea, required, type = "text", placeholder }: { label: string; name: string; value?: string | null; textarea?: boolean; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      {textarea ? <Textarea name={name} defaultValue={value ?? ""} required={required} placeholder={placeholder} /> : <Input type={type} name={name} defaultValue={value ?? ""} required={required} placeholder={placeholder} />}
    </label>
  );
}

function SelectField({ label, name, value, options, required, onChange }: { label: string; name: string; value?: string | null; options: string[][]; required?: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      {label}
      <select name={name} defaultValue={value ?? ""} required={required} onChange={(event) => onChange?.(event.currentTarget.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100">
        {options.map(([optionValue, labelText]) => <option key={optionValue || labelText} value={optionValue}>{labelText}</option>)}
      </select>
    </label>
  );
}

function CheckboxGroup({ label, name, options, value }: { label: string; name: string; options: string[]; value?: string | null }) {
  const selected = new Set(String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground">
            <input type="checkbox" name={name} value={option} defaultChecked={selected.has(option)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
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

function AccordionSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-[14px] border border-border bg-white shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-dark-accent">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-lg leading-none text-muted transition group-open:rotate-45 group-open:text-senac-orange">+</span>
      </summary>
      <div className="space-y-3 border-t border-border bg-[#F8FAFD] px-4 py-3">{children}</div>
    </details>
  );
}

function MobileFormActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 border-t border-border bg-white px-3 py-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_22px_rgba(10,61,145,0.08)] sm:hidden">
      <div className="flex flex-wrap gap-2">{children}</div>
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
  const draftPayload = mapMarieActionToStepDraft(draftAction, activeStep);
  const initialArea = (draftPayload.assessedArea ?? assessment?.assessedArea ?? "FACIAL") as MarieArea;
  const initialConcern = (draftPayload.primaryTreatmentConcern ?? assessment?.primaryTreatmentConcern ?? "") as MarieProtocolKey | "";
  const initialFinding = (draftPayload.primaryFinding ?? draftPayload.mainFinding ?? assessment?.primaryFinding ?? assessment?.mainFinding ?? "") as string;
  const [selectedArea, setSelectedArea] = useState<MarieArea>(initialArea);
  const [selectedConcern, setSelectedConcern] = useState<MarieProtocolKey | "">(initialConcern);
  const [selectedFinding, setSelectedFinding] = useState(initialFinding);
  const concernOptions = getTreatmentConcernOptionsForArea(selectedArea);
  const findingOptions = selectedConcern ? findingOptionsByConcern[selectedConcern] ?? [] : [];
  const selectedConcernLabel = concernOptions.find((option) => option.value === selectedConcern)?.label;

  useEffect(() => {
    if (!appointment) return;
    setActiveTab(labelFromStep(appointment.currentStep === "PREPARATION" ? "ANAMNESIS" : appointment.currentStep));
  }, [appointment, setActiveTab]);

  useEffect(() => {
    if (!draftAction) return;
    setActiveTab(stepToCareTab(getMarieActionTargetStep(draftAction, currentStep)));
  }, [draftAction, currentStep, setActiveTab]);

  useEffect(() => {
    const nextArea = (draftPayload.assessedArea ?? assessment?.assessedArea ?? "FACIAL") as MarieArea;
    const nextConcern = (draftPayload.primaryTreatmentConcern ?? assessment?.primaryTreatmentConcern ?? "") as MarieProtocolKey | "";
    const nextFinding = (draftPayload.primaryFinding ?? draftPayload.mainFinding ?? assessment?.primaryFinding ?? assessment?.mainFinding ?? "") as string;
    setSelectedArea(nextArea);
    setSelectedConcern(nextConcern && isTreatmentConcernCompatible(nextConcern, nextArea) ? nextConcern : "");
    setSelectedFinding(nextFinding);
  }, [assessment?.assessedArea, assessment?.primaryTreatmentConcern, assessment?.primaryFinding, assessment?.mainFinding, draftPayload.assessedArea, draftPayload.primaryTreatmentConcern, draftPayload.primaryFinding, draftPayload.mainFinding]);

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
    const normalizedCurrentStep = appointment?.currentStep === "ASSESSMENT" ? "ANAMNESIS" : appointment?.currentStep;
    if (!appointment || normalizedCurrentStep === step) {
      setActiveTab(labelFromStep(step));
      return;
    }
    let reason: string | null = null;
    if (appointment.status === "FINISHED") {
      reason = window.prompt("Motivo da reabertura do atendimento:");
      if (!reason) return;
    } else if (flowSteps.findIndex((item) => item.key === step) < flowSteps.findIndex((item) => item.key === appointment.currentStep)) {
      const ok = window.confirm("Voltar para esta etapa atualizará a etapa atual e poderá marcar etapas posteriores como 'precisa revisão'. Continuar?");
      if (!ok) return;
    }
    const updated = await submit(`/api/appointments/${appointment.id}/step`, "PUT", { step, reason }, "Etapa atualizada.");
    if (updated) setActiveTab(labelFromStep(step));
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
      <div className="border-b border-border bg-white px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Etapa atual</p>
            <p className="text-base font-bold leading-6 text-dark-accent sm:text-lg">{activeStepLabel}</p>
          </div>
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">Fluxo</p>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative flex min-w-[460px] items-start justify-between gap-3">
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

  function MobileActions() {
    if (activeTab === "Anamnese") {
      return (
        <MobileFormActionBar>
          <Button form="anamnesis-form" name="intent" value="draft" size="sm" disabled={isPending}><Save className="h-4 w-4" />Salvar</Button>
          <Button form="anamnesis-form" name="intent" value="advance" size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar e avançar</Button>
        </MobileFormActionBar>
      );
    }

    if (activeTab === "Plano de cuidado") {
      if (editingProtocol || !protocol || draftPayload.title || draftPayload.objective || draftPayload.indication || draftPayload.postProcedureCare) {
        return (
          <MobileFormActionBar>
            <Button form="protocol-form" size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar plano</Button>
          </MobileFormActionBar>
        );
      }
      return (
        <MobileFormActionBar>
          <Button size="sm" onClick={() => setEditingProtocol(true)}><Pencil className="h-4 w-4" />Editar</Button>
          <Button size="sm" variant="primary" onClick={() => run(async () => submit(`/api/protocols/${protocol.id}`, "PUT", { status: "APPLIED" }, "Protocolo aplicado. Próxima etapa: execução."))}>Aplicar</Button>
        </MobileFormActionBar>
      );
    }

    if (activeTab === "Execução") {
      return (
        <MobileFormActionBar>
          <Button form="execution-form" size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar execução</Button>
        </MobileFormActionBar>
      );
    }

    if (activeTab === "Evolução") {
      return (
        <MobileFormActionBar>
          <Button form="evolution-form" size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar evolução</Button>
          {appointment?.status !== "FINISHED" && <Button type="button" size="sm" variant="success" onClick={() => run(async () => finishAppointment())}>Finalizar</Button>}
        </MobileFormActionBar>
      );
    }

    if (activeTab === "Finalização") {
      return (
        <MobileFormActionBar>
          {appointment?.status !== "FINISHED" && <Button size="sm" variant="success" onClick={() => run(async () => finishAppointment(true))}>Finalizar</Button>}
          {appointment?.status === "FINISHED" && <Button size="sm" onClick={() => run(async () => chooseStep("ANAMNESIS"))}><RotateCcw className="h-4 w-4" />Reabrir</Button>}
        </MobileFormActionBar>
      );
    }

    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Stepper />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFD] p-3.5 pb-8 sm:pb-3.5 2xl:p-4">
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
          <StepForm title="Anamnese inicial" description="Registre os dados essenciais do atendimento. A Marie pode sugerir perguntas e pontos de atenção, mas o registro é profissional.">
            <form id="anamnesis-form" key={`anamnesis-${draftAction?.id ?? "base"}`} className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
              const shouldAdvance = submitter?.value !== "draft";
              const rawPayload = formObject(new FormData(event.currentTarget));
              const payload = withSafeComplaint(withStructuredSkinNotes(withAssessmentAliases(rawPayload)), selectedConcernLabel);
              run(async () => {
                await submit(anamnesis ? `/api/anamneses/${anamnesis.id}` : `/api/patients/${patient.id}/anamneses`, anamnesis ? "PUT" : "POST", pickFields(payload, anamnesisFields), "Anamnese salva.");
                if (appointment) {
                  await submit(assessment ? `/api/assessments/${assessment.id}` : `/api/appointments/${appointment.id}/assessment`, assessment ? "PUT" : "POST", pickFields(payload, assessmentFields), "Avaliação inicial salva.");
                  if (shouldAdvance) await submit(`/api/appointments/${appointment.id}/step`, "PUT", { step: "CARE_PLAN" }, "Próxima etapa: plano de cuidado.");
                }
                if (shouldAdvance) setActiveTab("Plano de cuidado");
              });
            }}>
              <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-dark-accent">Dados essenciais</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Preencha o mínimo clínico para orientar a Marie e avançar com segurança.</p>
                </div>
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm font-medium">Área avaliada
                    <select name="assessedArea" value={selectedArea} required onChange={(event) => {
                      const nextArea = event.currentTarget.value as MarieArea;
                      setSelectedArea(nextArea);
                      setSelectedConcern((current) => current && isTreatmentConcernCompatible(current, nextArea) ? current : "");
                      setSelectedFinding("");
                    }} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100">
                      <option value="FACIAL">Facial</option>
                      <option value="BODY">Corporal</option>
                      <option value="BOTH">Facial e corporal</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-foreground">Indicação principal
                    <select name="primaryTreatmentConcern" value={selectedConcern} onChange={(event) => {
                      setSelectedConcern(event.currentTarget.value as MarieProtocolKey | "");
                      setSelectedFinding("");
                    }} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100">
                      <option value="">Selecione para orientar a Marie</option>
                      {selectedArea === "BOTH" ? (
                        <>
                          <optgroup label="Faciais">
                            {concernOptions.filter((option) => option.area === "FACIAL").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </optgroup>
                          <optgroup label="Corporais">
                            {concernOptions.filter((option) => option.area === "BODY").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </optgroup>
                        </>
                      ) : concernOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  {findingOptions.length > 0 && (
                    <SelectField label="Achado principal" name="primaryFinding" value={selectedFinding} onChange={setSelectedFinding} options={[["", "Não informado"], ...findingOptions.map((option) => [option, option])]} />
                  )}
                  <TextField label="Detalhes da queixa relatada" name="chiefComplaint" value={draftPayload.chiefComplaint ?? anamnesis?.chiefComplaint} textarea placeholder="Ex.: paciente relata cravos, oleosidade intensa, abdômen/flancos, manchas ou sensibilidade..." />
                  <TextField label="Objetivo do atendimento" name="treatmentGoal" value={draftPayload.treatmentGoal ?? anamnesis?.treatmentGoal} textarea placeholder="Ex.: reduzir medidas, melhorar textura da pele, controlar oleosidade..." />
                  <TextField label="Restrições / contraindicações" name="contraindications" value={draftPayload.contraindications ?? anamnesis?.contraindications} textarea placeholder="Ex.: alergias, gestação, uso de ácidos, sensibilidade, doenças, medicações..." />
                  <TextField label="Observações profissionais" name="notes" value={draftPayload.notes ?? anamnesis?.notes} textarea placeholder="Registre sua análise inicial, pontos de atenção e observações relevantes..." />
                </div>
              </div>

              <AccordionSection title="Histórico clínico" description="Medicações, alergias, condições pré-existentes e hábitos relevantes.">
                <TextField label="Medicamentos em uso" name="medications" value={draftPayload.medications ?? anamnesis?.medications} textarea />
                <TextField label="Doenças/condições pré-existentes" name="preExistingConditions" value={draftPayload.preExistingConditions ?? anamnesis?.preExistingConditions} textarea />
                <TextField label="Alergias detalhadas" name="allergies" value={draftPayload.allergies ?? anamnesis?.allergies} textarea />
                <TextField label="Procedimentos anteriores" name="previousProcedures" value={draftPayload.previousProcedures ?? anamnesis?.previousProcedures} textarea />
                <TextField label="Hábitos relevantes" name="habits" value={draftPayload.habits ?? anamnesis?.habits} textarea />
              </AccordionSection>

              <AccordionSection title="Pele e sensibilidade" description="Dados úteis para a Marie ajustar cautela, fotoproteção e barreira cutânea.">
                <SelectField label="Tipo de pele" name="skinType" value={draftPayload.skinType ?? anamnesis?.skinType} options={skinTypeOptions} />
                <SelectField label="Sensibilidade" name="skinSensitivity" value={draftPayload.skinSensitivity ?? anamnesis?.skinSensitivity} options={sensitivityOptions} />
                <SelectField label="Fotoproteção" name="photoprotection" value={draftPayload.photoprotection ?? assessment?.photoprotection} options={photoprotectionOptions} />
                <SelectField label="Exposição solar" name="sunExposure" value={draftPayload.sunExposure ?? assessment?.sunExposure} options={sunExposureOptions} />
                <SelectField label="Uso recente de ácidos/retinoides" name="acidUse" value={draftPayload.acidUse ?? draftPayload.acidRetinoidUse ?? assessment?.acidUse ?? assessment?.acidRetinoidUse} options={acidUseOptions} />
                <SelectField label="Medicamento sensibilizante / Roacutan / isotretinoína" name="sensitizingMedication" value={draftPayload.sensitizingMedication ?? assessment?.sensitizingMedication} options={sensitizingMedicationOptions} />
              </AccordionSection>

              <AccordionSection title="Contraindicações e hábitos estruturados" description="Seleções padronizadas reduzem ambiguidades para a Marie.">
                <CheckboxGroup label="Contraindicações importantes" name="structuredContraindications" options={contraindicationOptions} value={draftPayload.structuredContraindications ?? assessment?.structuredContraindications} />
                <CheckboxGroup label="Hábitos relevantes" name="structuredHabits" options={habitOptions} value={draftPayload.structuredHabits ?? assessment?.structuredHabits} />
              </AccordionSection>

              <AccordionSection title="Avaliação estética inicial" description="Achados técnicos mantidos para avaliação, IA e plano de cuidado.">
                <TextField label="Condição da pele" name="skinCondition" value={draftPayload.skinCondition ?? assessment?.skinCondition} textarea />
                <TextField label="Condição corporal" name="bodyCondition" value={draftPayload.bodyCondition ?? assessment?.bodyCondition} textarea />
                <TextField label="Análise profissional" name="professionalAnalysis" value={draftPayload.professionalAnalysis ?? assessment?.professionalAnalysis} textarea />
                <TextField label="Riscos percebidos" name="perceivedRisks" value={draftPayload.perceivedRisks ?? assessment?.perceivedRisks} textarea />
                <TextField label="Observações técnicas" name="technicalNotes" value={draftPayload.technicalNotes ?? assessment?.technicalNotes} textarea />
              </AccordionSection>

              <div className="hidden flex-wrap gap-2 border-t border-border pt-3 sm:flex">
                <Button name="intent" value="draft" size="sm" disabled={isPending}><Save className="h-4 w-4" />Salvar rascunho</Button>
                <Button name="intent" value="advance" size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar e avançar</Button>
              </div>
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
              protocolFormId="protocol-form"
            />
          </div>
        )}

        {activeTab === "Execução" && (
          <StepForm title="Execução" description="Registre procedimento, produtos, parâmetros e intercorrências. Alterações aqui podem exigir revisão da evolução.">
            <form id="execution-form" key={`execution-${draftAction?.id ?? "base"}`} className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              if (!appointment) return;
              run(async () => {
                await submit(`/api/appointments/${appointment.id}/execution`, "POST", formObject(new FormData(event.currentTarget)), "Execução registrada.");
                setActiveTab("Evolução");
              });
            }}>
              <TextField label="Procedimento realizado" name="procedurePerformed" value={draftPayload.procedurePerformed ?? execution?.procedurePerformed} textarea required />
              <TextField label="Produtos utilizados" name="productsUsed" value={draftPayload.productsUsed ?? execution?.productsUsed} textarea />
              <TextField label="Parâmetros de equipamentos" name="equipmentParameters" value={draftPayload.equipmentParameters ?? execution?.equipmentParameters} textarea />
              <TextField label="Duração" name="duration" value={draftPayload.duration ?? execution?.duration} />
              <TextField label="Observações profissionais" name="professionalNotes" value={draftPayload.professionalNotes ?? execution?.professionalNotes} textarea />
              <TextField label="Intercorrências" name="incidents" value={draftPayload.incidents ?? execution?.incidents} textarea />
              <TextField label="Cuidados pós-procedimento entregues" name="postCareGiven" value={draftPayload.postCareGiven ?? execution?.postCareGiven} textarea />
              <div className="hidden sm:block">
                <Button size="sm" variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar execução</Button>
              </div>
            </form>
          </StepForm>
        )}

        {activeTab === "Evolução" && (
          <StepForm title="Evolução" description="Registre resposta clínica, ajustes e próximos passos.">
            <form id="evolution-form" key={`evolution-${draftAction?.id ?? "base"}`} className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              run(async () => submit(`/api/patients/${patient.id}/evolutions`, "POST", { ...formObject(new FormData(event.currentTarget)), appointmentId: appointment?.id ?? null }, "Evolução registrada."));
            }}>
              <TextField label="Resumo / procedimento realizado" name="summary" value={draftPayload.summary} textarea required />
              <TextField label="Resposta do paciente" name="patientResponse" value={draftPayload.patientResponse} textarea />
              <TextField label="Observações clínicas" name="professionalNotes" value={draftPayload.professionalNotes} textarea />
              <TextField label="Ajustes realizados" name="adjustmentsMade" value={draftPayload.adjustmentsMade} textarea />
              <TextField label="Próximos passos" name="nextSteps" value={draftPayload.nextSteps} textarea />
              <TextField label="Data de retorno" name="returnDate" value={draftPayload.returnDate} type="date" />
              <div className="hidden flex-wrap gap-2 sm:flex">
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
            {draftPayload.finalSummary && <Field label="Resumo final sugerido pela Marie" value={draftPayload.finalSummary} />}
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
      <MobileActions />
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
  const { appointment, patient, suggestion, protocol, marieSuggestions, draftPayload, editingSuggestion, setEditingSuggestion, showSuggestionForm, setShowSuggestionForm, editingProtocol, setEditingProtocol, isPending, run, submit, duplicateProtocol, protocolFormId } = props;
  const hasDraftPlan = Boolean(draftPayload.title || draftPayload.objective || draftPayload.indication || draftPayload.postProcedureCare);
  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-dark-accent">Plano/protocolo em construção</p>
            <p className="text-xs text-muted">A Marie pode preencher este rascunho. O profissional revisa, edita e salva.</p>
          </div>
          {protocol && <Button size="sm" onClick={() => setEditingProtocol((value: boolean) => !value)}><Pencil className="h-4 w-4" />Editar</Button>}
        </div>
        {(editingProtocol || !protocol || hasDraftPlan) ? (
          <ProtocolForm formId={protocolFormId} draftPayload={draftPayload} protocol={protocol} suggestion={suggestion} appointment={appointment} patient={patient} disabled={isPending} onSubmit={(payload: Record<string, unknown>) => run(async () => {
            await submit(protocol ? `/api/protocols/${protocol.id}` : `/api/patients/${patient.id}/protocols`, protocol ? "PUT" : "POST", payload, "Plano de cuidado salvo.");
            setEditingProtocol(false);
          })} />
        ) : (
          <div className="space-y-3">
            <Field label="Status" value={labelFor(protocol.status)} />
            <Field label="Título" value={protocol.title} />
            <Field label="Objetivo" value={protocol.objective} />
            <Field label="Indicação" value={protocol.indication} />
            <Field label="Contraindicações" value={protocol.contraindications} />
            <Field label="Cuidados pós-procedimento" value={protocol.postProcedureCare} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => run(async () => submit(`/api/protocols/${protocol.id}`, "PUT", { status: "APPLIED" }, "Protocolo aplicado. Próxima etapa: execução."))}>Aplicar protocolo</Button>
              <Button size="sm" variant="ghost" onClick={() => run(async () => duplicateProtocol(protocol))}><Copy className="h-4 w-4" />Duplicar</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[14px] border border-border bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-dark-accent">Revisão profissional</p>
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
            <p className="text-sm font-semibold text-dark-accent">Sugestões internas</p>
            <p className="text-xs text-muted">Use apenas quando precisar registrar uma sugestão manual ou manter histórico técnico.</p>
          </div>
          <Button size="sm" onClick={() => setShowSuggestionForm(true)}><Plus className="h-4 w-4" />Criar sugestão</Button>
        </div>
        {showSuggestionForm && <SuggestionForm draftPayload={{}} editingSuggestion={editingSuggestion ?? suggestion} appointment={appointment} isAi={false} disabled={isPending} onSubmit={(payload: Record<string, unknown>) => run(async () => {
          await submit(editingSuggestion ? `/api/suggestions/${editingSuggestion.id}` : `/api/patients/${patient.id}/suggestions`, editingSuggestion ? "PUT" : "POST", payload, "Sugestão salva no histórico do plano.");
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

function ProtocolForm({ formId, draftPayload = {}, protocol, suggestion, appointment, disabled, onSubmit }: any) {
  return (
    <form id={formId} key={`protocol-${draftPayload.title ?? protocol?.id ?? "base"}`} className="space-y-3" onSubmit={(event) => {
      event.preventDefault();
      onSubmit({ ...formObject(new FormData(event.currentTarget)), appointmentId: appointment?.id ?? null });
    }}>
      <TextField label="Título" name="title" value={draftPayload.title ?? protocol?.title ?? suggestion?.title} required />
      <TextField label="Objetivo" name="objective" value={draftPayload.objective ?? protocol?.objective ?? suggestion?.objective} textarea />
      <TextField label="Indicação" name="indication" value={draftPayload.indication ?? protocol?.indication ?? suggestion?.suggestedTechniques} textarea />
      <TextField label="Contraindicações" name="contraindications" value={draftPayload.contraindications ?? protocol?.contraindications ?? suggestion?.contraindications} textarea />
      <TextField label="Cuidados pós-procedimento" name="postProcedureCare" value={draftPayload.postProcedureCare ?? protocol?.postProcedureCare ?? suggestion?.warnings} textarea />
      <input type="hidden" name="source" value={draftPayload.source ?? protocol?.source ?? "AI_ASSISTED"} />
      <input type="hidden" name="status" value={draftPayload.status ?? protocol?.status ?? "DRAFT"} />
      <div className="hidden sm:block">
        <Button size="sm" variant="primary" disabled={disabled}><Save className="h-4 w-4" />Salvar plano</Button>
      </div>
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
