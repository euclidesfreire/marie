import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { calculateAge } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
    include: {
      appointments: {
        select: { id: true, status: true, date: true },
        orderBy: [{ status: "asc" }, { date: "desc" }],
        take: 3
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  return (
    <AppShell title="Pacientes">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 rounded-[18px] border border-border bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Prontuário clínico</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-dark-accent">Pacientes</h1>
            <p className="text-sm text-muted">Cadastro, histórico e acesso rápido ao workspace clínico.</p>
          </div>
          <Link href="/patients/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover">
            Novo paciente
          </Link>
        </div>
        <div className="grid gap-3">
          {patients.map((patient) => {
            const appointment = patient.appointments.find((item) => item.status === "IN_PROGRESS" || item.status === "REOPENED") ?? patient.appointments[0];
            const workspaceHref = `/patients/${patient.id}/workspace${appointment ? `?appointmentId=${appointment.id}` : ""}`;

            return (
              <Card key={patient.id} className="flex flex-col gap-4 p-4 transition hover:border-blue-200 hover:shadow-panel sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-dark-accent">{patient.name}</h2>
                    <Badge tone={patient.status === "ACTIVE" ? "green" : "slate"}>{labelFor(patient.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{calculateAge(patient.birthDate)} anos · {patient.phone ?? "sem telefone"}</p>
                  <p className="mt-1 text-xs text-muted">{appointment ? `Atendimento: ${labelFor(appointment.status)}` : "Sem atendimento iniciado"}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href={`/patients/${patient.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm transition hover:border-slate-300 hover:bg-[#F8FAFD]">
                    <FileText className="h-4 w-4" />Prontuário
                  </Link>
                  <Link href={workspaceHref} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-hover">
                    <ArrowUpRight className="h-4 w-4" />Workspace
                  </Link>
                </div>
              </Card>
            );
          })}
          {patients.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhum paciente cadastrado.</Card>}
        </div>
      </div>
    </AppShell>
  );
}
