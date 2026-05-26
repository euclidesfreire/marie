import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolStepSchema } from "@/lib/validations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolStepSchema.partial().parse(await parseJson(request, {}));
    return Response.json(await prisma.protocolStep.update({ where: { id }, data }));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.protocolStep.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
