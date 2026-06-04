import type { MarieAction, MarieContextPayload, MarieResponse } from "@/lib/ai/marie-client";
import {
  commandAsksForEvolution,
  commandAsksForGuidance,
  commandAsksForProtocol,
  getChiefComplaint,
  getCurrentStep,
  getMarieArea,
  getMissingFields,
  type MarieContextLike
} from "@/lib/ai/marie-context-analyzer";
import { detectMarieIntent } from "@/lib/ai/marie-intent-detector";
import { getProtocolByKey, type MarieArea, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import { buildPostCareGuidance, buildProtocolSuggestionPayload } from "@/lib/ai/marie-protocol-builder";
import { detectMarieRisks, type MarieRiskLevel } from "@/lib/ai/marie-risk-engine";

export type MarieTone = "normal" | "cautious" | "insufficient_data";

export type MarieScenario = {
  intent: MarieProtocolKey;
  area: MarieArea;
  step: string;
  riskLevel: MarieRiskLevel;
  detectedRisks: string[];
  missingFields: string[];
  recommendedProtocolKey: MarieProtocolKey;
  tone: MarieTone;
  canSuggestProtocol: boolean;
  shouldWarnProfessional: boolean;
};

const actionId = () => `marie-action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const principle = "Marie sugere. O profissional valida. O atendimento evolui.";

function action(type: MarieAction["type"], title: string, description: string, payload: unknown): MarieAction {
  return { id: actionId(), type, title, description, payload, requiresConfirmation: true };
}

function sentenceList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function currentProtocolName(scenario: MarieScenario) {
  return getProtocolByKey(scenario.recommendedProtocolKey).title;
}

function buildReason(scenario: MarieScenario, context: MarieContextLike) {
  const complaint = getChiefComplaint(context);
  const protocol = getProtocolByKey(scenario.recommendedProtocolKey);
  const pieces = [
    complaint ? `queixa registrada: ${complaint}` : "",
    `intenção provável: ${protocol.title}`,
    scenario.detectedRisks.length ? `pontos de cautela: ${sentenceList(scenario.detectedRisks)}` : "sem contraindicação relevante detectada nos dados informados"
  ].filter(Boolean);

  return pieces.join("; ");
}

export function analyzeMarieScenario(context: MarieContextPayload): MarieScenario {
  const intent = detectMarieIntent(context);
  const risks = detectMarieRisks(context, intent);
  const missingFields = getMissingFields(context);
  const step = getCurrentStep(context);
  const protocolRequested = commandAsksForProtocol(context.professionalCommand);
  const canSuggestProtocol = step === "CARE_PLAN" || protocolRequested;
  const hasEssentialData = missingFields.filter((field) => ["queixa principal", "avaliação estética", "área avaliada"].includes(field)).length === 0;

  return {
    intent,
    area: getMarieArea(context),
    step,
    riskLevel: risks.riskLevel,
    detectedRisks: risks.detectedRisks,
    missingFields,
    recommendedProtocolKey: intent,
    tone: !hasEssentialData && canSuggestProtocol ? "insufficient_data" : risks.riskLevel === "LOW" ? "normal" : "cautious",
    canSuggestProtocol,
    shouldWarnProfessional: risks.shouldWarnProfessional
  };
}

function buildProtocolAction(scenario: MarieScenario, context: MarieContextPayload) {
  const risks = detectMarieRisks(context, scenario.recommendedProtocolKey);
  return action(
    "CREATE_PROTOCOL_SUGGESTION",
    "Preencher plano de cuidado",
    `Preparar ${currentProtocolName(scenario).toLowerCase()} como rascunho editável do plano.`,
    buildProtocolSuggestionPayload(scenario.recommendedProtocolKey, risks)
  );
}

function buildContraindicationAction(scenario: MarieScenario, context: MarieContextPayload) {
  const risks = detectMarieRisks(context, scenario.recommendedProtocolKey);
  return action("REVIEW_CONTRAINDICATIONS", "Revisar contraindicações", "Listar cautelas detectadas para validação profissional.", {
    review: risks.detectedRisks.length
      ? `Foram detectados: ${risks.detectedRisks.join("; ")}. Recomenda-se validar: ${risks.cautions.join("; ")}.`
      : "Não há contraindicações relevantes identificadas nos dados informados, mas a confirmação profissional continua obrigatória.",
    risks: risks.detectedRisks,
    cautions: risks.cautions
  });
}

function buildGuidanceAction(scenario: MarieScenario, context: MarieContextPayload) {
  const risks = detectMarieRisks(context, scenario.recommendedProtocolKey);
  return action("GENERATE_POST_CARE_GUIDANCE", "Gerar orientação pós-procedimento", "Preparar cuidados pós e home care para revisão profissional.", {
    guidance: buildPostCareGuidance(scenario.recommendedProtocolKey, risks)
  });
}

function buildEvolutionAction(scenario: MarieScenario, context: MarieContextPayload) {
  const protocol = getProtocolByKey(scenario.recommendedProtocolKey);
  const lastEvolution = context.evolutions?.[0];
  const risks = detectMarieRisks(context, scenario.recommendedProtocolKey);
  return action("CREATE_EVOLUTION", "Criar evolução clínica", "Gerar evolução da sessão para revisão antes de salvar.", {
    summary: `Evolução assistida relacionada a ${protocol.title.toLowerCase()}. Registrar resposta observada, tolerância ao procedimento e achados relevantes da sessão.`,
    patientResponse: lastEvolution?.patientResponse ?? "Paciente deve ser orientada a relatar sensibilidade, desconforto, reações ou melhora percebida sem promessa de resultado.",
    professionalNotes: risks.detectedRisks.length
      ? `Manter cautela por: ${risks.detectedRisks.join("; ")}. Validar presencialmente antes de manter ou intensificar conduta.`
      : "Sem intercorrências informadas no contexto. Confirmar tolerância e registros clínicos antes de salvar.",
    adjustmentsMade: "Ajustes devem ser registrados pelo profissional conforme resposta clínica.",
    nextSteps: `Acompanhar evolução, reforçar cuidados pós e revisar necessidade de continuidade do plano. ${principle}`
  });
}

function preparationResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [
    action("SUMMARIZE_PATIENT_HISTORY", "Resumir histórico do paciente", "Organizar dados já registrados antes de iniciar ou continuar o atendimento.", {
      summary: `Paciente ${context.patient.name}. ${context.evolutions?.length ?? 0} evolução(ões), ${context.protocols?.length ?? 0} protocolo(s) e ${context.suggestions?.length ?? 0} sugestão(ões) no histórico.`
    })
  ];

  if (!context.appointment || !["IN_PROGRESS", "REOPENED"].includes(context.appointment.status)) {
    actions.unshift(action("START_APPOINTMENT", "Iniciar atendimento", "Colocar o atendimento em andamento pela anamnese.", { status: "IN_PROGRESS", currentStep: "ANAMNESIS" }));
  }

  return {
    message: `Antes de iniciar, recomendo confirmar queixa principal, objetivo do tratamento e contraindicações. ${scenario.missingFields.length ? `Ainda faltam: ${sentenceList(scenario.missingFields)}.` : "O contexto inicial está organizado para avançar."} ${principle}`,
    warnings: [principle],
    actions
  };
}

function anamnesisResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [buildContraindicationAction(scenario, context)];
  const asksProtocol = commandAsksForProtocol(context.professionalCommand);
  const command = context.professionalCommand.toLowerCase();
  if (asksProtocol) actions.push(buildProtocolAction(scenario, context));
  const areaGuidance =
    scenario.area === "BODY"
      ? "Para avaliação corporal, sugiro observar gordura localizada, retenção hídrica, flacidez, fibro edema geloide, medidas e contraindicações vasculares, inflamatórias ou para eletroterapia."
      : scenario.area === "BOTH"
        ? "Como a área envolve facial e corporal, sugiro separar pontos faciais como sensibilidade, barreira cutânea, manchas e uso de ácidos; e pontos corporais como medidas, flacidez, retenção hídrica e contraindicações vasculares."
        : "Para avaliação facial, sugiro observar sensibilidade, barreira cutânea, textura, manchas, luminosidade, firmeza, uso recente de ácidos/retinoides e fotoproteção.";

  if (command.includes("avalia") || command.includes("ponto") || command.includes("risco") || command.includes("comparar")) {
    actions.push(action("UPDATE_APPOINTMENT_NOTES", "Preencher avaliação inicial", "Preparar pontos técnicos para a Anamnese inicial.", {
      professionalAnalysis: areaGuidance,
      perceivedRisks: scenario.detectedRisks.length ? scenario.detectedRisks.join("; ") : "Sem risco relevante detectado nos dados informados. Confirmar contraindicações manualmente.",
      technicalNotes: `Motivo da sugestão: ${buildReason(scenario, context)}. Recomenda-se validar presencialmente e registrar achados antes do plano de cuidado.`,
      evaluation: areaGuidance
    }));
  }

  return {
    message: `Na anamnese e avaliação inicial, identifiquei ${buildReason(scenario, context)}. ${areaGuidance} ${scenario.missingFields.length ? `Sugiro complementar ${sentenceList(scenario.missingFields)} antes de validar o plano.` : "A etapa traz base suficiente para o plano, desde que o profissional confirme presencialmente."} ${asksProtocol ? "Preparei uma sugestão preliminar, mas ela deve ser revisada com cautela." : "Nesta etapa, priorizo lacunas, perguntas complementares e contraindicações antes de montar protocolo completo."}`,
    warnings: scenario.shouldWarnProfessional ? [...scenario.detectedRisks, principle] : [principle],
    actions
  };
}

function assessmentResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [
    buildContraindicationAction(scenario, context),
    action("UPDATE_APPOINTMENT_NOTES", "Sugerir ajuste na avaliação", "Registrar pontos técnicos para revisão no atendimento.", {
      evaluation: `Avaliação assistida: cruzar ${currentProtocolName(scenario).toLowerCase()} com anamnese, área avaliada (${scenario.area}) e riscos percebidos. Confirmar fototipo, sensibilidade, hábitos, histórico de procedimentos e contraindicações antes do plano.`
    })
  ];

  if (commandAsksForProtocol(context.professionalCommand)) actions.push(buildProtocolAction(scenario, context));

  return {
    message: `Cruzei avaliação e anamnese. O cenário aponta para ${currentProtocolName(scenario).toLowerCase()} porque ${buildReason(scenario, context)}. Recomendo registrar área, tolerância, riscos e observações técnicas para apoiar o Plano de cuidado. ${principle}`,
    warnings: scenario.shouldWarnProfessional ? [...scenario.detectedRisks, principle] : [principle],
    actions
  };
}

function carePlanResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [buildProtocolAction(scenario, context), buildContraindicationAction(scenario, context)];
  if (commandAsksForGuidance(context.professionalCommand)) actions.push(buildGuidanceAction(scenario, context));

  const caution = scenario.tone === "insufficient_data"
    ? `Consigo gerar uma sugestão inicial, mas recomendo preencher ${sentenceList(scenario.missingFields)} antes de validar o protocolo.`
    : scenario.tone === "cautious"
      ? "A sugestão foi montada de forma mais conservadora por causa dos fatores de cautela detectados."
      : "A sugestão usa procedimentos reais da base facial/corporal e deve ser validada pela profissional.";

  return {
    message: `Preparei uma proposta para ${currentProtocolName(scenario).toLowerCase()}. Motivo: ${buildReason(scenario, context)}. ${caution} ${principle}`,
    warnings: scenario.shouldWarnProfessional ? [...scenario.detectedRisks, principle] : [principle],
    actions
  };
}

function executionResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [
    action("UPDATE_APPOINTMENT_NOTES", "Sugerir registro da execução", "Organizar procedimento, parâmetros e observações sem inventar valores técnicos.", {
      procedurePerformed: `Registrar técnica aplicada e região tratada com referência ao plano: ${currentProtocolName(scenario)}.`,
      productsUsed: "Informar produtos utilizados conforme protocolo interno e tolerância do cliente.",
      equipmentParameters: "Registrar parâmetros do equipamento conforme protocolo interno e orientação do fabricante, sem valores inventados pela Marie.",
      duration: "Registrar duração aproximada conforme execução real.",
      professionalNotes: `Execução assistida: registrar tolerância do cliente, resposta observada, intercorrências e ajustes realizados. ${scenario.shouldWarnProfessional ? `Atenção a: ${sentenceList(scenario.detectedRisks)}.` : ""}`,
      incidents: "Registrar intercorrências somente se observadas ou relatadas.",
      postCareGiven: "Registrar cuidados entregues ao final e reforçar que a decisão é profissional."
    }),
    buildGuidanceAction(scenario, context)
  ];
  if (commandAsksForEvolution(context.professionalCommand)) actions.push(buildEvolutionAction(scenario, context));

  return {
    message: `Para a execução, recomendo registrar técnica, região, produtos, parâmetros conforme protocolo interno, tolerância do cliente, intercorrências e cuidados entregues. Não inventei valores técnicos; eles devem vir do equipamento/protocolo da clínica. ${scenario.shouldWarnProfessional ? `Atenção a: ${sentenceList(scenario.detectedRisks)}. ` : ""}${principle}`,
    warnings: scenario.shouldWarnProfessional ? [...scenario.detectedRisks, principle] : [principle],
    actions
  };
}

function evolutionResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [buildEvolutionAction(scenario, context), buildGuidanceAction(scenario, context)];
  if (context.professionalCommand.toLowerCase().includes("finalizar")) {
    actions.push(action("FINISH_APPOINTMENT", "Finalizar atendimento", "Encerrar somente após confirmação profissional.", { status: "FINISHED", currentStep: "COMPLETION" }));
  }

  return {
    message: `Posso estruturar a evolução considerando o plano aplicado, a resposta do paciente e o histórico. Para ${currentProtocolName(scenario).toLowerCase()}, recomendo registrar tolerância, intercorrências, resposta percebida, ajustes e próximos passos sem prometer resultado. ${principle}`,
    warnings: scenario.shouldWarnProfessional ? [...scenario.detectedRisks, principle] : [principle],
    actions
  };
}

function completionResponse(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  const actions: MarieAction[] = [
    action("SUMMARIZE_PATIENT_HISTORY", "Gerar resumo final", "Preparar resumo do atendimento e pendências para revisão.", {
      summary: `Resumo assistido: ${context.patient.name}; etapa atual ${scenario.step}; protocolo provável ${currentProtocolName(scenario)}; pendências: ${scenario.missingFields.length ? scenario.missingFields.join(", ") : "não identificadas no contexto disponível"}. ${principle}`
    })
  ];

  if (context.professionalCommand.toLowerCase().includes("finalizar")) {
    actions.push(action("FINISH_APPOINTMENT", "Finalizar atendimento", "Encerrar somente após confirmação profissional.", { status: "FINISHED", currentStep: "COMPLETION" }));
  }

  return {
    message: `Revisei pendências para finalização. ${scenario.missingFields.length ? `Antes de encerrar, ainda vale conferir ${sentenceList(scenario.missingFields)}.` : "Não identifiquei pendências críticas no contexto disponível."} Sugiro registrar resumo final, orientações e necessidade de retorno/acompanhamento. ${principle}`,
    warnings: [principle],
    actions
  };
}

export function buildMarieResponseFromScenario(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  if (scenario.step === "PREPARATION") return preparationResponse(scenario, context);
  if (scenario.step === "ANAMNESIS") return anamnesisResponse(scenario, context);
  if (scenario.step === "ASSESSMENT") return assessmentResponse(scenario, context);
  if (scenario.step === "CARE_PLAN") return carePlanResponse(scenario, context);
  if (scenario.step === "EXECUTION") return executionResponse(scenario, context);
  if (scenario.step === "EVOLUTION") return evolutionResponse(scenario, context);
  return completionResponse(scenario, context);
}
