"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FilePlus2, Play, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CareActions({ data, setActiveTab }: { data: any; setActiveTab: (tab: string) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const appointment = data.currentAppointment;
  const protocol = data.patient.protocols?.[0];

  async function createAppointment() {
    await fetch(`/api/patients/${data.patient.id}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT", dailyComplaint: data.patient.anamneses?.[0]?.chiefComplaint ?? null })
    });
    router.refresh();
  }

  async function updateAppointment(status: string) {
    if (!appointment) return;
    await fetch(`/api/appointments/${appointment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    router.refresh();
  }

  async function approveProtocol() {
    if (!protocol) {
      setActiveTab("Protocolo");
      return;
    }
    await fetch(`/api/protocols/${protocol.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" })
    });
    router.refresh();
  }

  return (
    <div className="border-t border-border bg-white p-4 pb-5">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">Ações do atendimento</p>
      <div className="grid grid-cols-2 gap-2">
        {!appointment ? (
          <Button size="sm" variant="primary" disabled={isPending} onClick={() => startTransition(() => void createAppointment())}><Play className="h-4 w-4" />Novo atendimento</Button>
        ) : appointment.status !== "IN_PROGRESS" && appointment.status !== "FINISHED" ? (
          <Button size="sm" variant="primary" disabled={isPending} onClick={() => startTransition(() => void updateAppointment("IN_PROGRESS"))}><Play className="h-4 w-4" />Iniciar atendimento</Button>
        ) : (
          <Button size="sm" disabled={isPending || !appointment} onClick={() => startTransition(() => void updateAppointment("DRAFT"))}><Save className="h-4 w-4" />Salvar rascunho</Button>
        )}
        <Button size="sm" onClick={() => setActiveTab("Sugestões")}><FilePlus2 className="h-4 w-4" />Criar sugestão</Button>
        <Button size="sm" variant="success" disabled={isPending} onClick={() => startTransition(() => void approveProtocol())}><CheckCircle2 className="h-4 w-4" />Aprovar protocolo</Button>
        <Button size="sm" variant="primary" disabled={isPending || !appointment} onClick={() => startTransition(() => void updateAppointment("FINISHED"))}><Send className="h-4 w-4" />Finalizar</Button>
        <Button size="sm" variant="ghost" disabled={isPending || !appointment} onClick={() => startTransition(() => void updateAppointment("CANCELED"))}>Cancelar atendimento</Button>
      </div>
    </div>
  );
}
