/**
 * ТРЕЗОРЪТ · двете числа между банката, ръката и счетоводството.
 *
 * Заданието (M06-10 · M06-P3): „Трезор = изтеглено − дадено" и „Трезорът се
 * СМЯТА, не се въвежда." Негово, 11.09 (запис 195) т.5: „В Сметки къде е
 * Трезора".
 *
 * Тук се пази онова, което може да се сбърка тихо: посоката на изваждането и
 * това, че отрицателното е НАХОДКА, а не грешка в сметката — раздадено повече,
 * отколкото е изтеглено, е истинско състояние и се показва, не се скрива.
 */

import { describe, expect, it } from 'vitest';
import type { Kesh } from '../src/smetach/smetki.js';
import { trezorat } from '../src/smetach/trezor.js';

const kesh = (dadeno: number, izvlechenie: number, vkarano: number): Kesh =>
  ({
    mesets: '2026-09',
    zaplati: dadeno,
    fakturi: 0,
    dadeno,
    izvlechenie,
    vkarano,
    sverki: [],
  }) as Kesh;

describe('трезорът', () => {
  it('в каса = изтеглено − дадено · в ръце = дадено − вкарано', () => {
    const t = trezorat(kesh(150_000, 200_000, 120_000));
    expect(t.vKasa_st).toBe(50_000);
    expect(t.vRatse_st).toBe(30_000);
  });

  it('вкараното е РАЗХОД и се пази с минус · чете се по модул', () => {
    // без модула изваждането се обръща в събиране и трезорът показва двойно
    expect(trezorat(kesh(150_000, 200_000, -120_000)).vRatse_st).toBe(30_000);
    expect(trezorat(kesh(150_000, 200_000, -150_000)).vRatse_st).toBe(0);
  });

  it('нулата е нула · месец без движение не лъже', () => {
    const t = trezorat(kesh(0, 0, 0));
    expect(t.vKasa_st).toBe(0);
    expect(t.vRatse_st).toBe(0);
  });

  it('раздадено повече от изтегленото дава ОТРИЦАТЕЛНО · това е находка, не грешка', () => {
    const t = trezorat(kesh(200_000, 150_000, 0));
    expect(t.vKasa_st).toBe(-50_000);
    expect(t.vRatse_st).toBe(200_000);
  });

  it('всяко число носи формулата си с думи (правило 28)', () => {
    const t = trezorat(kesh(1, 1, 1));
    expect(t.formulaNaKasata).not.toBe('');
    expect(t.formulaNaRatsete).not.toBe('');
    expect(t.mesets).toBe('2026-09');
  });
});
