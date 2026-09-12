/**
 * КАЛЕНДАРЪТ С ЦИФРИТЕ · двата пътя до ъгъла трябва да дават едно число.
 *
 * Негово, 11.09 (записи 145 · 147 · 149): цифрата със знака в клетката · общ
 * сбор под колоните · сбор на реда за периода. Тестът пази точно това и
 * сверката между двете посоки (правило 7: разликата се записва и при нула).
 */

import { describe, expect, it } from 'vitest';
import { kalendarHTML } from '../app/reshetka/kalendar-tablitsa.js';
import type { Zapechatan } from '../app/reshetka/shablon.js';
import {
  dvanaysetMeseca,
  kalendar,
  denNaMeseca,
  type RedZaKalendara,
} from '../src/smetach/kalendar.js';
import { koloniNaTakta } from '../src/smetach/vreme.js';
import { pishi } from '../src/yadro/pari.js';

const DNES = '2026-09-11';

/** Само за теста · чете запечатания низ през символа, както `tests/shablon.test.ts`. */
const kato = (z: Zapechatan): string => {
  const simvoli = Object.getOwnPropertySymbols(z);
  return (z as unknown as Record<symbol, string>)[simvoli[0]!]!;
};

function redove(): RedZaKalendara[] {
  return [
    {
      id: 'naemi',
      ime: 'Наеми',
      chisla: [
        { data: denNaMeseca('2026-07'), chislo: 120_000 },
        { data: denNaMeseca('2026-08'), chislo: 120_000 },
        { data: denNaMeseca('2026-09'), chislo: 85_000 },
      ],
    },
    {
      id: 'fakturi',
      ime: 'Фактури',
      chisla: [
        { data: denNaMeseca('2026-08'), chislo: -240_000 },
        { data: denNaMeseca('2026-09'), chislo: -31_000 },
      ],
    },
  ];
}

describe('календарът с цифрите', () => {
  it('клетката носи сбора на реда в колоната · и знакът идва от числото', () => {
    const koloni = koloniNaTakta('mesets', DNES);
    const k = kalendar(redove(), koloni);

    // ПЪРВО обхватът · празна решетка прави всяко твърдение под нея зелено
    expect(k.koloni.length).toBeGreaterThan(2);
    expect(k.redove).toHaveLength(2);

    const naemi = k.redove[0]!;
    const avgust = k.koloni.findIndex((x) => x.ot.startsWith('2026-08'));
    expect(avgust).toBeGreaterThanOrEqual(0);
    expect(naemi.kletki[avgust]?.sbor).toBe(120_000);
    expect(k.redove[1]!.kletki[avgust]?.sbor).toBe(-240_000);
  });

  it('„Период" е сборът на реда · долният ред е сборът на колоната · и двата дават ъгъла', () => {
    const koloni = koloniNaTakta('mesets', DNES);
    const k = kalendar(redove(), koloni);

    // „Период" е сборът по ВИДИМИТЕ колони · число извън прозореца от време не
    // влиза в него (и точно затова разликата по-долу е сверка, не украса)
    const vidim = (mesets: string): boolean =>
      k.koloni.some((x) => x.ot.startsWith(mesets)) as boolean;
    const ochakvanNaem =
      (vidim('2026-07') ? 120_000 : 0) +
      (vidim('2026-08') ? 120_000 : 0) +
      (vidim('2026-09') ? 85_000 : 0);
    const ochakvaniFakturi = (vidim('2026-08') ? -240_000 : 0) + (vidim('2026-09') ? -31_000 : 0);
    expect(vidim('2026-09')).toBe(true);
    expect(k.redove[0]!.period).toBe(ochakvanNaem);
    expect(k.redove[1]!.period).toBe(ochakvaniFakturi);
    expect(k.vsichko).toBe(ochakvanNaem + ochakvaniFakturi);

    const poKoloni = k.podKolonite.reduce((a, s) => a + s, 0);
    expect(poKoloni).toBe(k.vsichko);
    // сверката се записва И при нула (правило 7)
    expect(k.razlika).toBe(0);
  });

  it('число извън всички колони не изчезва тихо · разликата го казва', () => {
    const koloni = koloniNaTakta('mesets', DNES);
    const daleche: RedZaKalendara[] = [
      { id: 'r', ime: 'Ред', chisla: [{ data: '2019-01-01', chislo: 777 }] },
    ];
    const k = kalendar(daleche, koloni);

    expect(k.redove[0]!.period).toBe(0);
    expect(k.podKolonite.reduce((a, s) => a + s, 0)).toBe(0);
    expect(k.razlika).toBe(0);
  });

  it('месецът става дата · първото число', () => {
    expect(denNaMeseca('2026-08')).toBe('2026-08-01');
    expect(denNaMeseca('2026-08-17')).toBe('2026-08-17');
  });
});

describe('календарът на екрана', () => {
  it('клетката носи знака · долният ред е сборът · сверката се КАЗВА', () => {
    const koloni = koloniNaTakta('svoy', DNES, dvanaysetMeseca('2026-09'));
    expect(koloni).toHaveLength(12);
    const iz = kato(kalendarHTML(kalendar(redove(), koloni)));

    expect(iz).toContain('data-kalendar');
    expect(iz).toContain('>Период<');
    // плюсът се ПИШЕ (запис 145) · минусът идва от самото число
    expect(iz).toContain(`+${pishi(120_000)}`);
    expect(iz).toContain('data-kalendar-vsichko');
    expect(iz).toContain('data-kalendar-sbor="0"');
    expect(iz).toContain('сверката затваря');
  });

  it('нулевата клетка е ПРАЗНА · нула не е число за четене', () => {
    const koloni = koloniNaTakta('svoy', DNES, dvanaysetMeseca('2026-09'));
    const iz = kato(kalendarHTML(kalendar([{ id: 'p', ime: 'Празен', chisla: [] }], koloni)));
    expect(iz).toContain('Празен');
    expect(iz).not.toContain(`+${pishi(0)}`);
  });
});
