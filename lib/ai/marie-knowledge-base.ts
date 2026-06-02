export type MarieArea = "FACIAL" | "BODY" | "BOTH";

export type MarieProtocolKey =
  | "facial_acne"
  | "facial_clareamento"
  | "facial_rejuvenescimento"
  | "facial_olheiras"
  | "facial_flacidez_papada"
  | "facial_sinais_cicatrizes"
  | "facial_outras"
  | "corporal_gordura"
  | "corporal_estrias"
  | "corporal_celulite"
  | "corporal_flacidez"
  | "corporal_clareamento"
  | "corporal_relaxamento";

export type MarieTreatmentProtocol = {
  key: MarieProtocolKey;
  title: string;
  area: MarieArea;
  complaintKeywords: string[];
  objective: string;
  actives: string;
  techniques: string[];
  equipments: string[];
  contraindications: string[];
  warnings: string[];
  homeCare: string[];
};

export const marieTreatmentKnowledge: Record<MarieProtocolKey, MarieTreatmentProtocol> = {
  facial_rejuvenescimento: {
    key: "facial_rejuvenescimento",
    title: "Protocolo facial para rejuvenescimento",
    area: "FACIAL",
    complaintKeywords: ["rugas", "envelhecimento", "rejuvenescimento", "linhas finas", "firmeza", "viço"],
    objective: "Apoiar melhora gradual de textura, viço e firmeza, respeitando sensibilidade, fototipo e resposta cutânea.",
    actives: "Ativos antioxidantes, hidratantes e firmadores compatíveis com a avaliação profissional.",
    techniques: ["Microcorrentes", "Radiofrequência", "Ultrassom microfocado", "Criofrequência", "Tecarterapia", "Peeling químico", "LED Terapia", "Peeling de diamante", "Peeling de cristal", "Eletroporação", "Luz intensa pulsada", "Eletrolift"],
    equipments: ["Microcorrentes", "radiofrequência", "ultrassom microfocado", "criofrequência", "LED/LIP e eletroporação, conforme disponibilidade e avaliação."],
    contraindications: ["Sensibilidade intensa", "uso recente de ácidos", "isotretinoína/Roacutan", "gestação", "alterações cardíacas ou contraindicações para eletroterapia e recursos térmicos."],
    warnings: ["Evitar promessa de resultado e ajustar intensidade conforme barreira cutânea, fototipo e tolerância."],
    homeCare: ["Fotoproteção diária", "hidratação", "evitar ativos irritantes após procedimentos abrasivos", "acompanhar sensibilidade nas 24-48h seguintes."]
  },
  facial_acne: {
    key: "facial_acne",
    title: "Protocolo facial para acne e oleosidade",
    area: "FACIAL",
    complaintKeywords: ["acne", "espinha", "comedao", "comedões", "pustula", "pústula", "oleosidade", "cravos"],
    objective: "Auxiliar no controle da oleosidade, higienização profunda, redução de inflamação aparente e melhora gradual da textura da pele.",
    actives: "Ativos calmantes, seborreguladores e hidratantes compatíveis com pele oleosa, conforme avaliação profissional.",
    techniques: ["Higienização inicial", "Limpeza de pele com extração, se indicada", "Desincrust", "Peeling ultrassônico", "Alta Frequência", "Fotobiomodulação", "Peeling químico adequado", "Vacuoterapia", "Microcorrentes", "Terapia de contraste", "Ionização", "Peeling de diamante"],
    equipments: ["Peeling ultrassônico", "alta frequência", "LED/fotobiomodulação", "vacuoterapia, ionização e recursos compatíveis com a avaliação profissional."],
    contraindications: ["Alergias", "uso recente de Roacutan/isotretinoína", "uso de ácidos", "sensibilidade intensa", "gestação", "histórico de reações."],
    warnings: ["Evitar extrações intensas, peelings ou recursos abrasivos em pele sensibilizada ou com isotretinoína recente."],
    homeCare: ["Fotoproteção", "higiene suave", "não manipular lesões", "evitar ácidos sem orientação", "observar ardor, edema ou piora de sensibilidade."]
  },
  facial_clareamento: {
    key: "facial_clareamento",
    title: "Protocolo facial clareador conservador",
    area: "FACIAL",
    complaintKeywords: ["mancha", "manchas", "melasma", "hipercromia", "clareamento", "pigmentacao", "pigmentação"],
    objective: "Apoiar uniformização gradual do aspecto da pele, com foco em fotoproteção, tolerância cutânea e acompanhamento profissional.",
    actives: "Ativos clareadores e antioxidantes compatíveis com fototipo, sensibilidade e protocolo da clínica.",
    techniques: ["Peelings químicos clareadores", "Luz intensa pulsada", "Fototerapia", "Microcorrentes", "Peeling ultrassônico", "Ultrassom microfocado", "Peeling de diamante", "Eletrofrequência facial para clareamento"],
    equipments: ["Fototerapia/LIP", "microcorrentes", "peeling ultrassônico", "ultrassom microfocado e recursos clareadores conforme avaliação."],
    contraindications: ["Exposição solar frequente", "fotoproteção irregular", "fototipo alto sem avaliação", "sensibilidade intensa", "uso recente de ácidos ou isotretinoína."],
    warnings: ["Priorizar fotoproteção e evitar abordagem agressiva quando houver exposição solar frequente ou barreira cutânea sensibilizada."],
    homeCare: ["Fotoproteção rigorosa", "evitar sol direto", "hidratação", "não associar ácidos sem orientação", "acompanhar manchas sem prometer clareamento garantido."]
  },
  facial_olheiras: {
    key: "facial_olheiras",
    title: "Protocolo facial para olheiras",
    area: "FACIAL",
    complaintKeywords: ["olheira", "olheiras", "regiao dos olhos", "região dos olhos"],
    objective: "Apoiar melhora gradual do aspecto da região periocular, considerando sensibilidade, vascularização e tipo de olheira.",
    actives: "Ativos calmantes, hidratantes e antioxidantes compatíveis com região periocular.",
    techniques: ["Microcorrentes", "Vácuo laser", "LED âmbar", "Tecarterapia", "Eletroporação", "Jato de plasma em casos específicos", "Crioterapia", "Criofrequência", "Corrente galvanizada", "Eletrocautério em casos específicos"],
    equipments: ["Microcorrentes", "LED âmbar", "eletroporação", "criofrequência ou recursos específicos conforme indicação profissional."],
    contraindications: ["Sensibilidade periocular", "lesões locais", "alergias", "procedimentos agressivos sem indicação específica."],
    warnings: ["Jato de plasma e eletrocautério exigem cautela e validação profissional criteriosa."],
    homeCare: ["Fotoproteção", "hidratação suave", "evitar atrito", "monitorar edema, ardor ou reação local."]
  },
  facial_flacidez_papada: {
    key: "facial_flacidez_papada",
    title: "Protocolo facial para flacidez e papada",
    area: "FACIAL",
    complaintKeywords: ["papada", "flacidez facial", "mandibular", "contorno facial", "perda de firmeza"],
    objective: "Apoiar melhora do aspecto de firmeza e contorno facial, com acompanhamento progressivo e validação profissional.",
    actives: "Ativos firmadores, hidratantes e antioxidantes compatíveis com a avaliação profissional.",
    techniques: ["Radiofrequência", "Ultrassom microfocado", "Criofrequência", "Eletrolift", "Vacuoterapia", "Tecarterapia", "Microcorrentes", "Laser", "Fototerapia"],
    equipments: ["Radiofrequência", "ultrassom microfocado", "criofrequência", "microcorrentes, laser ou fototerapia conforme indicação."],
    contraindications: ["Gestação", "marca-passo", "alterações cardíacas", "contraindicações para eletroterapia, laser ou recursos térmicos."],
    warnings: ["Validar tolerância e contraindicações antes de radiofrequência, criofrequência, ultrassom ou correntes."],
    homeCare: ["Fotoproteção", "hidratação", "acompanhar sensibilidade", "manter registros evolutivos."]
  },
  facial_sinais_cicatrizes: {
    key: "facial_sinais_cicatrizes",
    title: "Conduta facial para sinais e cicatrizes",
    area: "FACIAL",
    complaintKeywords: ["sinal", "sinais", "verruga", "verrugas", "cicatriz", "cicatrizes", "nevo", "nevos", "siringoma"],
    objective: "Organizar avaliação criteriosa de lesões benignas, cicatrizes ou alterações locais, sempre com cautela e validação profissional.",
    actives: "Ativos reparadores e calmantes podem ser considerados conforme tolerância e indicação.",
    techniques: ["Jato de Plasma", "Eletrocautério", "Remoção de lesões benignas como nevos, verrugas, siringoma e cicatrizes atróficas, quando permitido e validado."],
    equipments: ["Jato de plasma e eletrocautério somente em casos específicos e com validação profissional."],
    contraindications: ["Lesões suspeitas", "histórico de alteração dermatológica não avaliada", "cicatrização inadequada", "gestação ou contraindicações específicas."],
    warnings: ["Não realizar diagnóstico médico. Lesões suspeitas devem ser encaminhadas para avaliação médica antes de qualquer procedimento."],
    homeCare: ["Orientar proteção local", "não manipular a área", "acompanhar cicatrização e sinais de reação."]
  },
  facial_outras: {
    key: "facial_outras",
    title: "Protocolo facial de revitalização",
    area: "FACIAL",
    complaintKeywords: ["revitalizacao", "revitalização", "detox facial", "limpeza de pele", "drenagem facial"],
    objective: "Apoiar revitalização, higienização e conforto cutâneo conforme queixa e avaliação profissional.",
    actives: "Ativos hidratantes, calmantes e antioxidantes conforme tolerância.",
    techniques: ["Limpeza de pele com extração e eletroterapias", "Revitalização facial", "Drenagem linfática facial", "Detox facial"],
    equipments: ["Eletroterapias faciais compatíveis com avaliação e disponibilidade da clínica."],
    contraindications: ["Alergias", "sensibilidade intensa", "contraindicações para eletroterapia."],
    warnings: ["Ajustar conduta conforme tolerância e objetivo do atendimento."],
    homeCare: ["Fotoproteção", "hidratação", "evitar irritantes após a sessão."]
  },
  corporal_gordura: {
    key: "corporal_gordura",
    title: "Protocolo corporal para gordura localizada",
    area: "BODY",
    complaintKeywords: ["gordura localizada", "medidas", "adiposidade", "abdomen", "abdômen", "flanco", "culote"],
    objective: "Apoiar o remodelamento corporal e a melhora do contorno da região avaliada, considerando hábitos, contraindicações e resposta progressiva.",
    actives: "Ativos cosméticos firmadores, drenantes ou lipolíticos não invasivos, conforme avaliação profissional e protocolo da clínica.",
    techniques: ["Avaliação da região e registro de medidas", "Criolipólise", "Ultrassom cavitacional", "Ultrassom microfocado", "Eletrolipólise", "Vacum laser", "Ondas de choque", "Manta térmica", "Correntes excitomotoras", "Radiofrequência", "Criofrequência", "Endermoterapia", "Massagem modeladora"],
    equipments: ["Ultrassom cavitacional", "radiofrequência", "criofrequência", "endermoterapia", "ondas de choque, correntes excitomotoras ou recursos disponíveis conforme avaliação."],
    contraindications: ["Gestação", "marca-passo", "alterações cardíacas", "sensibilidade local", "contraindicações para eletroterapia, ultrassom ou recursos térmicos."],
    warnings: ["Não prometer redução de medidas. Acompanhar por medidas, fotos autorizadas e relato do cliente."],
    homeCare: ["Hidratação", "atividade física conforme rotina do cliente", "acompanhar alimentação/hábitos", "observar sensibilidade local."]
  },
  corporal_estrias: {
    key: "corporal_estrias",
    title: "Protocolo corporal para estrias",
    area: "BODY",
    complaintKeywords: ["estria", "estrias"],
    objective: "Apoiar melhora gradual do aspecto das estrias, respeitando tipo, tempo de evolução e tolerância da pele.",
    actives: "Ativos reparadores, hidratantes e renovadores conforme avaliação profissional.",
    techniques: ["Striort", "Eletrocautério", "Jato de Plasma", "Peeling de diamante", "Peeling químico", "Laser"],
    equipments: ["Jato de plasma", "eletrocautério", "laser e recursos de peeling conforme indicação."],
    contraindications: ["Gestação", "sensibilidade intensa", "cicatrização inadequada", "uso de ácidos ou medicamentos sensibilizantes."],
    warnings: ["Evitar prometer eliminação de estrias e ajustar estímulo conforme tolerância e risco de hiperpigmentação."],
    homeCare: ["Hidratação", "fotoproteção quando área exposta", "evitar atrito e irritantes no pós-procedimento."]
  },
  corporal_celulite: {
    key: "corporal_celulite",
    title: "Protocolo corporal para celulite",
    area: "BODY",
    complaintKeywords: ["celulite", "fibro edema", "fibroedema"],
    objective: "Apoiar melhora do aspecto da celulite e da circulação local, considerando hábitos, hidratação e resposta progressiva.",
    actives: "Ativos drenantes, firmadores e cosméticos de apoio compatíveis com avaliação profissional.",
    techniques: ["Endermoterapia", "Criofrequência", "Tecarterapia", "Eletrolipólise", "Corrente Russa", "Ultrassom cavitacional", "Sonoforese", "Ondas de choque"],
    equipments: ["Endermoterapia", "criofrequência", "tecarterapia", "eletrolipólise", "corrente russa, ultrassom cavitacional ou ondas de choque conforme avaliação."],
    contraindications: ["Gestação", "marca-passo", "alterações cardíacas", "contraindicações para correntes, ultrassom ou recursos térmicos."],
    warnings: ["Baixa ingestão de água e sedentarismo reduzem aderência ao plano; orientar acompanhamento de hábitos sem promessa de resultado."],
    homeCare: ["Aumentar ingestão hídrica quando adequado", "movimento regular", "acompanhar resposta local", "evitar expectativas irreais."]
  },
  corporal_flacidez: {
    key: "corporal_flacidez",
    title: "Protocolo corporal para flacidez e tonificação",
    area: "BODY",
    complaintKeywords: ["flacidez corporal", "tonificacao", "tonificação", "firmeza corporal"],
    objective: "Apoiar melhora gradual do aspecto de firmeza e tônus corporal, respeitando contraindicações e evolução clínica.",
    actives: "Ativos firmadores, hidratantes e cosméticos de apoio conforme protocolo da clínica.",
    techniques: ["Radiofrequência corporal", "Criofrequência", "Corrente russa", "Corrente aussie", "Tecarterapia", "Ultrassom microfocado", "Fotobiomodulação", "Eletroporação com ativos firmadores", "Ondas de choque"],
    equipments: ["Radiofrequência corporal", "criofrequência", "corrente russa/aussie", "tecarterapia, ultrassom microfocado, fotobiomodulação e ondas de choque conforme avaliação."],
    contraindications: ["Gestação", "marca-passo", "alterações cardíacas", "contraindicações para eletroterapia, ultrassom ou recursos térmicos."],
    warnings: ["Validar riscos antes de correntes, radiofrequência, criofrequência e ultrassom."],
    homeCare: ["Hidratação", "atividade física conforme orientação de rotina", "acompanhar evolução e tolerância."]
  },
  corporal_clareamento: {
    key: "corporal_clareamento",
    title: "Protocolo corporal clareador",
    area: "BODY",
    complaintKeywords: ["clareamento corporal", "axila", "virilha", "area intima", "área íntima", "coxa", "gluteos", "glúteos", "joelho", "cotovelo"],
    objective: "Apoiar uniformização gradual do aspecto da região corporal avaliada, com cautela para sensibilidade e hiperpigmentação.",
    actives: "Ativos clareadores e calmantes compatíveis com a região e avaliação profissional.",
    techniques: ["Peelings químicos clareadores", "Fototerapia", "Laser terapêutico", "Jato de plasma em protocolos específicos", "Eletroporação com ativos clareadores", "Peeling de cristal"],
    equipments: ["Fototerapia", "laser terapêutico", "eletroporação, peeling de cristal e recursos específicos com validação profissional."],
    contraindications: ["Sensibilidade local", "atrito intenso", "exposição solar", "uso de ácidos", "histórico de hiperpigmentação pós-inflamatória."],
    warnings: ["Evitar procedimentos agressivos em regiões sensíveis ou com atrito sem avaliação profissional."],
    homeCare: ["Evitar atrito", "hidratação", "fotoproteção quando área exposta", "não usar ácidos sem orientação."]
  },
  corporal_relaxamento: {
    key: "corporal_relaxamento",
    title: "Protocolo corporal de relaxamento e drenagem",
    area: "BODY",
    complaintKeywords: ["relaxamento", "massagem", "drenagem", "detox", "spa dos pés", "spa dos pes", "ventosa", "pedras quentes"],
    objective: "Promover conforto, relaxamento e apoio ao bem-estar, respeitando contraindicações e resposta do cliente.",
    actives: "Produtos de massagem, cosméticos hidratantes e recursos de conforto conforme protocolo da clínica.",
    techniques: ["Massagem relaxante com ventosa", "Massagem com pedras quentes", "Massagem com velas quentes", "Massagem com correntes elétricas", "Drenagem linfática", "Detox Corporal", "Spa dos pés"],
    equipments: ["Ventosas, pedras quentes, velas, recursos de drenagem e correntes apenas quando adequados e validados."],
    contraindications: ["Gestação sem liberação/avaliação", "alterações circulatórias importantes", "febre", "lesões locais", "dor inexplicada", "contraindicações para calor ou correntes."],
    warnings: ["Ajustar pressão, temperatura e recurso ao conforto do cliente e à avaliação profissional."],
    homeCare: ["Hidratação", "repouso conforme necessidade", "observar desconfortos e relatar reações."]
  }
};

export function getProtocolByKey(key: MarieProtocolKey) {
  return marieTreatmentKnowledge[key];
}
