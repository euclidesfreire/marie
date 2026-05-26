"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PatientFormProps = {
  patient?: {
    id: string;
    name: string;
    birthDate: Date | string;
    phone?: string | null;
    email?: string | null;
    gender?: string | null;
    document?: string | null;
    notes?: string | null;
    status: string;
  };
};

export function PatientForm({ patient }: PatientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(patient ? `/api/patients/${patient.id}` : "/api/patients", {
      method: patient ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!response.ok) {
      setError("Revise os campos e tente novamente.");
      return;
    }
    const saved = await response.json();
    router.push(`/patients/${saved.id}`);
    router.refresh();
  }

  const date = patient?.birthDate ? new Date(patient.birthDate).toISOString().slice(0, 10) : "";

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Nome<Input name="name" defaultValue={patient?.name} required /></label>
        <label className="grid gap-1 text-sm font-medium">Data de nascimento<Input name="birthDate" type="date" defaultValue={date} required /></label>
        <label className="grid gap-1 text-sm font-medium">Telefone<Input name="phone" defaultValue={patient?.phone ?? ""} /></label>
        <label className="grid gap-1 text-sm font-medium">E-mail<Input name="email" type="email" defaultValue={patient?.email ?? ""} /></label>
        <label className="grid gap-1 text-sm font-medium">Gênero<Input name="gender" defaultValue={patient?.gender ?? ""} /></label>
        <label className="grid gap-1 text-sm font-medium">Documento<Input name="document" defaultValue={patient?.document ?? ""} /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium">Observações<Textarea name="notes" defaultValue={patient?.notes ?? ""} /></label>
      <select name="status" defaultValue={patient?.status ?? "ACTIVE"} className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100">
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
        <option value="ARCHIVED">Arquivado</option>
      </select>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="primary" disabled={loading}>{loading ? "Salvando..." : "Salvar paciente"}</Button>
    </form>
  );
}
