/**
 * БАЛАНСЪТ НА ПАРИТЕ В СИСТЕМАТА · двата обхвата и трите му цвята.
 *
 * Негово, 13.09 (запис 203), точка 5: „**Баланс който Смята Трезора + Банковото
 * покритие… Червена като опасност и преди РАЗХОДИТЕ ЗА 6 МЕСЕЦА… Да има всеки
 * месец запис колко е разликата между Приход и Разход.**"
 *
 * И поправката, 13.09 (запис 205): „**под 12 — жълто, иначе зелено. Това се
 * променя на жълто е когато си на загуба, а когато си на печалба е зелено. Да
 * има и според вкарания период, а ако е сега периода да е за периода на
 * такта.**"
 *
 * Двата обхвата са цялата идея и се пазят тук: БАЛАНСЪТ е натрупан, ПОСОКАТА е
 * за периода. Прагът е ЧИСЛО, не настроение — затова стои в кода, не в CSS.
 */

import { describe, expect, it } from 'vitest';
import type { SmetkiZaBalansa } from '../src/smetach/balans.js';
import { balansat, MESETSI_CHERVENO, mesetsiteNaBalansa } from '../src/smetach/balans.js';
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

/** Сметки с толкова месеца, колкото са подадените тройки месец · приход · разход. */
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

describe('двата обхвата на Баланса', () => {
  const VSICHKO = smetki([
    ['2026-05', 500_000, -100_000],
    ['2026-06', 500_000, -100_000],
    ['2026-07', 100_000, -200_000],
    ['2026-08', 100_000, -200_000],
  ]);
  /** същите Сметки, свити до последните два месеца · това вижда календарът */
  const V_PERIODA = smetki([
    ['2026-07', 100_000, -200_000],
    ['2026-08', 100_000, -200_000],
  ]);

  /**
   * Балансът е СЪСТОЯНИЕ, не отчет: парите не изчезват, защото човек е свил
   * календара до два месеца. Затова той се смята от ВСИЧКИ Сметки, а посоката —
   * от онези в периода.
   */
  it('БАЛАНСЪТ е натрупан · не се мени със свиването на календара', () => {
    const shirok = balansat(VSICHKO, VSICHKO, 0);
    const tesen = balansat(VSICHKO, V_PERIODA, 0);
    expect(shirok.balans_st).toBe(tesen.balans_st);
    expect(tesen.balans_st).toBe(600_000);
  });

  it('ПОСОКАТА е за периода · средното и записът идват само от неговите месеци', () => {
    const b = balansat(VSICHKO, V_PERIODA, 0);
    expect(b.mesetsi.map((m) => m.mesets)).toEqual(['2026-07', '2026-08']);
    expect(b.zaPerioda_st).toBe(-200_000);
    expect(b.nameseets_st).toBe(-100_000);
  });

  it('целият период дава друга посока от свития · и това е смисълът', () => {
    expect(balansat(VSICHKO, VSICHKO, 0).nameseets_st).toBe(150_000);
    expect(balansat(VSICHKO, V_PERIODA, 0).nameseets_st).toBe(-100_000);
  });

  it('кешът влиза в баланса, но не и в посоката', () => {
    const b = balansat(VSICHKO, V_PERIODA, 1_000_000);
    expect(`${b.vnoskiVBroy_st} · ${b.banka_st} · ${b.balans_st}`).toBe(
      '1000000 · 600000 · 1600000',
    );
    expect(b.nameseets_st).toBe(-100_000);
  });
});

describe('светофарът на Баланса', () => {
  const ZAGUBA: readonly (readonly [string, number, number])[] = [
    ['2026-08', 100_000, -200_000],
    ['2026-09', 100_000, -200_000],
  ];
  const PECHALBA: readonly (readonly [string, number, number])[] = [['2026-09', 300_000, -100_000]];
  const nazaguba = (kesh: number) => balansat(smetki(ZAGUBA), smetki(ZAGUBA), kesh);
  const napechalba = (kesh: number) => balansat(smetki(PECHALBA), smetki(PECHALBA), kesh);

  /**
   * Негово, 13.09 (запис 205): „под 12 — жълто, иначе зелено. Това се променя на
   * жълто е когато си на загуба, а когато си на печалба е зелено."
   *
   * Тоест дванайсетте месеца ги няма вече. Останалият праг е един и е негов.
   */
  it('прагът е ЕДИН и е шест месеца · дванайсетте си отидоха с думата му', () => {
    expect(MESETSI_CHERVENO).toBe(6);
  });

  it('ЗАГУБА · ЖЪЛТО · дори когато парите стигат за дълго', () => {
    // 2 000 000 кеш − 200 000 банка = 1 800 000 · при −100 000 на месец стигат за 18
    const b = nazaguba(2_000_000);
    expect(`${b.mesetsiZhivot} · ${b.svetofar}`).toBe('18 · zhalto');
    expect(b.zashto).toContain('ЗАГУБА');
  });

  it('ПЕЧАЛБА · ЗЕЛЕНО · и няма число за живот, защото парите не се изчерпват', () => {
    const b = napechalba(0);
    expect(`${b.mesetsiZhivot} · ${b.svetofar}`).toBe('null · zeleno');
    expect(b.zashto).toContain('ПЕЧАЛБА');
  });

  it('под ШЕСТ месеца живот · ЧЕРВЕНОТО гази жълтото', () => {
    // 700 000 кеш − 200 000 банка = 500 000 · при −100 000 на месец стигат за 5
    const b = nazaguba(700_000);
    expect(`${b.mesetsiZhivot} · ${b.svetofar}`).toBe('5 · cherveno');
    expect(b.zashto).toContain('ОПАСНО');
  });

  /** Баланс под нулата е опасност веднага · без значение каква е посоката. */
  it('баланс ПОД НУЛАТА е червено, дори при печалба', () => {
    const b = napechalba(-1_000_000);
    expect(`${b.balans_st} · ${b.svetofar}`).toBe('-800000 · cherveno');
    expect(b.zashto).toContain('под нулата');
  });

  it('на НУЛА · нито печалба, нито загуба · зелено, защото балансът не намалява', () => {
    const nanula = smetki([['2026-09', 100_000, -100_000]]);
    const b = balansat(nanula, nanula, 500_000);
    expect(`${b.nameseets_st} · ${b.svetofar}`).toBe('0 · zeleno');
  });

  it('празни Сметки · нула баланс, нула средно, зелено без обещания', () => {
    const b = balansat(smetki([]), smetki([]), 0);
    expect(`${b.balans_st} · ${b.nameseets_st} · ${b.mesetsiZhivot} · ${b.svetofar}`).toBe(
      '0 · 0 · null · zeleno',
    );
  });
});
