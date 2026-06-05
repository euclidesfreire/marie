import { buildMarieContextSummary, getMarieArea, normalizeMarieText, type MarieContextLike } from "@/lib/ai/marie-context-analyzer";
import type { MarieProtocolKey, MarieTreatmentProtocol } from "@/lib/ai/marie-knowledge-base";
import { marieTreatmentKnowledge } from "@/lib/ai/marie-knowledge-base";
import type { MarieContextSummary } from "@/lib/ai/marie-scenario-types";

function matchCount(text: string, terms: string[]) {
  return terms.reduce((score, term) => score + (text.includes(normalizeMarieText(term)) ? 1 : 0), 0);
}

export function scoreProtocol(protocol: MarieTreatmentProtocol, summary: MarieContextSummary) {
  const explicitArea = summary.explicitArea;
  if (explicitArea && explicitArea !== "BOTH" && protocol.area !== explicitArea) return -100;

  let score = 0;
  score += matchCount(summary.structuredDecisionText, protocol.complaintKeywords) * 10;
  score += matchCount(summary.commandText, protocol.complaintKeywords) * 5;
  score += matchCount(summary.assessmentText, protocol.complaintKeywords) * 4;
  score += matchCount(summary.complaintText, protocol.complaintKeywords) * 2;
  score += matchCount(summary.freeTextComplaint, protocol.complaintKeywords) * 2;
  score += matchCount(summary.appointmentText, protocol.complaintKeywords) * 2;
  score += matchCount(summary.historyText, protocol.complaintKeywords);

  if (explicitArea && protocol.area === explicitArea) score += 6;
  if (!explicitArea && protocol.area === summary.area) score += 2;
  return score;
}

export function detectMarieIntent(context: MarieContextLike): MarieProtocolKey {
  const summary = buildMarieContextSummary(context);
  const area = getMarieArea(context);
  const explicitArea = summary.explicitArea;
  if (summary.selectedTreatmentConcern && summary.primaryTreatmentConcernCompatible) {
    return summary.selectedTreatmentConcern;
  }
  const allowedProtocols = Object.values(marieTreatmentKnowledge).filter((protocol) => {
    if (!explicitArea || explicitArea === "BOTH") return true;
    return protocol.area === explicitArea;
  });

  const ranked = allowedProtocols
    .map((protocol) => ({ protocol, score: scoreProtocol(protocol, summary) }))
    .sort((left, right) => right.score - left.score);

  if (ranked[0]?.score > 0) return ranked[0].protocol.key;

  if (explicitArea === "BODY" || (!explicitArea && area === "BODY")) return "corporal_gordura";
  if (explicitArea === "FACIAL" || (!explicitArea && area === "FACIAL")) return "facial_rejuvenescimento";

  const command = summary.commandText;
  const bodyScore = matchCount(command, ["corporal", "corpo", "medidas", "gordura", "celulite", "estrias"]);
  const facialScore = matchCount(command, ["facial", "pele", "rosto", "acne", "melasma"]);
  return bodyScore > facialScore ? "corporal_gordura" : "facial_rejuvenescimento";
}
