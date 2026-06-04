import assert from "node:assert/strict";
import { analyzeMarieScenario } from "../lib/ai/marie-step-advisor";

type Area = "FACIAL" | "BODY";

function payload(area: Area, complaint: string, extra: Record<string, string> = {}, protocols: any[] = []) {
  return {
    patient: { id: "patient", name: "Paciente teste" },
    anamnesis: {
      id: "anamnesis",
      patientId: "patient",
      chiefComplaint: complaint,
      treatmentGoal: "Melhorar a condição avaliada",
      allergies: "Nega alergias",
      medications: extra.medications ?? "Nenhum",
      contraindications: extra.contraindications ?? "Nenhuma",
      skinSensitivity: extra.skinSensitivity ?? "Normal",
      habits: extra.habits ?? ""
    },
    appointment: {
      id: "appointment",
      patientId: "patient",
      currentStep: "CARE_PLAN",
      status: "IN_PROGRESS",
      dailyComplaint: complaint
    },
    assessment: {
      id: "assessment",
      appointmentId: "appointment",
      assessedArea: area,
      professionalAnalysis: complaint,
      skinCondition: extra.skinCondition ?? "",
      bodyCondition: extra.bodyCondition ?? "",
      perceivedRisks: extra.risks ?? "Nenhum"
    },
    protocols,
    suggestions: [],
    evolutions: [],
    professionalCommand: "Gerar protocolo"
  } as any;
}

const intentCases: Array<[string, any, string]> = [
  ["BODY ignora histórico facial", payload("BODY", "", {}, [{ title: "Protocolo facial para acne e melasma", status: "APPROVED" }]), "corporal_gordura"],
  ["FACIAL ignora histórico corporal", payload("FACIAL", "", {}, [{ title: "Protocolo corporal para gordura e celulite", status: "APPROVED" }]), "facial_rejuvenescimento"],
  ["gordura abdominal", payload("BODY", "Gordura localizada no abdômen"), "corporal_gordura"],
  ["celulite", payload("BODY", "Celulite e retenção hídrica"), "corporal_celulite"],
  ["estrias", payload("BODY", "Estrias antigas"), "corporal_estrias"],
  ["flacidez corporal", payload("BODY", "Flacidez e tonificação corporal"), "corporal_flacidez"],
  ["clareamento corporal", payload("BODY", "Clareamento de axila"), "corporal_clareamento"],
  ["relaxamento", payload("BODY", "Relaxamento e drenagem"), "corporal_relaxamento"],
  ["acne", payload("FACIAL", "Acne e oleosidade"), "facial_acne"],
  ["melasma", payload("FACIAL", "Melasma"), "facial_clareamento"],
  ["olheiras", payload("FACIAL", "Olheiras"), "facial_olheiras"],
  ["papada", payload("FACIAL", "Papada"), "facial_flacidez_papada"]
];

for (const [label, input, expected] of intentCases) {
  const scenario = analyzeMarieScenario(input);
  assert.equal(scenario.intent, expected, label);
  assert.equal(scenario.area, input.assessment.assessedArea, `${label}: área`);
}

const pacemaker = analyzeMarieScenario(payload("BODY", "Gordura localizada abdominal", { contraindications: "Marca-passo" }));
assert.match(pacemaker.avoidedProcedures.join(" "), /correntes|eletroterapias/i);
assert.match(pacemaker.avoidedProcedures.join(" "), /radiofrequência/i);
assert.match(pacemaker.avoidedProcedures.join(" "), /ultrassom/i);

const isotretinoin = analyzeMarieScenario(payload("FACIAL", "Acne e oleosidade", { medications: "Roacutan/isotretinoína" }));
assert.match(isotretinoin.avoidedProcedures.join(" "), /peeling/i);
assert.match(isotretinoin.avoidedProcedures.join(" "), /extração/i);
assert.match(isotretinoin.avoidedProcedures.join(" "), /jato de plasma/i);
assert.match(isotretinoin.avoidedProcedures.join(" "), /eletrocautério/i);

console.log("Marie AI: 14 cenários validados com sucesso.");
