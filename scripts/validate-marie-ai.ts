import assert from "node:assert/strict";
import { getTreatmentConcernGroups, treatmentConcernOptions } from "../lib/ai/marie-knowledge-base";
import { findCatalogProcedure } from "../lib/ai/marie-procedure-catalog";
import { analyzeMarieScenario, buildMarieResponseFromScenario } from "../lib/ai/marie-step-advisor";

type Area = "FACIAL" | "BODY";

function payload(area: Area, complaint: string, extra: Record<string, any> = {}, protocols: any[] = []) {
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
      currentStep: extra.step ?? "CARE_PLAN",
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
    primaryTreatmentConcern: extra.primaryTreatmentConcern,
    professionalCommand: extra.command ?? "Gerar protocolo"
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
  const officialProcedures = treatmentConcernOptions.find((option) => option.value === scenario.intent)?.procedures ?? [];
  for (const procedure of [...scenario.recommendedProcedures, ...scenario.optionalProcedures]) {
    assert.ok(officialProcedures.some((official) => procedure.startsWith(official)), `${label}: procedimento fora dos anexos: ${procedure}`);
  }
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

assert.equal(treatmentConcernOptions.length, 13, "A base deve conter exatamente as 13 indicações dos anexos.");
for (const option of treatmentConcernOptions) {
  assert.ok(option.procedures.length > 0, `${option.label}: sem procedimentos.`);
  for (const procedure of option.procedures) {
    assert.ok(findCatalogProcedure(option.value, procedure), `${option.label}: procedimento sem metadados no catálogo: ${procedure}`);
  }
}

const selectedConcern = analyzeMarieScenario(payload("FACIAL", "Pele oleosa", { primaryTreatmentConcern: "facial_acne" }));
assert.equal(selectedConcern.intent, "facial_acne", "Indicação principal compatível deve ter prioridade.");

const selectedWithoutAssessment = payload("FACIAL", "Acne anterior no histórico", { primaryTreatmentConcern: "corporal_celulite" });
selectedWithoutAssessment.assessment = null;
const selectedWithoutAssessmentScenario = analyzeMarieScenario(selectedWithoutAssessment);
assert.equal(selectedWithoutAssessmentScenario.area, "BODY", "Sem área avaliada, a indicação estruturada deve orientar a área.");
assert.equal(selectedWithoutAssessmentScenario.intent, "corporal_celulite", "Sem área avaliada, a indicação estruturada deve ter prioridade.");

const incompatibleConcern = analyzeMarieScenario(payload("BODY", "Gordura localizada", { primaryTreatmentConcern: "facial_acne" }));
assert.equal(incompatibleConcern.intent, "corporal_gordura", "Indicação facial incompatível não pode vencer área BODY.");
assert.match(incompatibleConcern.contradictions.join(" "), /não é compatível/i);

const facialGroups = getTreatmentConcernGroups("FACIAL");
const bodyGroups = getTreatmentConcernGroups("BODY");
const bothGroups = getTreatmentConcernGroups("BOTH");
assert.equal(facialGroups.facial.length, 7);
assert.equal(facialGroups.body.length, 0);
assert.equal(bodyGroups.facial.length, 0);
assert.equal(bodyGroups.body.length, 6);
assert.equal(bothGroups.facial.length, 7);
assert.equal(bothGroups.body.length, 6);

function responseFor(step: string, command: string, withAppointment = true) {
  const input = payload("FACIAL", "Acne e oleosidade", { step, command });
  if (!withAppointment) input.appointment = null;
  const scenario = analyzeMarieScenario(input);
  return buildMarieResponseFromScenario(scenario, input);
}

const preparation = responseFor("PREPARATION", "Apoiar atendimento", false);
const anamnesis = responseFor("ANAMNESIS", "Revisar anamnese");
const anamnesisProtocol = responseFor("ANAMNESIS", "Gerar protocolo");
const warning = responseFor("ANAMNESIS", "Revisar contraindicações");
const carePlan = responseFor("CARE_PLAN", "Sugerir plano de cuidado");
const execution = responseFor("EXECUTION", "Apoiar execução");
const evolution = responseFor("EVOLUTION", "Criar evolução");
const completion = responseFor("COMPLETION", "Revisar pendências");

assert.deepEqual(preparation.actions?.map((item) => item.type), ["START_APPOINTMENT"]);
assert.equal(anamnesis.actions?.length ?? 0, 0, "Anamnese conversacional não deve criar ação aplicável.");
assert.ok(anamnesisProtocol.actions?.some((item) => item.type === "CREATE_PROTOCOL_SUGGESTION"), "Pedido explícito de protocolo deve funcionar na Anamnese.");
assert.equal(warning.actions?.length ?? 0, 0, "Revisão de contraindicações deve ser somente alerta.");
assert.ok(carePlan.actions?.some((item) => item.type === "CREATE_PROTOCOL_SUGGESTION"));
assert.ok(execution.actions?.some((item) => item.type === "UPDATE_APPOINTMENT_NOTES"));
assert.ok(!execution.actions?.some((item) => item.type === "CREATE_PROTOCOL_SUGGESTION"));
assert.ok(evolution.actions?.some((item) => item.type === "CREATE_EVOLUTION"));
assert.ok(!evolution.actions?.some((item) => item.type === "CREATE_PROTOCOL_SUGGESTION"));
assert.ok(completion.actions?.some((item) => item.type === "SUMMARIZE_PATIENT_HISTORY"));

for (const response of [preparation, anamnesis, warning, carePlan, execution, evolution, completion]) {
  assert.ok(!response.actions?.some((item) => item.title === "Registrar perguntas e lacunas"));
  assert.ok(!response.actions?.some((item) => item.type === "REVIEW_CONTRAINDICATIONS"));
}

assert.match(carePlan.message, /validar, ajustar ou rejeitar o plano sugerido/i);
assert.doesNotMatch(anamnesis.message, /validar, ajustar ou rejeitar/i);
assert.doesNotMatch(execution.message, /validar, ajustar ou rejeitar/i);
assert.notEqual(anamnesis.message, execution.message);
assert.notEqual(execution.message, evolution.message);

console.log("Marie AI: cobertura, intenção, segurança e fluxo validados com sucesso.");
