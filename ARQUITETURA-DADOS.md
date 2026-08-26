# ARQUITETURA DE DADOS — o contrato

Vale a partir da Fase B (arcos 4a-4f). Uma página, de propósito.

## A doutrina, em cinco linhas

- **O banco (`kinu-beta.trips`) é a fonte da verdade.**
- **O `localStorage` é cache de leitura + fila de escrita.** Nunca é a verdade;
  é a cópia rápida dela mais o que ainda não subiu.
- **`tripStore` é a porta única, síncrona.** Toda leitura e toda escrita de
  viagem passam por ele. Ninguém toca `kinu_trips` direto.
- **`tripSync` é o espelho (ida).** Local → banco, por outbox, com entrega
  garantida.
- **`tripHydration` é o retorno (volta).** Banco → local, destrutivo por
  natureza, com gate e proteções.

## Quem pode o quê

| módulo | lê | escreve | quando |
|---|---|---|---|
| `tripStore` | `kinu_trips` | `kinu_trips`, `kinu_price_history_*` | síncrono, sob demanda |
| `tripSync` | `kinu_trips` (diff), outbox | outbox, `trips` no banco | sino do store, `online`, `visibilitychange`, sessão |
| `tripHydration` | banco, outbox | `kinu_trips` **via `hydrateTrips`** | sessão, adoção, retorno de aba (piso 60s), botão do `/smoke` |
| `tripAdoption` | `kinu_trips_owner` | `kinu_trips_owner` | login com passado local |
| telas | `tripStore` | `tripStore` | — |

## As cinco regras que não se quebram

1. **Read-modify-write, sempre.** Nunca regravar o array inteiro a partir de
   estado React. É o que produz perda silenciosa entre abas.
2. **O outbox é lei.** O que está pendente não é sobrescrito nem removido pela
   hidratação. `delete` pendente nunca é ressuscitado.
3. **Falha não destrói.** Erro de rede, PostgREST ou promessa rejeitada deixam
   o `localStorage` intacto. Só um `select` que RESPONDEU move uma vírgula.
4. **`toRow()` é o único construtor de linha.** Exatamente
   `{ id, user_id, payload, schema_version }`. Colunas geradas nunca são enviadas.
5. **Hidratar não ecoa.** Escrita vinda do banco roda sob `absorbLocalWrite()` e
   não volta para o banco.

## O que este contrato NÃO promete (limitações declaradas)

- **Não há tempo real.** Frescor multi-dispositivo vem de: boot, decisão da
  adoção, retorno de aba (com piso de 60s) e recarga. Nada de polling.
- **A hidratação pode remover uma viagem aberta na tela** se ela foi apagada
  noutro dispositivo e não há nada pendente no outbox. O funil avisa no console
  e não grava por cima; trabalho não salvo naquele formulário se perde.
- **Eco entre abas.** `absorbLocalWrite()` silencia só a aba que hidratou. Outra
  aba aberta vê o evento `storage` e pode reenviar ao banco um payload idêntico
  ao que acabou de vir dele. Inofensivo no conteúdo, barulhento no `updated_at`.
- **Exclusão propaga pelo diff, não por chamada.** `clearTrips()` apaga o
  `localStorage`; os deletes nascem do diff do espelho e cobrem o que **este
  navegador conhece**. Viagem que existe no banco e nunca foi hidratada aqui não
  recebe delete.
- **`schema_version` diferente é ignorada, nunca apagada.** Cliente velho não
  destrói o que cliente novo escreveu.

## Onde está a história

`RELATORIO-RECON-ARCO5.md` (mapa), `RELATORIO-F3-ARCO4F-HIDRATACAO.md` (a porta
de volta), `RELATORIO-F3-ARCO4G-CORTE.md` (esta formalização).
