/**
 * СТИЛЪТ ПОЗНАВА ВСЕКИ КЛАС, КОЙТО КОДЪТ ПИШЕ.
 *
 * Платената цена, 11.09.2026: четиринайсет класа стояха в HTML без нито едно
 * правило в `app/stil.css`. Нищо не падаше — просто екранът изглеждаше
 * недовършен: календарът беше безцветен, редът с цифрите на Продажби беше гол
 * текст, а таблицата от двайсет колони излизаше извън страницата, защото
 * обвивката `pregled` нямаше `overflow-x`. Клас без правило е мълчалива липса,
 * а мълчаливите липси са точно онова, което този проект брои с машина.
 *
 * Тестът гледа ДВЕ неща:
 *
 *   1. статичните класове (`class="…"` в кода) — обхождат се от диска;
 *   2. ДИНАМИЧНИТЕ, които се смятат в израз и никой обход не вижда — те стоят
 *      в списък с ръка отдолу, защото „изчислено" не значи „непроверимо".
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STIL = 'app/stil.css';

/**
 * Класове, които се смятат в израз · всеки е закован с ръка и с мястото си.
 * Расте ли списъкът, расте и стилът — това е целият договор.
 */
const SMETNATI: readonly { readonly klas: string; readonly kade: string }[] = [
  { klas: 'prihod', kade: 'app/reshetka/kalendar-tablitsa.ts · знакът на клетката' },
  { klas: 'razhod', kade: 'app/reshetka/kalendar-tablitsa.ts · знакът на клетката' },
  { klas: 'nula', kade: 'app/reshetka/kalendar-tablitsa.ts · празната клетка' },
  { klas: 'dnes', kade: 'app/reshetka/kalendar-tablitsa.ts · колоната на днешния ден' },
  { klas: 'period', kade: 'app/reshetka/kalendar-tablitsa.ts · сборът на реда' },
  { klas: 'zavarshena', kade: 'app/prozorets/prodazhbi.ts · състоянието на продажбата' },
  { klas: 'platena', kade: 'app/prozorets/prodazhbi.ts · платената вноска' },
  { klas: 'smetnata', kade: 'app/prozorets/prodazhbi.ts · сметнатата колона' },
];

/** Всеки клас, изписан дословно в `class="…"` из целия `app/`. */
function statichnite(): { readonly klasove: Set<string>; readonly fayla: number } {
  const klasove = new Set<string>();
  let fayla = 0;
  const obhod = (papka: string): void => {
    for (const ime of readdirSync(papka)) {
      const pat = join(papka, ime);
      if (statSync(pat).isDirectory()) obhod(pat);
      else if (ime.endsWith('.ts')) {
        fayla += 1;
        const tekst = readFileSync(pat, 'utf8');
        for (const m of tekst.matchAll(/class="([^"$]*)"/g))
          for (const k of (m[1] ?? '').split(/\s+/))
            if (/^[a-z][a-z0-9-]*$/.test(k)) klasove.add(k);
      }
    }
  };
  obhod('app');
  return { klasove, fayla };
}

function stilat(): string {
  return readFileSync(STIL, 'utf8');
}

/** Стилът споменава ли този клас · като селектор, не като дума в коментар. */
function poznat(css: string, klas: string): boolean {
  return new RegExp(`\\.${klas}(?![a-z0-9-])`, 'u').test(css.replace(/\/\*[\s\S]*?\*\//g, ''));
}

describe('стилът и кодът', () => {
  it('всеки клас, изписан в кода, има правило в стила', () => {
    const { klasove, fayla } = statichnite();
    const css = stilat();
    // обход, който не казва колко е видял, е зелен и когато не е гледал (обход Й)
    expect(fayla).toBeGreaterThan(20);
    expect(klasove.size).toBeGreaterThan(50);

    const bezStil = [...klasove].filter((k) => !poznat(css, k)).sort();
    expect(bezStil).toEqual([]);
  });

  it('и всеки СМЕТНАТ клас също · те не се виждат от обход', () => {
    const css = stilat();
    expect(SMETNATI.length).toBeGreaterThan(5);
    const bezStil = SMETNATI.filter((x) => !poznat(css, x.klas)).map(
      (x) => `${x.klas} · ${x.kade}`,
    );
    expect(bezStil).toEqual([]);
  });

  it('печатът съществува · „разпечатай ми това" не получава отказ', () => {
    const css = stilat();
    expect(css).toContain('@media print');
    // лентата с прозорците и бутоните не влизат в хартията
    expect(/@media print[\s\S]*\.lenta-prozortsi/u.test(css)).toBe(true);
  });

  it('широката таблица се плъзга, не чупи страницата', () => {
    const css = stilat();
    expect(/\.pregled\s*\{[^}]*overflow-x:\s*auto/u.test(css)).toBe(true);
  });
});
