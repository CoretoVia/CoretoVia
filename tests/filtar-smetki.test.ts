/**
 * ФИЛТЪРЪТ НА СМЕТКИ · секции, оцелели редове, пресметнати сборове.
 *
 * Негово, 12.09 (запис 199), точка 5: „**В сметки да е същото.**" И, по-рано,
 * 11.09 (запис 163): скриването в Сметки „**ще ги изключва от изчисленията**"
 * — тъй че тук се пази точно това: сборът СЛЕД филтъра е сборът на видимите, а
 * не старият сбор с по-малко редове под него.
 *
 * Как изглежда редът на екрана, го доказва проходът; тук е сметката.
 */

import { describe, expect, it } from 'vitest';
import { filtriraySektsiite } from '../src/smetach/filtar-smetki.js';
import type { RedVSektsiya, Sektsiya } from '../src/smetach/smetki.js';

/** Един ред · думите му са прости, за да личи какво прави филтърът. */
function red(i: number, id: string, suma_st: number): RedVSektsiya {
  return { i, id, suma_st, mesets: '2026-09', data: '' };
}

function sektsiya(nomer: number, tekst: string, redove: readonly RedVSektsiya[]): Sektsiya {
  return {
    strana: 'razhod',
    nomer,
    tekst,
    redove,
    sbor: redove.reduce((a, r) => a + r.suma_st, 0),
    spryana: false,
  };
}

/** Думите: 0 · секцията · 1 · името на реда. */
const DUMI: Readonly<Record<string, readonly string[]>> = {
  d1: ['Ток', 'Януари'],
  d2: ['Ток', 'Февруари'],
  d3: ['Вода', 'Януари'],
};
const dumiteNa = (_sek: Sektsiya, r: RedVSektsiya): readonly string[] => DUMI[r.id] ?? [];

const SEKTSII: readonly Sektsiya[] = [
  sektsiya(1, 'Ток', [red(0, 'd1', -1000), red(1, 'd2', -2000)]),
  sektsiya(2, 'Вода', [red(2, 'd3', -500)]),
];

describe('филтърът на Сметки', () => {
  it('празният филтър не пипа нищо · сборът е целият', () => {
    const r = filtriraySektsiite(SEKTSII, [], dumiteNa);
    expect(r.sektsii.length).toBe(2);
    expect(r.sbor).toBe(-3500);
    expect(`${r.broyVidimi} от ${r.broyVsichki}`).toBe('3 от 3');
  });

  /**
   * Празната секция е негов ред от Книгата и мястото ѝ се вижда преди в нея да
   * влезе първата сума. Изчезва само когато ФИЛТЪР я е изпразнил.
   */
  it('без филтър остават и ПРАЗНИТЕ секции · с филтър си отиват', () => {
    const sasPrazna = [...SEKTSII, sektsiya(3, 'Парно', [])];
    expect(filtriraySektsiite(sasPrazna, [], dumiteNa).sektsii.map((s) => s.tekst)).toEqual([
      'Ток',
      'Вода',
      'Парно',
    ]);
    expect(filtriraySektsiite(sasPrazna, ['Ток'], dumiteNa).sektsii.map((s) => s.tekst)).toEqual([
      'Ток',
    ]);
  });

  it('избор в колона · секцията без оцелели редове си отива ЦЯЛА', () => {
    const r = filtriraySektsiite(SEKTSII, ['Ток'], dumiteNa);
    expect(r.sektsii.map((s) => s.tekst)).toEqual(['Ток']);
    expect(r.sbor).toBe(-3000);
    expect(`${r.broyVidimi} от ${r.broyVsichki}`).toBe('2 от 3');
  });

  it('СБОРЪТ НА СЕКЦИЯТА се пресмята върху видимите ѝ редове', () => {
    const r = filtriraySektsiite(SEKTSII, ['', 'Януари'], dumiteNa);
    expect(r.sektsii.map((s) => `${s.tekst} ${s.sbor}`)).toEqual(['Ток -1000', 'Вода -500']);
    expect(r.sbor).toBe(-1500);
    expect(r.broyVidimi).toBe(2);
  });

  it('филтър без нито един оцелял · нула секции и нула сбор', () => {
    const r = filtriraySektsiite(SEKTSII, ['Парно'], dumiteNa);
    expect(r.sektsii).toEqual([]);
    expect(r.sbor).toBe(0);
    expect(`${r.broyVidimi} от ${r.broyVsichki}`).toBe('0 от 3');
  });

  it('търси се СЪДЪРЖАНЕ, без главни · както в дървото', () => {
    const r = filtriraySektsiite(SEKTSII, ['то'], dumiteNa);
    expect(r.sektsii.map((s) => s.tekst)).toEqual(['Ток']);
  });
});
