import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { MarieWorkspace } from "@/components/workspace/marie-workspace";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientWorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ appointmentId?: string }> }) {
  const { id } = await params;
  const { appointmentId } = await searchParams;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      anamneses: { orderBy: { createdAt: "desc" } },
      appointments: {
        orderBy: { date: "desc" },
        include: {
          assessment: true,
          execution: true,
          stepStates: { orderBy: { createdAt: "asc" } },
          followUps: { orderBy: { date: "desc" } },
          marieSuggestions: { orderBy: { createdAt: "desc" } },
          suggestions: true,
          protocols: { include: { steps: { orderBy: { order: "asc" } } } },
          evolutions: true
        }
      },
      suggestions: { orderBy: { createdAt: "desc" }, include: { validation: true, adjustments: true } },
      protocols: { orderBy: { createdAt: "desc" }, include: { steps: { orderBy: { order: "asc" } } } },
      evolutions: { orderBy: { createdAt: "desc" } },
      clinicalNotes: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!patient) notFound();
  const currentAppointment =
    patient.appointments.find((appointment) => appointment.id === appointmentId) ??
    patient.appointments.find((appointment) => appointment.status === "IN_PROGRESS") ??
    patient.appointments[0] ??
    null;
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <Topbar
        context={`${patient.name} · Workspace do paciente`}
        professional={user.name}
        status={currentAppointment?.status === "IN_PROGRESS" ? "Atendimento em andamento" : "Workspace do paciente"}
      />
      <MarieWorkspace data={{ patient, currentAppointment }} />
    </div>
  );
}
