import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { createProfessionalValidationSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance, markDownstreamStepsForReview } from "@/lib/care-flow";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = createProfessionalValidationSchema.parse(await parseJson(request, {}));
    const validation = await prisma.professionalValidation.upsert({ where: { suggestionId: id }, create: { ...data, suggestionId: id, professionalId: user.id }, update: data });
    const suggestion = await prisma.protocolSuggestion.findUnique({ where: { id } });

    if (suggestion && data.decision !== "REJECTED") {
      await prisma.protocolSuggestion.update({ where: { id }, data: { status: data.decision === "APPROVED_WITH_ADJUSTMENTS" ? "ADJUSTED" : "APPROVED" } });
      const existingProtocol = suggestion.appointmentId
        ? await prisma.protocol.findFirst({ where: { appointmentId: suggestion.appointmentId }, orderBy: { createdAt: "desc" } })
        : null;
      if (!existingProtocol) {
        await prisma.protocol.create({
          data: {
            patientId: suggestion.patientId,
            appointmentId: suggestion.appointmentId,
            title: suggestion.title,
            objective: suggestion.objective,
            indication: suggestion.suggestedTechniques,
            contraindications: suggestion.contraindications,
            postProcedureCare: suggestion.warnings,
            source: suggestion.source === "AI" ? "AI_ASSISTED" : "MANUAL",
            status: "APPROVED"
          }
        });
      }
      if (suggestion.appointmentId) {
        await markDownstreamStepsForReview(suggestion.appointmentId, "CARE_PLAN");
        await completeStepAndMaybeAdvance(suggestion.appointmentId, "CARE_PLAN", "EXECUTION");
      }
    }

    if (suggestion && data.decision === "REJECTED") {
      await prisma.protocolSuggestion.update({ where: { id }, data: { status: "REJECTED" } });
    }

    return Response.json(validation, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
