import { getProtocolByKey, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import {
  findCatalogProcedure,
  procedureMatchesContext,
  type MarieProcedure
} from "@/lib/ai/marie-procedure-catalog";
import type { MarieRiskAnalysis } from "@/lib/ai/marie-risk-engine";
import type { MarieCaseSubtype, MarieProcedurePlan, MarieScenario } from "@/lib/ai/marie-scenario-types";

const validationNotice = "Sugestão simulada para apoio ao profissional. A decisão final deve ser validada pelo profissional responsável.";

const subtypeLabels: Record<MarieCaseSubtype, string> = {
  comedonal_acne: "acne comedoniana e oleosidade",
  inflammatory_acne: "acne inflamatória",
  oily_skin: "oleosidade sem lesões relevantes",
  sensitive_acne: "acne com pele sensibilizada",
  melasma: "melasma e controle de hipercromia",
  post_inflammatory_hyperpigmentation: "hiperpigmentação pós-inflamatória",
  solar_spots: "manchas solares",
  dehydrated_aging_skin: "rejuvenescimento de pele desidratada",
  sensitive_aging_skin: "rejuvenescimento de pele sensível",
  facial_laxity: "flacidez facial e contorno",
  under_eye_dark_circles: "olheiras",
  localized_abdominal_fat: "gordura localizada abdominal",
  localized_fat_with_laxity: "gordura localizada associada à flacidez",
  cellulite_edematous: "celulite com retenção hídrica",
  cellulite_fibrotic: "celulite com sinais fibróticos",
  recent_stretch_marks: "estrias recentes",
  old_stretch_marks: "estrias antigas",
  body_laxity: "flacidez corporal",
  intimate_area_darkening: "escurecimento corporal em área sensível",
  relaxation_and_fluid_retention: "relaxamento e retenção hídrica",
  general_case: "plano de cuidado inicial"
};

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function officialEquipmentsForIntent(intent: MarieProtocolKey) {
  const equipmentRoles = new Set(["equipment", "electrotherapy", "laser_light", "thermal"]);
  return getProtocolByKey(intent).techniques.filter((officialName) => {
    const item = findCatalogProcedure(intent, officialName);
    return item && equipmentRoles.has(item.role);
  });
}

function contextForProcedureSelection(scenario: MarieScenario) {
  return [
    ...scenario.detectedSignals,
    ...scenario.detectedRisks,
    ...scenario.contradictions,
    scenario.subtype.replaceAll("_", " ")
  ].join(" ");
}

function procedurePriority(item: MarieProcedure, scenario: MarieScenario) {
  let score = item.intensity === "low" ? 3 : item.intensity === "moderate" ? 2 : 1;
  if (item.indications.some((term) => contextForProcedureSelection(scenario).toLowerCase().includes(term.toLowerCase()))) score += 3;
  if (scenario.safetyProfile === "CAUTION" && item.intensity === "high") score -= 3;
  if (scenario.safetyProfile === "HIGH_RISK" && item.role !== "manual" && item.role !== "massage" && item.role !== "homecare") score -= 4;
  return score;
}

function catalogPlan(scenario: MarieScenario) {
  type CatalogEntry = { officialName: string; item: MarieProcedure; reason?: string };
  const contextText = contextForProcedureSelection(scenario);
  const base = getProtocolByKey(scenario.intent);
  const catalog = base.techniques
    .map((officialName) => ({ officialName, item: findCatalogProcedure(scenario.intent, officialName) }))
    .filter((entry): entry is { officialName: string; item: MarieProcedure } => Boolean(entry.item))
    .sort((left, right) => procedurePriority(right.item, scenario) - procedurePriority(left.item, scenario));
  const recommended: CatalogEntry[] = [];
  const optional: CatalogEntry[] = [];
  const avoided: string[] = [];

  for (const entry of catalog) {
    const { item, officialName } = entry;
    const match = procedureMatchesContext(item, contextText, scenario.detectedRisks);
    if (match.avoidReasons.length) {
      avoided.push(`${officialName} — evitar/revisar devido a ${match.avoidReasons.join(", ")}`);
      continue;
    }
    if (
      match.cautionReasons.length ||
      (scenario.safetyProfile === "CAUTION" && item.intensity === "high") ||
      (scenario.safetyProfile === "HIGH_RISK" && item.intensity !== "low")
    ) {
      const reason = match.cautionReasons.length ? ` — requer cautela por ${match.cautionReasons.join(", ")}` : " — somente após validação profissional específica";
      optional.push({ ...entry, reason });
      continue;
    }
    recommended.push(entry);
  }

  const equipmentRoles = new Set(["equipment", "electrotherapy", "laser_light", "thermal"]);
  return {
    recommended: recommended.slice(0, 6),
    optional: [...recommended.slice(6), ...optional],
    avoided,
    equipments: unique([...recommended, ...optional].filter((entry) => equipmentRoles.has(entry.item.role)).map((entry) => entry.officialName))
  };
}

function safetyWideAvoidances(scenario: MarieScenario) {
  const risks = scenario.detectedRisks.join(" ").toLowerCase();
  const avoided: string[] = [];
  if (risks.includes("roacutan") || risks.includes("isotretinoína")) {
    avoided.push(
      "Peelings agressivos — evitar/revisar devido ao uso de Roacutan/isotretinoína",
      "Extração intensa — evitar/revisar devido ao uso de Roacutan/isotretinoína",
      "Jato de plasma — evitar/revisar devido ao uso de Roacutan/isotretinoína",
      "Eletrocautério — evitar/revisar devido ao uso de Roacutan/isotretinoína"
    );
  }
  if (scenario.area !== "FACIAL" && (risks.includes("marca-passo") || risks.includes("alteração cardíaca"))) {
    avoided.push(
      "Correntes e eletroterapias — evitar/revisar devido à restrição cardíaca",
      "Radiofrequência e criofrequência — evitar/revisar devido à restrição cardíaca",
      "Ultrassom corporal — evitar/revisar devido à restrição cardíaca"
    );
  }
  return avoided;
}

export function buildProcedurePlan(scenario: MarieScenario): MarieProcedurePlan {
  const base = getProtocolByKey(scenario.intent);
  const catalog = catalogPlan(scenario);
  const recommendedProcedures = unique(catalog.recommended.map((entry) => entry.officialName));
  const optionalProcedures = unique(catalog.optional.map((entry) => `${entry.officialName}${entry.reason ?? ""}`));
  const avoidedProcedures = unique([
    ...catalog.avoided,
    ...safetyWideAvoidances(scenario),
    ...(scenario.safetyProfile === "CAUTION" ? ["Procedimentos intensivos antes de revisar os fatores de cautela"] : [])
  ]);
  const alternatives = scenario.safetyProfile === "HIGH_RISK"
    ? ["Linha de preparação e orientação antes do protocolo", "Linha conservadora somente após validação profissional"]
    : ["Linha conservadora focada em preparo e tolerância", "Linha padrão com procedimentos recomendados", ...(scenario.safetyProfile === "LOW_RISK" ? ["Linha progressiva/intensiva somente após boa resposta e validação profissional"] : [])];

  return {
    title: scenario.safetyProfile === "HIGH_RISK"
      ? `Sugestão conservadora para ${subtypeLabels[scenario.subtype]}`
      : scenario.safetyProfile === "INSUFFICIENT_DATA"
        ? `Sugestão preliminar para ${subtypeLabels[scenario.subtype]}`
        : scenario.safetyProfile === "CAUTION"
          ? `Plano cauteloso para ${subtypeLabels[scenario.subtype]}`
          : `Protocolo para ${subtypeLabels[scenario.subtype]}`,
    objective: base.objective,
    recommendedProcedures,
    optionalProcedures,
    avoidedProcedures,
    recommendedEquipments: catalog.equipments,
    recommendedHomeCare: unique(base.homeCare),
    alternatives,
    justification: scenario.explanation
  };
}

export function buildPostCareGuidance(intent: MarieProtocolKey, risks: MarieRiskAnalysis) {
  const protocol = getProtocolByKey(intent);
  const cautions = risks.cautions.length ? `\n\nPontos de cautela: ${risks.cautions.join("; ")}.` : "";
  return `${protocol.homeCare.join("; ")}.${cautions}\n\n${validationNotice}`;
}

export function buildDynamicProtocolPayload(scenario: MarieScenario) {
  const base = getProtocolByKey(scenario.intent);
  const plan = buildProcedurePlan(scenario);
  const missing = scenario.missingFields.length ? `\n\nDados a confirmar: ${scenario.missingFields.join("; ")}.` : "";
  const contradictions = scenario.contradictions.length ? `\n\nIncoerências/pontos de atenção: ${scenario.contradictions.join("; ")}.` : "";

  const sequence = scenario.area === "BOTH"
    ? [
        "Facial:",
        ...(scenario.intent.startsWith("facial_") ? plan.recommendedProcedures.map((item, index) => `${index + 1}. ${item}`) : ["- Confirmar queixa e avaliação facial antes de sugerir procedimentos."]),
        "\nCorporal:",
        ...(scenario.intent.startsWith("corporal_") ? plan.recommendedProcedures.map((item, index) => `${index + 1}. ${item}`) : ["- Confirmar queixa e avaliação corporal antes de sugerir procedimentos."])
      ].join("\n")
    : numbered(plan.recommendedProcedures);

  return {
    title: plan.title,
    objective: plan.objective,
    area: scenario.area,
    suggestedActives: base.actives,
    suggestedTechniques: [
      "Sequência sugerida:",
      sequence,
      plan.optionalProcedures.length ? `\nProcedimentos opcionais:\n${plan.optionalProcedures.map((item) => `- ${item}`).join("\n")}` : "",
      plan.avoidedProcedures.length ? `\nProcedimentos a evitar neste cenário:\n${plan.avoidedProcedures.map((item) => `- ${item}`).join("\n")}` : "",
      `\nAlternativas possíveis:\n${plan.alternatives.map((item) => `- ${item}`).join("\n")}`
    ].filter(Boolean).join("\n"),
    suggestedEquipments: `Considerar: ${plan.recommendedEquipments.join("; ")}. Parâmetros devem seguir equipamento, protocolo interno e validação profissional.`,
    contraindications: `${scenario.detectedRisks.length ? scenario.detectedRisks.join("; ") : base.contraindications.join("; ")}.${missing}`,
    warnings: `${validationNotice} ${plan.justification}${contradictions}`,
    status: "WAITING_REVIEW"
  };
}

// Compatibilidade com chamadas existentes durante a transição do motor.
export function buildProtocolSuggestionPayload(intent: MarieProtocolKey, risks: MarieRiskAnalysis) {
  const base = getProtocolByKey(intent);
  return {
    title: base.title,
    objective: base.objective,
    area: base.area,
    suggestedActives: base.actives,
    suggestedTechniques: numbered(base.techniques),
    suggestedEquipments: officialEquipmentsForIntent(intent).join("; "),
    contraindications: [...base.contraindications, ...risks.detectedRisks].join("; "),
    warnings: `${validationNotice} ${risks.cautions.join("; ")}`,
    status: "WAITING_REVIEW"
  };
}
