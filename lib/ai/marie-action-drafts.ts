import type { MarieAction } from "@/lib/ai/marie-client";

export type MarieStepDraft = Record<string, any>;

export function getMarieActionTargetStep(action?: MarieAction | null, currentStep = "ANAMNESIS") {
  if (!action) return currentStep;
  if (action.type === "CREATE_PROTOCOL_SUGGESTION" || action.type === "CREATE_FINAL_PROTOCOL") return "CARE_PLAN";
  if (action.type === "GENERATE_POST_CARE_GUIDANCE") return currentStep === "CARE_PLAN" ? "CARE_PLAN" : currentStep;
  if (action.type === "CREATE_EVOLUTION") return "EVOLUTION";
  if (action.type === "UPDATE_APPOINTMENT_NOTES") return currentStep === "EXECUTION" ? "EXECUTION" : "ANAMNESIS";
  if (action.type === "REVIEW_CONTRAINDICATIONS" || action.type === "SUMMARIZE_PATIENT_HISTORY" || action.type === "CREATE_CLINICAL_NOTE") return currentStep;
  return currentStep;
}

export function stepToCareTab(step?: string | null) {
  if (step === "CARE_PLAN") return "Plano de cuidado";
  if (step === "EXECUTION") return "Execução";
  if (step === "EVOLUTION") return "Evolução";
  if (step === "COMPLETION") return "Finalização";
  return "Anamnese";
}

export function careTabToStep(tab?: string | null) {
  if (tab === "Plano de cuidado") return "CARE_PLAN";
  if (tab === "Execução") return "EXECUTION";
  if (tab === "Evolução") return "EVOLUTION";
  if (tab === "Finalização") return "COMPLETION";
  if (tab === "Preparação") return "PREPARATION";
  return "ANAMNESIS";
}

export function isMarieDraftAction(action: MarieAction) {
  return [
    "CREATE_PROTOCOL_SUGGESTION",
    "CREATE_EVOLUTION",
    "CREATE_CLINICAL_NOTE",
    "UPDATE_APPOINTMENT_NOTES",
    "GENERATE_POST_CARE_GUIDANCE",
    "SUMMARIZE_PATIENT_HISTORY",
    "REVIEW_CONTRAINDICATIONS"
  ].includes(action.type);
}

export function mapMarieActionToStepDraft(action?: MarieAction | null, currentStep = "ANAMNESIS"): MarieStepDraft {
  if (!action) return {};
  const payload = (action.payload ?? {}) as Record<string, any>;
  const targetStep = getMarieActionTargetStep(action, currentStep);

  if (targetStep === "ANAMNESIS") {
    const riskText = Array.isArray(payload.risks) ? payload.risks.join("; ") : "";
    const cautionText = Array.isArray(payload.cautions) ? payload.cautions.join("; ") : "";
    const review = payload.review ?? payload.summary ?? payload.content ?? payload.conduct ?? payload.evaluation ?? "";
    return {
      contraindications: payload.contraindications ?? review,
      notes: payload.notes ?? payload.summary ?? payload.content ?? review,
      professionalAnalysis: payload.professionalAnalysis ?? payload.evaluation ?? payload.conduct ?? review,
      perceivedRisks: payload.perceivedRisks ?? riskText,
      technicalNotes: payload.technicalNotes ?? cautionText
    };
  }

  if (targetStep === "CARE_PLAN") {
    return {
      title: payload.title,
      objective: payload.objective,
      indication: payload.indication ?? payload.suggestedTechniques,
      contraindications: payload.contraindications,
      postProcedureCare: payload.postProcedureCare ?? payload.warnings ?? payload.guidance,
      source: "AI_ASSISTED",
      status: "DRAFT"
    };
  }

  if (targetStep === "EXECUTION") {
    const guidance = payload.guidance ?? payload.conduct ?? payload.content ?? "";
    return {
      procedurePerformed: payload.procedurePerformed ?? payload.summary ?? guidance,
      productsUsed: payload.productsUsed,
      equipmentParameters: payload.equipmentParameters,
      duration: payload.duration,
      professionalNotes: payload.professionalNotes ?? guidance,
      incidents: payload.incidents,
      postCareGiven: payload.postCareGiven ?? payload.guidance
    };
  }

  if (targetStep === "EVOLUTION") {
    return {
      summary: payload.summary,
      patientResponse: payload.patientResponse,
      professionalNotes: payload.professionalNotes ?? payload.content,
      adjustmentsMade: payload.adjustmentsMade,
      nextSteps: payload.nextSteps,
      returnDate: payload.returnDate
    };
  }

  return {
    finalSummary: payload.summary ?? payload.content ?? payload.review,
    notes: payload.summary ?? payload.content ?? payload.review
  };
}
