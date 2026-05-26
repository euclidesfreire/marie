import { prisma } from "@/lib/prisma";
import { apiError, parseJson } from "@/lib/utils";
import { createProtocolSchema } from "@/lib/validations";
import { markDownstreamStepsForReview, setCurrentStep } from "@/lib/care-flow";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Response.json(await prisma.protocol.findMany({ where: { patientId: id }, include: { steps: true }, orderBy: { createdAt: "desc" } }));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = createProtocolSchema.parse(await parseJson(request, {}));
    const protocol = await prisma.protocol.create({ data: { ...data, patientId: id } });
    if (protocol.appointmentId) {
      await markDownstreamStepsForReview(protocol.appointmentId, "CARE_PLAN");
      await setCurrentStep(protocol.appointmentId, "CARE_PLAN");
    }
    return Response.json(protocol, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
