import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAnamnesisSchema } from "@/lib/validations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createAnamnesisSchema.partial().parse(await parseJson(request, {}));
    return Response.json(await prisma.anamnesis.update({ where: { id }, data }));
  } catch (error) {
    return apiError(error);
  }
}
