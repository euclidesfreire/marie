import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome profissional."),
  email: z.string().trim().email("Informe um e-mail válido.")
});

export const createPatientSchema = z.object({
  name: z.string().trim().min(2),
  birthDate: z.coerce.date(),
  phone: optionalText,
  email: z.string().email().optional().nullable().or(z.literal("")),
  gender: optionalText,
  document: optionalText,
  notes: optionalText,
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE")
});

export const updatePatientSchema = createPatientSchema.partial();

export const createAnamnesisSchema = z.object({
  chiefComplaint: z.string().trim().min(2),
  treatmentGoal: optionalText,
  allergies: optionalText,
  medications: optionalText,
  preExistingConditions: optionalText,
  previousProcedures: optionalText,
  skinType: optionalText,
  skinSensitivity: optionalText,
  contraindications: optionalText,
  habits: optionalText,
  notes: optionalText
});

export const createAppointmentSchema = z.object({
  date: z.coerce.date().optional(),
  dailyComplaint: optionalText,
  evaluation: optionalText,
  conduct: optionalText,
  status: z.enum(["DRAFT", "IN_PROGRESS", "FINISHED", "REOPENED", "CANCELED"]).default("DRAFT"),
  currentStep: z.enum(["PREPARATION", "ANAMNESIS", "ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"]).optional(),
  startedAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable(),
  reopenedAt: z.coerce.date().optional().nullable(),
  reopenReason: optionalText
});

export const createAssessmentSchema = z.object({
  assessedArea: z.enum(["FACIAL", "BODY", "BOTH"]),
  primaryTreatmentConcern: optionalText,
  primaryFinding: optionalText,
  mainFinding: optionalText,
  photoprotection: optionalText,
  sunExposure: optionalText,
  acidUse: optionalText,
  acidRetinoidUse: optionalText,
  sensitizingMedication: optionalText,
  structuredContraindications: optionalText,
  structuredHabits: optionalText,
  professionalAnalysis: optionalText,
  skinCondition: optionalText,
  bodyCondition: optionalText,
  perceivedRisks: optionalText,
  technicalNotes: optionalText
});

export const createProtocolSuggestionSchema = z.object({
  appointmentId: z.string().optional().nullable(),
  source: z.enum(["MANUAL", "AI"]).default("MANUAL"),
  title: z.string().trim().min(2),
  objective: optionalText,
  area: z.enum(["FACIAL", "BODY", "BOTH"]),
  suggestedActives: optionalText,
  suggestedTechniques: optionalText,
  suggestedEquipments: optionalText,
  contraindications: optionalText,
  warnings: optionalText,
  status: z.enum(["DRAFT", "WAITING_REVIEW", "APPROVED", "ADJUSTED", "REJECTED"]).default("DRAFT")
});

export const createProfessionalValidationSchema = z.object({
  decision: z.enum(["APPROVED", "APPROVED_WITH_ADJUSTMENTS", "REJECTED"]),
  justification: optionalText,
  criticalAnalysis: optionalText
});

export const createTechnicalAdjustmentSchema = z.object({
  changedField: z.string().trim().min(1),
  previousValue: optionalText,
  newValue: z.string().trim().min(1),
  reason: optionalText
});

export const createProtocolSchema = z.object({
  appointmentId: z.string().optional().nullable(),
  title: z.string().trim().min(2),
  objective: optionalText,
  indication: optionalText,
  contraindications: optionalText,
  postProcedureCare: optionalText,
  source: z.enum(["MANUAL", "AI_ASSISTED"]).default("MANUAL"),
  status: z.enum(["DRAFT", "REVIEWED", "APPROVED", "APPLIED"]).default("DRAFT")
});

export const createProtocolStepSchema = z.object({
  order: z.coerce.number().int().min(1),
  title: z.string().trim().min(2),
  description: optionalText,
  product: optionalText,
  duration: optionalText,
  notes: optionalText
});

export const createEvolutionSchema = z.object({
  appointmentId: z.string().optional().nullable(),
  summary: z.string().trim().min(2),
  patientResponse: optionalText,
  professionalNotes: optionalText,
  adjustmentsMade: optionalText,
  nextSteps: optionalText,
  returnDate: z.coerce.date().optional().nullable()
});

export const createAppointmentExecutionSchema = z.object({
  procedurePerformed: z.string().trim().min(2),
  productsUsed: optionalText,
  equipmentParameters: optionalText,
  duration: optionalText,
  professionalNotes: optionalText,
  incidents: optionalText,
  postCareGiven: optionalText
});

export const setAppointmentStepSchema = z.object({
  step: z.enum(["PREPARATION", "ANAMNESIS", "ASSESSMENT", "CARE_PLAN", "EXECUTION", "EVOLUTION", "COMPLETION"]),
  reason: optionalText
});

export const createAppointmentFollowUpSchema = z.object({
  type: z.enum(["RETURN", "FOLLOW_UP", "PROTOCOL_REVIEW", "EVOLUTION_CHECK", "INTERCURRENCE"]).default("FOLLOW_UP"),
  date: z.coerce.date().optional(),
  summary: z.string().trim().min(2),
  patientResponse: optionalText,
  professionalNotes: optionalText,
  adjustments: optionalText,
  nextSteps: optionalText,
  status: z.enum(["OPEN", "COMPLETED", "CANCELED"]).default("OPEN")
});

export const createClinicalNoteSchema = z.object({
  content: z.string().trim().min(2),
  origin: z.enum(["PROFESSIONAL", "AI"]).default("PROFESSIONAL")
});

export const marieActionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "CREATE_PROTOCOL_SUGGESTION",
    "UPDATE_PROTOCOL_SUGGESTION",
    "CREATE_EVOLUTION",
    "CREATE_CLINICAL_NOTE",
    "UPDATE_APPOINTMENT_NOTES",
    "START_APPOINTMENT",
    "FINISH_APPOINTMENT",
    "SEND_SUGGESTION_TO_VALIDATION",
    "APPROVE_SUGGESTION",
    "CREATE_FINAL_PROTOCOL",
    "GENERATE_POST_CARE_GUIDANCE",
    "SUMMARIZE_PATIENT_HISTORY",
    "REVIEW_CONTRAINDICATIONS"
  ]),
  title: z.string().optional(),
  description: z.string().optional(),
  payload: z.unknown(),
  requiresConfirmation: z.boolean().default(true)
});

export const executeMarieActionSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional().nullable(),
  action: marieActionSchema
});
