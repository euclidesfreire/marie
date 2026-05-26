import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StartAppointmentButton } from "@/components/appointments/start-appointment-button";
import { PatientForm } from "@/components/patients/patient-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { labelFor } from "@/lib/labels";
import { calculateAge, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { appointments: { orderBy: { date: "desc" } }, anamneses: { orderBy: { createdAt: "desc" } } }
  });
  if (!patient) notFound();
  const inProgress = patient.appointments.find((appointment) => appointment.status === "IN_PROGRESS");

  return (
    <AppShell title="Pacientes">
      <div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-senac-blue">Prontuário</p>
              <h1 className="mt-1 text-xl font-semibold text-dark-accent">{patient.name}</h1>
              <p className="text-sm text-muted">{calculateAge(patient.birthDate)} anos · nascimento em {formatDate(patient.birthDate)}</p>
            </div>
            <Badge tone="green">{labelFor(patient.status)}</Badge>
          </CardHeader>
          <CardContent><PatientForm patient={patient} /></CardContent>
        </Card>
        <div className="space-y-4">
          <Button variant="primary" className="w-full"><Link href={`/patients/${patient.id}/workspace${inProgress ? `?appointmentId=${inProgress.id}` : ""}`}>Abrir workspace</Link></Button>
          <StartAppointmentButton patientId={patient.id} hasInProgress={!!inProgress} inProgressId={inProgress?.id} />
          <Card>
            <CardHeader><h2 className="font-medium">Atendimentos</h2></CardHeader>
            <CardContent className="space-y-3">
              {patient.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-[14px] border border-border bg-[#F8FAFD] p-3 text-sm">
                  <p className="font-semibold text-dark-accent">{labelFor(appointment.status)}</p>
                  <p className="text-muted">{formatDate(appointment.date)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
