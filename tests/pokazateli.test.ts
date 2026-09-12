/**
 * ПОКАЗАТЕЛИТЕ · данните, от които се смятат коефициентите.
 *
 * Негово, 11.09 (запис 194): „**Събери основните данни необходими за
 * изчисляване на коефициентите от отчети. Искам под таблицата и диаграмата да
 * дадеш всички данни които може да се съберат от Приходи и Разходи за да се
 * сметнат коефициентите.**"
 *
 * Тук се пази онова, което може да се сбърка тихо: делението на нула, знакът на
 * разхода (той се пази отрицателен и се чете по модул), и това, че всяко число
 * носи формулата си — инак екранът показва цифра, която никой не може да провери.
 */

import { describe, expect, it } from 'vitest';
import { pokazatelite } from '../src/smetach/pokazateli.js';
import type { Sektsiya, Smetki } from '../src/smetach/smetki.js';

function sektsiya(
  strana: 'prihod' | 'razhod',
  nomer: number,
  tekst: string,
  sbor: number,
): Sektsiya {
  return {
    strana,
    nomer,
    tekst,
    redove: [{ i: 0, id: `r-${nomer}`, suma_st: sbor, mesets: '2026-09', data: '' }],
    sbor,
    spryana: false,
  };
}

function smetki(prihod: readonly Sektsiya[], razhod: readonly Sektsiya[]): Smetki {
  const sborPrihod = prihod.reduce((a, s) => a + s.sbor, 0);
  const sborRazhod = razhod.reduce((a, s) => a + s.sbor, 0);
  return {
    prihod,
    razhod,
    sborPrihod,
    sborRazhod,
    rezultat: sborPrihod + sborRazhod,
    bezSektsiya: [],
    broyDvizheniya: prihod.length + razhod.length,
    sverka: {
      kakvo: 'Приход ↔ Разход',
      vhod: sborPrihod,
      izhod: -sborRazhod,
      razlika: 0,
      nared: true,
      kogato: '2026-09-11T12:00:00.000Z',
    } as Smetki['sverka'],
  };
}

const PRIMER = smetki(
  [sektsiya('prihod', 1, 'Наем Банка', 120_000), sektsiya('prihod', 2, 'Наем Кеш', 80_000)],
  [sektsiya('razhod', 1, 'Заплати', -150_000), sektsiya('razhod', 2, 'Ток', -50_000)],
);

describe('показателите', () => {
  it('дават приход, разход и резултат · разходът се чете по МОДУЛ', () => {
    const p = pokazatelite(PRIMER, 12);
    // ПЪРВО броят · празен списък прави всяко твърдение под него зелено
    expect(p.length).toBeGreaterThan(8);
    const po = new Map(p.map((x) => [x.klyuch, x]));
    expect(po.get('prihod')?.st).toBe(200_000);
    // разходът е записан с минус, а на екрана се чете като положително число
    expect(po.get('razhod')?.st).toBe(200_000);
    expect(po.get('rezultat')?.st).toBe(0);
  });

  it('всяко число носи формулата си · екранът казва откъде идва (правило 28)', () => {
    const p = pokazatelite(PRIMER, 12);
    expect(p.filter((x) => x.formula.trim() === '')).toEqual([]);
    expect(p.filter((x) => x.ime.trim() === '')).toEqual([]);
  });

  it('деление на нула се КАЗВА, не дава нула и не дава безкрайност', () => {
    const prazno = smetki([], [sektsiya('razhod', 1, 'Заплати', -1_000)]);
    const po = new Map(pokazatelite(prazno, 12).map((x) => [x.klyuch, x]));
    // няма приход · маржът няма знаменател
    expect(po.get('marzh')?.stoynost).toBe('—');
    expect(po.get('razhod-kam-prihod')?.stoynost).toBe('—');
    // но покритието се смята · знаменателят му е разходът
    expect(po.get('pokritie')?.stoynost).toBe('0,0 %');
  });

  it('нула месеца не дава средно · вместо да дели на нула', () => {
    const po = new Map(pokazatelite(PRIMER, 0).map((x) => [x.klyuch, x]));
    expect(po.get('sredno-prihod')?.stoynost).toBe('—');
    expect(po.get('sredno-prihod')?.st).toBeNull();
  });

  it('най-голямата секция се намира по МОДУЛ · разходът е отрицателен', () => {
    const po = new Map(pokazatelite(PRIMER, 12).map((x) => [x.klyuch, x]));
    expect(po.get('nay-goliam-razhod')?.stoynost).toContain('Заплати');
    expect(po.get('nay-goliam-prihod')?.stoynost).toContain('Наем Банка');
  });
});
