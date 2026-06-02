import type { MarieArea } from "@/lib/ai/marie-knowledge-base";

export type MarieContextLike = {
  patient: any;
  anamnesis?: any | null;
  appointment?: any | null;
  assessment?: any | null;
  suggestions?: any[];
  protocols?: any[];
  evolutions?: any[];
  professionalCommand: string;
};

const emptyValues = new Set(["", "nao", "não", "nenhum", "nenhuma", "n/a", "na", "null", "undefined"]);

export function normalizeMarieText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isBlank(value: unknown) {
  const normalized = normalizeMarieText(value).trim();
  return !normalized || emptyValues.has(normalized);
}

export function collectContextText(context: MarieContextLike) {
  const anamnesis = context.anamnesis ?? {};
  const assessment = context.assessment ?? {};
  const appointment = context.appointment ?? {};
  const latestProtocol = context.protocols?.[0] ?? {};
  const latestEvolution = context.evolutions?.[0] ?? {};
  const latestSuggestion = context.suggestions?.[0] ?? {};

  return normalizeMarieText([
    context.professionalCommand,
    context.patient?.name,
    context.patient?.notes,
    appointment.dailyComplaint,
    appointment.evaluation,
    appointment.conduct,
    anamnesis.chiefComplaint,
    anamnesis.treatmentGoal,
    anamnesis.allergies,
    anamnesis.medications,
    anamnesis.preExistingConditions,
    anamnesis.previousProcedures,
    anamnesis.skinType,
    anamnesis.skinSensitivity,
    anamnesis.contraindications,
    anamnesis.habits,
    anamnesis.notes,
    assessment.assessedArea,
    assessment.professionalAnalysis,
    assessment.skinCondition,
    assessment.bodyCondition,
    assessment.perceivedRisks,
    assessment.technicalNotes,
    latestProtocol.title,
    latestProtocol.objective,
    latestProtocol.indication,
    latestSuggestion.title,
    latestSuggestion.objective,
    latestSuggestion.suggestedTechniques,
    latestEvolution.summary,
    latestEvolution.patientResponse,
    latestEvolution.professionalNotes,
    latestEvolution.adjustmentsMade,
    latestEvolution.nextSteps
  ].filter(Boolean).join(" "));
}

export function getCurrentStep(context: MarieContextLike) {
  const step = context.appointment?.currentStep ?? "PREPARATION";
  return step === "ASSESSMENT" ? "ANAMNESIS" : step;
}

export function getMarieArea(context: MarieContextLike): MarieArea {
  const assessed = context.assessment?.assessedArea;
  if (assessed === "FACIAL" || assessed === "BODY" || assessed === "BOTH") return assessed;

  const text = collectContextText(context);
  const bodyHints = ["gordura", "celulite", "estria", "abdomen", "flacidez corporal", "drenagem", "massagem", "axila", "virilha"];
  const facialHints = ["acne", "melasma", "mancha", "olheira", "papada", "facial", "ruga", "mandibular"];
  const hasBody = bodyHints.some((hint) => text.includes(hint));
  const hasFacial = facialHints.some((hint) => text.includes(hint));

  if (hasBody && hasFacial) return "BOTH";
  if (hasBody) return "BODY";
  return "FACIAL";
}

export function getChiefComplaint(context: MarieContextLike) {
  return context.anamnesis?.chiefComplaint ?? context.appointment?.dailyComplaint ?? context.patient?.notes ?? "";
}

export function getMissingFields(context: MarieContextLike) {
  const missing: string[] = [];
  const step = getCurrentStep(context);
  const anamnesis = context.anamnesis;
  const assessment = context.assessment;

  if (!anamnesis || isBlank(anamnesis.chiefComplaint)) missing.push("queixa principal");
  if (!anamnesis || isBlank(anamnesis.treatmentGoal)) missing.push("objetivo do tratamento");
  if (!anamnesis || isBlank(anamnesis.allergies)) missing.push("alergias");
  if (!anamnesis || isBlank(anamnesis.medications)) missing.push("medicamentos");
  if (!anamnesis || isBlank(anamnesis.contraindications)) missing.push("contraindicações");

  if (["ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"].includes(step)) {
    if (!assessment) {
      missing.push("avaliação estética");
    } else {
      if (isBlank(assessment.assessedArea)) missing.push("área avaliada");
      if (isBlank(assessment.professionalAnalysis)) missing.push("análise profissional");
      if (isBlank(assessment.perceivedRisks)) missing.push("riscos percebidos");
    }
  }

  return [...new Set(missing)];
}

export function commandAsksForProtocol(command: string) {
  const text = normalizeMarieText(command);
  return ["protocolo", "plano", "conduta", "tratamento"].some((keyword) => text.includes(keyword));
}

export function commandAsksForEvolution(command: string) {
  const text = normalizeMarieText(command);
  return ["evolucao", "evolução", "retorno", "acompanhamento"].some((keyword) => text.includes(keyword));
}

export function commandAsksForGuidance(command: string) {
  const text = normalizeMarieText(command);
  return ["orientacao", "orientação", "cuidados", "home care", "pos-procedimento", "pós-procedimento"].some((keyword) => text.includes(keyword));
}
