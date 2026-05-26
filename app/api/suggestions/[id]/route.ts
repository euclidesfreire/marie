import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolSuggestionSchema } from "@/lib/validations";
import { markDownstreamStepsForReview, setCurrentStep } from "@/lib/care-flow";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolSuggestionSchema.partial().parse(await parseJson(request, {}));
    const suggestion = await prisma.protocolSuggestion.update({ where: { id }, data });
    if (suggestion.appointmentId) {
      await markDownstreamStepsForReview(suggestion.appointmentId, "CARE_PLAN");
      if (data.status === "WAITING_REVIEW") await setCurrentStep(suggestion.appointmentId, "CARE_PLAN");
    }
    return Response.json(suggestion);
  } catch (error) {
    return apiError(error);
  }
}
