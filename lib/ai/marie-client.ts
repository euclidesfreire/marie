import type {
  AestheticAssessment,
  Anamnesis,
  Appointment,
  Evolution,
  Patient,
  Protocol,
  ProtocolSuggestion
} from "@prisma/client";

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
  professionalCommand: string;
};

export type MarieResponse = {
  message: string;
  suggestedProtocol?: unknown;
  warnings?: string[];
  actions?: MarieAction[];
};

const id = () => `marie-action-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export async function sendMessageToMarie(payload: MarieContextPayload): Promise<MarieResponse> {
  const command = payload.professionalCommand.toLowerCase();
  const actions: MarieAction[] = [];

  if (command.includes("protocolo")) {
    actions.push({
      id: id(),
      type: "CREATE_PROTOCOL_SUGGESTION",
      title: "Criar sugestão de protocolo",
      description: "Preparar uma sugestão assistida para revisão profissional.",
      requiresConfirmation: true,
      payload: {
        title: command.includes("acne") ? "Protocolo assistido para acne grau II" : "Sugestão assistida de protocolo",
        objective: "Estruturar uma conduta inicial segura para revisão da profissional.",
        area: payload.assessment?.assessedArea ?? "FACIAL",
        suggestedActives: "Niacinamida, ácido mandélico em baixa concentração e hidratante calmante.",
        suggestedTechniques: "Higienização, preparo da pele, aplicação controlada e fotoproteção.",
        suggestedEquipments: "LED azul ou vermelho conforme avaliação profissional.",
        contraindications: payload.anamnesis?.contraindications ?? "Revisar alergias, gestação, uso de isotretinoína e sensibilidade cutânea.",
        warnings: "Validar tolerância, barreira cutânea e histórico antes de aplicar.",
        status: "WAITING_REVIEW"
      }
    });
  }

  if (command.includes("iniciar atendimento") || command.includes("começar atendimento") || command.includes("comecar atendimento")) {
    actions.push({
      id: id(),
      type: "START_APPOINTMENT",
      title: "Iniciar atendimento",
      description: "Colocar o atendimento em andamento e iniciar pela anamnese.",
      requiresConfirmation: true,
      payload: { status: "IN_PROGRESS", currentStep: "ANAMNESIS" }
    });
  }

  if (command.includes("enviar para validação") || command.includes("enviar para validacao")) {
    actions.push({
      id: id(),
      type: "SEND_SUGGESTION_TO_VALIDATION",
      title: "Enviar sugestão para validação",
      description: "Mover a sugestão selecionada para revisão profissional.",
      requiresConfirmation: true,
      payload: { status: "WAITING_REVIEW" }
    });
  }

  if (command.includes("aprovar sugestão") || command.includes("aprovar sugestao")) {
    actions.push({
      id: id(),
      type: "APPROVE_SUGGESTION",
      title: "Aprovar sugestão",
      description: "Registrar aprovação profissional e gerar protocolo final.",
      requiresConfirmation: true,
      payload: { decision: "APPROVED", justification: "Aprovação preparada pela Marie para confirmação profissional." }
    });
  }

  if (command.includes("protocolo final")) {
    actions.push({
      id: id(),
      type: "CREATE_FINAL_PROTOCOL",
      title: "Criar protocolo final",
      description: "Criar protocolo final a partir da sugestão validada.",
      requiresConfirmation: true,
      payload: { status: "APPROVED" }
    });
  }

  if (command.includes("finalizar atendimento")) {
    actions.push({
      id: id(),
      type: "FINISH_APPOINTMENT",
      title: "Finalizar atendimento",
      description: "Encerrar o atendimento e marcar a jornada como concluída.",
      requiresConfirmation: true,
      payload: { status: "FINISHED", currentStep: "COMPLETION" }
    });
  }

  if (command.includes("evolucao") || command.includes("evolução")) {
    actions.push({
      id: id(),
      type: "CREATE_EVOLUTION",
      title: "Criar evolução clínica",
      description: "Registrar uma evolução resumida para complementar o prontuário.",
      requiresConfirmation: true,
      payload: {
        summary: "Evolução preparada pela Marie para revisão profissional.",
        patientResponse: "Paciente orientada a observar sensibilidade e resposta da pele.",
        professionalNotes: "Validar achados clínicos antes de manter no prontuário.",
        adjustmentsMade: "Sem ajustes aplicados automaticamente.",
        nextSteps: "Reavaliar resposta no proximo atendimento."
      }
    });
  }

  if (command.includes("nota")) {
    actions.push({
      id: id(),
      type: "CREATE_CLINICAL_NOTE",
      title: "Criar anotação clínica",
      description: "Adicionar uma nota assistida ao prontuário.",
      requiresConfirmation: true,
      payload: {
        content: "Nota assistida criada pela Marie. Revisar e complementar antes de usar como registro clínico."
      }
    });
  }

  if (command.includes("conduta") || command.includes("atendimento")) {
    actions.push({
      id: id(),
      type: "UPDATE_APPOINTMENT_NOTES",
      title: "Atualizar conduta do atendimento",
      description: "Propor ajuste no campo de conduta do atendimento atual.",
      requiresConfirmation: true,
      payload: {
        conduct: "Conduta sugerida pela Marie para revisão: manter abordagem conservadora, observar tolerância e registrar resposta clínica."
      }
    });
  }

  if (command.includes("orientacao") || command.includes("orientação")) {
    actions.push({
      id: id(),
      type: "GENERATE_POST_CARE_GUIDANCE",
      title: "Gerar orientação pós-procedimento",
      description: "Preparar orientações para a profissional revisar e entregar.",
      requiresConfirmation: true,
      payload: {
        guidance: "Evitar sol direto, manter fotoproteção, não usar ativos irritantes por 48 horas e comunicar sinais de reação."
      }
    });
  }

  if (command.includes("contraindicacao") || command.includes("contraindicação")) {
    actions.push({
      id: id(),
      type: "REVIEW_CONTRAINDICATIONS",
      title: "Revisar contraindicações",
      description: "Listar pontos de atencao a partir da anamnese registrada.",
      requiresConfirmation: true,
      payload: {
        review: payload.anamnesis?.contraindications || "Não há contraindicações registradas. Confirmar manualmente antes do procedimento."
      }
    });
  }

  if (command.includes("historico") || command.includes("histórico") || command.includes("resumir")) {
    actions.push({
      id: id(),
      type: "SUMMARIZE_PATIENT_HISTORY",
      title: "Resumir histórico",
      description: "Montar um resumo assistido do histórico da paciente.",
      requiresConfirmation: true,
      payload: {
        summary: `Paciente ${payload.patient.name}, com ${payload.evolutions?.length ?? 0} evoluções registradas e ${payload.protocols?.length ?? 0} protocolos no histórico.`
      }
    });
  }

  return {
    message:
      actions.length > 0
        ? "Preparei uma ou mais ações para sua revisão. Nenhuma alteração será salva sem confirmação profissional."
        : "Entendi. Quando a IA estiver conectada, usarei os dados do paciente, anamnese e histórico para apoiar esta análise.",
    warnings: ["Marie sugere. O profissional valida. O atendimento evolui."],
    actions
  };
}
