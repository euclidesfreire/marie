import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { updatePatientSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) return Response.json({ error: "Paciente não encontrado." }, { status: 404 });
  return Response.json(patient);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = updatePatientSchema.parse(await parseJson(request, {}));
    const patient = await prisma.patient.update({ where: { id }, data: { ...data, email: data.email || null } });
    return Response.json(patient);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.patient.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
