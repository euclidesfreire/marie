import { collectContextText, normalizeMarieText, type MarieContextLike } from "@/lib/ai/marie-context-analyzer";
import type { MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import { marieTreatmentKnowledge } from "@/lib/ai/marie-knowledge-base";

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeMarieText(term)));
}

export function detectMarieIntent(context: MarieContextLike): MarieProtocolKey {
  const text = collectContextText(context);
  const command = normalizeMarieText(context.professionalCommand);
  const prioritizedText = `${command} ${text}`;

  for (const protocol of Object.values(marieTreatmentKnowledge)) {
    if (includesAny(prioritizedText, protocol.complaintKeywords)) return protocol.key;
  }

  if (includesAny(prioritizedText, ["facial", "pele", "rosto"])) return "facial_rejuvenescimento";
  if (includesAny(prioritizedText, ["corporal", "corpo", "medidas"])) return "corporal_gordura";

  const area = context.assessment?.assessedArea;
  if (area === "BODY") return "corporal_gordura";
  if (area === "BOTH") return "facial_rejuvenescimento";
  return "facial_rejuvenescimento";
}
