import type { MarieArea, MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";

export type MarieCaseSubtype =
  | "comedonal_acne"
  | "inflammatory_acne"
  | "oily_skin"
  | "sensitive_acne"
  | "melasma"
  | "post_inflammatory_hyperpigmentation"
  | "solar_spots"
  | "dehydrated_aging_skin"
  | "sensitive_aging_skin"
  | "facial_laxity"
  | "under_eye_dark_circles"
  | "localized_abdominal_fat"
  | "localized_fat_with_laxity"
  | "cellulite_edematous"
  | "cellulite_fibrotic"
  | "recent_stretch_marks"
  | "old_stretch_marks"
  | "body_laxity"
  | "intimate_area_darkening"
  | "relaxation_and_fluid_retention"
  | "general_case";

export type MarieSafetyProfile = "LOW_RISK" | "CAUTION" | "HIGH_RISK" | "INSUFFICIENT_DATA";

export type MarieCareMaturity =
  | "NO_APPOINTMENT"
  | "NO_ANAMNESIS"
  | "PARTIAL_ANAMNESIS"
  | "ANAMNESIS_READY"
  | "ASSESSMENT_READY"
  | "PROTOCOL_DRAFTED"
  | "PROTOCOL_APPROVED"
  | "EXECUTION_REGISTERED"
  | "EVOLUTION_REGISTERED"
  | "FOLLOW_UP";

export type MarieCommandGoal =
  | "ASK_QUESTIONS"
  | "REVIEW"
  | "WARN"
  | "SUGGEST_PROTOCOL"
  | "ADJUST_PROTOCOL"
  | "GENERATE_HOME_CARE"
  | "REGISTER_EXECUTION"
  | "GENERATE_EVOLUTION"
  | "SUMMARIZE"
  | "FINISH"
  | "GENERAL_SUPPORT";

export type MarieContextSummary = {
  command: string;
  normalizedCommand: string;
  commandText: string;
  complaintText: string;
  assessmentText: string;
  appointmentText: string;
  allText: string;
  clinicalText: string;
  historyText: string;
  chiefComplaint: string;
  treatmentGoal: string;
  area: MarieArea;
  explicitArea?: MarieArea;
  primaryTreatmentConcern?: MarieProtocolKey;
  primaryTreatmentConcernCompatible: boolean;
  step: string;
  appointmentStatus?: string;
  hasAppointment: boolean;
  hasAnamnesis: boolean;
  hasAssessment: boolean;
  hasProtocolDraft: boolean;
  hasApprovedProtocol: boolean;
  hasEvolutionForAppointment: boolean;
  hasPreviousHistory: boolean;
  protocolCount: number;
  evolutionCount: number;
  suggestionCount: number;
};

export type MarieScenario = {
  intent: MarieProtocolKey;
  subtype: MarieCaseSubtype;
  safetyProfile: MarieSafetyProfile;
  careMaturity: MarieCareMaturity;
  commandGoal: MarieCommandGoal;
  step: string;
  area: MarieArea;
  confidence: number;
  detectedSignals: string[];
  detectedRisks: string[];
  missingFields: string[];
  contradictions: string[];
  recommendedProcedures: string[];
  optionalProcedures: string[];
  avoidedProcedures: string[];
  recommendedEquipments: string[];
  recommendedHomeCare: string[];
  suggestedQuestions: string[];
  explanation: string;
  shouldSuggestProtocol: boolean;
  shouldSuggestQuestions: boolean;
  shouldWarnProfessional: boolean;
  shouldOfferAlternatives: boolean;
};

export type MarieProcedurePlan = Pick<
  MarieScenario,
  "recommendedProcedures" | "optionalProcedures" | "avoidedProcedures" | "recommendedEquipments" | "recommendedHomeCare"
> & {
  title: string;
  objective: string;
  alternatives: string[];
  justification: string;
};
