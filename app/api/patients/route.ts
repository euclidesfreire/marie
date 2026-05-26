import { prisma } from "@/lib/prisma";
import { apiError, getCurrentUser, parseJson } from "@/lib/utils";
import { createPatientSchema } from "@/lib/validations";

export async function GET() {
  const patients = await prisma.patient.findMany({ orderBy: { updatedAt: "desc" } });
  return Response.json(patients);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const data = createPatientSchema.parse(await parseJson(request, {}));
    const patient = await prisma.patient.create({ data: { ...data, professionalId: user.id, email: data.email || null } });
    return Response.json(patient, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
