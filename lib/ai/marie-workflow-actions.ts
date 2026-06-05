export type WorkflowStage = "anamnesis" | "plan" | "execution" | "evolution" | "completion";

export type WorkflowQuickAction = {
  id: string;
  label: string;
  stage: WorkflowStage;
  action: string;
  disabled?: boolean;
  disabledReason?: string;
};

export const workflowQuickActions: Record<WorkflowStage, WorkflowQuickAction[]> = {
  anamnesis: [
    { id: "complete-anamnesis", label: "Completar anamnese", stage: "anamnesis", action: "complete_anamnesis" },
    { id: "review-evaluated-area", label: "Revisar área avaliada", stage: "anamnesis", action: "review_evaluated_area" },
    { id: "review-main-complaint", label: "Revisar queixa principal", stage: "anamnesis", action: "review_main_complaint" },
    { id: "review-contraindications", label: "Revisar contraindicações", stage: "anamnesis", action: "review_contraindications" },
    { id: "go-to-plan", label: "Avançar para plano/protocolo", stage: "anamnesis", action: "go_to_plan" }
  ],
  plan: [
    { id: "generate-protocol", label: "Gerar sugestão de protocolo", stage: "plan", action: "generate_protocol" },
    { id: "edit-plan", label: "Editar plano", stage: "plan", action: "edit_plan" },
    { id: "approve-plan", label: "Aprovar plano", stage: "plan", action: "approve_plan" },
    { id: "back-to-anamnesis", label: "Voltar para anamnese", stage: "plan", action: "back_to_anamnesis" },
    { id: "go-to-evolution", label: "Avançar para evolução", stage: "plan", action: "go_to_evolution" }
  ],
  execution: [
    { id: "register-execution", label: "Registrar execução", stage: "execution", action: "register_execution" },
    { id: "review-parameters", label: "Revisar parâmetros", stage: "execution", action: "review_parameters" },
    { id: "generate-post-care", label: "Gerar orientação pós", stage: "execution", action: "generate_post_care" },
    { id: "go-to-evolution", label: "Avançar para evolução", stage: "execution", action: "go_to_evolution" }
  ],
  evolution: [
    { id: "register-evolution", label: "Registrar evolução", stage: "evolution", action: "register_evolution" },
    { id: "compare-last-session", label: "Comparar com atendimento anterior", stage: "evolution", action: "compare_last_session" },
    { id: "adjust-protocol", label: "Ajustar protocolo", stage: "evolution", action: "adjust_protocol" },
    { id: "finish-service", label: "Finalizar atendimento", stage: "evolution", action: "finish_service" },
    { id: "reopen-service", label: "Reabrir atendimento", stage: "evolution", action: "reopen_service" }
  ],
  completion: [
    { id: "review-pendencies", label: "Revisar pendências", stage: "completion", action: "review_pendencies" },
    { id: "generate-final-summary", label: "Gerar resumo final", stage: "completion", action: "generate_final_summary" },
    { id: "prepare-return", label: "Preparar retorno", stage: "completion", action: "prepare_return" },
    { id: "reopen-service", label: "Reabrir atendimento", stage: "completion", action: "reopen_service" }
  ]
};

export function getWorkflowStageFromStep(step?: string | null): WorkflowStage {
  if (step === "CARE_PLAN") return "plan";
  if (step === "EXECUTION") return "execution";
  if (step === "EVOLUTION") return "evolution";
  if (step === "COMPLETION") return "completion";
  return "anamnesis";
}

export function getWorkflowQuickActionsForStep(step?: string | null, appointmentStatus?: string | null) {
  const stage = getWorkflowStageFromStep(step);
  return workflowQuickActions[stage].map((item) => {
    if (item.action === "reopen_service" && appointmentStatus !== "FINISHED") {
      return { ...item, disabled: true, disabledReason: "Disponível após finalizar o atendimento." };
    }
    if (item.action === "finish_service" && appointmentStatus === "FINISHED") {
      return { ...item, disabled: true, disabledReason: "Atendimento já finalizado." };
    }
    return item;
  });
}
