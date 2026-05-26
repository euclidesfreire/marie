import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolSuggestionSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.protocolSuggestion.findMany({ where: { patientId: id }, include: { validation: true, adjustments: true }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolSuggestionSchema.parse(await parseJson(request, {}));
    const suggestion = await prisma.protocolSuggestion.create({ data: { ...data, patientId: id } });
    if (suggestion.appointmentId) {
      await completeStepAndMaybeAdvance(suggestion.appointmentId, "CARE_PLAN");
    }
    return Response.json(suggestion, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
