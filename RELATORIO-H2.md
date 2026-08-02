# Relatório — Hotéis curados, onda H2 (todas as cidades publicadas)

**Data:** 2026-08-02
**Escopo:** estender a camada de hotéis do piloto H1 (2 cidades) para **todas** as cidades com
`status='published'` na tabela `curated_hotels`.

## Resultado

**55 hotéis em 12 cidades** (antes: 20 em 2). Nenhuma mudança de comportamento no app ou na edge —
só mais dados no mesmo caminho já construído no H1.

| # | Cidade (app) | Cidade (banco) | Hotéis | Custo no prompt |
|---|---|---|---|---|
| 1 | Cartagena | Cartagena | 10 | 1.985 B |
| 2 | Gramado | Gramado | 10 | 1.964 B |
| 3 | Orlando | Orlando | 5 | 1.067 B |
| 4 | Rio de Janeiro | Rio de Janeiro | 4 | 880 B |
| 5 | Porto Seguro | Porto Seguro | 4 | 869 B |
| 6 | Buenos Aires | Buenos Aires | 4 | 865 B |
| 7 | Lisboa | Lisboa | 4 | 855 B |
| 8 | Paris | Paris | 3 | 735 B |
| 9 | **Roma** | `Rome` | 3 | 729 B |
| 10 | Salvador | Salvador | 3 | 723 B |
| 11 | **Tóquio** | `Tokyo` | 3 | 723 B |
| 12 | Fortaleza | Fortaleza | 2 | 608 B |
| | **Total** | | **55** | |

O custo é **por cidade ativa**, não somado: o payload só carrega os hotéis da cidade da viagem.
Pior caso é Cartagena, ~1,99 kB (≈500 tokens). O cap de 30 hotéis/cidade da edge nunca ativa
(máximo real: 10).

## Achado — `Rome`/`Tokyo` no banco vs `Roma`/`Tóquio` no app

As chaves de `curatedHotels` são consultadas por `getCuratedHotels(city)`, que recebe o nome vindo
de `CURATED_CITIES` (`src/lib/curatedCities.ts`). Duas cidades divergem entre banco e app:

| Banco | App (`CURATED_CITIES`) |
|---|---|
| `Rome` | `Roma` |
| `Tokyo` | `Tóquio` |

Sincronizadas cruas, essas 6 linhas entrariam no arquivo sob as chaves `Rome`/`Tokyo` e
**nunca seriam encontradas** — o lookup devolveria `null`, a seção de hotéis sumiria do prompt
nessas duas cidades e não haveria erro nem sintoma. Mesma família de falha silenciosa do
`RELATORIO-DEPLOY-EDGE.md`: o dado existe, o caminho existe, e mesmo assim não chega.

### Correção no `scripts/sync-hotels.ts`

1. **`CITY_KEY_ALIAS`** — a consulta usa o nome do banco; o arquivo é escrito com o nome do app.
2. **Validação obrigatória** — toda chave gerada é conferida contra `CURATED_CITIES`; se não bater,
   o script morre com instrução em vez de gravar dado morto:

   ```
   ❌ 'Rome' vira a chave 'Roma', que não existe em CURATED_CITIES.
      getCuratedHotels() nunca a encontraria. Acrescente um alias em CITY_KEY_ALIAS
      ou corrija o nome da cidade no banco.
   ```

3. **`DEFAULT_CITIES`** passa do par do H1 para as 12 da H2 — rodar sem argumento reproduz a onda.
4. Cidades com espaço no nome saem entre aspas na linha `Para atualizar:` do arquivo gerado
   (`'Rio de Janeiro'`), que antes era copiável mas errada.

> **Nota:** o alias é uma ponte, não a cura. O ideal é o banco falar o mesmo nome que o app. Enquanto
> as duas grafias existirem, todo pipeline novo que ler `curated_hotels` precisa do mesmo mapa.

## Comando

```bash
npx tsx scripts/sync-hotels.ts Cartagena Gramado Orlando 'Rio de Janeiro' 'Porto Seguro' \
  'Buenos Aires' Lisboa Salvador Rome Paris Tokyo Fortaleza
```

Só `src/data/curatedHotels.ts` (gerado) e `scripts/sync-hotels.ts` mudaram. `KinuAIContext.tsx` e a
edge function **não foram tocados** — a onda é puro dado.

## Validação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |
| Chaves geradas ⊆ `CURATED_CITIES` | ✅ 12/12, nenhuma órfã |
| `getCuratedHotels('Roma')` / `('Tóquio')` | ✅ 3 e 3 (era `null` antes do alias) |
| `getCuratedHotels('Rome')` / `('Tokyo')` | ✅ `null` — grafia do banco não vaza pro runtime |
| `getCuratedHotels('Nova York')` (sem curadoria) | ✅ `null`, seção some do prompt |
| ids duplicados (global, 55 linhas) | ✅ 0 |
| Campos obrigatórios vazios | ✅ nenhum |
| `rating` ausente ou 0 | ✅ nenhum |

## ⚠️ Produção não muda com este commit

O dado de hotel viaja no payload que o app monta, então **esta onda depende do deploy da edge que
ainda está bloqueado**. Enquanto a `kinu-ai` em produção for a versão antiga, ela ignora o campo
`hotels` — agora com 55 hotéis em vez de 20, e continua sem sintoma visível.

O bloqueio é de acesso, não de código: o `SUPABASE_ACCESS_TOKEN` gravado pertence a uma conta sem
privilégio no ref `lnhbamzhturwkhcwiohr` (403). Ver `RELATORIO-DEPLOY-EDGE.md` § *Bloqueio atual*
para as três formas de destravar. **Assim que destravar, um único deploy entrega H1 e H2 juntos.**

## O que ficou de fora

**45 linhas `needs_review`** não entraram (o script filtra `status='published'`). Elas são a maior
parte do estoque nas cidades pequenas — Fortaleza tem 2 publicadas e 6 em revisão:

| Cidade | published | needs_review |
|---|---|---|
| Fortaleza | 2 | 6 |
| Salvador | 3 | 5 |
| Rome | 3 | 5 |
| Paris | 3 | 5 |
| Tokyo | 3 | 5 |
| Rio de Janeiro | 4 | 4 |
| Porto Seguro | 4 | 4 |
| Buenos Aires | 4 | 4 |
| Lisboa | 4 | 4 |
| Orlando | 5 | 3 |
| Cartagena | 10 | 0 |
| Gramado | 10 | 0 |

Publicar essas 45 é o caminho óbvio para a H3, e não custa código nenhum: revisar no banco e
re-rodar o script.

## Pendências

- [ ] **Deploy da edge** — único bloqueio para H1+H2 valerem em produção (`RELATORIO-DEPLOY-EDGE.md`).
- [ ] **`gra-h-gramado-hostel`** continua `published` com `notes: 'H1 · VERIFICAR nome/operação ·
      verificado a olho 01/08'`. Herdado do H1 e ainda não resolvido — é a única linha publicada com
      ressalva nas 55.
- [ ] **Alinhar a grafia no banco** (`Rome`→`Roma`, `Tokyo`→`Tóquio`) e então remover o
      `CITY_KEY_ALIAS`. Enquanto não, o mapa é obrigatório em qualquer leitor novo da tabela.
- [ ] **`place_id`, `google_rating`, `google_reviews`, `auto_check` nulos em 55/55** — sem
      corroboração externa, o `rating` de cada hotel é curadoria manual, sem segunda fonte.
- [ ] **Cidades sem hotel nenhum:** 9 das 21 `CURATED_CITIES` (Nova York, Londres, Barcelona, Dubai,
      Cidade do Cabo, Istambul, Bangkok, Marrakech, Singapura). A seção some no prompt — degrada
      limpo, mas o agente fica sem hotel nessas viagens.
