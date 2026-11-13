# RELATORIO-M22B5 — importação: horário, ordem do usuário, um lugar por item
Commit `fix(import):` f5a5860. Proibidos/intocáveis intactos; function tocada: só `kinu-ai/index.ts` (ferramenta + regra 10b; 13, 16 e `criar_viagem` intactas). STEP1-M22*.md não comitados.

## Function
- `importar_roteiro`: item ganha `periodo` (enum cafe_da_manha|manha|almoco|tarde|jantar|noite); descrição de `hora` = só se o usuário escreveu.
- Regra 10b: (h) um lugar por item, (i) nome só o nome próprio, (j) hora só se escrita / periodo se indicado / nunca inventar, (k) ordem do usuário.
- Obs.: o prompt é template literal; os itens (i)/(j) saíram sem crases (crase quebrou o `deno check`).

## Biblioteca (`importItinerary.ts`, `importAgent.ts`)
- T1 hora explícita vence · T2 período → 08:00/10:00/12:30/15:00/20:00/21:30 (vence a categoria do catálogo) · T3 sem hora e sem período → fim do anterior + 30 min (primeiro do dia: 10:00) · T4 calculado antes do fim do anterior → fim + 30 (item de hora explícita nunca é movido) · T5 dia da chegada: sem hora explícita nunca antes do fim do item `-slot-checkin` da viagem (+30). Removidas as horas padrão por categoria (`CATALOG_DEFAULT_TIME`/`DEFAULT_TIME`). Duração = `durationHours` do catálogo, ou `defaultMinutesOf` para livres. Slot/tipo seguem a hora final.
- M1: mesmo id de catálogo duas vezes no MESMO dia → um só (o primeiro; não conta em `itens`). Dias diferentes: regra atual (`repetido`). `importCardLines` aplica o mesmo corte, para o cartão bater com a viagem.
- `normalizeImportDays` repassa `periodo`.
- T5 usou só o item de check-in da própria viagem: nenhuma função não exportada do motor.

## Testes
- Novo `m22b5-horarios.test.ts` (6): cena de Paris pelo caminho real (buildAgentImport → addTrip → listTrips). Afirmações 1–6 do pedido, todas verdes: Marais depois do check-in e Breizh 20:00; Louvre 09:00, Chartier entre o fim do Louvre e 15:00, Tulherias 15:00, Relais 20:00, nenhum par no mesmo horário em nenhum dia; dia 4 em ordem com horas crescentes e Angelina > 16:00; dia 5 = 1 item "Montmartre & Sacré-Cœur" 10:00 com foraDaJanela; 15 itens / 12 reconhecidos / 3 livres (Jardim das Tulherias, Café Constant, Notre-Dame), Louvre em dia fechado; leitura do index.ts.
- Asserts alterados em m22b1/m22b3/m22b4: **nenhum** — os três já passavam sem edição (suas cenas usam hora explícita ou só checam contagem/marcas). Nenhum teste fora do novo arquivo mudou de resultado.

## Gates
deno check ok · tsc limpo · eslint limpo nos 3 arquivos · vitest 93 arquivos, 944 passed, 0 failed (rodada DEPOIS do último ajuste) · build ok.

## Redeploy (Lovable): `supabase/functions/kinu-ai/index.ts` (único; `_shared/*` não tocados).

## Push do fix
```
To https://github.com/PedroContrucci/kinus-clan-compass
   58a0807..f5a5860  main -> main
```
