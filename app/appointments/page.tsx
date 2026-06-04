import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({ include: { patient: true }, orderBy: { date: "desc" } });
  const toneForStatus = (status: string) => status === "IN_PROGRESS" ? "amber" : status === "FINISHED" ? "green" : status === "CANCELED" ? "slate" : "blue";

  return (
    <AppShell title="Atendimentos">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="mb-5 rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Fluxo clínico</p>
          <h1 className="mt-1 text-2xl font-semibold text-dark-accent">Atendimentos</h1>
          <p className="text-sm text-muted">Acompanhe atendimentos em andamento, finalizados e reabertos.</p>
        </div>
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-dark-accent">{appointment.patient.name}</p>
                <p className="text-sm text-muted">{formatDate(appointment.date)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={toneForStatus(appointment.status)}>{labelFor(appointment.status)}</Badge>
                <Link href={`/patients/${appointment.patientId}/workspace?appointmentId=${appointment.id}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-hover">
                  <ArrowUpRight className="h-4 w-4" />Abrir workspace
                </Link>
                <Link href={`/patients/${appointment.patientId}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground transition hover:bg-[#F8FAFD]">
                  <FileText className="h-4 w-4" />Prontuário
                </Link>
              </div>
            </Card>
          ))}
          {appointments.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhum atendimento registrado.</Card>}
        </div>
      </div>
    </AppShell>
  );
}
