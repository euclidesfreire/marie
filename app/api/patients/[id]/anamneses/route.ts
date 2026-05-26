import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createAnamnesisSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.anamnesis.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createAnamnesisSchema.parse(await parseJson(request, {}));
    return Response.json(await prisma.anamnesis.create({ data: { ...data, patientId: id } }), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
