import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { MarieWorkspace } from "@/components/workspace/marie-workspace";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/utils";

export const dynamic = "force-dynamic";

const appointmentInclude = {
  assessment: true,
  execution: true,
  stepStates: { orderBy: { createdAt: "asc" as const } },
  followUps: { orderBy: { date: "desc" as const } },
  marieSuggestions: { orderBy: { createdAt: "desc" as const } },
  suggestions: true,
  protocols: { include: { steps: { orderBy: { order: "asc" as const } } } },
  evolutions: true
};

export default async function PatientWorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ appointmentId?: string }> }) {
  const { id } = await params;
  const { appointmentId } = await searchParams;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      anamneses: { orderBy: { createdAt: "desc" }, take: 3 },
      suggestions: { orderBy: { createdAt: "desc" }, take: 8, include: { validation: true, adjustments: true } },
      protocols: { orderBy: { createdAt: "desc" }, take: 8, include: { steps: { orderBy: { order: "asc" } } } },
      evolutions: { orderBy: { createdAt: "desc" }, take: 12 },
      clinicalNotes: { orderBy: { createdAt: "desc" }, take: 10 }
    }
  });
  if (!patient) notFound();

  const [currentAppointment, user] = await Promise.all([
    appointmentId
      ? prisma.appointment.findFirst({ where: { id: appointmentId, patientId: id }, include: appointmentInclude })
      : prisma.appointment.findFirst({
          where: { patientId: id, status: { in: ["IN_PROGRESS", "REOPENED"] } },
          include: appointmentInclude,
          orderBy: { date: "desc" }
        }).then((appointment) => appointment ?? prisma.appointment.findFirst({ where: { patientId: id }, include: appointmentInclude, orderBy: { date: "desc" } })),
    getCurrentUser()
  ]);

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
