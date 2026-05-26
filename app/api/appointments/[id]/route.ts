import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAppointmentSchema } from "@/lib/validations";
import { appointmentFinishData, appointmentStartData } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { assessment: true, suggestions: true, protocols: true, evolutions: true } });
  if (!appointment) return Response.json({ error: "Atendimento não encontrado." }, { status: 404 });
  return Response.json(appointment);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createAppointmentSchema.partial().parse(await parseJson(request, {}));
    const flowData =
      data.status === "IN_PROGRESS"
        ? appointmentStartData()
      : data.status === "FINISHED"
          ? appointmentFinishData()
          : data.status === "CANCELED"
            ? { status: "CANCELED" as const }
            : {};
    const appointment = await prisma.appointment.update({ where: { id }, data: { ...data, ...flowData } });
    return Response.json(appointment);
  } catch (error) {
    return apiError(error);
  }
}
