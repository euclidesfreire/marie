import { prisma } from "@/lib/prisma";

export const careSteps = ["PREPARATION", "ANAMNESIS", "ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"] as const;

export type CareStep = (typeof careSteps)[number];

const downstreamReview: Record<CareStep, CareStep[]> = {
  PREPARATION: [],
  ANAMNESIS: ["ASSESSMENT", "CARE_PLAN"],
  ASSESSMENT: ["CARE_PLAN"],
  CARE_PLAN: ["EXECUTION"],
  EXECUTION: ["EVOLUTION"],
  EVOLUTION: [],
  COMPLETION: []
};

export function stepIndex(step?: string | null) {
  const index = careSteps.indexOf(step as CareStep);
  return index < 0 ? 0 : index;
}

export function appointmentStartData() {
  return {
    status: "IN_PROGRESS" as const,
    currentStep: "ANAMNESIS" as const,
    startedAt: new Date()
  };
}

export function appointmentFinishData() {
  return {
    status: "FINISHED" as const,
    currentStep: "COMPLETION" as const,
    finishedAt: new Date()
  };
}

export function appointmentReopenData(step: CareStep, reason: string) {
  return {
    status: "REOPENED" as const,
    currentStep: step,
    reopenedAt: new Date(),
    reopenReason: reason
  };
}

export async function ensureAppointmentSteps(appointmentId: string, currentStep: CareStep = "ANAMNESIS") {
  await Promise.all(
    careSteps.map((step) =>
      prisma.appointmentStepState.upsert({
        where: { appointmentId_step: { appointmentId, step } },
        create: {
          appointmentId,
          step,
          status: step === currentStep ? "CURRENT" : stepIndex(step) < stepIndex(currentStep) ? "COMPLETED" : "PENDING",
          completedAt: stepIndex(step) < stepIndex(currentStep) ? new Date() : null
        },
        update: {}
      })
    )
  );
}

export async function setCurrentStep(appointmentId: string, step: CareStep) {
  await ensureAppointmentSteps(appointmentId, step);
  await prisma.appointment.update({ where: { id: appointmentId }, data: { currentStep: step } });
  await prisma.appointmentStepState.updateMany({ where: { appointmentId, status: "CURRENT" }, data: { status: "PENDING" } });
  await prisma.appointmentStepState.upsert({
    where: { appointmentId_step: { appointmentId, step } },
    create: { appointmentId, step, status: "CURRENT", reopenedAt: new Date() },
    update: { status: "CURRENT", reopenedAt: new Date() }
  });
}

export async function completeStepAndMaybeAdvance(appointmentId: string, completedStep: CareStep, nextStep?: CareStep) {
  await ensureAppointmentSteps(appointmentId, completedStep);
  await prisma.appointmentStepState.upsert({
    where: { appointmentId_step: { appointmentId, step: completedStep } },
    create: { appointmentId, step: completedStep, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date(), reviewedAt: new Date() }
  });
  if (nextStep) {
    await setCurrentStep(appointmentId, nextStep);
  }
}

export async function markDownstreamStepsForReview(appointmentId: string, changedStep: CareStep) {
  const steps = downstreamReview[changedStep] ?? [];
  if (steps.length === 0) return;
  await ensureAppointmentSteps(appointmentId, changedStep);
  await prisma.appointmentStepState.updateMany({
    where: {
      appointmentId,
      step: { in: steps },
      status: { in: ["COMPLETED", "CURRENT"] }
    },
    data: { status: "NEEDS_REVIEW", reviewedAt: null }
  });
}
