import type { MarieAction, MarieContextPayload, MarieResponse } from "@/lib/ai/marie-client";
import {
  buildMarieContextSummary,
  detectCareMaturity,
  detectCaseSubtype,
  detectCommandGoal,
  getMissingFields,
  normalizeMarieText
} from "@/lib/ai/marie-context-analyzer";
import { detectMarieIntent } from "@/lib/ai/marie-intent-detector";
import { getProtocolByKey } from "@/lib/ai/marie-knowledge-base";
import { buildDynamicProtocolPayload, buildProcedurePlan } from "@/lib/ai/marie-protocol-builder";
import { detectMarieRisks, detectSafetyProfile } from "@/lib/ai/marie-risk-engine";
import type { MarieCommandGoal, MarieContextSummary, MarieScenario } from "@/lib/ai/marie-scenario-types";

export type { MarieScenario } from "@/lib/ai/marie-scenario-types";

const principle = "Marie sugere. O profissional valida. O atendimento evolui.";
const actionId = () => `marie-action-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeMarieText(term)));
}

function sentenceList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function action(type: MarieAction["type"], title: string, description: string, payload: unknown): MarieAction {
  return { id: actionId(), type, title, description, payload, requiresConfirmation: true };
}

function detectSignals(summary: MarieContextSummary, scenarioIntent: string) {
  const signalTerms = [
    "comedões", "cravos", "pústulas", "inflamação", "oleosidade", "sensibilidade", "ácidos", "roacutan",
    "melasma", "exposição solar", "fotoproteção", "ressecamento", "flacidez", "papada", "gordura localizada",
    "abdômen", "celulite", "retenção", "edema", "fibrose", "estrias", "marca-passo", "gestação"
  ];
  const found = signalTerms.filter((term) => summary.allText.includes(normalizeMarieText(term)));
  return unique([`intenção: ${scenarioIntent.replaceAll("_", " ")}`, `área: ${summary.area}`, ...found]);
}

function alignSubtypeWithIntent(intent: string, subtype: MarieScenario["subtype"]): MarieScenario["subtype"] {
  const allowed: Record<string, MarieScenario["subtype"][]> = {
    facial_acne: ["comedonal_acne", "inflammatory_acne", "oily_skin", "sensitive_acne"],
    facial_clareamento: ["melasma", "post_inflammatory_hyperpigmentation", "solar_spots"],
    facial_rejuvenescimento: ["dehydrated_aging_skin", "sensitive_aging_skin", "facial_laxity"],
    facial_olheiras: ["under_eye_dark_circles"],
    facial_flacidez_papada: ["facial_laxity"],
    corporal_gordura: ["localized_abdominal_fat", "localized_fat_with_laxity"],
    corporal_celulite: ["cellulite_edematous", "cellulite_fibrotic"],
    corporal_estrias: ["recent_stretch_marks", "old_stretch_marks"],
    corporal_flacidez: ["body_laxity"],
    corporal_clareamento: ["intimate_area_darkening"],
    corporal_relaxamento: ["relaxation_and_fluid_retention"]
  };
  const defaults: Record<string, MarieScenario["subtype"]> = {
    facial_acne: "comedonal_acne",
    facial_clareamento: "post_inflammatory_hyperpigmentation",
    facial_rejuvenescimento: "dehydrated_aging_skin",
    facial_olheiras: "under_eye_dark_circles",
    facial_flacidez_papada: "facial_laxity",
    corporal_gordura: "localized_abdominal_fat",
    corporal_celulite: "cellulite_edematous",
    corporal_estrias: "old_stretch_marks",
    corporal_flacidez: "body_laxity",
    corporal_clareamento: "intimate_area_darkening",
    corporal_relaxamento: "relaxation_and_fluid_retention"
  };
  return allowed[intent]?.includes(subtype) ? subtype : (defaults[intent] ?? subtype);
}

function buildSuggestedQuestions(summary: MarieContextSummary, missingFields: string[], subtype: string) {
  const questions = missingFields.map((field) => `Confirmar ${field}.`);
  if (summary.area === "FACIAL" || summary.area === "BOTH") {
    questions.push("Houve uso recente de ácidos, retinoides ou isotretinoína?", "Como está a fotoproteção e a exposição solar recente?", "A pele apresenta ardor, descamação ou reação frequente?");
  }
  if (summary.area === "BODY" || summary.area === "BOTH") {
    questions.push("Há marca-passo, alterações cardíacas, vasculares ou gestação?", "Como estão ingestão hídrica, atividade física e resposta a procedimentos anteriores?", "A região apresenta dor, edema, fibrose ou sensibilidade?");
  }
  if (subtype.includes("acne")) questions.push("Predominam comedões, lesões inflamadas ou apenas oleosidade?");
  if (subtype.includes("cellulite")) questions.push("A celulite apresenta retenção/edema, dor ou áreas endurecidas?");
  return unique(questions).slice(0, 7);
}

function detectContradictions(summary: MarieContextSummary, commandGoal: MarieCommandGoal) {
  const text = summary.allText;
  const contradictions: string[] = [];
  const asksClearance = includesAny(summary.normalizedCommand, ["clareador", "clareamento", "melasma", "mancha"]);
  const asksAbrasive = includesAny(summary.normalizedCommand, ["peeling", "abrasivo", "extracao", "extração", "diamante"]);
  const asksElectro = includesAny(summary.normalizedCommand, ["radiofrequencia", "radiofrequência", "corrente", "eletro", "ultrassom", "criofrequencia", "criofrequência"]);

  if (asksClearance && includesAny(text, ["exposicao solar intensa", "exposição solar intensa", "filtro irregular", "sem filtro", "nao usa filtro", "não usa filtro"])) {
    contradictions.push("Foi solicitado clareamento, mas há exposição solar relevante ou fotoproteção irregular.");
  }
  if ((asksElectro || summary.area === "BODY") && includesAny(text, ["marca-passo", "marcapasso"])) {
    contradictions.push("Há marca-passo registrado; eletroterapia e recursos relacionados exigem revisão antes da sugestão.");
  }
  if ((asksElectro || summary.area === "BODY") && includesAny(text, ["gestacao", "gestação", "gravida", "grávida"])) {
    contradictions.push("Há gestação informada; procedimentos corporais com correntes, calor ou ultrassom não devem ser sugeridos diretamente.");
  }
  if ((asksAbrasive || commandGoal === "SUGGEST_PROTOCOL") && includesAny(text, ["roacutan", "isotretinoina", "isotretinoína", "pele sensibilizada", "descamacao", "descamação"])) {
    contradictions.push("O contexto sugere pele sensibilizada ou isotretinoína; peelings, extrações intensas e abrasão precisam ser evitados/revistos.");
  }
  if (commandGoal === "FINISH" && !summary.hasEvolutionForAppointment) {
    contradictions.push("O atendimento foi solicitado para finalização sem evolução registrada.");
  }
  if (commandGoal === "FINISH" && !["EVOLUTION", "COMPLETION"].includes(summary.step)) {
    contradictions.push("O atendimento foi solicitado para finalização sem evidência de execução registrada no fluxo atual.");
  }
  if (commandGoal === "GENERATE_EVOLUTION" && !summary.hasApprovedProtocol && !["EXECUTION", "EVOLUTION", "COMPLETION"].includes(summary.step)) {
    contradictions.push("Foi solicitada evolução, mas não há protocolo aprovado ou execução identificada no contexto.");
  }
  return unique(contradictions);
}

function buildExplanation(summary: MarieContextSummary, scenario: Pick<MarieScenario, "subtype" | "safetyProfile" | "missingFields" | "detectedRisks" | "careMaturity">) {
  const evidence = [
    summary.chiefComplaint ? `a queixa principal (${summary.chiefComplaint})` : "",
    summary.treatmentGoal ? `o objetivo informado (${summary.treatmentGoal})` : "",
    summary.hasAssessment ? `a avaliação estética e a área ${summary.area.toLowerCase()}` : "",
    summary.hasPreviousHistory ? "o histórico já registrado" : ""
  ].filter(Boolean);
  const safety = scenario.detectedRisks.length
    ? `Foram encontrados fatores de cautela: ${sentenceList(scenario.detectedRisks)}.`
    : "Não encontrei fator de alto risco nos dados disponíveis.";
  const gaps = scenario.missingFields.length ? `Ainda faltam ${sentenceList(scenario.missingFields)}.` : "Os dados essenciais estão razoavelmente preenchidos.";
  return `A análise considerou ${sentenceList(evidence) || "os dados disponíveis"}. O subtipo provável é ${scenario.subtype.replaceAll("_", " ")} e a maturidade do atendimento é ${scenario.careMaturity.toLowerCase().replaceAll("_", " ")}. ${safety} ${gaps}`;
}

export function analyzeMarieScenario(context: MarieContextPayload): MarieScenario {
  const summary = buildMarieContextSummary(context);
  const commandGoal = detectCommandGoal(summary);
  const careMaturity = detectCareMaturity(context, summary);
  const intent = detectMarieIntent(context);
  const subtype = alignSubtypeWithIntent(intent, detectCaseSubtype(summary));
  const missingFields = getMissingFields(context);
  const risks = detectMarieRisks(context, intent);
  const safetyProfile = detectSafetyProfile(context, intent, summary, missingFields, commandGoal);
  const contradictions = detectContradictions(summary, commandGoal);
  const baseScenario = {
    intent,
    subtype,
    safetyProfile,
    careMaturity,
    commandGoal,
    step: summary.step,
    area: summary.area,
    confidence: Math.max(0.35, Math.min(0.95, 0.45 + (summary.chiefComplaint ? 0.2 : 0) + (summary.hasAssessment ? 0.15 : 0) + (subtype !== "general_case" ? 0.15 : 0) - (missingFields.length * 0.03))),
    detectedSignals: detectSignals(summary, intent),
    detectedRisks: risks.detectedRisks,
    missingFields,
    contradictions,
    recommendedProcedures: [],
    optionalProcedures: [],
    avoidedProcedures: [],
    recommendedEquipments: [],
    recommendedHomeCare: [],
    suggestedQuestions: buildSuggestedQuestions(summary, missingFields, subtype),
    explanation: "",
    shouldSuggestProtocol: ["SUGGEST_PROTOCOL", "ADJUST_PROTOCOL"].includes(commandGoal) || (summary.step === "CARE_PLAN" && ["GENERAL_SUPPORT", "REVIEW"].includes(commandGoal)),
    shouldSuggestQuestions: commandGoal === "ASK_QUESTIONS" || safetyProfile === "INSUFFICIENT_DATA" || missingFields.length > 2,
    shouldWarnProfessional: safetyProfile !== "LOW_RISK" || contradictions.length > 0,
    shouldOfferAlternatives: ["CAUTION", "HIGH_RISK"].includes(safetyProfile) || commandGoal === "ADJUST_PROTOCOL"
  } satisfies MarieScenario;
  baseScenario.explanation = buildExplanation(summary, baseScenario);
  const plan = buildProcedurePlan(baseScenario);
  return {
    ...baseScenario,
    recommendedProcedures: plan.recommendedProcedures,
    optionalProcedures: plan.optionalProcedures,
    avoidedProcedures: plan.avoidedProcedures,
    recommendedEquipments: plan.recommendedEquipments,
    recommendedHomeCare: plan.recommendedHomeCare
  };
}

function openingFor(scenario: MarieScenario) {
  const openings: Record<string, string[]> = {
    HIGH_RISK: ["Antes de sugerir o protocolo, encontrei alguns pontos de atenção.", "Neste caso, eu priorizaria segurança e preparo antes de qualquer conduta mais intensa."],
    INSUFFICIENT_DATA: ["Ainda não há dados suficientes para uma recomendação completa.", "Pelo que está registrado até aqui, consigo organizar uma direção inicial, mas faltam informações importantes."],
    CAUTION: ["Há dados suficientes para uma sugestão inicial, mas eu validaria alguns pontos antes.", "Com base na anamnese e na avaliação, o caso pede uma abordagem mais cautelosa."],
    LOW_RISK: ["O caso parece caminhar para uma sugestão estruturada.", "Com base na anamnese e na avaliação, há uma direção inicial coerente.", "Para esta etapa, eu priorizaria uma conduta progressiva e acompanhada."]
  };
  const options = openings[scenario.safetyProfile] ?? openings.LOW_RISK;
  const index = Math.abs([...`${scenario.subtype}-${scenario.commandGoal}-${scenario.step}`].reduce((total, char) => total + char.charCodeAt(0), 0)) % options.length;
  return options[index];
}

export function buildDynamicMarieMessage(scenario: MarieScenario, context: MarieContextPayload) {
  const summary = buildMarieContextSummary(context);
  const detected = `Detectei um cenário provável de ${scenario.subtype.replaceAll("_", " ")} na área ${scenario.area.toLowerCase()}, com confiança de ${Math.round(scenario.confidence * 100)}%.`;
  const gaps = scenario.missingFields.length ? `Antes de validar, faltam: ${sentenceList(scenario.missingFields)}.` : "Os dados essenciais permitem avançar para uma proposta revisável.";
  const risk = scenario.detectedRisks.length ? `Atenção a: ${sentenceList(scenario.detectedRisks)}.` : "Não identifiquei risco importante nos dados informados.";
  const contradiction = scenario.contradictions.length ? `Também encontrei esta incoerência: ${sentenceList(scenario.contradictions)}.` : "";
  const history = summary.hasPreviousHistory
    ? `Há histórico registrado (${summary.protocolCount} protocolo(s) e ${summary.evolutionCount} evolução(ões)); esta proposta pode ser tratada como ajuste e comparada à resposta anterior.`
    : "Não há histórico clínico suficiente para comparação; recomendo acompanhar a primeira resposta.";
  const practical = scenario.commandGoal === "ASK_QUESTIONS"
    ? `Eu começaria por: ${sentenceList(scenario.suggestedQuestions.slice(0, 3))}`
    : scenario.commandGoal === "GENERATE_EVOLUTION" && !summary.hasEvolutionForAppointment
      ? "Sugiro registrar tolerância, resposta observada, intercorrências, adesão ao home care e próximos passos."
      : scenario.shouldSuggestProtocol
        ? `A linha prática prioriza ${sentenceList(scenario.recommendedProcedures.slice(0, 3))}.`
        : `Para esta etapa, sugiro revisar ${sentenceList(scenario.suggestedQuestions.slice(0, 2))}.`;

  return `${openingFor(scenario)} ${detected} ${risk} ${gaps} ${contradiction} ${history} ${practical} O profissional pode validar, ajustar ou rejeitar. ${principle}`;
}

function protocolAction(scenario: MarieScenario) {
  return action("CREATE_PROTOCOL_SUGGESTION", "Preencher plano de cuidado", "Criar rascunho contextualizado para edição e validação profissional.", buildDynamicProtocolPayload(scenario));
}

function questionsAction(scenario: MarieScenario) {
  return action("CREATE_CLINICAL_NOTE", "Registrar perguntas e lacunas", "Preparar perguntas complementares no formulário da etapa atual.", {
    content: `Perguntas sugeridas:\n${scenario.suggestedQuestions.map((item) => `- ${item}`).join("\n")}\n\nLacunas detectadas: ${scenario.missingFields.join("; ") || "nenhuma essencial"}.`,
    notes: scenario.suggestedQuestions.join("\n"),
    professionalAnalysis: scenario.explanation
  });
}

function warningAction(scenario: MarieScenario) {
  return action("REVIEW_CONTRAINDICATIONS", "Revisar contraindicações antes do plano", "Organizar riscos, incoerências e procedimentos a evitar.", {
    review: `${scenario.explanation}\n\nProcedimentos a evitar/revisar: ${scenario.avoidedProcedures.join("; ") || "confirmar conforme avaliação profissional"}.`,
    risks: scenario.detectedRisks,
    cautions: scenario.contradictions,
    perceivedRisks: [...scenario.detectedRisks, ...scenario.contradictions].join("; "),
    technicalNotes: scenario.explanation
  });
}

function homeCareAction(scenario: MarieScenario) {
  return action("GENERATE_POST_CARE_GUIDANCE", "Gerar home care contextualizado", "Preparar orientações coerentes com subtipo, risco e plano.", {
    guidance: `${scenario.recommendedHomeCare.join("; ")}. ${scenario.detectedRisks.length ? `Atenção adicional: ${scenario.detectedRisks.join("; ")}.` : ""} ${principle}`
  });
}

function executionAction(scenario: MarieScenario) {
  return action("UPDATE_APPOINTMENT_NOTES", "Sugerir registro da execução", "Preparar um rascunho sem inventar parâmetros técnicos.", {
    procedurePerformed: `Registrar os procedimentos realmente executados entre: ${scenario.recommendedProcedures.join("; ")}.`,
    productsUsed: "Registrar produtos e ativos efetivamente utilizados.",
    equipmentParameters: "Registrar parâmetros conforme equipamento, orientação do fabricante e protocolo interno. A Marie não define valores técnicos exatos.",
    duration: "Registrar duração real da sessão.",
    professionalNotes: `${scenario.explanation} Confirmar tolerância e resposta observada.`,
    incidents: "Registrar intercorrências somente se observadas ou relatadas.",
    postCareGiven: scenario.recommendedHomeCare.join("; ")
  });
}

function evolutionAction(scenario: MarieScenario, context: MarieContextPayload) {
  const latest = context.evolutions?.[0];
  return action("CREATE_EVOLUTION", "Preparar evolução clínica", "Criar rascunho comparável ao histórico antes de salvar.", {
    summary: `Evolução assistida para ${scenario.subtype.replaceAll("_", " ")}. Registrar procedimentos realizados e resposta observada.`,
    patientResponse: latest?.patientResponse ?? "Confirmar tolerância, sensibilidade, percepção do paciente e adesão às orientações.",
    professionalNotes: `${scenario.explanation} ${scenario.contradictions.length ? `Pendências: ${scenario.contradictions.join("; ")}.` : ""}`,
    adjustmentsMade: scenario.safetyProfile === "LOW_RISK" ? "Registrar ajustes conforme resposta clínica." : "Manter abordagem conservadora e registrar qualquer redução de intensidade ou mudança de conduta.",
    nextSteps: `Comparar resposta na próxima sessão, revisar home care e validar continuidade do plano. ${principle}`
  });
}

function summaryAction(scenario: MarieScenario, context: MarieContextPayload) {
  return action("SUMMARIZE_PATIENT_HISTORY", "Preparar resumo contextual", "Organizar histórico, achados e pendências para revisão.", {
    summary: `${context.patient.name}: ${scenario.explanation} Procedimentos recomendados: ${scenario.recommendedProcedures.join("; ")}. Pendências: ${scenario.missingFields.join("; ") || "nenhuma essencial"}.`
  });
}

export function buildDynamicMarieActions(scenario: MarieScenario, context: MarieContextPayload): MarieAction[] {
  const actions: MarieAction[] = [];

  if (scenario.careMaturity === "NO_APPOINTMENT") {
    actions.push(action("START_APPOINTMENT", "Iniciar atendimento", "Abrir o atendimento pela Anamnese inicial.", { status: "IN_PROGRESS", currentStep: "ANAMNESIS" }));
  }
  if (scenario.shouldSuggestQuestions || scenario.commandGoal === "ASK_QUESTIONS") actions.push(questionsAction(scenario));
  if (scenario.shouldWarnProfessional || scenario.commandGoal === "WARN") actions.push(warningAction(scenario));
  if (scenario.shouldSuggestProtocol) actions.push(protocolAction(scenario));
  if (scenario.commandGoal === "GENERATE_HOME_CARE" || ["EXECUTION", "EVOLUTION"].includes(scenario.step)) actions.push(homeCareAction(scenario));
  if (scenario.commandGoal === "REGISTER_EXECUTION" || scenario.step === "EXECUTION") actions.push(executionAction(scenario));
  if (scenario.commandGoal === "GENERATE_EVOLUTION" || scenario.step === "EVOLUTION") actions.push(evolutionAction(scenario, context));
  if (scenario.commandGoal === "SUMMARIZE" || scenario.step === "COMPLETION") actions.push(summaryAction(scenario, context));
  if (scenario.commandGoal === "FINISH") {
    actions.push(summaryAction(scenario, context));
    actions.push(action("FINISH_APPOINTMENT", "Finalizar atendimento", "Finalizar somente após revisão explícita das pendências.", { status: "FINISHED", currentStep: "COMPLETION", pendingReview: scenario.contradictions }));
  }
  if (actions.length === 0) actions.push(summaryAction(scenario, context));
  const seen = new Set<string>();
  return actions.filter((item) => {
    if (seen.has(item.type)) return false;
    seen.add(item.type);
    return true;
  });
}

export function buildMarieResponseFromScenario(scenario: MarieScenario, context: MarieContextPayload): MarieResponse {
  return {
    message: buildDynamicMarieMessage(scenario, context),
    warnings: unique([...scenario.detectedRisks, ...scenario.contradictions, principle]),
    actions: buildDynamicMarieActions(scenario, context)
  };
}
