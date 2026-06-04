import { getProtocolByKey, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import {
  procedureMatchesContext,
  proceduresForCategory,
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

function subtypePlan(subtype: MarieCaseSubtype) {
  const plans: Partial<Record<MarieCaseSubtype, Pick<MarieProcedurePlan, "recommendedProcedures" | "optionalProcedures" | "avoidedProcedures">>> = {
    comedonal_acne: {
      recommendedProcedures: ["Higienização inicial", "Limpeza de pele com extração, se indicada", "Peeling ultrassônico", "Alta Frequência", "Fotobiomodulação", "Finalização com hidratação leve e fotoproteção"],
      optionalProcedures: ["Peeling químico adequado, se houver tolerância", "Microcorrentes", "Terapia de contraste"],
      avoidedProcedures: ["Procedimentos agressivos enquanto sensibilidade e uso de ativos não estiverem confirmados"]
    },
    inflammatory_acne: {
      recommendedProcedures: ["Avaliar atividade inflamatória e integridade da pele", "Higienização suave", "Fotobiomodulação", "Alta Frequência somente se indicada", "Finalização calmante e fotoproteção"],
      optionalProcedures: ["Microcorrentes para apoio ao controle inflamatório", "Peeling químico somente após validação de tolerância"],
      avoidedProcedures: ["Extração intensa em lesões inflamadas", "Procedimentos abrasivos sobre lesões ativas"]
    },
    oily_skin: {
      recommendedProcedures: ["Higienização equilibrada", "Desincrust, se indicado", "Peeling ultrassônico", "Hidratação leve", "Fotoproteção"],
      optionalProcedures: ["Ionização", "Alta Frequência", "Fotobiomodulação"],
      avoidedProcedures: ["Ressecamento excessivo e procedimentos irritativos sem necessidade"]
    },
    sensitive_acne: {
      recommendedProcedures: ["Avaliação profissional conservadora", "Orientação de barreira cutânea", "Higienização suave", "Fotobiomodulação calmante, se compatível", "Fotoproteção"],
      optionalProcedures: ["Somente recursos suaves após validação profissional"],
      avoidedProcedures: ["Peeling químico", "Peeling de diamante", "Extração agressiva", "Jato de plasma", "Eletrocautério"]
    },
    melasma: {
      recommendedProcedures: ["Revisar fotoproteção e exposição solar", "Avaliar fototipo e padrão da hipercromia", "Fototerapia conservadora", "Ativos clareadores compatíveis", "Acompanhamento evolutivo"],
      optionalProcedures: ["Peeling químico clareador após validação", "Eletroporação com ativos adequados"],
      avoidedProcedures: ["Procedimentos agressivos com exposição solar intensa ou fotoproteção irregular"]
    },
    dehydrated_aging_skin: {
      recommendedProcedures: ["Higienização suave", "Revitalização e hidratação", "Eletroporação", "LED Terapia", "Fotoproteção"],
      optionalProcedures: ["Microcorrentes", "Tecarterapia", "Radiofrequência após avaliação"],
      avoidedProcedures: ["Peelings intensos antes de recuperar hidratação e barreira cutânea"]
    },
    localized_abdominal_fat: {
      recommendedProcedures: ["Avaliação da região e registro de medidas", "Endermoterapia ou massagem modeladora", "Ultrassom cavitacional, se indicado", "Radiofrequência ou criofrequência conforme objetivo", "Orientação de hidratação e acompanhamento"],
      optionalProcedures: ["Ondas de choque", "Eletrolipólise", "Criolipólise após avaliação específica"],
      avoidedProcedures: ["Promessa de redução de medidas", "Equipamentos sem validação de contraindicações"]
    },
    localized_fat_with_laxity: {
      recommendedProcedures: ["Registro de medidas e grau de flacidez", "Endermoterapia", "Radiofrequência ou criofrequência conforme segurança", "Massagem modeladora", "Acompanhamento evolutivo"],
      optionalProcedures: ["Ultrassom cavitacional", "Ondas de choque", "Correntes excitomotoras"],
      avoidedProcedures: ["Combinações intensivas sem testar tolerância e contraindicações"]
    },
    cellulite_edematous: {
      recommendedProcedures: ["Avaliar retenção hídrica e hábitos", "Drenagem linfática", "Endermoterapia conforme tolerância", "Orientação de hidratação", "Registro evolutivo"],
      optionalProcedures: ["Ondas de choque", "Tecarterapia", "Criofrequência conforme avaliação"],
      avoidedProcedures: ["Abordagem agressiva em área dolorosa, inflamada ou com contraindicação vascular"]
    },
    cellulite_fibrotic: {
      recommendedProcedures: ["Registrar grau e áreas fibróticas", "Endermoterapia conforme tolerância", "Ondas de choque", "Tecarterapia", "Acompanhamento da resposta"],
      optionalProcedures: ["Criofrequência", "Ultrassom cavitacional", "Sonoforese"],
      avoidedProcedures: ["Pressão excessiva ou equipamentos sem avaliação vascular"]
    },
    relaxation_and_fluid_retention: {
      recommendedProcedures: ["Avaliar edema e contraindicações circulatórias", "Drenagem linfática", "Massagem relaxante", "Orientação de hidratação", "Registro da resposta"],
      optionalProcedures: ["Detox corporal", "Spa dos pés", "Massagem com pedras quentes se compatível"],
      avoidedProcedures: ["Calor, pressão intensa ou correntes quando houver contraindicação"]
    }
  };
  return plans[subtype];
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
  const contextText = contextForProcedureSelection(scenario);
  const catalog = proceduresForCategory(scenario.intent, scenario.area)
    .sort((left, right) => procedurePriority(right, scenario) - procedurePriority(left, scenario));
  const recommended: MarieProcedure[] = [];
  const optional: MarieProcedure[] = [];
  const avoided: string[] = [];

  for (const item of catalog) {
    const match = procedureMatchesContext(item, contextText, scenario.detectedRisks);
    if (match.avoidReasons.length) {
      avoided.push(`${item.name} — evitar/revisar devido a ${match.avoidReasons.join(", ")}`);
      continue;
    }
    if (
      match.cautionReasons.length ||
      (scenario.safetyProfile === "CAUTION" && item.intensity === "high") ||
      (scenario.safetyProfile === "HIGH_RISK" && item.intensity !== "low")
    ) {
      const reason = match.cautionReasons.length ? ` — requer cautela por ${match.cautionReasons.join(", ")}` : " — somente após validação profissional específica";
      optional.push({ ...item, name: `${item.name}${reason}` });
      continue;
    }
    recommended.push(item);
  }

  const equipmentRoles = new Set(["equipment", "electrotherapy", "laser_light", "thermal"]);
  return {
    recommended: recommended.slice(0, 6),
    optional: [...recommended.slice(6), ...optional],
    avoided,
    equipments: unique([...recommended, ...optional].filter((item) => equipmentRoles.has(item.role)).map((item) => item.name.split(" — ")[0]))
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
  const subtype = subtypePlan(scenario.subtype);
  const catalog = catalogPlan(scenario);
  const recommendedProcedures = unique([
    ...(scenario.safetyProfile === "HIGH_RISK"
      ? ["Revisar contraindicações e validar presencialmente antes de definir recursos"]
      : []),
    ...catalog.recommended.map((item) => item.name)
  ]);
  const optionalProcedures = unique([
    ...catalog.optional.map((item) => item.name),
    ...(catalog.recommended.length === 0 ? (subtype?.optionalProcedures ?? []) : [])
  ]);
  const avoidedProcedures = unique([
    ...catalog.avoided,
    ...safetyWideAvoidances(scenario),
    ...(scenario.safetyProfile === "HIGH_RISK" && catalog.avoided.length === 0
      ? (subtype?.avoidedProcedures ?? ["Procedimentos intensivos até revisão profissional dos riscos"])
      : []),
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
    suggestedEquipments: base.equipments.join("; "),
    contraindications: [...base.contraindications, ...risks.detectedRisks].join("; "),
    warnings: `${validationNotice} ${risks.cautions.join("; ")}`,
    status: "WAITING_REVIEW"
  };
}
