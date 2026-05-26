import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { createClinicalNoteSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.clinicalNote.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = createClinicalNoteSchema.parse(await parseJson(request, {}));
    return Response.json(await prisma.clinicalNote.create({ data: { ...data, patientId: id, professionalId: user.id } }), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
