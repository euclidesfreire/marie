import { collectContextText, normalizeMarieText, type MarieContextLike } from "@/lib/ai/marie-context-analyzer";
import type { MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import type { MarieCommandGoal, MarieContextSummary, MarieSafetyProfile } from "@/lib/ai/marie-scenario-types";

export type MarieRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type MarieRiskAnalysis = {
  riskLevel: MarieRiskLevel;
  detectedRisks: string[];
  cautions: string[];
  shouldWarnProfessional: boolean;
};

function has(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeMarieText(term)));
}

function hasPositive(text: string, terms: string[], negations: string[] = []) {
  return has(text, terms) && !has(text, negations);
}

function isBodyElectroThermalIntent(intent: MarieProtocolKey) {
  return ["corporal_gordura", "corporal_celulite", "corporal_flacidez"].includes(intent);
}

function isAbrasiveFacialIntent(intent: MarieProtocolKey) {
  return ["facial_acne", "facial_clareamento", "facial_rejuvenescimento", "facial_sinais_cicatrizes", "corporal_estrias", "corporal_clareamento"].includes(intent);
}

export function detectMarieRisks(context: MarieContextLike, intent: MarieProtocolKey): MarieRiskAnalysis {
  const text = collectContextText(context);
  const detectedRisks: string[] = [];
  const cautions: string[] = [];
  let score = 0;

  if (hasPositive(text, ["gestacao", "gestação", "gravida", "grávida"], ["nao gestante", "não gestante", "nega gestacao", "nega gestação"])) {
    detectedRisks.push("gestação informada ou suspeita");
    cautions.push("validar segurança antes de eletroterapias, recursos térmicos, peelings e procedimentos mais intensos");
    score += 3;
  }

  if (hasPositive(text, ["marca-passo", "marcapasso", "marca passo"], ["sem marca-passo", "sem marcapasso", "nega marca-passo"])) {
    detectedRisks.push("marca-passo");
    cautions.push("evitar recomendar correntes, radiofrequência, criofrequência ou recursos eletroterápicos sem validação profissional");
    score += isBodyElectroThermalIntent(intent) ? 4 : 3;
  }

  if (hasPositive(text, ["cardiaca", "cardíaca", "cardiaco", "cardíaco", "arritmia", "hipertensao", "hipertensão"], ["sem alteracao cardiaca", "sem alteração cardíaca", "nega cardiopatia"])) {
    detectedRisks.push("alteração cardíaca/pressórica mencionada");
    cautions.push("validar contraindicações para eletroterapia, recursos térmicos e procedimentos corporais antes da conduta");
    score += isBodyElectroThermalIntent(intent) ? 3 : 2;
  }

  if (hasPositive(text, ["roacutan", "isotretinoina", "isotretinoína"], ["nao usa roacutan", "não usa roacutan", "sem isotretinoina", "sem isotretinoína"])) {
    detectedRisks.push("uso de Roacutan/isotretinoína");
    cautions.push("evitar peelings, extrações intensas e procedimentos abrasivos sem avaliação profissional criteriosa");
    score += isAbrasiveFacialIntent(intent) ? 4 : 3;
  }

  if (hasPositive(text, ["acido", "ácido", "retinol", "tretinoina", "tretinoína"], ["nao usa acido", "não usa ácido", "sem uso de acido", "sem uso de ácido"])) {
    detectedRisks.push("uso de ácidos/ativos sensibilizantes");
    cautions.push("avaliar barreira cutânea antes de peelings, extrações ou recursos abrasivos");
    score += 2;
  }

  if (hasPositive(text, ["alergia", "alergias", "alergica", "alérgica"], ["sem alergia", "sem alergias", "nega alergia", "nenhuma alergia"])) {
    detectedRisks.push("alergia relatada");
    cautions.push("confirmar produto, ativo ou substância relacionada à alergia antes do procedimento");
    score += 2;
  }

  if (hasPositive(text, ["sensibilidade", "sensivel", "sensível", "ardor", "vermelhidão", "vermelhidao"], ["sem sensibilidade", "nega sensibilidade"])) {
    detectedRisks.push("sensibilidade cutânea");
    cautions.push("priorizar abordagem conservadora e observar resposta nas 24-48h seguintes");
    score += 2;
  }

  if (hasPositive(text, ["sol", "solar", "exposicao solar", "exposição solar", "sem filtro", "nao usa filtro", "não usa filtro", "fotoprotecao irregular", "fotoproteção irregular"], ["sem exposicao solar", "sem exposição solar", "fotoprotecao regular", "fotoproteção regular"])) {
    detectedRisks.push("exposição solar/fotoproteção irregular");
    cautions.push("reforçar fotoproteção e cautela em protocolos clareadores ou abrasivos");
    score += intent === "facial_clareamento" || intent === "corporal_clareamento" ? 3 : 1;
  }

  if (has(text, ["fototipo alto", "fototipo iv", "fototipo v", "fototipo vi", "pele negra", "pele morena"])) {
    detectedRisks.push("fototipo alto ou risco de hiperpigmentação");
    cautions.push("evitar abordagem agressiva e acompanhar risco de hiperpigmentação pós-inflamatória");
    score += 2;
  }

  if (has(text, ["lesao", "lesão", "sinal", "nevo", "verruga", "ferida"])) {
    detectedRisks.push("lesão/sinal mencionado");
    cautions.push("não diagnosticar; lesões suspeitas devem ser avaliadas por profissional habilitado antes de procedimentos");
    score += intent === "facial_sinais_cicatrizes" ? 3 : 1;
  }

  if (has(text, ["pouca agua", "pouca água", "baixa ingestao", "baixa ingestão", "nao bebe agua", "não bebe água"])) {
    detectedRisks.push("baixa ingestão de água");
    cautions.push("orientar hidratação e acompanhar adesão ao plano, especialmente em queixas corporais");
    score += 1;
  }

  if (has(text, ["sedentario", "sedentária", "sedentaria", "sedentarismo"])) {
    detectedRisks.push("sedentarismo");
    cautions.push("registrar hábito e alinhar expectativas em protocolos corporais");
    score += 1;
  }

  if (has(text, ["tabagismo", "tabagista", "fuma"])) {
    detectedRisks.push("tabagismo");
    cautions.push("considerar impacto em resposta tecidual e evolução");
    score += 1;
  }

  const riskLevel: MarieRiskLevel = score >= 4 ? "HIGH" : score >= 2 ? "MEDIUM" : "LOW";

  return {
    riskLevel,
    detectedRisks: [...new Set(detectedRisks)],
    cautions: [...new Set(cautions)],
    shouldWarnProfessional: riskLevel !== "LOW"
  };
}

export function detectSafetyProfile(
  context: MarieContextLike,
  intent: MarieProtocolKey,
  summary: MarieContextSummary,
  missingFields: string[],
  commandGoal: MarieCommandGoal
): MarieSafetyProfile {
  const risk = detectMarieRisks(context, intent);
  const severeSignal = has(summary.allText, ["alergia grave", "anafilaxia", "ferida aberta", "lesao suspeita", "lesão suspeita", "sinal suspeito"]);
  const highRiskDetected = risk.detectedRisks.some((item) =>
    ["gestação", "marca-passo", "cardíaca", "Roacutan", "isotretinoína"].some((term) => item.includes(term))
  );
  if (highRiskDetected || severeSignal) return "HIGH_RISK";
  if (!summary.hasAnamnesis || !summary.chiefComplaint || (["SUGGEST_PROTOCOL", "ADJUST_PROTOCOL"].includes(commandGoal) && !summary.hasAssessment)) {
    return "INSUFFICIENT_DATA";
  }
  if (risk.riskLevel !== "LOW" || missingFields.includes("contraindicações")) return "CAUTION";
  return "LOW_RISK";
}
