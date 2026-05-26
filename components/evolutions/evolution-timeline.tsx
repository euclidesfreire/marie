"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

function formObject(formData: FormData) {
  return Object.fromEntries([...formData.entries()].map(([key, value]) => [key, value === "" ? null : value]));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm leading-6 text-foreground">{children || "Não informado"}</div>
    </div>
  );
}

export function EvolutionTimeline({ patients, evolutions }: { patients: any[]; evolutions: any[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit(endpoint: string, method: "POST" | "PUT", payload: any) {
    await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setCreating(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[18px] border border-border bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Registro evolutivo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-dark-accent">Evoluções</h1>
          <p className="mt-1 text-sm text-muted">Acompanhe a evolução clínica do paciente ao longo do tempo.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nova evolução</Button>
      </div>

      {creating && (
        <form
          className="grid gap-3 rounded-[14px] border border-border bg-white p-5 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const patientId = String(new FormData(form).get("patientId"));
            const payload = formObject(new FormData(form));
            delete payload.patientId;
            startTransition(() => void submit(`/api/patients/${patientId}/evolutions`, "POST", payload));
          }}
        >
          <select name="patientId" className="h-10 rounded-md border border-border bg-white px-3 text-sm" required>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>
          <Textarea name="summary" placeholder="Procedimento realizado / resumo" required />
          <Textarea name="patientResponse" placeholder="Resposta do paciente" />
          <Textarea name="professionalNotes" placeholder="Observações clínicas" />
          <Textarea name="adjustmentsMade" placeholder="Ajustes realizados" />
          <Textarea name="nextSteps" placeholder="Próximos passos" />
          <div className="flex gap-2">
            <Button variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar evolução</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="relative space-y-4 md:pl-7 before:hidden before:absolute before:left-2 before:top-2 before:h-full before:w-px before:bg-border md:before:block">
        {evolutions.map((item, index) => (
          <div key={item.id} className="relative rounded-[14px] border border-border bg-white p-5 shadow-soft md:before:absolute md:before:-left-[27px] md:before:top-6 md:before:h-4 md:before:w-4 md:before:rounded-full md:before:border-4 md:before:border-white md:before:bg-senac-blue md:before:shadow">
            {editingId === item.id ? (
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  startTransition(() => void submit(`/api/evolutions/${item.id}`, "PUT", formObject(new FormData(event.currentTarget))));
                }}
              >
                <Textarea name="summary" defaultValue={item.summary} required />
                <Textarea name="patientResponse" defaultValue={item.patientResponse ?? ""} />
                <Textarea name="professionalNotes" defaultValue={item.professionalNotes ?? ""} />
                <Textarea name="adjustmentsMade" defaultValue={item.adjustmentsMade ?? ""} />
                <Textarea name="nextSteps" defaultValue={item.nextSteps ?? ""} />
                <div className="flex gap-2">
                  <Button variant="primary" disabled={isPending}><Save className="h-4 w-4" />Salvar</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Evolução {evolutions.length - index}</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(item.createdAt)}</p>
                  <p className="mt-1 text-sm text-muted">{item.patient.name}</p>
                </div>
                <div className="space-y-3">
                  <Field label="Procedimento realizado">{item.summary}</Field>
                  <Field label="Resposta do paciente">{item.patientResponse}</Field>
                  <Field label="Observações clínicas">{item.professionalNotes}</Field>
                  <Field label="Ajustes realizados">{item.adjustmentsMade}</Field>
                  <Field label="Próximos passos">{item.nextSteps}</Field>
                  <Button size="sm" onClick={() => setEditingId(item.id)}><Pencil className="h-4 w-4" />Editar evolução</Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {evolutions.length === 0 && <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted shadow-soft">Nenhuma evolução registrada.</div>}
      </div>
    </div>
  );
}
