import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAssessmentSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance, markDownstreamStepsForReview } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.aestheticAssessment.findUnique({ where: { appointmentId: id } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createAssessmentSchema.parse(await parseJson(request, {}));
    const assessment = await prisma.aestheticAssessment.upsert({ where: { appointmentId: id }, create: { ...data, appointmentId: id }, update: data });
    await markDownstreamStepsForReview(id, "ASSESSMENT");
    await completeStepAndMaybeAdvance(id, "ASSESSMENT", "CARE_PLAN");
    return Response.json(assessment, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
