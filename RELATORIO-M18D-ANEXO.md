# ANEXO M18d — atividades de manhã/tarde por cidade (insumo para curar OPEN_CONFIRMED)

Fonte: `src/data/destinationActivities.ts` (campo `estimatedCostBRL`, custo por pessoa em R$). Período: manhã = morning, tarde = afternoon.
Regra de "livre" (D1): custo 0 E sem styleTag `shopping` E id sem `outlet`/`mall`. (a) = pagas (indisponíveis no feriado duro até entrar em OPEN_CONFIRMED); (b) = livres (sempre permitidas). Gratuitas de compras ficam fora das duas tabelas e vão numa linha à parte (também indisponíveis).

## Paris

### (a) Pagas — 24

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| par-jardin-des-plantes | Jardin des Plantes e Ménagerie | manhã | 80 | nature, family |
| par-la-vallee-village | La Vallée Village (outlet) | manhã | 40 | shopping, daytrip |
| par3-cite-sciences | Cité des Sciences (La Villette) | manhã | 60 | family, culture |
| par3-disneyland | Disneyland Paris (dia inteiro) | manhã | 450 | family, daytrip |
| par3-giverny | Day-trip a Giverny (jardins de Monet) | manhã | 120 | nature, art, romantic, daytrip |
| par3-jardin-acclimatation | Jardin d'Acclimatation | manhã | 80 | family |
| par3-mouffetard | Rue Mouffetard (mercado de rua) | manhã | 30 | gastronomy, culture |
| par3-orangerie | Musée de l'Orangerie | manhã | 45 | art, culture |
| par3-versailles | Day-trip a Versalhes | manhã | 150 | history, culture, daytrip |
| paris-catacombes | Catacumbas de Paris | manhã | 110 | culture, adventure |
| paris-louvre | Museu do Louvre | manhã | 80 | culture, history, art |
| paris-orsay | Museu d'Orsay | manhã | 70 | culture, art |
| paris-pantheon | Panthéon | manhã | 70 | culture, history |
| paris-sainte-chapelle | Sainte-Chapelle | manhã | 80 | culture, history |
| paris-tour-eiffel-top | Torre Eiffel (subir até o topo) | manhã | 320 | culture, romantic |
| par3-bercy | Bercy Village | tarde | 40 | family, relaxation |
| par3-berthillon | Berthillon (Île Saint-Louis) | tarde | 20 | gastronomy |
| par3-canal-picnic | Fim de tarde no Canal Saint-Martin | tarde | 20 | relaxation, romantic |
| par3-marionetes | Marionetes do Jardim de Luxemburgo | tarde | 20 | family, culture |
| par3-pierre-herme | Pierre Hermé (macarons) | tarde | 30 | gastronomy |
| par3-rodin | Musée Rodin (jardins) | tarde | 40 | art, romantic |
| paris-champs-elysees | Champs-Élysées & Arco do Triunfo | tarde | 65 | culture, shopping |
| paris-palais-garnier-visit | Palais Garnier (Ópera de Paris) | tarde | 80 | culture, art |
| paris-sena-cruzeiro | Cruzeiro no Sena | tarde | 80 | romantic, family |

### (b) Livres — 11

| id | nome | período | styleTags |
|---|---|---|---|
| par-bois-vincennes | Bois de Vincennes e Parc Floral | manhã | nature, family, relaxation |
| par3-carnavalet | Musée Carnavalet | manhã | culture, history |
| par3-coulee-verte | Coulée Verte (Promenade Plantée) | manhã | nature, relaxation |
| paris-montmartre | Montmartre & Sacré-Cœur | manhã | culture, history, romantic |
| paris-notre-dame | Île de la Cité & Notre-Dame | manhã | culture, history |
| paris-notre-dame-exterior | Catedral de Notre-Dame (parte externa pós-incêndio) | manhã | culture, history |
| par-buttes-chaumont | Parc des Buttes-Chaumont | tarde | nature, relaxation, romantic |
| par3-galerie-vivienne | Galerie Vivienne | tarde | culture, romantic |
| paris-luxembourg | Jardins de Luxembourg | tarde | nature, family, relaxation |
| paris-quartier-latin | Bairro Latino e Shakespeare & Co | tarde | culture |
| paris-tuileries | Tuileries Garden | tarde | nature, romantic |

Gratuitas de compras (fora de (b), indisponíveis): par-bon-marche, paris-galeries-lafayette, paris-marais-walk, paris-saint-ouen

## Lisboa

### (a) Pagas — 22

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| lis-botanico-tropical | Jardim Botânico Tropical (Belém) | manhã | 20 | nature, family, history |
| lis-castelo-sao-jorge | Castelo de São Jorge | manhã | 95 | history, culture, family |
| lis-costa-caparica | Praia da Costa da Caparica | manhã | 20 | beach, relaxation, family |
| lis-gulbenkian | Museu Calouste Gulbenkian | manhã | 60 | art, culture |
| lis-jeronimos | Mosteiro dos Jerónimos | manhã | 75 | history, culture, art |
| lis-oceanario | Oceanário de Lisboa | manhã | 130 | family, nature |
| lis-praia-adraga | Praia da Adraga (Sintra) | manhã | 60 | beach, nature, romantic |
| lis-praia-carcavelos | Praia de Carcavelos | manhã | 15 | beach, family, relaxation |
| lis-praia-tamariz | Praia do Tamariz (Estoril) | manhã | 15 | beach, family, relaxation |
| lis-torre-belem | Torre de Belém | manhã | 50 | history, culture |
| lis2-cascais | Bate-volta a Cascais + Boca do Inferno | manhã | 120 | beach, relaxation, family, daytrip |
| lis2-feira-ladra | Feira da Ladra | manhã | 20 | culture |
| lis2-pavilhao | Pavilhão do Conhecimento | manhã | 60 | family, culture |
| lis2-sintra | Bate-volta a Sintra (Palácio da Pena) | manhã | 180 | nature, culture, family, daytrip |
| lis-jardim-botanico | Jardim Botânico de Lisboa (Príncipe Real) | tarde | 20 | nature, relaxation, romantic |
| lis-praia-guincho | Praia do Guincho | tarde | 40 | beach, nature, adventure |
| lis-santa-justa-carmo | Elevador de Santa Justa e Convento do Carmo | tarde | 45 | culture, history |
| lis-santo-amaro-oeiras | Praia de Santo Amaro de Oeiras | tarde | 15 | beach, family, relaxation |
| lis-tram-28 | Elétrico 28 (Tram histórico) | tarde | 20 | culture, history |
| lis2-maat | MAAT — Museu de Arte, Arquitetura e Tecnologia | tarde | 45 | culture, art |
| lis2-santini | Gelados Santini | tarde | 20 | gastronomy, snack |
| lis2-telecabine | Telecabine do Parque das Nações | tarde | 40 | family, relaxation |

### (b) Livres — 7

| id | nome | período | styleTags |
|---|---|---|---|
| lis-alfama-walk | Passeio a pé por Alfama até o Miradouro das Portas do Sol | manhã | culture, history, budget |
| lis-jardim-estrela | Jardim da Estrela | tarde | nature, family, relaxation |
| lis-miradouros | Miradouros: Senhora do Monte e Graça | tarde | romantic, culture |
| lis-monsanto-montes-claros | Miradouro dos Montes Claros (Monsanto) | tarde | nature, romantic, relaxation |
| lis-parque-eduardo-vii | Parque Eduardo VII | tarde | nature, family, relaxation |
| lis-ribeira-cais | Ribeira das Naus e Cais do Sodré | tarde | romantic, beach |
| lis2-miradouro-catarina | Miradouro de Santa Catarina (Adamastor) | tarde | relaxation, romantic |

Gratuitas de compras (fora de (b), indisponíveis): lis-baixa-chiado, lis-centro-colombo, lis-conserveira, lis-corte-ingles, lis-embaixada, lis-lx-factory, lis-vida-portuguesa

## Roma

### (a) Pagas — 20

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| rom-appia-antica-bike | Via Appia Antica de bicicleta | manhã | 90 | nature, history, adventure, family |
| rom-castel-romano-outlet | Castel Romano Designer Outlet | manhã | 50 | shopping, daytrip |
| rom-cinecitta-si-mostra | Cinecittà si Mostra (estúdios de cinema) | manhã | 110 | family, culture, art |
| rom-lido-di-ostia | Praia em Lido di Ostia | manhã | 20 | beach, family, relaxation, daytrip |
| rom-scuola-gladiatori | Scuola di Gladiatori (Gruppo Storico Romano) | manhã | 350 | family, history, adventure |
| rom-zoomarine | Bate-volta a Zoomarine (Torvaianica) | manhã | 220 | family, nature, daytrip |
| rom2-bioparco | Bioparco (Villa Borghese) | manhã | 60 | family, nature |
| rom2-capitolini | Musei Capitolini | manhã | 45 | culture, history, art |
| rom2-explora | Explora — Museo dei Bambini | manhã | 50 | family |
| rome-castel-santangelo | Castel Sant Angelo | manhã | 85 | culture, history |
| rome-colosseo | Coliseu e Fórum Romano | manhã | 110 | history, culture, family |
| rome-galleria-borghese | Galleria Borghese | manhã | 95 | art, culture |
| rome-pantheon-centro | Panteão e centro histórico | manhã | 30 | culture, history |
| rome-vaticano | Museus do Vaticano e Capela Sistina | manhã | 150 | art, history, culture |
| rom-welcome-to-rome | Welcome To Rome (show imersivo) | tarde | 80 | family, history, culture |
| rom2-doria | Galleria Doria Pamphilj | tarde | 50 | art, culture |
| rom2-giolitti | Giolitti | tarde | 15 | gastronomy |
| rom2-laghetto | Barquinho no Laghetto di Villa Borghese | tarde | 15 | romantic, family, relaxation |
| rom2-pompi | Pompi — il Re del Tiramisù | tarde | 12 | gastronomy |
| rome-villa-borghese | Villa Borghese | tarde | 80 | nature, art, family |

### (b) Livres — 10

| id | nome | período | styleTags |
|---|---|---|---|
| rom-villa-pamphili | Villa Doria Pamphilj | manhã | nature, family, relaxation |
| rome-campo-fiori | Mercado de Campo de Fiori | manhã | culture, gastronomy |
| rome-san-pietro | Basílica de San Pietro | manhã | history, culture, budget |
| rom-giardino-aranci | Giardino degli Aranci (Aventino) | tarde | nature, romantic, relaxation |
| rom-parco-acquedotti | Parco degli Acquedotti | tarde | nature, history, relaxation |
| rom2-pincio | Terrazza del Pincio ao pôr do sol | tarde | romantic, relaxation |
| rome-aventino | Aventino: Jardim das Laranjeiras e Buraco da Fechadura | tarde | romantic, culture |
| rome-gianicolo | Janículo ao pôr do sol | tarde | romantic, nature |
| rome-trastevere-tarde | Trastevere: vielas e Santa Maria | tarde | culture, romantic |
| rome-trevi | Fontana di Trevi & Centro | tarde | culture, romantic |

Gratuitas de compras (fora de (b), indisponíveis): rom-campo-de-fiori-mercato, rom-castroni, rom-eataly, rom-galleria-alberto-sordi, rom-mercato-monti, rom-rinascente-tritone, rome-escadaria-espanha

## Tóquio

### (a) Pagas — 18

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| tok3-disneysea | Tokyo DisneySea (dia inteiro) | manhã | 450 | family |
| tok3-ghibli | Museu Ghibli (Mitaka) | manhã | 80 | family, culture, art |
| tok3-hakone | Day-trip a Hakone (onsen + Fuji) | manhã | 250 | nature, relaxation, daytrip |
| tok3-inokashira | Parque Inokashira (Kichijoji) | manhã | 20 | nature, family, relaxation |
| tok3-kamakura | Day-trip a Kamakura | manhã | 120 | culture, nature, history, daytrip |
| tok3-kappabashi | Kappabashi (rua da cozinha) | manhã | 50 | shopping, culture |
| tok3-ryogoku | Manhã de sumô em Ryogoku | manhã | 50 | culture |
| tokyo-teamlab | teamLab Borderless | manhã | 150 | art, culture |
| tokyo-ueno-park | Parque Ueno e Museu Nacional | manhã | 45 | culture, nature, family |
| tok3-ameyoko | Ameyoko (mercado de rua) | tarde | 40 | culture, shopping, gastronomy |
| tok3-meguro | Rio Meguro (sakura ou passeio) | tarde | 20 | nature, romantic |
| tok3-pokemon | Pokémon Center Mega Tokyo | tarde | 60 | family |
| tok3-shimokita | Shimokitazawa (vintage) | tarde | 60 | shopping, culture |
| tok3-skytree | Tokyo Skytree | tarde | 150 | family, relaxation |
| tok3-teamlab-planets | teamLab Planets (Toyosu) | tarde | 120 | art, family |
| tok3-yanaka | Yanaka Ginza (Tóquio retrô) | tarde | 40 | culture, relaxation |
| tokyo-odaiba | Odaiba: Gundam e orla da baía | tarde | 30 | family, culture |
| tokyo-shinjuku-gyoen | Jardim Shinjuku Gyoen | tarde | 25 | nature, romantic |

### (b) Livres — 4

| id | nome | período | styleTags |
|---|---|---|---|
| tok3-nezu | Santuário Nezu (torii escondidos) | manhã | culture, nature |
| tokyo-meiji-shrine | Meiji Jingu | manhã | culture, nature |
| tokyo-senso-ji | Templo Senso-ji | manhã | culture, history |
| tokyo-shibuya-crossing | Shibuya Crossing | tarde | culture |

Gratuitas de compras (fora de (b), indisponíveis): tok-ginza-six, tokyo-akihabara, tokyo-ginza, tokyo-harajuku

## Porto

### (a) Pagas — 17

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| opo-bate-volta-braga | Bate-volta a Braga e Bom Jesus do Monte | manhã | 60 | culture, history, nature, daytrip |
| opo-bate-volta-douro | Estação Ferroviária do Pinhão (bate-volta Vale do Douro) | manhã | 250 | nature, gastronomy, romantic, daytrip |
| opo-bate-volta-guimaraes | Castelo de Guimarães (bate-volta) | manhã | 60 | culture, history, family, daytrip |
| opo-igreja-sao-francisco | Igreja de São Francisco (talha dourada) | manhã | 50 | culture, history, art |
| opo-livraria-lello | Livraria Lello | manhã | 40 | culture, history, art, family |
| opo-palacio-bolsa | Palácio da Bolsa (Salão Árabe) | manhã | 80 | culture, history, art |
| opo-se-do-porto | Sé do Porto e claustro | manhã | 25 | culture, history |
| opo-sea-life | Sea Life Porto | manhã | 90 | family, nature |
| opo-serralves | Serralves (museu e parque) | manhã | 80 | art, culture, nature, family |
| opo-torre-clerigos | Torre dos Clérigos | manhã | 50 | culture, history, romantic |
| opo-afurada | Mercado Municipal da Afurada | tarde | 60 | culture, gastronomy, relaxation |
| opo-casa-da-musica | Casa da Música (visita guiada) | tarde | 60 | art, culture |
| opo-caves-grahams | Caves Graham's (vinho do Porto) | tarde | 120 | gastronomy, culture, romantic |
| opo-cruzeiro-seis-pontes | Cruzeiro das Seis Pontes no Douro | tarde | 90 | family, romantic, nature, relaxation |
| opo-mercado-beira-rio | Mercado Beira-Rio (Gaia) | tarde | 60 | shopping, gastronomy, family |
| opo-teleferico-gaia | Teleférico de Gaia | tarde | 40 | family, romantic, nature |
| opo-world-of-discoveries | World of Discoveries | tarde | 110 | family, history, culture |

### (b) Livres — 11

| id | nome | período | styleTags |
|---|---|---|---|
| opo-parque-da-cidade | Parque da Cidade | manhã | nature, family, relaxation |
| opo-praia-homem-do-leme | Praia do Homem do Leme (Foz) | manhã | beach, family, relaxation |
| opo-praia-matosinhos | Praia de Matosinhos | manhã | beach, family, adventure |
| opo-sao-bento | Estação de São Bento (azulejos) | manhã | culture, history, art, family |
| opo-foz-do-douro | Foz do Douro (orla e Pérgola) | tarde | nature, beach, romantic, relaxation |
| opo-jardim-botanico | Jardim Botânico do Porto | tarde | nature, relaxation, romantic |
| opo-jardins-palacio-cristal | Jardins do Palácio de Cristal | tarde | nature, romantic, family, relaxation |
| opo-ponte-luis-i | Ponte Luís I (travessia pelo tabuleiro superior) | tarde | culture, romantic, adventure, nature |
| opo-praia-da-luz | Praia da Luz (Foz do Douro) | tarde | beach, romantic, relaxation |
| opo-praia-ingleses | Praia dos Ingleses (Foz) | tarde | beach, relaxation, romantic |
| opo-ribeira | Ribeira (cais e casario) | tarde | culture, history, romantic, family |

Gratuitas de compras (fora de (b), indisponíveis): opo-cc-bombarda, opo-claus-porto, opo-norteshopping, opo-perola-do-bolhao, opo-rua-santa-catarina, opo-vila-do-conde-outlet

## Salvador

### (a) Pagas — 25

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| ssa-ceasinha | Mercado do Rio Vermelho (Ceasinha) | manhã | 30 | shopping, gastronomy, culture |
| ssa-cidade-da-musica | Cidade da Música da Bahia | manhã | 30 | culture, family |
| ssa-escuna-ilhas | Passeio de escuna pela Baía (Ilha dos Frades) | manhã | 150 | nature, family, relaxation |
| ssa-feira-sao-joaquim | Feira de São Joaquim | manhã | 30 | culture |
| ssa-igreja-rosario-pretos | Igreja do Rosário dos Pretos | manhã | 10 | culture, history |
| ssa-mafro | MAFRO — Museu Afro-Brasileiro | manhã | 15 | culture, history, art |
| ssa-museu-nautico | Museu Náutico (Farol da Barra) | manhã | 30 | culture, history, family |
| ssa-praia-do-forte | Bate-volta Praia do Forte (Projeto Tamar) | manhã | 180 | family, nature, beach, daytrip |
| ssa-praia-itapua | Praia de Itapuã | manhã | 40 | beach, culture, relaxation |
| ssa-sao-francisco | Igreja de São Francisco | manhã | 20 | culture, history |
| ssa-stella-maris | Praia de Stella Maris | manhã | 60 | beach, family, relaxation |
| ssa-zoo-salvador | Parque Zoobotânico Getúlio Vargas | manhã | 20 | nature, family |
| ssa-acaraje-cira | Acarajé da Cira | tarde | 30 | gastronomy, culture |
| ssa-acaraje-regina | Acarajé da Regina | tarde | 25 | gastronomy, culture |
| ssa-alto-da-sereia | Barracas do Alto da Sereia | tarde | 50 | relaxation, gastronomy, culture |
| ssa-blue-praia | Blue Praia Bar | tarde | 120 | relaxation, gastronomy |
| ssa-casa-do-carnaval | Casa do Carnaval da Bahia | tarde | 30 | culture |
| ssa-casa-rio-vermelho | Casa do Rio Vermelho (Jorge Amado) | tarde | 40 | culture, history |
| ssa-elevador-mercado | Elevador Lacerda e Mercado Modelo | tarde | 15 | culture, shopping |
| ssa-farol-barra | Farol da Barra ao pôr do sol | tarde | 25 | beach, romantic, culture |
| ssa-lagoa-abaete | Lagoa do Abaeté | tarde | 20 | nature, culture |
| ssa-palacete-das-artes | Palacete das Artes | tarde | 20 | culture, art, relaxation |
| ssa-ribeira-fim-de-tarde | Ribeira no fim de tarde | tarde | 25 | relaxation, family, gastronomy |
| ssa-sorveteria-cubana | Sorveteria Cubana | tarde | 20 | gastronomy, culture |
| ssa-sorveteria-ribeira | Sorveteria da Ribeira | tarde | 25 | gastronomy, family, snack |

### (b) Livres — 13

| id | nome | período | styleTags |
|---|---|---|---|
| ssa-bonfim | Igreja do Bonfim e fitinhas | manhã | culture, history |
| ssa-jardim-botanico | Jardim Botânico de Salvador | manhã | nature, family, relaxation |
| ssa-parque-cidade | Parque da Cidade (Joventino Silva) | manhã | nature, family, relaxation |
| ssa-parque-pituacu | Parque Metropolitano de Pituaçu | manhã | nature, family, adventure |
| ssa-pelourinho | Pelourinho e Largo do Cruzeiro | manhã | history, culture, budget, family |
| ssa-porto-barra | Praia do Porto da Barra | manhã | beach, family |
| ssa-praia-flamengo | Praia do Flamengo | manhã | beach, family, relaxation |
| ssa-dique-tororo | Dique do Tororó | tarde | culture, art, family, nature |
| ssa-ponta-de-humaita | Pôr do sol na Ponta de Humaitá | tarde | relaxation, romantic, culture |
| ssa-praia-jaguaribe | Praia de Jaguaribe | tarde | beach, adventure, relaxation |
| ssa-rio-vermelho | Rio Vermelho no fim de tarde | tarde | culture, gastronomy |
| ssa-santo-antonio | Bairro de Santo Antônio Além do Carmo | tarde | culture, relaxation, romantic |
| ssa-solar-unhao | Solar do Unhão e MAM ao pôr do sol | tarde | art, romantic, culture |

Gratuitas de compras (fora de (b), indisponíveis): ssa-bahia-outlet, ssa-instituto-maua, ssa-salvador-shopping, ssa-shopping-barra, ssa-shopping-da-bahia, ssa-shopping-paralela

## Fortaleza

### (a) Pagas — 21

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| for-barraca-atlantiz | Dia de praia na Atlantiz | manhã | 85 | relaxation, gastronomy |
| for-barraca-chico-praia | Dia de praia no Chico do Caranguejo | manhã | 85 | relaxation, gastronomy, culture |
| for-barraca-crocobeach | Dia de praia no Crocobeach | manhã | 110 | relaxation, gastronomy |
| for-barraca-itaparika | Dia de praia na Itapariká | manhã | 80 | relaxation, gastronomy |
| for-barraca-santa-praia | Dia de praia na Santa Praia | manhã | 85 | relaxation, gastronomy |
| for-barraca-vira-verao | Dia de praia no Vira Verão | manhã | 100 | relaxation, nightlife |
| for-canoa-quebrada | Bate-volta a Canoa Quebrada | manhã | 180 | beach, nature, adventure, daytrip |
| for-cumbuco-manha | Praia do Cumbuco | manhã | 120 | beach, adventure, family |
| for-dragao-do-mar | Centro Dragão do Mar | manhã | 20 | culture, family, art |
| for-lagoinha | Praia de Lagoinha | manhã | 120 | beach, relaxation, nature, daytrip |
| for-mercado-central | Mercado Central de Fortaleza | manhã | 50 | shopping, culture |
| for-morro-branco | Bate-volta a Morro Branco e Praia das Fontes | manhã | 150 | beach, nature, family, daytrip |
| for-museu-fotografia | Museu da Fotografia Fortaleza | manhã | 40 | culture, art |
| for-sabiaguaba | Praia e dunas de Sabiaguaba | manhã | 30 | nature, beach, relaxation |
| for-aguas-belas | Praia de Águas Belas | tarde | 90 | beach, nature, daytrip |
| for-beach-park | Beach Park | tarde | 350 | family, adventure |
| for-ceart | CEART — Centro de Artesanato | tarde | 60 | shopping, culture |
| for-doce-50-sabores | Sorveteria 50 Sabores | tarde | 30 | gastronomy, relaxation, snack |
| for-taiba | Praia da Taíba | tarde | 100 | beach, relaxation, nature |
| for-theatro-jose-alencar | Theatro José de Alencar | tarde | 20 | culture, history |
| for-veleiro-por-do-sol | Passeio de veleiro ao pôr do sol | tarde | 100 | beach, romantic, family |

### (b) Livres — 5

| id | nome | período | styleTags |
|---|---|---|---|
| for-parque-coco | Parque do Cocó | manhã | nature, family, relaxation |
| for-praia-futuro-manha | Praia do Futuro | manhã | beach, relaxation |
| for-praia-iracema | Praia de Iracema e Ponte dos Ingleses | manhã | beach, culture, romantic |
| for-catedral-metropolitana | Catedral Metropolitana de Fortaleza | tarde | culture, history |
| for-jardim-japones | Jardim Japonês da Beira-Mar | tarde | nature, relaxation, family |

Gratuitas de compras (fora de (b), indisponíveis): for-beira-mar, for-feirinha-beira-mar, for-iguatemi-bosque, for-north-shopping, for-riomar, for-via-sul

## Rio de Janeiro

### (a) Pagas — 16

| id | nome | período | custo (R$) | styleTags |
|---|---|---|---|---|
| rio-bioparque | BioParque do Rio | manhã | 80 | family, nature |
| rio-ccbb | CCBB Rio | manhã | 30 | culture, art |
| rio-cristo-redentor | Cristo Redentor (Corcovado) | manhã | 115 | culture, history, nature, family |
| rio-jardim-botanico | Jardim Botânico | manhã | 75 | nature, family, romantic |
| rio-mirante-dona-marta | Mirante Dona Marta | manhã | 60 | nature, romantic |
| rio-museu-amanha | Museu do Amanhã | manhã | 30 | culture, family, art |
| rio-museu-arte-rio | MAR — Museu de Arte do Rio | manhã | 30 | culture, art |
| rio-prainha | Prainha | manhã | 60 | beach, nature, adventure |
| rio-aquario | AquaRio | tarde | 140 | family |
| rio-forte-copacabana | Forte de Copacabana | tarde | 20 | culture, history |
| rio-lagoa-pedalinho | Lagoa Rodrigo de Freitas (pedalinho e quiosques) | tarde | 50 | family, relaxation, nature |
| rio-momo-gelato | Momo Gelato | tarde | 25 | gastronomy, relaxation, snack |
| rio-mureta-urca | Mureta da Urca | tarde | 40 | gastronomy, romantic, culture |
| rio-pao-acucar | Pão de Açúcar (bondinho) | tarde | 170 | nature, romantic, family |
| rio-planetario-gavea | Planetário da Gávea | tarde | 40 | family, culture |
| rio-theatro-municipal | Theatro Municipal (visita guiada) | tarde | 30 | culture, history |

### (b) Livres — 10

| id | nome | período | styleTags |
|---|---|---|---|
| rio-pista-claudio-coutinho | Pista Cláudio Coutinho | manhã | nature, family, relaxation |
| rio-praia-barra | Praia da Barra da Tijuca | manhã | beach, adventure, relaxation |
| rio-praia-copacabana | Praia de Copacabana | manhã | beach, family |
| rio-praia-ipanema | Praia de Ipanema (Posto 9) | manhã | beach, romantic |
| rio-praia-leblon | Praia do Leblon (Posto 12 e Baixo Bebê) | manhã | beach, family, relaxation |
| rio-praia-vermelha | Praia Vermelha (Urca) | manhã | beach, family, nature |
| rio-real-gabinete | Real Gabinete Português de Leitura | manhã | culture, history |
| rio-arpoador | Pedra do Arpoador ao pôr do sol | tarde | beach, romantic |
| rio-escadaria-selaron | Escadaria Selarón e Lapa | tarde | culture, art |
| rio-parque-lage | Parque Lage | tarde | nature, romantic, art |

Gratuitas de compras (fora de (b), indisponíveis): rio-barrashopping, rio-feira-hippie-ipanema, rio-feira-rio-antigo, rio-galeria-river, rio-rio-sul, rio-saara, rio-shopping-leblon, rio-village-mall
