import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createTechnicalAdjustmentSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.technicalAdjustment.findMany({ where: { suggestionId: id }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createTechnicalAdjustmentSchema.parse(await parseJson(request, {}));
    return Response.json(await prisma.technicalAdjustment.create({ data: { ...data, suggestionId: id } }), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
