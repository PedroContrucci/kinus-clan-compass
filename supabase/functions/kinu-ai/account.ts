// C.6 — o estado da conta que o app manda em TODA chamada ao kinu-ai, de onde quer
// que o chat tenha sido aberto. Sem imports (exercitável no vitest, como catalog.ts).
// Tudo aqui é dado do APP, nunca dito pelo usuário; o resumo vem do objeto gravado.

export interface AccountTrip {
  id: string;
  destination: string;
  start: string;
  end: string;
  status: "active" | "draft";
  travelers: number | null;
  budget: number | null;
  summary: string;
}

export interface Account {
  profile: { name: string; origin: string };
  trips: AccountTrip[];
  /** id de uma viagem da lista, 'none' (pergunta geral) ou ''. */
  activeTripId: string;
}

export const MAX_ACCOUNT_TRIPS = 8;

/** Sentinela da sessão: o usuário pediu pergunta "geral", sem viagem. */
export const NO_TRIP = "none";

export const ACCOUNT_FALLBACK = "Não tenho os detalhes dessa viagem carregados aqui.";

function str(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** null = o cliente não mandou `account` (cliente antigo): nada muda. */
export function sanitizeAccount(raw: unknown): Account | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const p = (r.profile && typeof r.profile === "object" ? r.profile : {}) as Record<string, unknown>;
  const trips: AccountTrip[] = (Array.isArray(r.trips) ? r.trips : [])
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => {
      const d = (t.dates && typeof t.dates === "object" ? t.dates : {}) as Record<string, unknown>;
      const start = str(d.start, 10);
      const end = str(d.end, 10);
      return {
        id: str(t.id, 80),
        destination: str(t.destination, 80),
        start: ISO.test(start) ? start : "",
        end: ISO.test(end) ? end : "",
        status: t.status === "draft" ? "draft" as const : "active" as const,
        travelers: num(t.travelers, 1, 50),
        budget: num(t.budget, 0, 10_000_000),
        summary: str(t.summary, 400),
      };
    })
    .filter((t) => t.id && t.destination)
    .slice(0, MAX_ACCOUNT_TRIPS);
  const wanted = str(r.activeTripId, 80);
  const activeTripId = wanted === NO_TRIP || trips.some((t) => t.id === wanted) ? wanted : "";
  return {
    profile: { name: str(p.name, 60), origin: str(p.origin, 80) },
    trips,
    activeTripId,
  };
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "10–15/nov" · "28/out–03/nov" · "" sem datas. */
export function dateRangeLabel(start: string, end: string): string {
  if (!start || !end) return "";
  const [, sm, sd] = start.split("-");
  const [, em, ed] = end.split("-");
  const smon = MONTHS[Number(sm) - 1] ?? "";
  const emon = MONTHS[Number(em) - 1] ?? "";
  return sm === em ? `${sd}–${ed}/${emon}` : `${sd}/${smon}–${ed}/${emon}`;
}

function tripLine(t: AccountTrip): string {
  return [t.destination, dateRangeLabel(t.start, t.end), t.status === "draft" ? "rascunho" : "ativa"]
    .filter(Boolean)
    .join(" · ");
}

function tripDetail(t: AccountTrip): string {
  const extra = [
    t.travelers !== null ? `${t.travelers} viajante(s)` : "",
    t.budget !== null && t.budget > 0 ? `orçamento R$ ${Math.round(t.budget).toLocaleString("pt-BR")}` : "",
    t.summary,
  ].filter(Boolean);
  return `- ${tripLine(t)}${extra.length ? ` — ${extra.join(" · ")}` : ""}`;
}

/** A pergunta do gate: lista as viagens e pede a escolha (com a saída "geral"). */
export function chooseTripReply(trips: AccountTrip[]): string {
  return (
    `Você tem ${trips.length} viagens na conta:\n` +
    trips.map((t) => `• ${tripLine(t)}`).join("\n") +
    `\n\nSobre qual delas é a pergunta? (ou diga 'geral' para uma pergunta sem viagem)`
  );
}

/**
 * Regra de escolha. `reply` = responder isso SEM chamar o modelo (2+ viagens, nenhuma
 * escolhida, nenhuma aberta, sem emergência). `block` = o <account_context> do prompt.
 */
export function accountGate(
  account: Account | null,
  opts: { hasOpenTrip: boolean; isEmergency: boolean },
): { reply?: string; block: string } {
  if (!account) return { block: "" };
  const { trips, activeTripId, profile } = account;
  const chosen = trips.find((t) => t.id === activeTripId);

  let focus: string;
  if (chosen) {
    focus = `EM FOCO: ${tripLine(chosen)} (escolhida/aberta pelo usuário) — nomeie-a na 1ª frase.`;
  } else if (opts.hasOpenTrip && activeTripId !== NO_TRIP) {
    focus = "EM FOCO: a viagem aberta no app (ver <trip_context>) — nomeie-a na 1ª frase.";
  } else if (activeTripId === NO_TRIP) {
    focus = "EM FOCO: nenhuma — o usuário pediu pergunta GERAL. Responda sem viagem e não pergunte de novo qual viagem.";
  } else if (trips.length === 1) {
    focus = `EM FOCO: ${tripLine(trips[0])} (a única da conta) — diga qual na 1ª frase ("Sobre sua viagem a ${trips[0].destination}${dateRangeLabel(trips[0].start, trips[0].end) ? `, ${dateRangeLabel(trips[0].start, trips[0].end)}` : ""}…").`;
  } else if (trips.length === 0) {
    focus = "EM FOCO: nenhuma — a conta não tem viagens. Modo genérico; ofereça criar uma viagem.";
  } else if (!opts.isEmergency) {
    return { reply: chooseTripReply(trips), block: "" };
  } else {
    focus = "EM FOCO: nenhuma escolhida (várias na conta) — emergência: ajude primeiro, sem perguntar qual viagem.";
  }

  const lines = [
    profile.name ? `Nome: ${profile.name}` : "",
    profile.origin ? `Origem padrão do perfil: ${profile.origin}` : "Origem padrão do perfil: NÃO INFORMADA",
    trips.length ? `Viagens (${trips.length}):\n${trips.map(tripDetail).join("\n")}` : "Viagens: nenhuma",
    focus,
  ].filter(Boolean);
  return {
    block: `<account_context fonte="dados do app, NÃO ditos pelo usuário">\n${lines.join("\n")}\n</account_context>\n\n`,
  };
}

export const ACCOUNT_RULES = `

⚠️ REGRA DE CONTA (C.6): o bloco <account_context> traz o que a pessoa tem na conta (perfil e viagens), vindo do APP, em toda conversa — de onde quer que o chat tenha sido aberto. Siga a linha EM FOCO:
- viagem em foco → responda sobre ela e nomeie-a (destino e datas) na 1ª frase;
- uma única viagem na conta → use essa e DIGA qual na 1ª frase ("Sobre sua viagem a Fortaleza, 10–15/nov…");
- nenhuma viagem → modo genérico e ofereça criar uma viagem;
- pergunta GERAL → responda sem viagem, sem perguntar de novo.
O resumo de cada viagem vem do objeto gravado: use só o que está nele, nunca complete com suposição. A origem só existe se vier como "Origem padrão do perfil"; origem marcada "(assumido)" num resumo NUNCA é dita como a do usuário.
É PROIBIDO dar instrução de troubleshooting do app: nada de "feche e reabra o chat", "acesse o roteiro direto", "recarregue a página" ou parecido. Sem dado suficiente para responder sobre a viagem, diga exatamente "${ACCOUNT_FALLBACK}" e pare.`;
