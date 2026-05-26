import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolStepSchema } from "@/lib/validations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolStepSchema.parse(await parseJson(request, {}));
    return Response.json(await prisma.protocolStep.create({ data: { ...data, protocolId: id } }), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
