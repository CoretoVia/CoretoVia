/**
 * ПОДСКАЗКАТА · чистите части, без DOM (ход Х · хелпът на две степени).
 *
 * Кутията и слушателите живеят в браузъра и ги доказва проходът
 * (`proba/razdeli/pomosht.ts`). Тук се пази онова, което се смята без екран:
 * белегът, празното, изборът на степен и подразбраното без памет.
 */

import { describe, expect, it } from 'vitest';
import {
  izborNaStepenHTML,
  KLYUCH_NA_STEPENTA,
  podskazka,
  podskazkaSDumi,
  stepenNaPomoshtta,
  zapomniStepenta,
} from '../app/reshetka/podskazka.js';
import type { Zapechatan } from '../app/reshetka/shablon.js';
import { IMENATA_NA_STEPENITE, pomosht, tekstNaPomoshtta } from '../src/model/pomosht.js';

/** Само за теста · чете запечатания низ през символа, както `tests/shablon.test.ts`. */
const kato = (z: Zapechatan): string => {
  const simvoli = Object.getOwnPropertySymbols(z);
  expect(simvoli).toHaveLength(1);
  return (z as unknown as Record<symbol, string>)[simvoli[0]!]!;
};

const P = pomosht('Защо съществува полето.', 'площ × база по вид');

describe('подсказката · степента', () => {
  it('без памет на екрана степента е подразбраната · Начало', () => {
    // vitest върви в node · `localStorage` няма, и това е точно случаят „ново устройство"
    expect(typeof localStorage).toBe('undefined');
    // закована с ръка, не сверена с константата: подразбраното е РЕШЕНИЕ (запис 132)
    expect(stepenNaPomoshtta()).toBe('nachalo');
  });

  it('запомнянето без памет не гърми · и подразбраното остава', () => {
    expect(() => zapomniStepenta('normalno')).not.toThrow();
    expect(stepenNaPomoshtta()).toBe('nachalo');
  });

  it('счупен запис в паметта пада към Начало · стар етикет, чужд низ, невалиден JSON', () => {
    const g = globalThis as { localStorage?: unknown };
    const proba = (surovo: string): string => {
      g.localStorage = { getItem: () => surovo, setItem: () => undefined };
      try {
        return stepenNaPomoshtta();
      } finally {
        delete g.localStorage;
      }
    };
    expect(proba('"ekspert"')).toBe('nachalo');
    expect(proba('"Нормален"')).toBe('nachalo');
    expect(proba('{счупено')).toBe('nachalo');
    expect(proba('"normalno"')).toBe('normalno');
  });

  it('ключът в паметта е без префикс на прозорец · префиксът на версията го слага pamet-ekran', () => {
    expect(KLYUCH_NA_STEPENTA).toBe('pomosht.stepen');
    expect(KLYUCH_NA_STEPENTA.startsWith('ui.')).toBe(false);
  });
});

describe('подсказката · белегът', () => {
  it('podskazka(p) дава белег с текста на подразбраната степен · защо + формулата', () => {
    expect(kato(podskazka(P))).toBe(` data-podskazka="${tekstNaPomoshtta(P, 'nachalo')}"`);
    expect(kato(podskazka(P))).toBe(
      ' data-podskazka="Защо съществува полето. · площ × база по вид"',
    );
  });

  it('текстът се екранира · кавичка в помощта не затваря атрибута', () => {
    const s = pomosht('казва „защо" и "кое"', 'а < б');
    const iz = kato(podskazka(s));
    expect(iz).toContain('&quot;кое&quot;');
    expect(iz).toContain('а &lt; б');
    expect(iz.split('"').length).toBe(3);
  });

  it('podskazkaSDumi с празен текст е НИЩО · не празен атрибут', () => {
    expect(kato(podskazkaSDumi(''))).toBe('');
    expect(kato(podskazkaSDumi('Книгата не е открита — първо Стопанинът.'))).toBe(
      ' data-podskazka="Книгата не е открита — първо Стопанинът."',
    );
  });
});

describe('подсказката · изборът на степен', () => {
  it('носи двата етикета · и selected само на подразбраната', () => {
    const iz = kato(izborNaStepenHTML());
    expect(iz).toContain('data-pomosht-stepen');
    expect(iz).toContain(`>${IMENATA_NA_STEPENITE.nachalo}<`);
    expect(iz).toContain(`>${IMENATA_NA_STEPENITE.normalno}<`);
    expect(iz).toMatch(/<option value="nachalo" selected>/);
    expect(iz).not.toMatch(/<option value="normalno" selected>/);
    expect(iz.match(/selected/g)).toHaveLength(1);
  });
});
