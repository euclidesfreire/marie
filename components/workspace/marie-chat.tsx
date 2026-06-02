"use client";

import { useMemo, useState, useTransition } from "react";
import { Bot, CalendarDays, Check, ClipboardList, Clock3, Leaf, Mic, Paperclip, Pencil, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MarieAction } from "@/lib/ai/marie-client";
import { sendMessageToMarie } from "@/lib/ai/marie-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { labelFor } from "@/lib/labels";

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  actions?: (MarieAction & { localStatus?: "pending" | "applied" | "canceled" })[];
};

const marieStepMocks: Record<string, { quickActions: string[]; defaultMessage: string }> = {
  PREPARATION: {
    quickActions: ["Revisar histórico do paciente", "Sugerir perguntas complementares", "Iniciar atendimento"],
    defaultMessage: "Posso organizar o contexto inicial e preparar o atendimento."
  },
  ANAMNESIS: {
    quickActions: ["Revisar anamnese e apontar lacunas", "Identificar contraindicações", "Sugerir perguntas complementares", "Resumir queixa e objetivo"],
    defaultMessage: "Posso revisar a anamnese, sugerir perguntas complementares ou identificar possíveis contraindicações."
  },
  ASSESSMENT: {
    quickActions: ["Apoiar avaliação facial", "Apoiar avaliação corporal", "Comparar avaliação com anamnese", "Sugerir pontos técnicos"],
    defaultMessage: "Posso apoiar a avaliação profissional com pontos de atenção e revisão de riscos."
  },
  CARE_PLAN: {
    quickActions: ["Gerar protocolo com base nos dados", "Gerar protocolo facial", "Gerar protocolo corporal", "Revisar contraindicações do protocolo", "Gerar cuidados pós e home care"],
    defaultMessage: "Posso sugerir um plano de cuidado para revisão profissional."
  },
  EXECUTION: {
    quickActions: ["Sugerir registro da execução", "Gerar orientação pós-procedimento", "Registrar intercorrência", "Preparar evolução da sessão"],
    defaultMessage: "Posso ajudar a registrar o que foi executado e as orientações dadas ao paciente."
  },
  EVOLUTION: {
    quickActions: ["Gerar evolução da sessão", "Comparar com evolução anterior", "Sugerir próximos passos", "Preparar retorno"],
    defaultMessage: "Posso ajudar a escrever a evolução clínica e sugerir próximos passos."
  },
  COMPLETION: {
    quickActions: ["Revisar pendências", "Gerar resumo final", "Preparar retorno", "Finalizar atendimento"],
    defaultMessage: "Posso revisar pendências e preparar um resumo final do atendimento."
  }
};
const compactTips = ["Sugestões exigem validação", "Ações só salvam com confirmação", "Use o painel direito para revisar"];

const actionVisuals: Record<string, { icon: LucideIcon; description: string }> = {
  "Sugerir protocolo": { icon: ClipboardList, description: "Sugestões baseadas no caso clínico" },
  "Ajustar plano": { icon: CalendarDays, description: "Personalizar metas e condutas" },
  "Revisar contraindicações": { icon: ShieldCheck, description: "Análise de segurança e riscos" },
  "Gerar cuidados pós": { icon: Leaf, description: "Orientações para o paciente" }
};

function visualForCommand(command: string) {
  if (actionVisuals[command]) return actionVisuals[command];
  if (command.toLowerCase().includes("risco") || command.toLowerCase().includes("contra")) return { icon: ShieldCheck, description: "Revisão clínica assistida" };
  if (command.toLowerCase().includes("orient") || command.toLowerCase().includes("cuidado")) return { icon: Leaf, description: "Texto para revisão profissional" };
  if (command.toLowerCase().includes("exec") || command.toLowerCase().includes("agenda") || command.toLowerCase().includes("plano")) return { icon: CalendarDays, description: "Organização do atendimento" };
  return { icon: ClipboardList, description: "Apoio contextual da Marie" };
}

function previewRows(action: MarieAction) {
  const payload = (action.payload ?? {}) as Record<string, unknown>;
  const rows = [
    ["Título", payload.title],
    ["Objetivo", payload.objective],
    ["Área", typeof payload.area === "string" ? labelFor(payload.area) : payload.area],
    ["Ativos sugeridos", payload.suggestedActives],
    ["Técnicas sugeridas", payload.suggestedTechniques],
    ["Equipamentos", payload.suggestedEquipments],
    ["Contraindicações", payload.contraindications],
    ["Alertas", payload.warnings],
    ["Resumo", payload.summary],
    ["Resposta da paciente", payload.patientResponse],
    ["Próximos passos", payload.nextSteps],
    ["Orientação", payload.guidance],
    ["Revisão", payload.review],
    ["Conteúdo", payload.content],
    ["Conduta", payload.conduct]
  ];
  return rows.filter(([, value]) => typeof value === "string" && value.trim().length > 0) as [string, string][];
}

function primaryActionLabel(action: MarieAction) {
  if (action.type === "CREATE_PROTOCOL_SUGGESTION") return "Salvar como sugestão";
  if (action.type === "CREATE_EVOLUTION") return "Salvar evolução";
  if (action.type === "CREATE_CLINICAL_NOTE") return "Salvar anotação";
  if (action.type === "UPDATE_APPOINTMENT_NOTES") return "Aplicar como sugestão";
  return "Aplicar como sugestão";
}

export function MarieChat({ data, onApplied, onEditAction }: { data: any; onApplied: () => void; onEditAction: (action: MarieAction) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ASSISTANT",
      content: "Como posso apoiar este atendimento? Posso estruturar sugestões, revisar riscos ou organizar a evolução, sempre com validação profissional."
    }
  ]);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const context = useMemo(() => ({
    patient: data.patient,
    anamnesis: data.patient.anamneses?.[0],
    appointment: data.currentAppointment,
    assessment: data.currentAppointment?.assessment,
    suggestions: data.patient.suggestions ?? [],
    protocols: data.patient.protocols ?? [],
    evolutions: data.patient.evolutions ?? []
  }), [data]);
  const currentStep = data.currentAppointment?.currentStep ?? "ANAMNESIS";
  const stepMock = marieStepMocks[currentStep] ?? marieStepMocks.ANAMNESIS;
  const quickCommands = stepMock.quickActions;

  async function send(command = text) {
    if (!command.trim()) return;
    setText("");
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "USER", content: command };
    setMessages((current) => [...current, userMessage]);
    const response = await sendMessageToMarie({ ...context, professionalCommand: command });
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: response.message,
        actions: response.actions?.map((action) => ({ ...action, localStatus: "pending" }))
      }
    ]);
  }

  function setActionStatus(actionId: string, localStatus: "applied" | "canceled") {
    setMessages((current) =>
      current.map((message) => ({
        ...message,
        actions: message.actions?.map((action) => (action.id === actionId ? { ...action, localStatus } : action))
      }))
    );
  }

  async function applyAction(action: MarieAction) {
    startTransition(async () => {
      const response = await fetch("/api/marie/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: data.patient.id, appointmentId: data.currentAppointment?.id, action })
      });
      if (response.ok) {
        setActionStatus(action.id, "applied");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "SYSTEM", content: "Ação salva e registrada no histórico da Marie." }]);
        onApplied();
      } else {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "SYSTEM", content: "Não foi possível salvar esta ação. Revise os dados e tente novamente." }]);
      }
    });
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-border bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8 lg:py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-senac-blue">Assistente Marie</h1>
              <Sparkles className="h-4 w-4 text-senac-orange" />
            </div>
            <p className="mt-2 text-sm text-muted">Etapa atual: <span className="font-semibold text-primary">{labelFor(currentStep)}</span></p>
          </div>
          <Badge tone="blue">Assistido</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs leading-5 text-senac-blue lg:px-4">
          <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0" />{stepMock.defaultMessage}</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {quickCommands.map((command) => {
            const visual = visualForCommand(command);
            return (
              <button
                key={command}
                type="button"
                className="group flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 text-left text-xs font-semibold text-senac-blue shadow-sm transition hover:border-blue-200 hover:bg-senac-blue-soft disabled:pointer-events-none disabled:opacity-60"
                onClick={() => send(command)}
                disabled={isPending}
              >
                <visual.icon className="h-4 w-4 text-primary group-hover:text-senac-orange" />
                <span className="whitespace-nowrap">{command}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 hidden gap-1.5 2xl:flex">
          {compactTips.map((tip) => <span key={tip} className="rounded-full border border-border bg-[#F8FAFD] px-2 py-1 text-[11px] text-muted">{tip}</span>)}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="rounded-[14px] border border-border bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm font-bold text-senac-blue"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />Histórico recente</span><span className="text-muted">›</span></div>
          <div className="grid gap-2 text-sm text-muted">
            <p className="truncate">Paciente: <span className="font-medium text-foreground">{data.patient.name}</span></p>
            <p className="truncate">Queixa: {data.patient.anamneses?.[0]?.chiefComplaint ?? data.currentAppointment?.dailyComplaint ?? "Não registrada"}</p>
            <p className="truncate">Sugestões: {data.patient.suggestions?.length ?? 0} · Evoluções: {data.patient.evolutions?.length ?? 0}</p>
          </div>
        </div>
        {messages.map((message) => (
          <div key={message.id} className={message.role === "USER" ? "ml-auto max-w-[82%]" : "mr-auto max-w-[72%]"}>
            <div className={`rounded-[14px] border p-5 text-sm shadow-soft ${message.role === "USER" ? "border-blue-200 bg-primary text-white" : message.role === "SYSTEM" ? "border-green-200 bg-green-50 text-green-800" : "border-border bg-white text-foreground border-l-4 border-l-senac-orange"}`}>
              {message.role === "ASSISTANT" && <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted"><Bot className="h-3.5 w-3.5" />Marie</div>}
              <p className="whitespace-pre-line leading-6">{message.content}</p>
            </div>
            {message.actions?.map((action) => (
              <div key={action.id} className="mt-2 rounded-[14px] border border-border bg-white p-3 shadow-soft">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="mt-1 text-xs text-muted">{action.description}</p>
                  </div>
                  <Badge tone={action.localStatus === "applied" ? "green" : action.localStatus === "canceled" ? "red" : "amber"}>
                    {action.localStatus === "applied" ? "Salva" : action.localStatus === "canceled" ? "Cancelada" : "Requer validação"}
                  </Badge>
                </div>
                <div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-border bg-[#F8FAFD] p-3">
                  {previewRows(action).map(([label, value]) => (
                    <div key={label} className="grid gap-0.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="text-sm leading-5 text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">Essa ação só será salva após confirmação profissional.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="primary" onClick={() => applyAction(action)} disabled={isPending || action.localStatus !== "pending"}><Check className="h-4 w-4" />{primaryActionLabel(action)}</Button>
                  <Button size="sm" onClick={() => onEditAction(action)} disabled={action.localStatus !== "pending"}><Pencil className="h-4 w-4" />Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setActionStatus(action.id, "canceled")} disabled={action.localStatus !== "pending"}><X className="h-4 w-4" />Cancelar</Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <form
        className="shrink-0 border-t border-border bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(10,61,145,0.05)] sm:px-6 lg:px-8"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex items-center gap-2 rounded-[14px] border border-border bg-white p-2 shadow-soft sm:gap-3 sm:p-3">
          <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite um comando para a Marie..." className="min-h-10 flex-1 resize-none border-0 shadow-none focus:ring-0" />
          <Button type="button" size="icon" variant="ghost" className="hidden shrink-0 sm:inline-flex"><Paperclip className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="hidden shrink-0 sm:inline-flex"><Mic className="h-4 w-4" /></Button>
          <Button variant="primary" className="h-11 shrink-0 rounded-xl px-3 sm:px-5" disabled={isPending || !text.trim()}><Send className="h-4 w-4" /><span className="hidden sm:inline">Enviar</span></Button>
        </div>
      </form>
    </section>
  );
}
