import { prisma } from "@/lib/prisma";
import { appointmentReopenData, ensureAppointmentSteps, markDownstreamStepsForReview, setCurrentStep, type CareStep } from "@/lib/care-flow";
import { apiError, parseJson } from "@/lib/utils";
import { setAppointmentStepSchema } from "@/lib/validations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = setAppointmentStepSchema.parse(await parseJson(request, {}));
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return Response.json({ error: "Atendimento não encontrado." }, { status: 404 });

    if (appointment.status === "FINISHED") {
      if (!data.reason) return Response.json({ error: "Informe o motivo da reabertura." }, { status: 400 });
      await prisma.appointment.update({ where: { id }, data: appointmentReopenData(data.step as CareStep, data.reason) });
    }

    await ensureAppointmentSteps(id, data.step as CareStep);
    await setCurrentStep(id, data.step as CareStep);
    await markDownstreamStepsForReview(id, data.step as CareStep);

    return Response.json(await prisma.appointment.findUnique({ where: { id }, include: { stepStates: true } }));
  } catch (error) {
    return apiError(error);
  }
}
