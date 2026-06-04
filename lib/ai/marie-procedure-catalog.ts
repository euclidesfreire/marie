import type { MarieArea, MarieProtocolKey } from "@/lib/ai/marie-knowledge-base";
import { normalizeMarieText } from "@/lib/ai/marie-context-analyzer";

export type MarieProcedureRole = "manual" | "equipment" | "peeling" | "electrotherapy" | "laser_light" | "massage" | "thermal" | "homecare";
export type MarieProcedureIntensity = "low" | "moderate" | "high";

export type MarieProcedure = {
  name: string;
  area: MarieArea;
  categories: MarieProtocolKey[];
  indications: string[];
  avoidWhen: string[];
  cautionWhen: string[];
  role: MarieProcedureRole;
  intensity: MarieProcedureIntensity;
  notes: string;
};

const electroAvoid = ["marca-passo", "gestação", "alterações cardíacas"];
const abrasiveAvoid = ["Roacutan", "isotretinoína", "pele sensibilizada", "ferida aberta"];
const thermalAvoid = ["marca-passo", "gestação", "alterações cardíacas", "sensibilidade térmica"];
const lightCaution = ["fototipo alto", "exposição solar", "fotoproteção irregular", "medicação fotossensibilizante"];

function procedure(
  name: string,
  area: MarieArea,
  categories: MarieProtocolKey[],
  indications: string[],
  role: MarieProcedureRole,
  intensity: MarieProcedureIntensity = "moderate",
  avoidWhen: string[] = [],
  cautionWhen: string[] = [],
  notes = "Aplicar somente após avaliação e validação profissional."
): MarieProcedure {
  return { name, area, categories, indications, role, intensity, avoidWhen, cautionWhen, notes };
}

export const marieProcedureCatalog: MarieProcedure[] = [
  // Faciais: rejuvenescimento, acne, clareamento, olheiras, flacidez, sinais e terapias gerais.
  procedure("Microcorrentes", "FACIAL", ["facial_rejuvenescimento", "facial_acne", "facial_clareamento", "facial_olheiras", "facial_flacidez_papada"], ["linhas finas", "inflamação", "manchas", "olheiras", "flacidez"], "electrotherapy", "low", electroAvoid),
  procedure("Radiofrequência facial", "FACIAL", ["facial_rejuvenescimento", "facial_flacidez_papada"], ["rugas", "flacidez", "contorno facial"], "thermal", "moderate", thermalAvoid, ["sensibilidade", "medicação contínua"]),
  procedure("Ultrassom microfocado facial", "FACIAL", ["facial_rejuvenescimento", "facial_clareamento", "facial_flacidez_papada"], ["lifting", "flacidez", "textura", "clareamento"], "equipment", "high", electroAvoid, ["sensibilidade", "lesões locais"]),
  procedure("Criofrequência facial", "FACIAL", ["facial_rejuvenescimento", "facial_olheiras", "facial_flacidez_papada"], ["firmeza", "olheiras", "flacidez"], "thermal", "moderate", thermalAvoid),
  procedure("Tecarterapia facial", "FACIAL", ["facial_rejuvenescimento", "facial_olheiras", "facial_flacidez_papada"], ["bioestimulação", "olheiras", "firmeza"], "thermal", "moderate", thermalAvoid),
  procedure("Peeling químico facial", "FACIAL", ["facial_rejuvenescimento", "facial_acne", "facial_clareamento"], ["acne", "manchas", "textura", "rejuvenescimento"], "peeling", "high", abrasiveAvoid, lightCaution, "Validar fototipo, sensibilidade, uso de ácidos e contraindicações."),
  procedure("LED Terapia", "FACIAL", ["facial_rejuvenescimento", "facial_acne", "facial_olheiras", "facial_flacidez_papada"], ["revitalização", "acne", "olheiras", "firmeza"], "laser_light", "low", [], ["fotossensibilidade"]),
  procedure("Peeling de diamante facial", "FACIAL", ["facial_rejuvenescimento", "facial_acne", "facial_clareamento"], ["textura", "comedões", "manchas"], "peeling", "high", abrasiveAvoid, lightCaution),
  procedure("Peeling de cristal facial", "FACIAL", ["facial_rejuvenescimento"], ["textura", "rejuvenescimento"], "peeling", "high", abrasiveAvoid, lightCaution),
  procedure("Eletroporação facial", "FACIAL", ["facial_rejuvenescimento", "facial_olheiras"], ["ativos", "hidratação", "olheiras"], "electrotherapy", "moderate", electroAvoid),
  procedure("Luz intensa pulsada facial", "FACIAL", ["facial_rejuvenescimento", "facial_clareamento"], ["manchas", "rejuvenescimento"], "laser_light", "high", ["gestação", "ferida aberta"], lightCaution),
  procedure("Eletrolift facial", "FACIAL", ["facial_rejuvenescimento", "facial_flacidez_papada"], ["linhas finas", "flacidez"], "electrotherapy", "moderate", electroAvoid, ["sensibilidade"]),
  procedure("Limpeza de pele com extração", "FACIAL", ["facial_acne", "facial_outras"], ["comedões", "cravos", "limpeza de pele"], "manual", "moderate", ["Roacutan", "isotretinoína", "pele sensibilizada", "acne inflamatória intensa"], ["sensibilidade"]),
  procedure("Desincrust", "FACIAL", ["facial_acne"], ["oleosidade", "comedões"], "electrotherapy", "moderate", electroAvoid, ["sensibilidade"]),
  procedure("Peeling ultrassônico facial", "FACIAL", ["facial_acne", "facial_clareamento"], ["oleosidade", "comedões", "manchas"], "equipment", "moderate", ["marca-passo", "gestação sem validação"], ["sensibilidade", "uso de ácidos"]),
  procedure("Fotobiomodulação facial", "FACIAL", ["facial_acne", "facial_flacidez_papada"], ["acne inflamatória", "reparo", "flacidez"], "laser_light", "low", [], ["fotossensibilidade"]),
  procedure("Vacuoterapia facial", "FACIAL", ["facial_acne", "facial_flacidez_papada"], ["oleosidade", "flacidez"], "equipment", "moderate", ["fragilidade vascular", "lesão ativa"], ["sensibilidade"]),
  procedure("Terapia de contraste facial", "FACIAL", ["facial_acne"], ["oleosidade", "acne"], "thermal", "low", ["sensibilidade térmica"], ["pele reativa"]),
  procedure("Ionização facial", "FACIAL", ["facial_acne"], ["oleosidade", "ativos"], "electrotherapy", "moderate", electroAvoid),
  procedure("Alta Frequência", "FACIAL", ["facial_acne"], ["acne", "pústulas", "pós-extração"], "electrotherapy", "moderate", electroAvoid, ["sensibilidade"]),
  procedure("Peelings químicos clareadores faciais", "FACIAL", ["facial_clareamento"], ["melasma", "HPI", "efélides", "melanose solar"], "peeling", "high", abrasiveAvoid, lightCaution),
  procedure("Fototerapia facial", "FACIAL", ["facial_clareamento", "facial_flacidez_papada"], ["manchas", "flacidez"], "laser_light", "low", [], lightCaution),
  procedure("Eletrofrequência facial para clareamento", "FACIAL", ["facial_clareamento"], ["manchas", "clareamento"], "electrotherapy", "moderate", electroAvoid, lightCaution),
  procedure("Vácuo laser periocular", "FACIAL", ["facial_olheiras"], ["olheira vascular", "edema periocular"], "laser_light", "moderate", ["lesão periocular"], ["sensibilidade periocular"]),
  procedure("LED âmbar", "FACIAL", ["facial_olheiras"], ["olheira pigmentada", "olheira vascular"], "laser_light", "low", [], ["fotossensibilidade"]),
  procedure("Jato de plasma facial", "FACIAL", ["facial_olheiras", "facial_sinais_cicatrizes"], ["olheiras específicas", "sinais", "cicatrizes"], "equipment", "high", ["gestação", "Roacutan", "lesão suspeita", "pele sensibilizada"], ["fototipo alto", "hiperpigmentação"]),
  procedure("Crioterapia periocular", "FACIAL", ["facial_olheiras"], ["edema", "olheira vascular"], "thermal", "low", ["sensibilidade térmica"], ["sensibilidade periocular"]),
  procedure("Corrente galvanizada periocular", "FACIAL", ["facial_olheiras"], ["olheiras"], "electrotherapy", "moderate", electroAvoid, ["sensibilidade periocular"]),
  procedure("Eletrocautério facial", "FACIAL", ["facial_olheiras", "facial_sinais_cicatrizes"], ["sinais", "cicatrizes", "casos específicos"], "equipment", "high", ["gestação", "Roacutan", "lesão suspeita", "pele sensibilizada"], ["fototipo alto"]),
  procedure("Laser facial", "FACIAL", ["facial_flacidez_papada"], ["flacidez", "contorno"], "laser_light", "high", ["gestação"], lightCaution),
  procedure("Remoção de lesões benignas", "FACIAL", ["facial_sinais_cicatrizes"], ["nevos", "verrugas", "siringoma", "cicatriz atrófica"], "equipment", "high", ["lesão suspeita", "diagnóstico não confirmado"], ["cicatrização", "fototipo alto"], "Exige avaliação profissional específica e encaminhamento quando houver suspeita."),
  procedure("Limpeza de pele com extração e eletroterapias", "FACIAL", ["facial_outras"], ["limpeza de pele", "pele opaca"], "manual", "moderate", ["Roacutan", "pele sensibilizada"], ["sensibilidade"]),
  procedure("Revitalização facial", "FACIAL", ["facial_outras"], ["pele opaca", "revitalização", "perda de viço"], "manual", "low"),
  procedure("Drenagem linfática facial", "FACIAL", ["facial_outras"], ["edema facial", "drenagem facial"], "massage", "low", ["infecção ativa", "contraindicação circulatória"]),
  procedure("Detox facial", "FACIAL", ["facial_outras"], ["detox facial", "pele opaca"], "manual", "low"),

  // Corporais.
  procedure("Criolipólise", "BODY", ["corporal_gordura"], ["gordura localizada", "abdômen", "flancos", "culote"], "thermal", "high", ["gestação", "sensibilidade ao frio", "alterações circulatórias"], ["sensibilidade local"]),
  procedure("Ultrassom cavitacional corporal", "BODY", ["corporal_gordura", "corporal_celulite"], ["gordura localizada", "celulite"], "equipment", "high", electroAvoid, ["sensibilidade local"]),
  procedure("Ultrassom microfocado corporal", "BODY", ["corporal_gordura", "corporal_flacidez"], ["gordura localizada", "flacidez"], "equipment", "high", electroAvoid),
  procedure("Eletrolipólise", "BODY", ["corporal_gordura", "corporal_celulite"], ["gordura localizada", "celulite"], "electrotherapy", "high", electroAvoid),
  procedure("Vacum laser corporal", "BODY", ["corporal_gordura"], ["gordura localizada", "contorno corporal"], "laser_light", "moderate", ["alterações vasculares", "gestação"], ["sensibilidade local"]),
  procedure("Ondas de choque corporal", "BODY", ["corporal_gordura", "corporal_celulite", "corporal_flacidez"], ["gordura localizada", "celulite", "flacidez"], "equipment", "high", ["gestação", "alterações vasculares", "lesão local"], ["sensibilidade local"]),
  procedure("Manta térmica", "BODY", ["corporal_gordura"], ["gordura localizada", "relaxamento"], "thermal", "moderate", thermalAvoid),
  procedure("Correntes excitomotoras", "BODY", ["corporal_gordura"], ["tonificação", "contorno corporal"], "electrotherapy", "moderate", electroAvoid),
  procedure("Radiofrequência corporal", "BODY", ["corporal_gordura", "corporal_flacidez"], ["flacidez", "tonificação", "contorno corporal"], "thermal", "moderate", thermalAvoid, ["sensibilidade local", "medicação contínua"]),
  procedure("Criofrequência corporal", "BODY", ["corporal_gordura", "corporal_celulite", "corporal_flacidez"], ["flacidez", "celulite", "contorno"], "thermal", "moderate", thermalAvoid),
  procedure("Endermoterapia", "BODY", ["corporal_gordura", "corporal_celulite"], ["gordura localizada", "celulite", "fibrose"], "equipment", "moderate", ["alterações vasculares", "lesão local"], ["sensibilidade"]),
  procedure("Massagem modeladora", "BODY", ["corporal_gordura"], ["gordura localizada", "contorno"], "massage", "moderate", ["inflamação local", "alteração vascular"], ["sensibilidade"]),
  procedure("Striort", "BODY", ["corporal_estrias"], ["estrias recentes", "estrias antigas"], "equipment", "high", ["gestação", "pele sensibilizada"], ["fototipo alto", "hiperpigmentação"]),
  procedure("Eletrocautério corporal", "BODY", ["corporal_estrias"], ["estrias"], "equipment", "high", ["gestação", "pele sensibilizada"], ["fototipo alto"]),
  procedure("Jato de Plasma corporal", "BODY", ["corporal_estrias", "corporal_clareamento"], ["estrias", "clareamento específico"], "equipment", "high", ["gestação", "pele sensibilizada"], ["fototipo alto", "hiperpigmentação"]),
  procedure("Peeling de diamante corporal", "BODY", ["corporal_estrias"], ["estrias", "textura"], "peeling", "high", abrasiveAvoid, ["fototipo alto"]),
  procedure("Peeling químico corporal", "BODY", ["corporal_estrias"], ["estrias", "textura"], "peeling", "high", abrasiveAvoid, lightCaution),
  procedure("Laser corporal", "BODY", ["corporal_estrias"], ["estrias"], "laser_light", "high", ["gestação"], lightCaution),
  procedure("Tecarterapia corporal", "BODY", ["corporal_celulite", "corporal_flacidez"], ["celulite", "flacidez"], "thermal", "moderate", thermalAvoid),
  procedure("Corrente Russa", "BODY", ["corporal_celulite", "corporal_flacidez"], ["celulite", "tonificação"], "electrotherapy", "moderate", electroAvoid),
  procedure("Corrente Aussie", "BODY", ["corporal_flacidez"], ["tonificação", "flacidez"], "electrotherapy", "moderate", electroAvoid),
  procedure("Sonoforese", "BODY", ["corporal_celulite"], ["celulite", "ativos"], "equipment", "moderate", electroAvoid),
  procedure("Fotobiomodulação corporal", "BODY", ["corporal_flacidez"], ["flacidez", "reparo"], "laser_light", "low", [], ["fotossensibilidade"]),
  procedure("Eletroporação com ativos firmadores", "BODY", ["corporal_flacidez"], ["flacidez", "tonificação"], "electrotherapy", "moderate", electroAvoid),
  procedure("Peelings químicos clareadores corporais", "BODY", ["corporal_clareamento"], ["axila", "virilha", "coxa", "glúteos", "joelho", "cotovelo"], "peeling", "high", abrasiveAvoid, ["atrito", "fototipo alto", "hiperpigmentação"]),
  procedure("Fototerapia corporal", "BODY", ["corporal_clareamento"], ["clareamento corporal"], "laser_light", "low", [], lightCaution),
  procedure("Laser terapêutico corporal", "BODY", ["corporal_clareamento"], ["clareamento corporal"], "laser_light", "high", ["gestação"], lightCaution),
  procedure("Eletroporação com ativos clareadores", "BODY", ["corporal_clareamento"], ["clareamento corporal"], "electrotherapy", "moderate", electroAvoid, ["sensibilidade"]),
  procedure("Peeling de cristal corporal", "BODY", ["corporal_clareamento"], ["clareamento corporal"], "peeling", "high", abrasiveAvoid, ["atrito", "fototipo alto"]),
  procedure("Massagem relaxante com ventosa", "BODY", ["corporal_relaxamento"], ["relaxamento", "tensão muscular"], "massage", "moderate", ["alterações vasculares", "lesão local"], ["sensibilidade"]),
  procedure("Massagem com pedras quentes", "BODY", ["corporal_relaxamento"], ["relaxamento", "tensão muscular"], "thermal", "moderate", ["sensibilidade ao calor", "alterações circulatórias"], ["sensibilidade"]),
  procedure("Massagem com velas quentes", "BODY", ["corporal_relaxamento"], ["relaxamento"], "thermal", "moderate", ["sensibilidade ao calor", "alergias"], ["sensibilidade"]),
  procedure("Massagem com correntes elétricas", "BODY", ["corporal_relaxamento"], ["relaxamento", "tensão muscular"], "electrotherapy", "moderate", electroAvoid),
  procedure("Drenagem linfática corporal", "BODY", ["corporal_relaxamento"], ["retenção hídrica", "edema", "drenagem"], "massage", "low", ["alterações circulatórias importantes", "infecção ativa"]),
  procedure("Detox Corporal", "BODY", ["corporal_relaxamento"], ["detox", "relaxamento"], "manual", "low"),
  procedure("Spa dos pés", "BODY", ["corporal_relaxamento"], ["relaxamento", "spa dos pés"], "manual", "low", ["lesão ativa nos pés"])
];

export function procedureMatchesContext(procedureItem: MarieProcedure, contextText: string, risks: string[]) {
  const text = normalizeMarieText(`${contextText} ${risks.join(" ")}`);
  const avoidReasons = procedureItem.avoidWhen.filter((term) => text.includes(normalizeMarieText(term)));
  const cautionReasons = procedureItem.cautionWhen.filter((term) => text.includes(normalizeMarieText(term)));
  return { avoidReasons, cautionReasons };
}

export function proceduresForCategory(category: MarieProtocolKey, area: MarieArea) {
  return marieProcedureCatalog.filter((item) => item.categories.includes(category) && (area === "BOTH" || item.area === area));
}
