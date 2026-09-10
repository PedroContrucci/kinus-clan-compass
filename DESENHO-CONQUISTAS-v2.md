# DESENHO — Conquistas & Nível do Viajante v2 (consolidado)

**Base:** 28/ago/2026 · consolidado em 10/set/2026 com as decisões dos arcos de eventos.
**Infra:** tabela `events` do kinu-beta (user_id, name, props, created_at — grant/RLS provados em 10/09) · coluna `landmark_tier` em `curated_activities` (21 cidades classificadas, 1 icon · 8 essential · 5 hidden_gem cada — **exceto Fortaleza e Gramado, com 4 hidden_gem**, conferido no banco em 10/09; nenhum molde depende de 5, o Segredo pede 1).

## 0. Princípio inegociável
Conquista premia **viagem vivida**, nunca tempo de tela. Régua: a pessoa contaria num churrasco. Sem streak, sem XP de clique. Conquistas derivam de eventos de VIAGEM, não de interface.

## 1. Taxonomia de eventos (a instrumentação — implementada em `src/lib/tripEvents.ts`)
| Evento | Quando | props |
|---|---|---|
| `trip.created` | rascunho criado | `{trip_id, destination, origin: 'wizard'\|'kinu_ai'}` |
| `trip.activated` | ativação (botão ou implícita ao confirmar item de rascunho) — UMA vez por trip_id (marca `activatedEventAt` na viagem) | `{trip_id, destination, country?, continent?, days, travelers, children?}` |
| `trip.completed` | endDate < hoje, varrido no boot, só status active/ongoing/completed — UMA vez (marca `completedEventAt`) | `{trip_id, destination, country?, continent?, days}` |
| `trip.item_confirmed` | item marcado confirmado | `{trip_id, kind: 'flight'\|'hotel'\|'activity', item_id}` |
| `budget.closed_under` | no completed, se confirmado+planejado ≤ orçamento | `{trip_id, budget, planned}` |
| `trip.checkin` | check-in pós-viagem enviado (a construir) | `{trip_id, city, lived_ids: [..], skipped: n}` |
| `cla.feedback_sent` | feedback enviado | `{page}` |
| `hotel.reasons_viewed` / `hotel.detail_opened` / `hotel.swapped` | transparência do hotel | ver RELATORIO-HOTEL-TRANSPARENTE |
| `onboarding.*` | welcome/path/hints/reset | ver onboarding v1.5 |
| `achievement.unlocked` | RESERVADO ao motor | `{key, level?}` |

Decisões: continente colapsa as 6 regiões do catálogo (Brasil→Américas, Ásia & Oriente Médio→Ásia); **Américas não separa norte/sul** (Cidadão do Mundo herda isso conscientemente); destino fora do catálogo omite country/continent; sem usuário logado não emite; dedupe no servidor é do motor.

## 2. Fonte da verdade da vivência
- **Check-in pós-viagem** (a construir): ao concluir, o KINU mostra o roteiro e pergunta "o que vocês viveram de verdade?" → `trip.checkin`.
- **Fallback:** item confirmado (`trip.item_confirmed`) em viagem concluída (`trip.completed`).
- Bônus: mede promessa vs. entrega do roteiro; semente do recap.

## 3. Camada Mundo — 14 troféus
| Chave | Nome | Critério |
|---|---|---|
| primeira_fogueira | Primeira Fogueira | 1ª viagem ativada |
| pe_na_estrada | Pé na Estrada | 1ª viagem concluída |
| cla_em_movimento | Clã em Movimento | 1ª concluída com children > 0 |
| maratonista | Maratonista do Clã | concluída com 10+ dias |
| bandeirante | Bandeirante | 3 destinos distintos concluídos |
| cartografo | Cartógrafo | 5 países distintos |
| cidadao_do_mundo | Cidadão do Mundo | 3 continentes distintos |
| raizes_fortes | Raízes Fortes | 3 concluídas no Brasil |
| capitao_do_orcamento | Capitão do Orçamento | 1ª fechada dentro do orçamento |
| tesoureiro_do_cla | Tesoureiro do Clã | 3 dentro do orçamento |
| tudo_no_lugar | Tudo no Lugar | voo + hotel + 3 atividades confirmados antes da partida |
| co_piloto | Co-piloto | 1ª viagem criada pelo KINU AI e ativada |
| primeiro_registro / album_do_cla | (reservadas — memórias, 2027) | |

XP: viagem concluída 100 · país novo 50 · continente novo 150 · dentro do orçamento 50 · conquista 25. Níveis: Aprendiz do Clã 0 → Explorador 100 → Desbravador 300 → Guardião das Rotas 700 → Ancião do Clã 1500.

## 4. Camada Local — gerada do catálogo (5 moldes × 21 cidades = 105)
| Molde | Nome-padrão (ex. Paris) | Critério (check-in; fallback confirmado+concluído) | XP |
|---|---|---|---|
| Carimbo | "Carimbo: Paris" | 1ª viagem concluída na cidade | 25 |
| Ícone | nome próprio por cidade | viveu o item `landmark_tier='icon'` | 25 |
| Essenciais | "Coração de Paris" | viveu 5 itens `essential` | 50 |
| Garfo local | "Garfo Parisiense" | viveu 3 itens gastronômicos do catálogo | 25 |
| Segredo do Clã | "Segredo de Paris" | viveu 1 item `hidden_gem` | 50 |

Implementada em `src/lib/localAchievements.ts` (moldes e nomes) + `src/data/generated/landmarkTiers.ts` (gerado pelo `sync-catalog.ts --apply`; é a única ponte entre `landmark_tier` e o runtime). Chaves `local.<slug>.<molde>`, com `<molde>` em carimbo · icone · coracao · garfo · segredo.

**Três decisões que o §4 não tinha:** (a) o casamento é por **id do catálogo**, extraído do id do item de roteiro (`day-1-for-mercado-peixes` → `for-mercado-peixes`) — nome é texto de tela e muda com uma correção de acento; (b) havendo `trip.checkin` na viagem, os confirmados dela **não** somam — o check-in é o que a pessoa viveu, e somar apagaria o `skipped`; (c) o XP é por molde (25/25/50/25/50), então `computeProgress` soma valores em vez de contar × 25.

**Consequência registrada, não corrigida:** a escada de níveis do §3 foi calibrada só para a Mundo. Com a Local, uma cidade bem vivida vale até 175 XP extras e a primeira viagem pode chegar perto de Guardião das Rotas. Recalibrar a escada é outra missão.

Troféus-ícone batizados: Guardiã do Tejo (Lisboa) · Dama de Ferro (Paris) · De Braços Abertos (Rio) · Coração do Pelô (Salvador) · Rei das Marés (Fortaleza) · Obra Inacabada (Barcelona) · Gladiador do Clã (Roma) · Chama da Liberdade (NY) · Batida do Big Ben (Londres) · Alma de Tango (Buenos Aires) · Toque no Céu (Dubai) · Travessia de Shibuya (Tóquio) · Cisne do Lago Negro (Gramado) · Marco Zero do Brasil (Porto Seguro) · Reino da Magia (Orlando) · Pérola do Caribe (Cartagena) · Sabedoria de Bizâncio (Istambul) · Coração da Medina (Marrakech) · Jardim do Futuro (Singapura) · Guardião da Esmeralda (Bangkok) · Topo da Mesa (Cidade do Cabo).

## 5. UI (quando for a hora)
Perfil: nível + barra de XP + grade de troféus (bloqueados em silhueta). Celebração ao destravar. Recap pós-viagem (com o "depois" v1). Sem ranking público na v1 — o Clã compara dicas, não pontos.
Seção **"Por destino"** abaixo da Mundo: cidade com viagem abre com os 5 troféus; as demais numa linha compacta "N destinos esperando" que expande em lista de nomes. Sem contagem por cidade e sem barra — é convite de viagem, não placar.

## 6. Sequência (estado em 10/09)
1. ✅ `landmark_tier` nas 21 cidades
2. ✅ Eventos de viagem instrumentados (`tripEvents.ts`, 01ba151)
3. ✅ Check-in pós-viagem (Lovable) — emite `trip.checkin` com `{trip_id, city, lived_ids, lived_names, skipped, note_len}`. **`lived_ids` e `lived_names` chegam como STRING** (separadores `','` e `' | '`), não como array: o motor aceita as duas formas.
4. ✅ Motor: `achievementEngine.ts` computa `events` → grava `achievement.unlocked` idempotente por chave natural lida do servidor. **Sem RPC:** rodando no cliente com a RLS *own*, o usuário lê os próprios eventos direto — a RPC `security definer` só faria falta se o motor rodasse com `service_role`.
5. ✅ UI do Perfil (`AchievementsPanel` no `/conta` + `AchievementCelebration` no App)
6. ✅ Retroativo — não é um modo: toda passada lê o histórico inteiro, então quem já viajou acorda com os troféus sem migração nenhuma.
7. ✅ Camada Local (§4) — 105 troféus gerados das 21 cidades, sobre os ids vividos.

**Duas diferenças entre o §3 e o que o motor implementa**, ambas por falta de dado nos eventos:
`tudo_no_lugar` não checa "antes da partida" (nenhum evento carrega `startDate`; mede voo + hotel
+ 3 atividades na mesma viagem) e `cla_em_movimento` cruza o `children` da **ativação** com a
conclusão — viagem ativada antes de 01ba151 não tem esse evento e não destrava.
