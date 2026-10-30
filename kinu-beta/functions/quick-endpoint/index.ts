// KINU · enrich v2 — verificação automática da curadoria via Google Places API (New)
// + modo coords (11/set/2026): preenche lat/lng das linhas publicadas sem coordenada.
// + modo fotos · modo tudo (escala).
// + CATÁLOGO VIVO v1 (30/out/2026):
//     · enrich com locationBias (âncora da cidade) + guarda de raio — Colmado nunca mais vira Nova York
//     · enrich grava google_website / google_phone / google_reservable / google_checked_at
//       e preenche booking_url / booking_phone / booking_mode em curated_activities quando estão vazios
//     · modo recheck: reconfere o que está published (Place Details) — fechou → draft sozinho;
//       nota baixa ou fechado temporariamente → recheck_flag (fila humana), continua published
// Substitui TODO o código da edge function (quick-endpoint) por este arquivo.
// Segredos necessários: GOOGLE_PLACES_API_KEY e SERVICE_ROLE_KEY.
//
// Chamadas:
//   modo padrão (enrich):  POST { "city": "Rio de Janeiro", "limit": 50 }
//     opcional: "table": "activities" | "hotels" | "both"  (padrão activities)
//     grava lat/lng na MESMA chamada do text search (não precisa do modo coords depois)
//   modo coords:           POST { "city": "Fortaleza", "mode": "coords" }
//   modo fotos:            POST { "city": "Fortaleza", "mode": "fotos" }
//   modo tudo (ESCALA):    POST { "mode": "tudo" }   -> coords + fotos nas cidades, encadeando a si mesma
//   modo recheck (30/out): POST { "mode": "recheck" }                      -> todas as cidades, published, mais antigas primeiro
//                          POST { "mode": "recheck", "city": "Paris" }     -> só uma cidade
//     opcionais: "dias": 30 (só reconfere quem foi conferido há mais de N dias; 0 = tudo) · "limite": 150
//                "table": "activities" | "hotels" | "both" (padrão both) · "dry_run": true
//     corta em ~50 s e devolve `restantes`; repita o POST até restantes = 0 (idempotente).
//
// Pré-requisito do catálogo vivo (uma vez, no SQL Editor do kinu-beta, aba "30 - ONDA"):
//   alter table curated_activities
//     add column if not exists google_website text,
//     add column if not exists google_phone text,
//     add column if not exists google_reservable boolean,
//     add column if not exists google_checked_at timestamptz,
//     add column if not exists recheck_flag text;
//   alter table curated_hotels
//     add column if not exists google_website text,
//     add column if not exists google_phone text,
//     add column if not exists google_reservable boolean,
//     add column if not exists google_checked_at timestamptz,
//     add column if not exists recheck_flag text;
//
// Pré-requisito do modo coords (uma vez, no SQL Editor do kinu-beta):
//   alter table curated_activities add column if not exists lat double precision;
//   alter table curated_activities add column if not exists lng double precision;
//   alter table curated_hotels     add column if not exists lat double precision;
//   alter table curated_hotels     add column if not exists lng double precision;

import { createClient } from "npm:@supabase/supabase-js@2";

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ───────────────────────────── modo padrão (enrich v2 + catálogo vivo) ─────────────────────────────

type Check = {
  verdict: "ok" | "atencao" | "fechado" | "nao_encontrado";
  apiError?: string;
  place_id?: string | null;
  rating?: number | null;
  reviews?: number;
  status?: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  // 30/out/2026 — catálogo vivo
  website?: string | null;
  phone?: string | null;
  reservable?: boolean | null;
  fora_de_raio?: boolean;
};

/** Campos pedidos ao Google no enrich. Contact (website, phone) e Atmosphere (rating, reservable) custam SKU próprio. */
const ENRICH_FIELDS =
  "places.id,places.displayName,places.rating,places.userRatingCount,places.businessStatus,places.formattedAddress,places.location," +
  "places.websiteUri,places.internationalPhoneNumber,places.reservable";

// 30/out/2026: `bias` é a âncora da cidade — o Google passa a preferir resultados perto dela, e o que
// cair fora do raio vira `atencao` (nunca `ok`), mesmo com nota alta. Antes, "Colmado Coffee Santiago"
// devolvia a filial de Nova York com verdict ok; só o endereço denunciava.
async function checkPlace(name: string, city: string, bias?: Coord | null, raioKm = RAIO_BUSCA_KM): Promise<Check> {
  const body: Record<string, unknown> = { textQuery: `${name} ${city}`, languageCode: "pt-BR" };
  if (bias) body.locationBias = { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50_000 } };
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": ENRICH_FIELDS,
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) return { verdict: "nao_encontrado", apiError: j.error.message ?? JSON.stringify(j.error) };
  const top = j.places?.[0];
  if (!top) return { verdict: "nao_encontrado" };

  const status: string = top.businessStatus ?? "UNKNOWN";
  const rating: number | null = top.rating ?? null;
  const reviews: number = top.userRatingCount ?? 0;

  const lat = Number(top.location?.latitude), lng = Number(top.location?.longitude);
  const coordOk = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const foraDeRaio = !!(bias && coordOk && distanciaKm({ lat, lng }, bias) > raioKm);

  let verdict: Check["verdict"] = "atencao";
  if (status === "CLOSED_PERMANENTLY") verdict = "fechado";
  else if (!foraDeRaio && status === "OPERATIONAL" && rating !== null && rating >= 4.2 && reviews >= 150) verdict = "ok";

  return {
    verdict,
    place_id: top.id ?? null,
    rating,
    reviews,
    status,
    address: top.formattedAddress ?? null,
    lat: coordOk ? lat : null,
    lng: coordOk ? lng : null,
    website: top.websiteUri ?? null,
    phone: top.internationalPhoneNumber ?? null,
    reservable: typeof top.reservable === "boolean" ? top.reservable : null,
    fora_de_raio: foraDeRaio,
  };
}

/** Deduz booking_mode a partir do que o Google sabe. Só é usado quando a linha ainda não tem modo. */
function bookingModeDe(c: Pick<Check, "reservable" | "website" | "phone">): string | null {
  if (c.reservable === true) return c.website ? "online" : (c.phone ? "phone" : null);
  if (c.reservable === false) return "walk_in";
  return null;
}

// 26/out/2026: a fila de revisão passa a cobrir curated_hotels.
// 30/out/2026: âncora + raio no text search; grava google_website/phone/reservable/checked_at;
// em curated_activities preenche booking_* vazios.
async function handleEnrich(city: string, limit: number, tabelas: Array<"curated_activities" | "curated_hotels">): Promise<Response> {
  const sondaVivo = await sondarCatalogoVivo();
  if (sondaVivo) return sondaVivo;

  const out: Record<string, string> = {};
  const porTabela: Record<string, number> = {};
  let firstApiError: string | null = null;
  let foraDeRaio = 0;
  const ancora = await ancoraDaCidade(city, ANCORAS_MANUAIS[city] ?? null);

  for (const tabela of tabelas) {
    const colunas = tabela === "curated_activities"
      ? "id,name,city,booking_mode,booking_url,booking_phone"
      : "id,name,city";
    let sel = await supabase.from(tabela).select(colunas).eq("city", city).eq("status", "needs_review").is("auto_check", null).limit(limit);
    if (sel.error && /auto_check/.test(`${sel.error.message ?? ""} ${sel.error.code ?? ""}`)) {
      sel = await supabase.from(tabela).select(colunas).eq("city", city).eq("status", "needs_review").limit(limit);
    }
    if (sel.error) throw sel.error;
    porTabela[tabela] = 0;

    for (const row of (sel.data ?? []) as Array<Record<string, unknown>>) {
      const c = await checkPlace(String(row.name), String(row.city), ancora.coord);
      if (c.apiError && !firstApiError) firstApiError = c.apiError;
      if (c.fora_de_raio) foraDeRaio++;

      const upd: Record<string, unknown> = { auto_check: c.verdict, google_checked_at: new Date().toISOString() };
      if (c.place_id !== undefined) {
        upd.place_id = c.place_id;
        upd.google_rating = c.rating;
        upd.google_reviews = c.reviews;
        upd.google_status = c.status;
        upd.google_address = c.address;
        upd.google_website = c.website ?? null;
        upd.google_phone = c.phone ?? null;
        upd.google_reservable = c.reservable ?? null;
        if (tabela === "curated_activities") {
          if (!row.booking_url && c.website) upd.booking_url = c.website;
          if (!row.booking_phone && c.phone) upd.booking_phone = c.phone;
          const modo = bookingModeDe(c);
          if (!row.booking_mode && modo) upd.booking_mode = modo;
        }
      }
      if (c.lat != null && c.lng != null) { upd.lat = c.lat; upd.lng = c.lng; }
      await gravar(tabela, String(row.id), upd);

      out[`${tabela === "curated_hotels" ? "hotel:" : ""}${row.id}`] = c.verdict + (c.fora_de_raio ? " (fora de raio)" : "");
      porTabela[tabela]++;
      await new Promise((res) => setTimeout(res, 120)); // gentileza com a API
    }
  }

  const resumo = Object.values(out).reduce((a: Record<string, number>, v) => {
    const k = v.replace(" (fora de raio)", "");
    a[k] = (a[k] ?? 0) + 1;
    return a;
  }, {});

  const body: Record<string, unknown> = {
    verificados: Object.keys(out).length,
    por_tabela: porTabela,
    resumo,
    fora_de_raio: foraDeRaio,
    ancora: { origem: ancora.origem, coord: ancora.coord },
    detalhe: out,
  };
  if (firstApiError) body.aviso_google = firstApiError; // erro da API nunca mais silencioso

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

// ───────────────────────────────── modo coords (aditivo) ─────────────────────────────────
//
// Regras: varre published + city + lat nula; Place Details quando há place_id (1 chamada,
// exata), text search "nome, cidade" quando não (grava lat/lng + place_id + endereço).
// Nunca grava meia coordenada nem 0,0. Guarda de raio contra o erro "caiu no bairro errado"
// em escala de país. Rodar de novo é seguro: o filtro é `lat is null`.

type Coord = { lat: number; lng: number };
type Tabela = "curated_activities" | "curated_hotels";

const RAIO_BUSCA_KM = 120;      // resultado de text search mais longe que isto da âncora é descartado
const FATOR_DETAILS = 3;        // Place Details tolera 3× (day trips: Ayutthaya a 80 km de Bangkok)
const TETO_MS = 50_000;         // corta antes do timeout do isolate; `restantes` diz quanto falta

function coordValida(lat: unknown, lng: unknown): Coord | null {
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a === 0 && b === 0) return null;               // golfo da Guiné = enrich que falhou
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

function distanciaKm(a: Coord, b: Coord): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function mediana(v: number[]): number {
  const s = [...v].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function placeDetails(placeId: string): Promise<Coord | null> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "location" },
  });
  const j = await r.json();
  if (j.error) throw new Error(`details: ${j.error.message ?? JSON.stringify(j.error)}`);
  return coordValida(j.location?.latitude, j.location?.longitude);
}

async function textSearch(query: string, bias?: Coord): Promise<{ coord: Coord | null; place_id: string | null; address: string | null }> {
  const body: Record<string, unknown> = { textQuery: query, languageCode: "pt-BR" };
  if (bias) body.locationBias = { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50_000 } };
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "places.id,places.location,places.formattedAddress",
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`search: ${j.error.message ?? JSON.stringify(j.error)}`);
  const top = j.places?.[0];
  if (!top) return { coord: null, place_id: null, address: null };
  return {
    coord: coordValida(top.location?.latitude, top.location?.longitude),
    place_id: top.id ?? null,
    address: top.formattedAddress ?? null,
  };
}

/** Âncora da cidade: mediana das linhas já resolvidas; sem nenhuma, busca pelo nome da cidade. */
async function ancoraDaCidade(city: string, manual?: Coord | null): Promise<{ coord: Coord | null; origem: string }> {
  if (manual) return { coord: manual, origem: "informada no payload" };
  const { data } = await supabase
    .from("curated_activities")
    .select("lat,lng")
    .eq("city", city)
    .not("lat", "is", null)
    .limit(200);
  const pts = (data ?? []).map((r) => coordValida(r.lat, r.lng)).filter((c): c is Coord => !!c);
  if (pts.length >= 3) {
    return { coord: { lat: mediana(pts.map((p) => p.lat)), lng: mediana(pts.map((p) => p.lng)) }, origem: `mediana de ${pts.length}` };
  }
  try {
    const s = await textSearch(`cidade de ${city}`);
    if (s.coord) return { coord: s.coord, origem: "busca pelo nome da cidade" };
  } catch { /* segue sem âncora */ }
  return { coord: null, origem: "nenhuma — varredura sem guarda de raio" };
}

/** Update tolerante: se a tabela não tiver place_id/google_address (hotéis), regrava só lat/lng. */
async function gravar(tabela: Tabela, id: string, upd: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(tabela).update(upd).eq("id", id);
  if (!error) return;
  const colunaAusente = /does not exist|42703|schema cache|PGRST204|Could not find the/i.test(`${error.message ?? ""} ${error.code ?? ""}`);
  if (!colunaAusente) throw error;
  const minimo = { lat: upd.lat, lng: upd.lng };
  const { error: e2 } = await supabase.from(tabela).update(minimo).eq("id", id);
  if (e2) throw e2;
}

async function handleCoords(body: Record<string, unknown>): Promise<Response> {
  const city = String(body.city ?? "").trim();
  if (!city) return json({ error: "city obrigatório" }, 400);

  const tableArg = String(body.table ?? "both");
  const tabelas: Tabela[] =
    tableArg === "activities" || tableArg === "curated_activities" ? ["curated_activities"]
    : tableArg === "hotels" || tableArg === "curated_hotels" ? ["curated_hotels"]
    : tableArg === "both" ? ["curated_activities", "curated_hotels"]
    : [];
  if (tabelas.length === 0) return json({ error: `table inválido: ${tableArg}` }, 400);

  const limite = Math.max(1, Math.min(1000, Number(body.limite ?? 300)));
  const dryRun = body.dry_run === true;
  const raioKm = Math.max(5, Number(body.raio_km ?? RAIO_BUSCA_KM));
  const inicio = Date.now();

  // 424: a coluna não existe → devolve o alter table em vez de gastar no Places
  const sonda = await supabase.from("curated_activities").select("lat").limit(1);
  if (sonda.error && /lat/.test(sonda.error.message ?? "")) {
    return json({
      error: "coluna lat/lng ausente",
      sql: "alter table curated_activities add column if not exists lat double precision; alter table curated_activities add column if not exists lng double precision; alter table curated_hotels add column if not exists lat double precision; alter table curated_hotels add column if not exists lng double precision;",
    }, 424);
  }

  const manual = body.ancora && typeof body.ancora === "object"
    ? coordValida((body.ancora as Record<string, unknown>).lat, (body.ancora as Record<string, unknown>).lng)
    : null;
  const ancora = await ancoraDaCidade(city, manual);

  const stats = { processadas: 0, por_place_id: 0, por_busca: 0, sem_resultado: 0, fora_de_raio: 0, erros: 0 };
  const por_tabela: Record<string, number> = {};
  const falhas: Record<string, string> = {};
  let restantes = 0;
  let cortou = false;

  for (const tabela of tabelas) {
    // select tolerante: hotéis podem não ter place_id
    let rows: Array<{ id: string; name: string; place_id?: string | null }> = [];
    let sel = await supabase.from(tabela).select("id,name,place_id").eq("city", city).eq("status", "published").is("lat", null).limit(limite);
    if (sel.error && /place_id/.test(sel.error.message ?? "")) {
      sel = await supabase.from(tabela).select("id,name").eq("city", city).eq("status", "published").is("lat", null).limit(limite);
    }
    if (sel.error) throw sel.error;
    rows = (sel.data ?? []) as typeof rows;
    por_tabela[tabela] = 0;

    for (const row of rows) {
      if (Date.now() - inicio > TETO_MS) { cortou = true; restantes += rows.length - por_tabela[tabela]; break; }
      try {
        let coord: Coord | null = null;
        let upd: Record<string, unknown> = {};
        let via: "place_id" | "busca" = "busca";

        if (row.place_id) {
          coord = await placeDetails(row.place_id);
          via = "place_id";
          if (coord && ancora.coord && distanciaKm(coord, ancora.coord) > raioKm * FATOR_DETAILS) {
            stats.fora_de_raio++; coord = null;
          }
          if (coord) upd = { lat: coord.lat, lng: coord.lng };
        }
        if (!coord) {
          const s = await textSearch(`${row.name}, ${city}`, ancora.coord ?? undefined);
          via = "busca";
          coord = s.coord;
          if (coord && ancora.coord && distanciaKm(coord, ancora.coord) > raioKm) {
            stats.fora_de_raio++; coord = null;
          }
          if (coord) upd = { lat: coord.lat, lng: coord.lng, place_id: s.place_id, google_address: s.address };
        }

        if (!coord) { stats.sem_resultado++; }
        else {
          if (!dryRun) await gravar(tabela, row.id, upd);
          if (via === "place_id") stats.por_place_id++; else stats.por_busca++;
        }
      } catch (e) {
        stats.erros++;
        falhas[row.id] = e instanceof Error ? e.message : JSON.stringify(e);
      }
      stats.processadas++;
      por_tabela[tabela]++;
      await new Promise((res) => setTimeout(res, 120));
    }
    if (cortou) break;
  }

  return json({
    modo: "coords",
    city,
    dry_run: dryRun,
    ...stats,
    concluida: !cortou,
    restantes,
    ancora: { origem: ancora.origem, coord: ancora.coord },
    raio_km: raioKm,
    por_tabela,
    falhas,
  });
}


// ───────────────────────────────── modo fotos (aditivo) ─────────────────────────────────
//
// Para cada linha published COM place_id e SEM photo_ref: Place Details (New) com fieldMask
// "photos" → guarda o nome do recurso da foto principal (places/…/photos/…) e a atribuição do
// autor (obrigatória pelos termos do Google). A imagem em si NÃO é guardada: o app a serve via
// function `place-photo` (proxy com a chave do servidor), como o Google exige.
// Pré-requisito: colunas photo_ref text, photo_attribution text nas duas tabelas.

async function placePhoto(placeId: string): Promise<{ ref: string | null; attribution: string | null; sem_foto: boolean }> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "photos" },
  });
  const j = await r.json();
  if (j.error) throw new Error(`details/photos: ${j.error.message ?? JSON.stringify(j.error)}`);
  const p = j.photos?.[0];
  if (!p?.name) return { ref: null, attribution: null, sem_foto: true };
  const a = p.authorAttributions?.[0];
  const attribution = a ? `${a.displayName ?? ""}${a.uri ? ` (${a.uri})` : ""}`.trim() || null : null;
  return { ref: p.name, attribution, sem_foto: false };
}

async function handleFotos(body: Record<string, unknown>): Promise<Response> {
  const city = String(body.city ?? "").trim();
  if (!city) return json({ error: "city obrigatório" }, 400);
  const tableArg = String(body.table ?? "both");
  const tabelas: Tabela[] =
    tableArg === "activities" || tableArg === "curated_activities" ? ["curated_activities"]
    : tableArg === "hotels" || tableArg === "curated_hotels" ? ["curated_hotels"]
    : tableArg === "both" ? ["curated_activities", "curated_hotels"] : [];
  if (tabelas.length === 0) return json({ error: `table inválido: ${tableArg}` }, 400);
  const limite = Math.max(1, Math.min(1000, Number(body.limite ?? 300)));
  const dryRun = body.dry_run === true;
  const inicio = Date.now();

  const sonda = await supabase.from("curated_activities").select("photo_ref").limit(1);
  if (sonda.error && /photo_ref/.test(sonda.error.message ?? "")) {
    return json({ error: "coluna photo_ref ausente", sql: "alter table curated_activities add column if not exists photo_ref text, add column if not exists photo_attribution text; alter table curated_hotels add column if not exists photo_ref text, add column if not exists photo_attribution text;" }, 424);
  }

  const stats = { processadas: 0, com_foto: 0, sem_foto: 0, sem_place_id: 0, erros: 0 };
  const por_tabela: Record<string, number> = {};
  const falhas: Record<string, string> = {};
  let restantes = 0, cortou = false;

  for (const tabela of tabelas) {
    // sem place_id não há o que buscar — o modo coords grava place_id pelo text search
    const semPid = await supabase.from(tabela).select("id", { count: "exact", head: true })
      .eq("city", city).eq("status", "published").is("place_id", null);
    stats.sem_place_id += semPid.count ?? 0;

    const sel = await supabase.from(tabela).select("id,place_id").eq("city", city).eq("status", "published")
      .not("place_id", "is", null).is("photo_ref", null).limit(limite);
    if (sel.error) throw sel.error;
    const rows = (sel.data ?? []) as Array<{ id: string; place_id: string }>;
    por_tabela[tabela] = 0;

    for (const row of rows) {
      if (Date.now() - inicio > TETO_MS) { cortou = true; restantes += rows.length - por_tabela[tabela]; break; }
      try {
        const f = await placePhoto(row.place_id);
        if (f.sem_foto) stats.sem_foto++;
        else {
          if (!dryRun) await gravar(tabela, row.id, { photo_ref: f.ref, photo_attribution: f.attribution });
          stats.com_foto++;
        }
      } catch (e) {
        stats.erros++;
        falhas[row.id] = e instanceof Error ? e.message : JSON.stringify(e);
      }
      stats.processadas++;
      por_tabela[tabela]++;
      await new Promise((res) => setTimeout(res, 120));
    }
    if (cortou) break;
  }
  return json({ modo: "fotos", city, dry_run: dryRun, ...stats, concluida: !cortou, restantes, por_tabela, falhas });
}


// ───────────────────────────────── modo tudo (escala) ─────────────────────────────────
//
// Varre TODAS as cidades publicadas, em ordem, rodando coords e depois fotos em cada uma. Como o
// isolate morre em ~60 s, cada rodada faz o que cabe em TETO_MS e depois chama a própria URL
// (fire-and-forget, com o service key) para continuar. Como coords/fotos filtram por `lat is null`
// / `photo_ref is null`, reprocessar é grátis: uma rodada que morrer no meio não estraga nada.
// Freio: `body.rodada` cresce a cada encadeamento; passou de MAX_RODADAS, para e avisa.

const MAX_RODADAS = 60;
const ANCORAS_MANUAIS: Record<string, Coord> = {
  "Porto Seguro": { lat: -16.4497, lng: -39.0647 },   // a busca "Porto Seguro" acha a seguradora em SP
};

async function cidadesPublicadas(): Promise<string[]> {
  const a = await supabase.from("curated_activities").select("city").eq("status", "published");
  if (a.error) throw a.error;
  const set = new Set<string>((a.data ?? []).map((r: { city: string }) => r.city));
  return [...set].sort();
}

async function pendentesDaCidade(city: string): Promise<{ coords: number; fotos: number }> {
  const [c1, c2, f1, f2] = await Promise.all([
    supabase.from("curated_activities").select("id", { count: "exact", head: true }).eq("city", city).eq("status", "published").is("lat", null),
    supabase.from("curated_hotels").select("id", { count: "exact", head: true }).eq("city", city).eq("status", "published").is("lat", null),
    supabase.from("curated_activities").select("id", { count: "exact", head: true }).eq("city", city).eq("status", "published").not("place_id", "is", null).is("photo_ref", null),
    supabase.from("curated_hotels").select("id", { count: "exact", head: true }).eq("city", city).eq("status", "published").not("place_id", "is", null).is("photo_ref", null),
  ]);
  return { coords: (c1.count ?? 0) + (c2.count ?? 0), fotos: (f1.count ?? 0) + (f2.count ?? 0) };
}

async function handleTudo(body: Record<string, unknown>, req: Request): Promise<Response> {
  const rodada = Number(body.rodada ?? 1);
  const dryRun = body.dry_run === true;
  if (rodada > MAX_RODADAS) return json({ modo: "tudo", parado: true, motivo: `passou de ${MAX_RODADAS} rodadas — algo não converge; veja pendentes` }, 200);

  const inicio = Date.now();
  const cidades = await cidadesPublicadas();
  const feito: Array<Record<string, unknown>> = [];
  let cortou = false;

  for (const city of cidades) {
    const pend = await pendentesDaCidade(city);
    if (pend.coords === 0 && pend.fotos === 0) continue;
    if (Date.now() - inicio > TETO_MS - 8_000) { cortou = true; break; }

    const sub: Record<string, unknown> = { city, mode: "coords", dry_run: dryRun, limite: 120 };
    if (ANCORAS_MANUAIS[city]) sub.ancora = ANCORAS_MANUAIS[city];
    const r1 = pend.coords > 0 ? await (await handleCoords(sub)).json() : null;
    if (Date.now() - inicio > TETO_MS - 8_000) { feito.push({ city, coords: r1 }); cortou = true; break; }
    const r2 = pend.fotos > 0 || (r1 && (r1.por_busca ?? 0) > 0)
      ? await (await handleFotos({ city, mode: "fotos", dry_run: dryRun, limite: 120 })).json() : null;
    feito.push({ city, coords: r1 && { processadas: r1.processadas, por_place_id: r1.por_place_id, por_busca: r1.por_busca, sem_resultado: r1.sem_resultado, erros: r1.erros },
                       fotos: r2 && { processadas: r2.processadas, com_foto: r2.com_foto, sem_foto: r2.sem_foto, erros: r2.erros } });
    if (Date.now() - inicio > TETO_MS - 8_000) { cortou = true; break; }
  }

  // ainda há pendência em alguma cidade? então encadeia a próxima rodada
  let restam = 0;
  for (const city of cidades) { const p = await pendentesDaCidade(city); restam += p.coords + p.fotos; }
  // itens sem ficha no Google ficam pendentes para sempre (sem_resultado/sem_foto): só encadeia se esta rodada avançou
  const avancou = feito.some((f) => {
    const c = f.coords as Record<string, number> | null, ph = f.fotos as Record<string, number> | null;
    return (c && (c.por_place_id + c.por_busca) > 0) || (ph && ph.com_foto > 0);
  });
  let encadeou = false;
  if (!dryRun && restam > 0 && avancou) {
    const key = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    fetch(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "apikey": key },
      body: JSON.stringify({ mode: "tudo", rodada: rodada + 1 }),
    }).catch(() => {});
    encadeou = true;
  }

  return json({ modo: "tudo", rodada, dry_run: dryRun, cidades: cidades.length, feito, cortou, pendentes_restantes: restam, avancou, proxima_rodada_disparada: encadeou,
    nota: encadeou ? "a próxima rodada já está rodando sozinha; confira o progresso por SQL ou repita o POST sem medo" : (restam > 0 ? "o que resta é sem ficha no Google — normal" : "tudo resolvido") });
}


// ───────────────────────────────── modo recheck (catálogo vivo, 30/out/2026) ─────────────────────────────────
//
// O enrich confere uma vez, na entrada. O recheck confere PARA SEMPRE: varre o que está published com
// place_id e google_checked_at nulo ou mais velho que `dias`, pede ao Place Details o estado atual e:
//   · CLOSED_PERMANENTLY       → status = 'draft', nota em `notes`, recheck_flag = 'fechado'   (sai do app no próximo sync)
//   · CLOSED_TEMPORARILY       → recheck_flag = 'fechado_temporariamente'                      (continua published; fila humana)
//   · rating < 4,0 com ≥ 150   → recheck_flag = 'nota_baixa'                                   (continua published; fila humana)
//   · OPERATIONAL e nota ok    → recheck_flag = null
// Sempre atualiza google_rating/reviews/status/address/website/phone/reservable e google_checked_at.
// Nunca muda booking_* que já exista (curadoria humana vence); preenche só o que está vazio.
// Custo: 1 Place Details por linha (Contact + Atmosphere). Mais antigas primeiro; corta em TETO_MS.

const RECHECK_FIELDS = "businessStatus,rating,userRatingCount,formattedAddress,websiteUri,internationalPhoneNumber,reservable";

async function sondarCatalogoVivo(): Promise<Response | null> {
  const sonda = await supabase.from("curated_activities").select("google_checked_at,recheck_flag").limit(1);
  if (sonda.error && /google_checked_at|recheck_flag/.test(sonda.error.message ?? "")) {
    return json({
      error: "colunas do catálogo vivo ausentes",
      sql: "alter table curated_activities add column if not exists google_website text, add column if not exists google_phone text, add column if not exists google_reservable boolean, add column if not exists google_checked_at timestamptz, add column if not exists recheck_flag text; alter table curated_hotels add column if not exists google_website text, add column if not exists google_phone text, add column if not exists google_reservable boolean, add column if not exists google_checked_at timestamptz, add column if not exists recheck_flag text;",
    }, 424);
  }
  return null;
}

async function placeEstado(placeId: string): Promise<{
  status: string; rating: number | null; reviews: number; address: string | null;
  website: string | null; phone: string | null; reservable: boolean | null;
}> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": RECHECK_FIELDS, "X-Goog-Language-Code": "pt-BR" },
  });
  const j = await r.json();
  if (j.error) throw new Error(`details/recheck: ${j.error.message ?? JSON.stringify(j.error)}`);
  return {
    status: j.businessStatus ?? "UNKNOWN",
    rating: j.rating ?? null,
    reviews: j.userRatingCount ?? 0,
    address: j.formattedAddress ?? null,
    website: j.websiteUri ?? null,
    phone: j.internationalPhoneNumber ?? null,
    reservable: typeof j.reservable === "boolean" ? j.reservable : null,
  };
}

async function handleRecheck(body: Record<string, unknown>): Promise<Response> {
  const sondaVivo = await sondarCatalogoVivo();
  if (sondaVivo) return sondaVivo;

  const city = String(body.city ?? "").trim();
  const tableArg = String(body.table ?? "both");
  const tabelas: Tabela[] =
    tableArg === "activities" || tableArg === "curated_activities" ? ["curated_activities"]
    : tableArg === "hotels" || tableArg === "curated_hotels" ? ["curated_hotels"]
    : tableArg === "both" ? ["curated_activities", "curated_hotels"] : [];
  if (tabelas.length === 0) return json({ error: `table inválido: ${tableArg}` }, 400);
  const limite = Math.max(1, Math.min(1000, Number(body.limite ?? 150)));
  const dias = Math.max(0, Number(body.dias ?? 30));
  const dryRun = body.dry_run === true;
  const inicio = Date.now();
  const corte = new Date(Date.now() - dias * 86_400_000).toISOString();
  const hoje = new Date().toISOString().slice(0, 10);

  const stats = { processadas: 0, ok: 0, fechados_para_draft: 0, fechados_temporariamente: 0, nota_baixa: 0, booking_preenchidos: 0, erros: 0 };
  const por_tabela: Record<string, number> = {};
  const mudancas: Record<string, string> = {};
  const falhas: Record<string, string> = {};
  let restantes = 0, cortou = false;

  for (const tabela of tabelas) {
    const colunas = "id,place_id,name,city,notes,google_checked_at"
      + (tabela === "curated_activities" ? ",booking_mode,booking_url,booking_phone" : "");
    // nulos primeiro (nunca conferidos), depois os mais antigos
    let q = supabase.from(tabela).select(colunas)
      .eq("status", "published").not("place_id", "is", null)
      .or(`google_checked_at.is.null,google_checked_at.lt.${corte}`)
      .order("google_checked_at", { ascending: true, nullsFirst: true })
      .limit(limite);
    if (city) q = q.eq("city", city);
    const sel = await q;
    if (sel.error) throw sel.error;
    const rows = (sel.data ?? []) as Array<Record<string, unknown>>;
    por_tabela[tabela] = 0;

    for (const row of rows) {
      if (Date.now() - inicio > TETO_MS) { cortou = true; restantes += rows.length - por_tabela[tabela]; break; }
      try {
        const e = await placeEstado(String(row.place_id));
        const upd: Record<string, unknown> = {
          google_rating: e.rating,
          google_reviews: e.reviews,
          google_status: e.status,
          google_address: e.address,
          google_website: e.website,
          google_phone: e.phone,
          google_reservable: e.reservable,
          google_checked_at: new Date().toISOString(),
          recheck_flag: null,
        };
        const id = `${tabela === "curated_hotels" ? "hotel:" : ""}${row.id}`;

        if (e.status === "CLOSED_PERMANENTLY") {
          upd.status = "draft";
          upd.recheck_flag = "fechado";
          upd.notes = `${row.notes ?? ""} · auto-aposentado ${hoje} (recheck): CLOSED_PERMANENTLY`.trim();
          stats.fechados_para_draft++;
          mudancas[id] = "fechado → draft";
        } else if (e.status === "CLOSED_TEMPORARILY") {
          upd.recheck_flag = "fechado_temporariamente";
          stats.fechados_temporariamente++;
          mudancas[id] = "fechado temporariamente (fila)";
        } else if (e.rating !== null && e.rating < 4.0 && e.reviews >= 150) {
          upd.recheck_flag = "nota_baixa";
          stats.nota_baixa++;
          mudancas[id] = `nota ${e.rating} com ${e.reviews} (fila)`;
        } else {
          stats.ok++;
        }

        if (tabela === "curated_activities") {
          let preencheu = false;
          if (!row.booking_url && e.website) { upd.booking_url = e.website; preencheu = true; }
          if (!row.booking_phone && e.phone) { upd.booking_phone = e.phone; preencheu = true; }
          const modo = bookingModeDe(e);
          if (!row.booking_mode && modo) { upd.booking_mode = modo; preencheu = true; }
          if (preencheu) stats.booking_preenchidos++;
        }

        if (!dryRun) await gravar(tabela, String(row.id), upd);
      } catch (err) {
        stats.erros++;
        falhas[String(row.id)] = err instanceof Error ? err.message : JSON.stringify(err);
      }
      stats.processadas++;
      por_tabela[tabela]++;
      await new Promise((res) => setTimeout(res, 120));
    }
    if (cortou) break;
  }

  return json({
    modo: "recheck", city: city || "todas", dias, dry_run: dryRun, ...stats,
    concluida: !cortou, restantes, por_tabela, mudancas, falhas,
    nota: cortou ? "repita o POST: ele continua de onde parou (mais antigas primeiro)" : "nada mais a reconferir dentro da janela",
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// ──────────────────────────────────────── handler ────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // modos aditivos; o modo padrão abaixo segue a mesma assinatura de sempre
    if (body?.mode === "coords") return await handleCoords(body);
    if (body?.mode === "fotos") return await handleFotos(body);
    if (body?.mode === "tudo") return await handleTudo(body, req);
    if (body?.mode === "recheck") return await handleRecheck(body);

    const { city, limit = 50 } = body;
    if (!city) {
      return new Response(JSON.stringify({ error: "city obrigatório" }), { status: 400 });
    }
    const tableArg = String(body.table ?? "activities");
    const tabelas: Array<"curated_activities" | "curated_hotels"> =
      tableArg === "activities" || tableArg === "curated_activities" ? ["curated_activities"]
      : tableArg === "hotels" || tableArg === "curated_hotels" ? ["curated_hotels"]
      : tableArg === "both" ? ["curated_activities", "curated_hotels"]
      : [];
    if (tabelas.length === 0) return json({ error: `table inválido: ${tableArg}` }, 400);
    return await handleEnrich(city, limit, tabelas);
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e, Object.getOwnPropertyNames(e as object));
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
