import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance, markDownstreamStepsForReview } from "@/lib/care-flow";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolSchema.partial().parse(await parseJson(request, {}));
    const protocol = await prisma.protocol.update({ where: { id }, data });
    if (protocol.appointmentId && data.status === "APPLIED") {
      await markDownstreamStepsForReview(protocol.appointmentId, "CARE_PLAN");
      await completeStepAndMaybeAdvance(protocol.appointmentId, "CARE_PLAN", "EXECUTION");
    }
    return Response.json(protocol);
  } catch (error) {
    return apiError(error);
  }
}
