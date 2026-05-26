import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { createAppointmentSchema } from "@/lib/validations";
import { appointmentStartData, ensureAppointmentSteps } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.appointment.findMany({ where: { patientId: id }, include: { assessment: true }, orderBy: { date: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = createAppointmentSchema.parse(await parseJson(request, {}));
    const flowData = data.status === "IN_PROGRESS" ? appointmentStartData() : {};
    const appointment = await prisma.appointment.create({ data: { ...data, ...flowData, patientId: id, professionalId: user.id } });
    await ensureAppointmentSteps(appointment.id, appointment.currentStep);
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
