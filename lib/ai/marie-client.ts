import type {
  AestheticAssessment,
  Anamnesis,
  Appointment,
  Evolution,
  Patient,
  Protocol,
  ProtocolSuggestion
} from "@prisma/client";
import { analyzeMarieScenario, buildMarieResponseFromScenario } from "@/lib/ai/marie-step-advisor";
import type { MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";

export type MarieActionType =
  | "CREATE_PROTOCOL_SUGGESTION"
  | "UPDATE_PROTOCOL_SUGGESTION"
  | "CREATE_EVOLUTION"
  | "CREATE_CLINICAL_NOTE"
  | "UPDATE_APPOINTMENT_NOTES"
  | "START_APPOINTMENT"
  | "FINISH_APPOINTMENT"
  | "SEND_SUGGESTION_TO_VALIDATION"
  | "APPROVE_SUGGESTION"
  | "CREATE_FINAL_PROTOCOL"
  | "GENERATE_POST_CARE_GUIDANCE"
  | "SUMMARIZE_PATIENT_HISTORY"
  | "REVIEW_CONTRAINDICATIONS";

export type MarieAction = {
  id: string;
  type: MarieActionType;
  title: string;
  description: string;
  payload: unknown;
  requiresConfirmation: boolean;
};

export type MarieContextPayload = {
  patient: Patient;
  anamnesis?: Anamnesis | null;
  appointment?: Appointment | null;
  assessment?: AestheticAssessment | null;
  suggestions?: ProtocolSuggestion[];
  protocols?: Protocol[];
  evolutions?: Evolution[];
  primaryTreatmentConcern?: MarieProtocolKey | null;
  mainTreatmentIndication?: MarieProtocolKey | null;
  professionalCommand: string;
};

export type MarieResponse = {
  message: string;
  suggestedProtocol?: unknown;
  warnings?: string[];
  actions?: MarieAction[];
};

export async function sendMessageToMarie(payload: MarieContextPayload): Promise<MarieResponse> {
  const scenario = analyzeMarieScenario(payload);
  return buildMarieResponseFromScenario(scenario, payload);
}
