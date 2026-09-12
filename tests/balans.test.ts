/**
 * БАЛАНСЪТ НА ПАРИТЕ В СИСТЕМАТА · и трите му цвята.
 *
 * Негово, 13.09 (запис 203), точка 5: „**Баланс който Смята Трезора + Банковото
 * покритие… Червена като опасност и преди РАЗХОДИТЕ ЗА 6 МЕСЕЦА… Жълто за
 * предприемане на продажби когато сумата падне до 12 месеца… Зелено когато
 * всичко е наред… Да има всеки месец запис колко е разликата между Приход и
 * Разход.**"
 *
 * Праговете са ЧИСЛА, не настроение — затова стоят тук, а не в CSS.
 */

import { describe, expect, it } from 'vitest';
import {
  balansat,
  MESETSI_CHERVENO,
  MESETSI_ZHALTO,
  mesetsiteNaBalansa,
} from '../src/smetach/balans.js';
import type { SmetkiZaBalansa } from '../src/smetach/balans.js';
import type { RedVSektsiya, Sektsiya } from '../src/smetach/smetki.js';

function red(i: number, mesets: string, suma_st: number): RedVSektsiya {
  return { i, id: `d${i}`, suma_st, mesets, data: '' };
}

function sektsiya(strana: 'prihod' | 'razhod', redove: readonly RedVSektsiya[]): Sektsiya {
  return {
    strana,
    nomer: 1,
    tekst: strana === 'prihod' ? 'Наем Банка' : 'Ток и вода',
    redove,
    sbor: redove.reduce((a, r) => a + r.suma_st, 0),
    spryana: false,
  };
}

/** Сметки с толкова месеца, колкото са подадените двойки приход · разход. */
function smetki(po: readonly (readonly [string, number, number])[]): SmetkiZaBalansa {
  const prihod = sektsiya(
    'prihod',
    po.map(([m, p], i) => red(i, m, p)),
  );
  const razhod = sektsiya(
    'razhod',
    po.map(([m, , r], i) => red(100 + i, m, r)),
  );
  return {
    prihod: [prihod],
    razhod: [razhod],
    sborPrihod: prihod.sbor,
    sborRazhod: razhod.sbor,
  };
}

describe('месечният запис на разликата', () => {
  it('един ред на месец · приход · разход · разлика · подредени по месец', () => {
    const m = mesetsiteNaBalansa(
      smetki([
        ['2026-08', 300_000, -100_000],
        ['2026-07', 200_000, -250_000],
      ]),
    );
    expect(m.map((x) => `${x.mesets} ${x.razlika}`)).toEqual(['2026-07 -50000', '2026-08 200000']);
  });

  /**
   * Месец без нито едно движение не е „месец с нулева разлика", а месец, за
   * който не знаем нищо. Да го броим би свалило средното без причина.
   */
  it('месец без движения изобщо не влиза в записа', () => {
    expect(mesetsiteNaBalansa(smetki([])).length).toBe(0);
  });
});

describe('светофарът на Баланса', () => {
  /** По 100 000 на месец надолу · три месеца · и толкова кеш, колкото поискаме. */
  const tri = (kesh: number) =>
    balansat(
      smetki([
        ['2026-07', 100_000, -200_000],
        ['2026-08', 100_000, -200_000],
        ['2026-09', 100_000, -200_000],
      ]),
      kesh,
    );

  it('балансът е КЕШЪТ плюс банката · и банката е приход + разход', () => {
    const b = tri(1_000_000);
    expect(`${b.kesh_st} · ${b.banka_st} · ${b.balans_st}`).toBe('1000000 · -300000 · 700000');
    expect(b.nameseets_st).toBe(-100_000);
  });

  /** Двата прага са НЕГОВИ числа · шест и дванайсет · и стоят пинати тук. */
  it('праговете са шест и дванайсет месеца · негови, дословно', () => {
    expect(MESETSI_CHERVENO).toBe(6);
    expect(MESETSI_ZHALTO).toBe(12);
    // точно на прага НЕ е под него · шест месеца живот е още жълто, не червено
    expect(tri(900_000).mesetsiZhivot).toBe(MESETSI_CHERVENO);
    expect(tri(900_000).svetofar).toBe('zhalto');
    // точно дванайсет е вече зелено
    expect(tri(1_500_000).mesetsiZhivot).toBe(MESETSI_ZHALTO);
    expect(tri(1_500_000).svetofar).toBe('zeleno');
  });

  it('под ШЕСТ месеца живот · ЧЕРВЕНО', () => {
    const b = tri(800_000);
    // 800 000 − 300 000 = 500 000 · при −100 000 на месец стигат за 5 месеца
    expect(`${b.mesetsiZhivot} · ${b.svetofar}`).toBe('5 · cherveno');
    expect(b.zashto).toContain('ОПАСНО');
  });

  it('под ДВАНАЙСЕТ месеца живот · ЖЪЛТО · моментът за продажби', () => {
    const b = tri(1_300_000);
    expect(`${b.mesetsiZhivot} · ${b.svetofar}`).toBe('10 · zhalto');
    expect(b.zashto).toContain('продажби');
  });

  it('дванайсет месеца и нагоре · ЗЕЛЕНО', () => {
    expect(tri(1_600_000).svetofar).toBe('zeleno');
  });

  it('положителна разлика · парите не се изчерпват · няма число за живот', () => {
    const b = balansat(
      smetki([
        ['2026-08', 300_000, -100_000],
        ['2026-09', 300_000, -100_000],
      ]),
      0,
    );
    expect(b.mesetsiZhivot).toBe(null);
    expect(b.svetofar).toBe('zeleno');
  });

  /** Баланс под нулата е опасност веднага · без значение каква е посоката. */
  it('баланс ПОД НУЛАТА е червено, дори когато разликата е положителна', () => {
    const b = balansat(
      smetki([
        ['2026-08', 300_000, -100_000],
        ['2026-09', 300_000, -100_000],
      ]),
      -1_000_000,
    );
    expect(`${b.balans_st} · ${b.svetofar}`).toBe('-600000 · cherveno');
    expect(b.zashto).toContain('под нулата');
  });

  it('празни Сметки · нула баланс, нула средно, зелено без обещания', () => {
    const b = balansat(smetki([]), 0);
    expect(`${b.balans_st} · ${b.nameseets_st} · ${b.mesetsiZhivot} · ${b.svetofar}`).toBe(
      '0 · 0 · null · zeleno',
    );
  });
});
