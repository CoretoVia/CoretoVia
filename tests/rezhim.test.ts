/**
 * ДВАТА РЕЖИМА НА КАЛЕНДАРА · един за двата прозореца.
 *
 * Негово, 12.09 (запис 202), ДОСЛОВНО: „**Календара има две нива за които
 * говорихме. В едното състочние включват редовете с бюджет и редовете от
 * Сметки, а другото включва само Задачите без да се вкарва в календара
 * бюджета на всяко от тях което има… Двата бутона сменят и двата режима в
 * Управление и в Сметки.**"
 *
 * Какво рисува всеки прозорец в двата режима, го доказва проходът през истински
 * браузър (раздел 4ж). Тук се пази онова, което се смята БЕЗ екран: че ключът е
 * ЕДИН и няма префикс на прозорец, че подразбраното е „пари", и че счупен или
 * непознат запис не пуска трети режим в програмата.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { chetiEkranno, snimkaNaEkrana, zapomniEkranno } from '../app/reshetka/pamet-ekran.js';
import {
  dumataNaRezhima,
  KLYUCHAT_NA_REZHIMA,
  obarniRezhima,
  parite,
  rezhimatSega,
} from '../app/reshetka/rezhim.js';

/** Хранилище в паметта · без него `pamet-ekran.ts` пада към подразбраното. */
function hranilishteVPametta(): Map<string, string> {
  const karta = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    get length() {
      return karta.size;
    },
    key: (i: number) => [...karta.keys()][i] ?? null,
    getItem: (k: string) => karta.get(k) ?? null,
    setItem: (k: string, v: string) => {
      karta.set(k, v);
    },
    removeItem: (k: string) => {
      karta.delete(k);
    },
  };
  return karta;
}

describe('двата режима на календара', () => {
  let pamet: Map<string, string>;

  beforeEach(() => {
    pamet = hranilishteVPametta();
  });

  it('подразбраното е ПАРИ · числото е причината програмата да я има', () => {
    expect(rezhimatSega()).toBe('pari');
    expect(parite()).toBe(true);
  });

  it('обръщането връща новия режим и го ЗАПОМНЯ', () => {
    expect(obarniRezhima()).toBe('zadachi');
    expect(rezhimatSega()).toBe('zadachi');
    expect(parite()).toBe(false);
    expect(obarniRezhima()).toBe('pari');
    expect(rezhimatSega()).toBe('pari');
  });

  it('ЕДИН ключ за двата прозореца · без префикс на прозорец', () => {
    obarniRezhima();
    expect([...pamet.keys()]).toEqual(['ui.v1.rezhim']);
    expect(KLYUCHAT_NA_REZHIMA.includes('.')).toBe(false);
  });

  /**
   * Тук е цялата причина файлът да съществува: моделът на Управление е
   * ИМЕНУВАН поглед на Управление (ADR-014) и се възстановява по префикс. Ако
   * режимът беше негов, отварянето на модел там щеше да мени какво вижда
   * Сметки — а той поиска обратното: един режим, който двата бутона въртят.
   */
  it('режимът НЕ влиза в модела на нито един прозорец', () => {
    zapomniEkranno('upravlenie.takt', 'godina');
    zapomniEkranno('smetki.takt', 'godina');
    obarniRezhima();
    expect(Object.keys(snimkaNaEkrana('upravlenie'))).toEqual(['upravlenie.takt']);
    expect(Object.keys(snimkaNaEkrana('smetki'))).toEqual(['smetki.takt']);
  });

  it('непознат запис не пуска трети режим · пада към ПАРИ', () => {
    zapomniEkranno(KLYUCHAT_NA_REZHIMA, 'нещо друго');
    expect(chetiEkranno<string>(KLYUCHAT_NA_REZHIMA, 'pari')).toBe('нещо друго');
    expect(rezhimatSega()).toBe('pari');
  });

  it('бутонът казва какво ще СТАНЕ · всеки прозорец назовава своето', () => {
    expect(dumataNaRezhima('Сметки')).toBe('Скрий Сметки');
    expect(dumataNaRezhima('Задачи')).toBe('Скрий Задачи');
    obarniRezhima();
    expect(dumataNaRezhima('Сметки')).toBe('Покажи Сметки');
    expect(dumataNaRezhima('Задачи')).toBe('Покажи Задачи');
  });
});
