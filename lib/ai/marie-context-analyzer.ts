import { getTreatmentConcernOption, type MarieArea, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import type { MarieCareMaturity, MarieCaseSubtype, MarieCommandGoal, MarieContextSummary } from "@/lib/ai/marie-scenario-types";

export type MarieContextLike = {
  patient: any;
  anamnesis?: any | null;
  appointment?: any | null;
  assessment?: any | null;
  suggestions?: any[];
  protocols?: any[];
  evolutions?: any[];
  primaryTreatmentConcern?: MarieProtocolKey | null;
  mainTreatmentIndication?: MarieProtocolKey | null;
  professionalCommand: string;
};

const emptyValues = new Set(["", "nao", "não", "nenhum", "nenhuma", "n/a", "na", "null", "undefined"]);

export function normalizeMarieText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isBlankMarieValue(value: unknown) {
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
  const selectedConcern = getTreatmentConcernOption(
    context.primaryTreatmentConcern
    ?? context.mainTreatmentIndication
    ?? context.assessment?.primaryTreatmentConcern
    ?? context.assessment?.mainTreatmentIndication
    ?? context.appointment?.primaryTreatmentConcern
    ?? context.appointment?.mainTreatmentIndication
  );
  if (selectedConcern) return selectedConcern.area;

  const text = normalizeMarieText([
    context.professionalCommand,
    context.appointment?.dailyComplaint,
    context.appointment?.evaluation,
    context.anamnesis?.chiefComplaint,
    context.anamnesis?.treatmentGoal,
    context.assessment?.professionalAnalysis,
    context.assessment?.skinCondition,
    context.assessment?.bodyCondition,
    context.assessment?.technicalNotes
  ].filter(Boolean).join(" "));
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

  if (!anamnesis || isBlankMarieValue(anamnesis.chiefComplaint)) missing.push("queixa principal");
  if (!anamnesis || isBlankMarieValue(anamnesis.treatmentGoal)) missing.push("objetivo do tratamento");
  if (!anamnesis || isBlankMarieValue(anamnesis.allergies)) missing.push("alergias");
  if (!anamnesis || isBlankMarieValue(anamnesis.medications)) missing.push("medicamentos");
  if (!anamnesis || isBlankMarieValue(anamnesis.contraindications)) missing.push("contraindicações");

  if (["ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"].includes(step)) {
    if (!assessment) {
      missing.push("avaliação estética");
    } else {
      if (isBlankMarieValue(assessment.assessedArea)) missing.push("área avaliada");
      if (isBlankMarieValue(assessment.professionalAnalysis)) missing.push("análise profissional");
      if (isBlankMarieValue(assessment.perceivedRisks)) missing.push("riscos percebidos");
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

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeMarieText(term)));
}

export function buildMarieContextSummary(context: MarieContextLike): MarieContextSummary {
  const anamnesis = context.anamnesis ?? {};
  const assessment = context.assessment ?? {};
  const appointment = context.appointment ?? {};
  const commandText = normalizeMarieText(context.professionalCommand);
  const complaintText = normalizeMarieText([
    anamnesis.chiefComplaint,
    anamnesis.treatmentGoal,
    anamnesis.skinType,
    anamnesis.skinSensitivity,
    anamnesis.habits,
    anamnesis.notes
  ].filter(Boolean).join(" "));
  const assessmentText = normalizeMarieText([
    assessment.assessedArea,
    assessment.professionalAnalysis,
    assessment.skinCondition,
    assessment.bodyCondition,
    assessment.perceivedRisks,
    assessment.technicalNotes
  ].filter(Boolean).join(" "));
  const appointmentText = normalizeMarieText([
    appointment.dailyComplaint,
    appointment.evaluation,
    appointment.conduct
  ].filter(Boolean).join(" "));
  const clinicalText = normalizeMarieText([
    complaintText,
    anamnesis.allergies,
    anamnesis.medications,
    anamnesis.preExistingConditions,
    anamnesis.previousProcedures,
    anamnesis.contraindications,
    assessmentText,
    appointmentText
  ].filter(Boolean).join(" "));
  const historyText = normalizeMarieText([
    ...(context.protocols ?? []).flatMap((item) => [item.title, item.objective, item.indication, item.contraindications, item.postProcedureCare]),
    ...(context.suggestions ?? []).flatMap((item) => [item.title, item.objective, item.suggestedTechniques, item.warnings]),
    ...(context.evolutions ?? []).flatMap((item) => [item.summary, item.patientResponse, item.professionalNotes, item.adjustmentsMade, item.nextSteps])
  ].filter(Boolean).join(" "));
  const hasApprovedProtocol = (context.protocols ?? []).some((item) => ["APPROVED", "APPLIED"].includes(item.status));
  const hasProtocolDraft = (context.suggestions ?? []).some((item) => ["DRAFT", "WAITING_REVIEW", "ADJUSTED"].includes(item.status)) || (context.protocols ?? []).some((item) => item.status === "DRAFT");
  const hasEvolutionForAppointment = (context.evolutions ?? []).some((item) => !context.appointment?.id || item.appointmentId === context.appointment.id);
  const selectedConcern = context.primaryTreatmentConcern
    ?? context.mainTreatmentIndication
    ?? context.assessment?.primaryTreatmentConcern
    ?? context.assessment?.mainTreatmentIndication
    ?? context.appointment?.primaryTreatmentConcern
    ?? context.appointment?.mainTreatmentIndication
    ?? null;
  const concernOption = getTreatmentConcernOption(selectedConcern);
  const area = getMarieArea(context);
  const explicitArea = ["FACIAL", "BODY", "BOTH"].includes(assessment.assessedArea) ? assessment.assessedArea as MarieArea : undefined;
  const primaryTreatmentConcernCompatible = !concernOption || !explicitArea || explicitArea === "BOTH" || concernOption.area === explicitArea;

  return {
    command: context.professionalCommand,
    normalizedCommand: commandText,
    commandText,
    complaintText,
    assessmentText,
    appointmentText,
    allText: normalizeMarieText(`${commandText} ${clinicalText} ${historyText}`),
    clinicalText,
    historyText,
    chiefComplaint: anamnesis.chiefComplaint ?? appointment.dailyComplaint ?? "",
    treatmentGoal: anamnesis.treatmentGoal ?? "",
    area,
    explicitArea,
    primaryTreatmentConcern: concernOption?.value,
    primaryTreatmentConcernCompatible,
    step: getCurrentStep(context),
    appointmentStatus: appointment.status,
    hasAppointment: Boolean(context.appointment),
    hasAnamnesis: Boolean(context.anamnesis),
    hasAssessment: Boolean(context.assessment),
    hasProtocolDraft,
    hasApprovedProtocol,
    hasEvolutionForAppointment,
    hasPreviousHistory: (context.protocols?.length ?? 0) > 0 || (context.evolutions?.length ?? 0) > 0,
    protocolCount: context.protocols?.length ?? 0,
    evolutionCount: context.evolutions?.length ?? 0,
    suggestionCount: context.suggestions?.length ?? 0
  };
}

export const buildContextSummary = buildMarieContextSummary;

export function detectCommandGoal(summary: MarieContextSummary): MarieCommandGoal {
  const command = summary.normalizedCommand;
  if (includesAny(command, ["finalizar", "encerrar", "concluir atendimento"])) return "FINISH";
  if (includesAny(command, ["home care", "orientacao", "orientação", "cuidados pos", "cuidados pós", "pos-procedimento", "pós-procedimento"])) return "GENERATE_HOME_CARE";
  if (includesAny(command, ["ajustar", "corrigir", "melhorar protocolo", "alterar plano", "revisar plano"])) return "ADJUST_PROTOCOL";
  if (includesAny(command, ["gerar protocolo", "sugerir protocolo", "plano de cuidado", "criar plano", "sugerir plano", "preencher plano", "sugerir tratamento", "gerar tratamento", "criar tratamento", "sugerir conduta"])) return "SUGGEST_PROTOCOL";
  if (includesAny(command, ["execucao", "execução", "registrar procedimento", "registrar sessao", "registrar sessão"])) return "REGISTER_EXECUTION";
  if (includesAny(command, ["evolucao", "evolução", "retorno", "proximos passos", "próximos passos"])) return "GENERATE_EVOLUTION";
  if (includesAny(command, ["pergunta", "o que perguntar", "complementar anamnese", "lacuna"])) return "ASK_QUESTIONS";
  if (includesAny(command, ["risco", "contraindicacao", "contraindicação", "cautela", "seguranca", "segurança"])) return "WARN";
  if (includesAny(command, ["resumo", "resumir", "historico", "histórico"])) return "SUMMARIZE";
  if (includesAny(command, ["revisar", "comparar", "avaliar", "avaliacao", "avaliação", "ponto de atencao", "ponto de atenção"])) return "REVIEW";
  return "GENERAL_SUPPORT";
}

export function detectCareMaturity(context: MarieContextLike, summary = buildMarieContextSummary(context)): MarieCareMaturity {
  if (!summary.hasAppointment) return "NO_APPOINTMENT";
  if (!summary.hasAnamnesis) return "NO_ANAMNESIS";
  if (summary.hasEvolutionForAppointment) return summary.evolutionCount > 1 ? "FOLLOW_UP" : "EVOLUTION_REGISTERED";
  if (["EVOLUTION", "COMPLETION"].includes(summary.step)) return "EXECUTION_REGISTERED";
  if (summary.hasApprovedProtocol) return "PROTOCOL_APPROVED";
  if (summary.hasProtocolDraft) return "PROTOCOL_DRAFTED";
  if (summary.hasAssessment) return "ASSESSMENT_READY";
  if ([context.anamnesis?.chiefComplaint, context.anamnesis?.treatmentGoal, context.anamnesis?.contraindications].some(isBlankMarieValue)) return "PARTIAL_ANAMNESIS";
  return "ANAMNESIS_READY";
}

export function detectCaseSubtype(summary: MarieContextSummary): MarieCaseSubtype {
  // Histórico antigo ajuda na comparação, mas não deve redefinir o caso atual.
  const text = normalizeMarieText(`${summary.commandText} ${summary.complaintText} ${summary.assessmentText} ${summary.appointmentText}`);
  if (includesAny(text, ["roacutan", "isotretinoina", "isotretinoína", "pele acneica sensibilizada", "acne sensivel", "acne sensível", "acne com acido", "acne com ácido", "descamacao", "descamação"])) return "sensitive_acne";
  if (includesAny(text, ["pustula", "pústula", "inflamada", "inflamatoria", "inflamatória", "papula", "pápula"])) return "inflammatory_acne";
  if (includesAny(text, ["comedao", "comedão", "comedoes", "comedões", "cravo", "cravos"])) return "comedonal_acne";
  if (includesAny(text, ["oleosidade", "pele oleosa"]) && !includesAny(text, ["lesao", "lesão", "acne", "espinha"])) return "oily_skin";
  if (includesAny(text, ["acne", "espinha", "espinhas"])) return "comedonal_acne";
  if (includesAny(text, ["melasma"])) return "melasma";
  if (includesAny(text, ["pos-inflamatoria", "pós-inflamatória", "hpi", "mancha de acne", "manchas de acne"])) return "post_inflammatory_hyperpigmentation";
  if (includesAny(text, ["melanose", "mancha solar", "manchas solares"])) return "solar_spots";
  if (includesAny(text, ["mancha", "manchas", "clareamento", "hipercromia"])) return "post_inflammatory_hyperpigmentation";
  if (includesAny(text, ["olheira", "olheiras"])) return "under_eye_dark_circles";
  if (includesAny(text, ["papada", "flacidez facial", "contorno mandibular", "perda de firmeza mandibular"])) return "facial_laxity";
  if (includesAny(text, ["ressecada", "ressecamento", "desidratada", "desvitalizada", "baixa hidratacao", "baixa hidratação"])) return "dehydrated_aging_skin";
  if (includesAny(text, ["pele fina", "pele reativa", "envelhecimento sensivel", "envelhecimento sensível"])) return "sensitive_aging_skin";
  if (includesAny(text, ["rejuvenescimento", "ruga", "rugas", "linhas finas"])) return "dehydrated_aging_skin";
  if (includesAny(text, ["gordura", "adiposidade", "abdomen", "abdômen", "flanco"]) && includesAny(text, ["flacidez"])) return "localized_fat_with_laxity";
  if (includesAny(text, ["gordura", "adiposidade", "abdomen", "abdômen", "flanco"])) return "localized_abdominal_fat";
  if (includesAny(text, ["celulite", "fibro edema", "fibroedema"]) && includesAny(text, ["edema", "retencao", "retenção", "inchaco", "inchaço"])) return "cellulite_edematous";
  if (includesAny(text, ["celulite", "fibro edema", "fibroedema"]) && includesAny(text, ["fibrose", "nodulo", "nódulo", "endurecida"])) return "cellulite_fibrotic";
  if (includesAny(text, ["celulite", "fibro edema", "fibroedema"])) return "cellulite_edematous";
  if (includesAny(text, ["estria vermelha", "estrias vermelhas", "estria recente", "estrias recentes"])) return "recent_stretch_marks";
  if (includesAny(text, ["estria branca", "estrias brancas", "estria antiga", "estrias antigas"])) return "old_stretch_marks";
  if (includesAny(text, ["estria", "estrias"])) return "old_stretch_marks";
  if (includesAny(text, ["flacidez corporal", "tonificacao", "tonificação"])) return "body_laxity";
  if (includesAny(text, ["axila", "virilha", "area intima", "área íntima", "escurecimento intimo", "escurecimento íntimo"])) return "intimate_area_darkening";
  if (includesAny(text, ["relaxamento", "drenagem", "retencao", "retenção", "detox", "spa dos pes", "spa dos pés"])) return "relaxation_and_fluid_retention";
  return "general_case";
}
