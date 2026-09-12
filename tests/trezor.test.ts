/**
 * ТРЕЗОРЪТ · всичко, което притежаваме в БРОЙ.
 *
 * Негово, 13.09 (запис 203), точка 4, ДОСЛОВНО: „**Трезора се пълни главно от
 * вноски СМР и те се трупат в него и показват само него, второ поле показва
 * Изтеглено(изтеглено по извлечение от Карта само). Това е всичко което
 * притежаваме Кеш и се дава в обща цифра и полето с име Общ Трезор.**"
 *
 * Трите числа се пазят тук; как изглеждат на реда — в прохода.
 */

import { describe, expect, it } from 'vitest';
import type { Prodazhbite, StranaNaProdazhba } from '../src/smetach/prodazhbi.js';
import { trezorat } from '../src/smetach/trezor.js';

function strana(s: 'banka' | 'kesh', vneseno: number): StranaNaProdazhba {
  return { strana: s, tsena: vneseno, vneseno, ostatak: 0 };
}

/** Продажби с една таблица и толкова редове, колкото са подадените страни. */
function prodazhbi(redove: readonly (readonly StranaNaProdazhba[])[]): Prodazhbite {
  return {
    tablitsi: [
      {
        klyuch: 'prodazhbi',
        ime: 'Продажби',
        redove: redove.map((strani, i) => ({
          i,
          id: `p${i}`,
          tablitsa: 'prodazhbi',
          ime: `апартамент ${i}`,
          kvadratura: 0,
          tsena: 0,
          tsenaPoStrani: 0,
          strani,
          platena: false,
          zavarshena: false,
          chaka: [],
        })),
        obshto: {},
        kvadratura: 0,
        platenite: 0,
        zavarshenite: 0,
        ostatak: 0,
        sastoyanie: 'aktivna',
        sverki: [],
      },
    ],
    broy: redove.length,
    tsena: 0,
    vneseno: 0,
    ostatak: 0,
  };
}

describe('Трезорът', () => {
  it('ВНОСКИТЕ В БРОЙ го пълнят · тези по банка не влизат', () => {
    const t = trezorat(
      { izvlechenie: 0, dadeno: 0 },
      prodazhbi([[strana('banka', 100_000), strana('kesh', 25_000)], [strana('kesh', 15_000)]]),
    );
    expect(t.vnoski_st).toBe(40_000);
    expect(t.obshto_st).toBe(40_000);
  });

  it('изтегленото е второто поле · и влиза в общото', () => {
    const t = trezorat({ izvlechenie: 198_000, dadeno: 0 }, prodazhbi([[strana('kesh', 25_000)]]));
    expect(`${t.vnoski_st} · ${t.iztegleno_st} · ${t.obshto_st}`).toBe('25000 · 198000 · 223000');
  });

  /**
   * Пари, дадени за заплати и фактури, са ИЗЛЕЗЛИ от касата. Ако стояха в
   * Трезора, щяхме да ги броим два пъти — веднъж като кеш, втори път като
   * платен разход.
   */
  it('раздаденото ИЗЛИЗА от общото · и се чете по модул, защото е разход', () => {
    const t = trezorat(
      { izvlechenie: 198_000, dadeno: 148_000 },
      prodazhbi([[strana('kesh', 25_000)]]),
    );
    expect(t.dadeno_st).toBe(148_000);
    expect(t.obshto_st).toBe(75_000);
  });

  it('празно навсякъде · трите числа са нула, не липсват', () => {
    const t = trezorat({ izvlechenie: 0, dadeno: 0 }, prodazhbi([]));
    expect(`${t.vnoski_st} · ${t.iztegleno_st} · ${t.obshto_st}`).toBe('0 · 0 · 0');
  });

  it('всяко число си носи формулата · подсказката не се пише два пъти', () => {
    const t = trezorat({ izvlechenie: 0, dadeno: 0 }, prodazhbi([]));
    expect(t.formulaNaVnoskite.length > 0).toBe(true);
    expect(t.formulaNaIzteglenoto.length > 0).toBe(true);
    expect(t.formulaNaObshtoto).toContain('вноски в брой + изтеглено − раздадено');
  });
});
