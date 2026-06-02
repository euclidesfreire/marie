import { collectContextText, normalizeMarieText, type MarieContextLike } from "@/lib/ai/marie-context-analyzer";
import type { MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";

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

  if (has(text, ["gestacao", "gestação", "gravida", "grávida"])) {
    detectedRisks.push("gestação informada ou suspeita");
    cautions.push("validar segurança antes de eletroterapias, recursos térmicos, peelings e procedimentos mais intensos");
    score += 3;
  }

  if (has(text, ["marca-passo", "marcapasso", "marca passo"])) {
    detectedRisks.push("marca-passo");
    cautions.push("evitar recomendar correntes, radiofrequência, criofrequência ou recursos eletroterápicos sem validação profissional");
    score += isBodyElectroThermalIntent(intent) ? 4 : 3;
  }

  if (has(text, ["cardiaca", "cardíaca", "cardiaco", "cardíaco", "arritmia", "hipertensao", "hipertensão"])) {
    detectedRisks.push("alteração cardíaca/pressórica mencionada");
    cautions.push("validar contraindicações para eletroterapia, recursos térmicos e procedimentos corporais antes da conduta");
    score += isBodyElectroThermalIntent(intent) ? 3 : 2;
  }

  if (has(text, ["roacutan", "isotretinoina", "isotretinoína"])) {
    detectedRisks.push("uso de Roacutan/isotretinoína");
    cautions.push("evitar peelings, extrações intensas e procedimentos abrasivos sem avaliação profissional criteriosa");
    score += isAbrasiveFacialIntent(intent) ? 4 : 3;
  }

  if (has(text, ["acido", "ácido", "retinol", "tretinoina", "tretinoína"])) {
    detectedRisks.push("uso de ácidos/ativos sensibilizantes");
    cautions.push("avaliar barreira cutânea antes de peelings, extrações ou recursos abrasivos");
    score += 2;
  }

  if (has(text, ["alergia", "alergias", "alergica", "alérgica"])) {
    detectedRisks.push("alergia relatada");
    cautions.push("confirmar produto, ativo ou substância relacionada à alergia antes do procedimento");
    score += 2;
  }

  if (has(text, ["sensibilidade", "sensivel", "sensível", "ardor", "vermelhidão", "vermelhidao"])) {
    detectedRisks.push("sensibilidade cutânea");
    cautions.push("priorizar abordagem conservadora e observar resposta nas 24-48h seguintes");
    score += 2;
  }

  if (has(text, ["sol", "solar", "exposicao solar", "exposição solar", "sem filtro", "nao usa filtro", "não usa filtro", "fotoprotecao irregular", "fotoproteção irregular"])) {
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
