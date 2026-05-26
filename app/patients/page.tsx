import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { calculateAge } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <AppShell title="Pacientes">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 rounded-[18px] border border-border bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Prontuário clínico</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-dark-accent">Pacientes</h1>
            <p className="text-sm text-muted">Cadastro, histórico e acesso rápido ao workspace clínico.</p>
          </div>
          <Button variant="primary"><Link href="/patients/new">Novo paciente</Link></Button>
        </div>
        <div className="grid gap-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="flex flex-col gap-4 p-4 transition hover:border-blue-200 hover:shadow-panel sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-dark-accent">{patient.name}</h2>
                  <Badge tone={patient.status === "ACTIVE" ? "green" : "slate"}>{labelFor(patient.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{calculateAge(patient.birthDate)} anos · {patient.phone ?? "sem telefone"}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="sm"><Link href={`/patients/${patient.id}`}>Prontuário</Link></Button>
                <Button size="sm" variant="primary"><Link href={`/patients/${patient.id}/workspace`}>Workspace</Link></Button>
              </div>
            </Card>
          ))}
          {patients.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhum paciente cadastrado.</Card>}
        </div>
      </div>
    </AppShell>
  );
}
