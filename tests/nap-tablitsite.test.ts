/**
 * ДВЕТЕ ТАБЛИЦИ НА НАП · текущото и грешките.
 *
 * Негово, 11.09 (запис 195), точка 5: „тези които се събират текущия са в
 * таблица където платените се сортират най отдолу… когато не са платени повече
 * от месец отиват в друга таблица където са грешки в декларирани фактури и
 * неплатени или надплатени плащания."
 *
 * Тук се пази онова, което може да се сбърка тихо: посоката на подредбата,
 * границата „повече от месец" и знакът на надплатеното.
 */

import { describe, expect, it } from 'vitest';
import type { Ddsat, MesetsNaDdsa } from '../src/smetach/dds.js';
import { napTablitsite } from '../src/smetach/nap-tablitsite.js';

const DNES = '2026-09-12';

function mesets(m: string, dalzhimo: number, deklarirano: number, plateno: number): MesetsNaDdsa {
  return {
    mesets: m,
    i: 0,
    id: `dds:${m}`,
    nachislen: dalzhimo,
    kredit: 0,
    dalzhimo,
    deklarirano,
    plateno,
    ostatak: dalzhimo - plateno,
    strana: 'razhod',
    suma: -dalzhimo,
    izdadeni: 0,
    plateni: 0,
    sverki: [],
  };
}

const ddsat = (mesetsi: readonly MesetsNaDdsa[]): Ddsat =>
  ({ mesetsi, dalzhimo: 0, plateno: 0, ostatak: 0, sverka: {} }) as Ddsat;

describe('двете таблици на НАП', () => {
  it('ПЛАТЕНИТЕ падат най-отдолу · чакащите стоят горе', () => {
    const t = napTablitsite(
      ddsat([
        mesets('2026-07', 1000, 1000, 1000),
        mesets('2026-08', 2000, 2000, 0),
        mesets('2026-09', 3000, 3000, 3000),
      ]),
      DNES,
    );
    // първо БРОЯТ · празен списък би направил твърдението под него зелено
    expect(t.tekushti).toHaveLength(3);
    expect(t.tekushti.map((r) => r.vid)).toEqual(['chaka', 'platen', 'platen']);
    expect(t.tekushti.at(-1)?.mesets).toBe('2026-09');
  });

  it('неплатено ПОВЕЧЕ ОТ МЕСЕЦ излиза от текущата и влиза в грешките', () => {
    const t = napTablitsite(
      ddsat([mesets('2026-06', 5000, 5000, 0), mesets('2026-08', 2000, 2000, 0)]),
      DNES,
    );
    expect(t.tekushti.map((r) => r.mesets)).toEqual(['2026-08']);
    expect(t.greshki.map((r) => r.mesets)).toEqual(['2026-06']);
    expect(t.greshki[0]?.vid).toBe('zakasnyal');
    expect(t.greshki[0]?.mesetsiNazad).toBe(3);
  });

  it('НАДПЛАТЕНОТО е грешка · и се познава по отрицателния остатък', () => {
    const t = napTablitsite(ddsat([mesets('2026-08', 1000, 1000, 1500)]), DNES);
    expect(t.greshki[0]?.vid).toBe('nadplaten');
    expect(t.greshki[0]?.ostatak).toBe(-500);
    expect(t.tekushti).toEqual([]);
  });

  it('декларирано, което не е дължимото, е грешка в декларираните фактури', () => {
    const t = napTablitsite(ddsat([mesets('2026-08', 1000, 900, 900)]), DNES);
    expect(t.greshki[0]?.vid).toBe('razminava');
  });

  it('сумата, която НЕ излиза, е за МИНАЛИЯ месец · не за текущия', () => {
    const t = napTablitsite(
      ddsat([mesets('2026-08', 2000, 2000, 500), mesets('2026-09', 9000, 9000, 0)]),
      DNES,
    );
    expect(t.minaliyatMesets).toBe('2026-08');
    expect(t.neizlyazlo_st).toBe(1500);
  });

  it('няма ред за миналия месец · сумата е нула, не измислена', () => {
    const t = napTablitsite(ddsat([mesets('2026-09', 9000, 9000, 0)]), DNES);
    expect(t.neizlyazlo_st).toBe(0);
    expect(t.ogledani).toBe(1);
  });
});
