/**
 * КОЛОНИТЕ КАТО В ЕКСЕЛ · паметта на ширините и на скритото.
 *
 * Негово, 11.09 (запис 193): „**Да има скриване на колони в Управление и Сметки
 * и колоната да се мести ширината като на ексел. Искам изгледа на ексел.
 * Казвам го за 100тен път.**" И 11.08: „**Скритите колони: Лично, като
 * ширините.**" — тоест и двете са ПОГЛЕД на този човек, на това устройство:
 * живеят в паметта на екрана, не в Журнала.
 *
 * Влаченето и рисуването ги доказва проходът през истински браузър; тук се
 * пази онова, което се смята без екран — кой ключ къде живее и че скриването
 * на една таблица не пипа другата.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { prilozhiKolonite, skriyKolona, varniVsichkiKoloni } from '../app/reshetka/kolonite.js';

/**
 * Хранилище в паметта · `pamet-ekran.ts` пада мълчаливо към подразбраното,
 * когато `localStorage` го няма, и тогава нищо не се помни. Тук му се дава
 * най-простото възможно, за да се провери договорът, а не браузърът.
 */
function hranilishteVPametta(): Map<string, string> {
  const karta = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
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

describe('скритите колони', () => {
  let pamet: Map<string, string>;

  beforeEach(() => {
    pamet = hranilishteVPametta();
  });

  it('се помнят под свой ключ за всяка таблица · с версията на екрана отпред', () => {
    skriyKolona('imoti', 'adres');
    const klyuchove = [...pamet.keys()];
    expect(klyuchove).toHaveLength(1);
    expect(klyuchove[0]).toBe('ui.v1.kolonite.skriti.imoti');
    expect(JSON.parse(pamet.get(klyuchove[0]!) ?? '[]')).toEqual(['adres']);
  });

  it('една таблица не пипа другата', () => {
    skriyKolona('imoti', 'adres');
    skriyKolona('prodazhbi', 'garazh');
    expect(JSON.parse(pamet.get('ui.v1.kolonite.skriti.imoti') ?? '[]')).toEqual(['adres']);
    expect(JSON.parse(pamet.get('ui.v1.kolonite.skriti.prodazhbi') ?? '[]')).toEqual(['garazh']);
  });

  it('една и съща колона не се записва два пъти', () => {
    skriyKolona('imoti', 'adres');
    skriyKolona('imoti', 'adres');
    expect(JSON.parse(pamet.get('ui.v1.kolonite.skriti.imoti') ?? '[]')).toEqual(['adres']);
  });

  it('връщането ги маха всичките · лентата под таблицата го прави с едно натискане', () => {
    skriyKolona('imoti', 'adres');
    skriyKolona('imoti', 'papka');
    varniVsichkiKoloni('imoti');
    expect(JSON.parse(pamet.get('ui.v1.kolonite.skriti.imoti') ?? '[]')).toEqual([]);
  });
});

describe('прилагането върху екрана', () => {
  it('без нито една таблица не гърми · екранът може да е друг прозорец', () => {
    hranilishteVPametta();
    const prazen = { querySelectorAll: () => [] } as unknown as HTMLElement;
    expect(() => prilozhiKolonite(prazen)).not.toThrow();
  });
});
