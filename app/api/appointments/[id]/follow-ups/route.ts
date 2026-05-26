import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAppointmentFollowUpSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.appointmentFollowUp.findMany({ where: { appointmentId: id }, orderBy: { date: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return Response.json({ error: "Atendimento não encontrado." }, { status: 404 });
    const data = createAppointmentFollowUpSchema.parse(await parseJson(request, {}));
    const followUp = await prisma.appointmentFollowUp.create({
      data: { ...data, appointmentId: id, patientId: appointment.patientId }
    });
    return Response.json(followUp, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
