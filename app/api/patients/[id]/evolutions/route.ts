import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createEvolutionSchema } from "@/lib/validations";
import { completeStepAndMaybeAdvance } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.evolution.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createEvolutionSchema.parse(await parseJson(request, {}));
    const evolution = await prisma.evolution.create({ data: { ...data, patientId: id } });
    if (evolution.appointmentId) {
      await completeStepAndMaybeAdvance(evolution.appointmentId, "EVOLUTION", "COMPLETION");
    }
    return Response.json(evolution, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
