import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createEvolutionSchema } from "@/lib/validations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createEvolutionSchema.partial().parse(await parseJson(request, {}));
    return Response.json(await prisma.evolution.update({ where: { id }, data }));
  } catch (error) {
    return apiError(error);
  }
}
