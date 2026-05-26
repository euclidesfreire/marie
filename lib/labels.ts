const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em atendimento",
  FINISHED: "Finalizado",
  REOPENED: "Reaberto",
  CANCELED: "Cancelado",
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  ARCHIVED: "Arquivado",
  WAITING_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovado",
  APPROVED_WITH_ADJUSTMENTS: "Aprovado com ajustes",
  ADJUSTED: "Ajustado",
  REJECTED: "Rejeitado",
  REVIEWED: "Revisado",
  APPLIED: "Aplicado",
  PREPARATION: "Preparação",
  ANAMNESIS: "Anamnese",
  ASSESSMENT: "Avaliação",
  CARE_PLAN: "Plano de cuidado",
  EXECUTION: "Execução",
  EVOLUTION: "Evolução",
  COMPLETION: "Finalização",
  PENDING: "Pendente",
  CURRENT: "Atual",
  COMPLETED: "Concluída",
  NEEDS_REVIEW: "Precisa revisão",
  SKIPPED: "Ignorada",
  MANUAL: "Manual",
  AI: "Marie",
  AI_ASSISTED: "Assistido pela Marie",
  FACIAL: "Facial",
  BODY: "Corporal",
  BOTH: "Facial e corporal"
};

export function labelFor(value?: string | null) {
  if (!value) return "Não informado";
  return statusLabels[value] ?? value;
}
