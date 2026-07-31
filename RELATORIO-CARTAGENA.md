# Relatório — Cartagena: suporte completo + catálogo curado (LOTE 4)

**Data:** 2026-07-31
**Commit:** `4168c74a9316e644f9ecc8f1602c3a0984e35031` — `feat: Cartagena full support + curated catalog (LOTE 4)`
**Push:** `e045bc5..4168c74  main -> main` — `local == origin/main` ✅
**Escopo:** 7 arquivos, 47 inserções, 1 remoção

## Contagem

| Cidade | const | Entradas | Banco | Validações |
|---|---|---|---|---|
| Cartagena | `cartagenaActivities` | **32** | 32 | contagem · ids únicos · paridade de ids · type-check · smoke em runtime ✅ |

Distribuição por categoria — as **6 seções** do prompt agrupado estão cobertas, nenhuma cai
em `📍 OUTROS`:

| `breakfast` | `morning` | `lunch` | `afternoon` | `dinner` | `night` |
|---|---|---|---|---|---|
| 4 | 7 | 4 | 7 | 6 | 4 |

## Andaime necessário (a cidade não existia no catálogo de atividades)

O `sync-catalog.ts` resolve a const **a partir do registry** (`:139-152`) e aborta se a chave
não existir. Cartagena tinha suporte apenas **parcial** — estava no catálogo de destinos, no
PDF, no Unsplash e no mapa de IATA do DraftCockpit, mas não em `destinationActivities.ts`.
Rodar o sync direto teria falhado com *"Cidade 'Cartagena' não encontrada no registry"*.

### Já existia (intocado)

| Arquivo | O que |
|---|---|
| `src/data/destinationCatalog.ts:110` | cidade na hierarquia do mapa (Colômbia, CTG, COP) |
| `src/data/destinationPdfData.ts:194,201` | descrição e consulado |
| `src/hooks/useUnsplash.ts:177` | query de imagem |
| `src/components/cockpit/DraftCockpit.tsx:81` | `'Cartagena': 'CTG'` |

### Criado neste commit

| Arquivo | Adição |
|---|---|
| `src/data/destinationActivities.ts` | `const cartagenaActivities` + entrada no registry (`cityCode: 'CTG'`) |
| `src/data/cityCoordinates.ts` | `lat: 10.3910, lng: -75.4794` — acende o pino no mapa-múndi |
| `src/lib/curatedCities.ts` | `'Cartagena'` em `CURATED_CITIES` — libera `criar_viagem` e `sugerir_destinos` do agente |
| `src/data/destinationDocs.ts` | `'Cartagena': 'Colômbia'` — documentação/visto |
| `src/lib/offersLinks.ts` | slug Civitatis `'cartagena-de-indias'` |
| `src/lib/createTrip.ts` | emoji `🏰` |
| `src/components/cockpit/DraftCockpit.tsx` | emoji `🏰` |

## Validação

Além das checagens internas do script (contagem · ids únicos · `tsc --noEmit`, com restauração
do arquivo em caso de falha):

**Paridade de ids contra o banco** — conjunto ordenado do PostgREST vs. ids extraídos do `.ts`:

```
banco=32 arquivo=32 diff=IDENTICOS
```

**Smoke em runtime** (`npx tsx`, importando os módulos de verdade):

```
registry           : Cartagena/CTG — 32 atividades
coordenadas        : { name: 'Cartagena', lat: 10.391, lng: -75.4794 }
CURATED_CITIES     : true
isCityCurated      : true
ids unicos         : true
campos obrigatorios: true
```

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |

## Decisões registradas

- **`WizardStep1Logistics.tsx` não foi tocado.** Aquela lista é de aeroportos de **origem**
  (cidades brasileiras de partida); Cartagena é destino. Salvador aparece lá por ser as duas
  coisas.
- **`SmokeTest.tsx` não foi tocado.** É uma lista de cenários de teste, não um registro de
  suporte. Um cenário "Cartagena" pode ser adicionado se houver interesse em cobertura.
- **Slug Civitatis `cartagena-de-indias`** — segue o padrão em espanhol já usado no arquivo
  (`'Nova York': 'nueva-york'`, `'Tóquio': 'tokio'`, `'Cidade do Cabo': 'ciudad-del-cabo'`).
  ⚠️ Não validado contra a Civitatis; é o slug canônico da cidade lá, mas vale um clique de
  conferência no link de ofertas.

## Estado acumulado do catálogo curado

| Lote | Cidades | Atividades |
|---|---|---|
| 1 | Salvador | 61 |
| 2 | Lisboa · Rome · Buenos Aires · Orlando | 161 |
| 3 | Paris · Tokyo | 119 |
| 4 | **Cartagena** | **32** |
