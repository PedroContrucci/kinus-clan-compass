// Os MOTIVOS da escolha do hotel — e a autoria dela.
//
// A regra de produto que este arco estreia diz que toda escolha do KINU mostra o porquê.
// O risco de uma feature assim não é ela não aparecer: é ela aparecer MENTINDO — um motivo
// que não pesou na decisão, ou um "Escolhido porque" sobre um hotel que o usuário escolheu.
// Os dois invariantes abaixo (§ "motivo ↔ parcela" e § "autoria") existem para isso.
import { describe, it, expect } from 'vitest';
import {
  rankHotelsForTrip,
  hotelChoiceLabel,
  hotelMapsUrl,
  tierOfTrip,
  personaOfTrip,
  TIER_LABEL,
  PERSONA_LABEL,
  type HotelReason,
  type SwapTripLike,
} from '@/lib/hotelSwap';
import { curatedHotels } from '@/data/curatedHotels';

const kinds = (reasons: HotelReason[]) => reasons.map((r) => r.kind);
const labelOf = (reasons: HotelReason[], kind: HotelReason['kind']) =>
  reasons.find((r) => r.kind === kind)?.label;

function trip(over: Partial<SwapTripLike> = {}): SwapTripLike {
  return { destination: 'Cartagena', budgetTier: 'comfort', travelers: 2, travelInterests: [], ...over };
}

const byId = (city: string, id: string) => {
  const found = curatedHotels[city]?.find((h) => h.id === id);
  if (!found) throw new Error(`fixture morta: ${id} não existe mais em ${city}`);
  return found;
};

describe('reasons — tier', () => {
  it('tier exato vira motivo com o rótulo em português, não o slug', () => {
    const r = rankHotelsForTrip('Cartagena', trip({ budgetTier: 'comfort' }));
    const casaLola = r.find((x) => x.hotel.id === 'ctg-h-casa-lola');
    expect(casaLola?.hotel.tier).toBe('mid');
    expect(labelOf(casaLola!.reasons, 'tier')).toBe('tier Conforto ✓');
    expect(labelOf(casaLola!.reasons, 'tier')).not.toContain('mid');
  });

  it('resort para viagem de alto padrão vira o motivo do substituto — e nunca os dois tiers juntos', () => {
    const r = rankHotelsForTrip('Cartagena', trip({ budgetTier: 'luxury' }));
    const sofitel = r.find((x) => x.hotel.id === 'ctg-h-sofitel');
    expect(sofitel?.hotel.tier).toBe('resort');
    expect(labelOf(sofitel!.reasons, 'tier-resort')).toBe('resort — atende acima do econômico');
    expect(kinds(sofitel!.reasons)).not.toContain('tier');

    // E o tier exato, no mesmo ranking, segue com o motivo dele.
    const sanAgustin = r.find((x) => x.hotel.id === 'ctg-h-san-agustin');
    expect(kinds(sanAgustin!.reasons)).toContain('tier');
    expect(kinds(sanAgustin!.reasons)).not.toContain('tier-resort');
  });

  it('resort para mochileiro não ganha motivo de tier nenhum', () => {
    const r = rankHotelsForTrip('Cartagena', trip({ budgetTier: 'backpacker' }));
    const caribe = r.find((x) => x.hotel.id === 'ctg-h-caribe');
    expect(kinds(caribe!.reasons)).not.toContain('tier');
    expect(kinds(caribe!.reasons)).not.toContain('tier-resort');
  });
});

describe('reasons — persona', () => {
  it('2 viajantes leem "casal"; 4 leem "família"', () => {
    const casal = rankHotelsForTrip('Cartagena', trip({ travelers: 2 }))
      .find((x) => x.hotel.id === 'ctg-h-casa-lola');
    expect(labelOf(casal!.reasons, 'persona')).toBe('perfil casal ✓');

    const familia = rankHotelsForTrip('Cartagena', trip({ travelers: 4 }))
      .find((x) => x.hotel.id === 'ctg-h-estelar');
    expect(labelOf(familia!.reasons, 'persona')).toBe('perfil família ✓');
  });

  it('hotel que não atende a persona da viagem NÃO ganha motivo de persona', () => {
    // Estelar é 'family'; a viagem é de casal. O bloco não pode inventar afinidade.
    const r = rankHotelsForTrip('Cartagena', trip({ travelers: 2 }));
    const estelar = r.find((x) => x.hotel.id === 'ctg-h-estelar');
    expect(estelar!.hotel.personaTags).not.toContain('couple');
    expect(kinds(estelar!.reasons)).not.toContain('persona');
  });
});

describe('reasons — zona ideal', () => {
  it('nomeia a zona ideal e só marca quem está nela', () => {
    // Buenos Aires + interesse 'family' -> Recoleta na tabela de HOTEL_ZONES.
    const r = rankHotelsForTrip(
      'Buenos Aires',
      trip({ destination: 'Buenos Aires', travelers: 4, travelInterests: ['family'] }),
    );
    const comZona = r.filter((x) => kinds(x.reasons).includes('zone'));

    expect(comZona.map((x) => x.hotel.id).sort()).toEqual(['bue-h-alvear', 'bue-h-duhau']);
    for (const item of comZona) {
      expect(labelOf(item.reasons, 'zone')).toBe('zona ideal Recoleta ✓');
      expect(item.hotel.zone).toBe('Recoleta');
    }

    // Palermo Hollywood não é a zona ideal desta viagem: nada de motivo de zona.
    const home = r.find((x) => x.hotel.id === 'bue-h-home');
    expect(kinds(home!.reasons)).not.toContain('zone');
  });

  it('cidade fora de HOTEL_ZONES não ganha motivo de zona — e não inventa um', () => {
    // Cartagena, Gramado e Orlando não têm tabela de zonas; Nova York, Porto Seguro e
    // Salvador têm, mas os nomes não casam com as zonas da curadoria. Nessas 6 cidades
    // (de 16) o motivo de zona simplesmente não existe — o bloco mostra um motivo menos,
    // e isso é honesto. Está anotado como pendência de curadoria no relatório do arco.
    for (const city of ['Cartagena', 'Gramado', 'Orlando']) {
      const r = rankHotelsForTrip(city, trip({ destination: city, travelInterests: ['nightlife'] }));
      expect(r.length).toBeGreaterThan(0);
      for (const item of r) {
        expect(kinds(item.reasons)).not.toContain('zone');
      }
    }
  });
});

describe('reasons — nota', () => {
  it('a nota da curadoria entra como motivo, com o número da curadoria', () => {
    const hyatt = rankHotelsForTrip('Cartagena', trip())
      .find((x) => x.hotel.id === 'ctg-h-hyatt');
    expect(labelOf(hyatt!.reasons, 'rating')).toBe(`nota ${byId('Cartagena', 'ctg-h-hyatt').rating}`);
  });
});

describe('reasons — a ordem é contrato', () => {
  it('tier → persona → zona → nota, sempre, para todo hotel de toda cidade', () => {
    const ORDEM = ['tier', 'tier-resort', 'persona', 'zone', 'rating'];
    const rank = (city: string) => rankHotelsForTrip(city, trip({ destination: city }));

    for (const city of Object.keys(curatedHotels)) {
      for (const item of rank(city)) {
        const posicoes = kinds(item.reasons).map((k) => ORDEM.indexOf(k));
        expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
      }
    }
  });
});

describe('invariante do arco — motivo ↔ parcela do score', () => {
  const TIERS = ['backpacker', 'comfort', 'premium', 'luxury'];

  it('nenhum motivo sem parcela, nenhuma parcela sem motivo, nos 68 hotéis × 4 tiers', () => {
    let conferidos = 0;

    for (const city of Object.keys(curatedHotels)) {
      for (const budgetTier of TIERS) {
        const t = trip({ destination: city, budgetTier, travelers: 2 });
        const tier = tierOfTrip(t);
        const persona = personaOfTrip(t);

        for (const { hotel, reasons, score } of rankHotelsForTrip(city, t)) {
          // Reconstrói o score A PARTIR dos motivos. Se um motivo foi escrito sem a
          // parcela (ou a parcela somada sem o motivo), esta soma não fecha.
          const somaDosMotivos = reasons.reduce((acc, r) => {
            if (r.kind === 'tier') return acc + 100;
            if (r.kind === 'tier-resort') return acc + 40;
            if (r.kind === 'persona') return acc + 50;
            if (r.kind === 'zone') return acc + 10;
            return acc + (Number(hotel.rating) || 0);
          }, 0);

          expect(somaDosMotivos).toBe(score);

          // E os rótulos falam a língua da viagem, não a do banco.
          if (kinds(reasons).includes('tier')) {
            expect(labelOf(reasons, 'tier')).toBe(`tier ${TIER_LABEL[tier]} ✓`);
          }
          if (kinds(reasons).includes('persona')) {
            expect(labelOf(reasons, 'persona')).toBe(`perfil ${PERSONA_LABEL[persona]} ✓`);
          }
          conferidos += 1;
        }
      }
    }

    expect(conferidos).toBe(Object.values(curatedHotels).flat().length * TIERS.length);
  });

  it('todo hotel curado tem pelo menos um motivo — nenhum card sai vazio', () => {
    for (const city of Object.keys(curatedHotels)) {
      for (const budgetTier of TIERS) {
        for (const item of rankHotelsForTrip(city, trip({ destination: city, budgetTier }))) {
          expect(item.reasons.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('autoria — os três estados de chosenBy', () => {
  const base = (chosenBy?: 'kinu' | 'user') =>
    trip({
      travelers: 2,
      accommodation: {
        name: 'Casa Lola Luxury Collection',
        curatedHotelId: 'ctg-h-casa-lola',
        ...(chosenBy ? { chosenBy } : {}),
      },
    });

  it("chosenBy 'kinu' → \"Escolhido porque:\", registrado e não deduzido", () => {
    const r = hotelChoiceLabel('Cartagena', base('kinu'));
    expect(r).toEqual({ author: 'kinu', label: 'Escolhido porque:', inferred: false });
  });

  it("chosenBy 'user' → \"Sua escolha\", mesmo que o hotel seja o que o KINU escolheria", () => {
    // O Casa Lola é o próprio pick do gerador para esta viagem: sem o registro, a
    // heurística diria 'kinu'. O registro manda, e é para isso que ele existe.
    const r = hotelChoiceLabel('Cartagena', base('user'));
    expect(r).toEqual({ author: 'user', label: 'Sua escolha · combina porque:', inferred: false });
  });

  it('sem chosenBy (viagem antiga) → heurística: o pick do gerador é do KINU', () => {
    const r = hotelChoiceLabel('Cartagena', base());
    expect(r.author).toBe('kinu');
    expect(r.label).toBe('Escolhido porque:');
    expect(r.inferred).toBe(true);
  });

  it('sem chosenBy e hotel diferente do pick → heurística: foi o usuário', () => {
    const t = trip({
      travelers: 2,
      accommodation: { name: 'Sofitel Legend Santa Clara', curatedHotelId: 'ctg-h-sofitel' },
    });
    const r = hotelChoiceLabel('Cartagena', t);
    expect(r.author).toBe('user');
    expect(r.label).toBe('Sua escolha · combina porque:');
    expect(r.inferred).toBe(true);
  });

  it('cidade sem curadoria e hospedagem de fora → usuário nenhum escolheu: cai em heurística sem quebrar', () => {
    const t = trip({ destination: 'Singapura', accommodation: { name: 'Hotel Qualquer' } });
    expect(() => hotelChoiceLabel('Singapura', t)).not.toThrow();
    expect(hotelChoiceLabel('Singapura', t).inferred).toBe(true);
  });
});

describe('hotelMapsUrl', () => {
  it('leva nome, zona e cidade — não o nome sozinho', () => {
    const url = hotelMapsUrl(byId('Cartagena', 'ctg-h-casa-lola'), 'Cartagena');
    expect(url).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(decodeURIComponent(url)).toContain('Casa Lola Luxury Collection, Getsemaní, Cartagena');
  });
});
