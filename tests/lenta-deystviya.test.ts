/**
 * ЧЕТВЪРТИЯТ РЕД · бутоните по теми.
 *
 * Негово, `zadanie/12-dopalneniya-08-09.md` (О1): „**Всички бутони се разделят
 * на теми с падащи менюта, колкото са темите в таба.**" И 11.09 (запис 193):
 * „**Създаването е отделно падащо меню навсякъде. Тук се събират и такта и
 * датата.**"
 *
 * Тук се пази онова, което може да изчезне тихо: бутон, който не е нито в тема,
 * нито открит на реда, просто не се рисува — и никой не разбира, докато той не
 * го потърси.
 */

import { describe, expect, it } from 'vitest';
import { lentaNaDeystviyata } from '../app/reshetka/lenta-deystviya.js';
import { h } from '../app/reshetka/shablon.js';
import {
  BUTONI_NA_UPRAVLENIE,
  butoniBezTema,
  OTKRITITE,
  TEMI_NA_BUTONITE,
} from '../src/model/osnova.js';

describe('четвъртият ред', () => {
  it('НИТО ЕДИН бутон не пада между темите', () => {
    // първо БРОЯТ · празен каталог би направил твърдението под него зелено
    expect(BUTONI_NA_UPRAVLENIE.length).toBeGreaterThan(10);
    expect(butoniBezTema(BUTONI_NA_UPRAVLENIE)).toEqual([]);
  });

  it('Създаването е ПЪРВАТА тема · и е своя, не смесена с изгледа', () => {
    expect(TEMI_NA_BUTONITE[0]?.klyuch).toBe('sazdavane');
    expect(TEMI_NA_BUTONITE[0]?.ime).toBe('Създаване');
    const drugite = TEMI_NA_BUTONITE.slice(1).flatMap((t) => t.klyuchove);
    for (const klyuch of TEMI_NA_BUTONITE[0]?.klyuchove ?? [])
      expect(drugite).not.toContain(klyuch);
  });

  it('тактът и датата стоят ОТКРИТИ · не в меню', () => {
    expect([...OTKRITITE].sort()).toEqual(['nachalo-sega', 'period', 'takt']);
    const vMenyu = new Set(TEMI_NA_BUTONITE.flatMap((t) => t.klyuchove));
    for (const klyuch of OTKRITITE) expect(vMenyu.has(klyuch)).toBe(false);
  });

  it('лентата рисува ВСЕКИ бутон · по веднъж · първо темите, после откритите', () => {
    // рисувачът се подменя с брояч: тестът пита КОЙ е поискан и в какъв ред,
    // без да разчита на HTML — формата е на екрана, редът е договор.
    const poiskani: string[] = [];
    lentaNaDeystviyata(BUTONI_NA_UPRAVLENIE, (b) => {
      poiskani.push(b.klyuch);
      return h``;
    });
    const ochakvani = [...TEMI_NA_BUTONITE.flatMap((tema) => tema.klyuchove), ...OTKRITITE];
    expect(poiskani).toEqual(ochakvani);
    expect(poiskani.length).toBe(BUTONI_NA_UPRAVLENIE.length);
  });

  it('нито един ключ не стои в две теми', () => {
    const vsichki = TEMI_NA_BUTONITE.flatMap((t) => t.klyuchove);
    expect(vsichki.length).toBe(new Set(vsichki).size);
  });
});
