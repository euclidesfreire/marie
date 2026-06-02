import { getProtocolByKey, type MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import type { MarieRiskAnalysis } from "@/lib/ai/marie-risk-engine";

const validationNotice = "Sugestão simulada para apoio ao profissional. A decisão final deve ser validada pelo profissional responsável.";

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function conservativeTechniques(intent: MarieProtocolKey, base: string[]) {
  if (intent === "facial_acne") {
    return [
      "Revisar medicações, uso de ácidos, Roacutan/isotretinoína e sensibilidade antes de qualquer procedimento",
      "Higienização suave e avaliação da barreira cutânea",
      "Fotobiomodulação ou recurso calmante, se compatível com a avaliação",
      "Evitar extrações intensas, peelings e procedimentos abrasivos até validação profissional"
    ];
  }

  if (intent === "facial_clareamento" || intent === "corporal_clareamento") {
    return [
      "Reforçar fotoproteção e investigar exposição solar antes de iniciar clareamento",
      "Avaliar fototipo, sensibilidade e risco de hiperpigmentação",
      "Considerar fototerapia ou abordagem conservadora conforme tolerância",
      "Evitar peelings agressivos enquanto houver fotoproteção irregular ou sensibilidade"
    ];
  }

  if (["corporal_gordura", "corporal_celulite", "corporal_flacidez"].includes(intent)) {
    return [
      "Revisar contraindicações para eletroterapia, ultrassom e recursos térmicos",
      "Registrar medidas, área, sensibilidade e hábitos",
      "Priorizar condutas manuais e orientações enquanto contraindicações estiverem pendentes",
      "Não aplicar correntes, radiofrequência, criofrequência ou ultrassom sem validação profissional"
    ];
  }

  return base;
}

export function buildPostCareGuidance(intent: MarieProtocolKey, risks: MarieRiskAnalysis) {
  const protocol = getProtocolByKey(intent);
  const cautions = risks.cautions.length ? `\n\nPontos de cautela: ${risks.cautions.join("; ")}.` : "";
  return `${protocol.homeCare.join("; ")}.${cautions}\n\n${validationNotice}`;
}

export function buildProtocolSuggestionPayload(intent: MarieProtocolKey, risks: MarieRiskAnalysis) {
  const protocol = getProtocolByKey(intent);
  const shouldConserve = risks.riskLevel !== "LOW";
  const techniques = shouldConserve ? conservativeTechniques(intent, protocol.techniques) : protocol.techniques;
  const riskText = risks.detectedRisks.length ? `\n\nRiscos detectados: ${risks.detectedRisks.join("; ")}.` : "";
  const cautionText = risks.cautions.length ? `\n\nCautelas: ${risks.cautions.join("; ")}.` : "";

  return {
    title: protocol.title,
    objective: protocol.objective,
    area: protocol.area,
    suggestedActives: protocol.actives,
    suggestedTechniques: `${numbered(techniques)}\n\nCuidados pós/home care: ${protocol.homeCare.join("; ")}.`,
    suggestedEquipments: protocol.equipments.join("; "),
    contraindications: `${protocol.contraindications.join("; ")}.${riskText}`,
    warnings: `${validationNotice} ${protocol.warnings.join(" ")}${cautionText}`,
    status: "WAITING_REVIEW"
  };
}
