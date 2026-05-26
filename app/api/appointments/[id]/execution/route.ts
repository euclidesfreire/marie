import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAppointmentExecutionSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance, markDownstreamStepsForReview } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.appointmentExecution.findUnique({ where: { appointmentId: id } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createAppointmentExecutionSchema.parse(await parseJson(request, {}));
    const execution = await prisma.appointmentExecution.upsert({
      where: { appointmentId: id },
      create: { ...data, appointmentId: id },
      update: data
    });
    await markDownstreamStepsForReview(id, "EXECUTION");
    await completeStepAndMaybeAdvance(id, "EXECUTION", "EVOLUTION");
    return Response.json(execution, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
