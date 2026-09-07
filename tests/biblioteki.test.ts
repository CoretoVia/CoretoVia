/**
 * БИБЛИОТЕКИТЕ · пин с ръка (правило 9 · ADR-002).
 *
 * Библиотека влиза САМО когато решава проблем, който не сме решили, и влиза
 * през ADR с име · версия · лиценз · размер · кой проблем. Нова зависимост без
 * ред тук е червен тест.
 *
 * СПИСЪКЪТ НА ПОЗВОЛЕНИТЕ ЛИЦЕНЗИ НЕ Е ТУК · чете се от единствения си дом
 * `stroezh/pozvoleni-litsenzi.mjs` (правило 17). Дотук той стоеше преписан и
 * се беше разминал: тук пет имена без Zlib, в машината шестнайсет с MPL-2.0.
 *
 * ДВАТА ОБХОДА ДОЛУ БЯХА СЛЕПИ и това е поправено (резен 6с):
 *   · внасянето търсеше буквално `from 'exceljs'` — тоест ВТОРА библиотека с
 *     друго име щеше да мине покрай пазача, който я трябва да пази;
 *   · телефонирането обхождаше само `src/` и само `.ts` — тоест `fetch` в
 *     джоба (`app/public/sw.js`) беше невидим по два независими признака.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { V_PAKETA } from '../stroezh/pozvoleni-litsenzi.mjs';

const POZVOLENI = [
  {
    ime: 'exceljs',
    versiya: '4.4.0',
    litsenz: 'MIT',
    problem:
      'стилове · слети клетки · валидации · формули с кеш · автофилтър, на четене И на писане',
  },
] as const;

/**
 * КОЙ ФАЙЛ МОЖЕ ДА ВНАСЯ ЧУЖД ПАКЕТ · име на пакета → пътищата, на които се
 * признава. Огледало на правилото `chuzhdo-samo-poimenno` в
 * `.dependency-cruiser.cjs`: там е забраната, тук е числото.
 */
const VNOSITELI: Readonly<Record<string, readonly string[]>> = {
  exceljs: ['src/kniga/ooxml.ts'],
};

/**
 * КОЙ ИМА ПРАВО ДА ТЕЛЕФОНИРА · път → колко викания се очакват.
 *
 * Джобът Е изключението и това не е пропуск: той сваля черупката и я пази, за
 * да работи приложението без мрежа. Числото е пиннато, за да се забележи ВТОРО
 * викане (правило 15: изключено ≠ липсващо — отворът се вижда, не се подразбира).
 */
const TELEFONIRAT_S_PRICHINA: Readonly<Record<string, { broy: number; zashto: string }>> = {
  'app/public/sw.js': {
    broy: 1,
    zashto: 'джобът · сваля черупката и я пази офлайн · това му е работата',
  },
};

const pj = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies: Record<string, string>;
};

/** Всички файлове с код под дадена папка · `.ts` И `.js` (джобът е `.js`). */
function faylove(papka: string, sabrani: string[] = []): string[] {
  for (const ime of readdirSync(papka)) {
    const pat = join(papka, ime);
    if (statSync(pat).isDirectory()) faylove(pat, sabrani);
    else if (ime.endsWith('.ts') || ime.endsWith('.js')) sabrani.push(pat.replace(/\/g, '/'));
  }
  return sabrani;
}

const KODAT = [...faylove('src'), ...faylove('app')];

describe('библиотеките в готовия пакет', () => {
  it('са точно изброените, с точна версия', () => {
    expect(Object.entries(pj.dependencies).sort()).toEqual(
      POZVOLENI.map((p) => [p.ime, p.versiya] as [string, string]).sort(),
    );
  });

  it('всяка има лиценз от позволените ЗА ПАКЕТА и казва какъв проблем решава', () => {
    for (const p of POZVOLENI) {
      expect(V_PAKETA).toContain(p.litsenz);
      expect(p.problem.length).toBeGreaterThan(10);
    }
  });

  it('позволените лицензи имат ЕДИН дом · тук не се преписват', () => {
    // Ако някой върне списъка в този файл, това твърдение казва защо да не го прави.
    const tozi = readFileSync('tests/biblioteki.test.ts', 'utf8');
    expect(tozi).not.toMatch(/\[\s*'MIT',\s*'Apache-2\.0'/);
    expect(V_PAKETA).toContain('Zlib');
    expect(V_PAKETA).not.toContain('MPL-2.0');
  });

  it('ЧУЖД пакет се внася само от обявените файлове · важи за ВСЯКО име, не само exceljs', () => {
    const namereni: Record<string, string[]> = {};
    for (const pat of KODAT) {
      const tekst = readFileSync(pat, 'utf8');
      for (const [, spec] of tekst.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) continue;
        const paket = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]!;
        (namereni[paket] ??= []).push(pat);
      }
    }
    for (const ime of Object.keys(namereni)) namereni[ime]!.sort();
    expect(namereni).toEqual(VNOSITELI);
    // обходът трябва да е ГЛЕДАЛ (обход Й · празен обход дава зелено без работа)
    expect(KODAT.length).toBeGreaterThan(80);
  });

  it('никой не телефонира освен джоба · src/ И app/ · .ts И .js', () => {
    const nahodki: string[] = [];
    const broyPoFayl: Record<string, number> = {};
    for (const pat of KODAT) {
      for (const [i, red] of readFileSync(pat, 'utf8').split('\n').entries()) {
        const gol = red.trim();
        if (gol.startsWith('//') || gol.startsWith('*')) continue;
        if (!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(red)) continue;
        if (pat in TELEFONIRAT_S_PRICHINA) {
          broyPoFayl[pat] = (broyPoFayl[pat] ?? 0) + 1;
          continue;
        }
        nahodki.push(`${pat}:${i + 1}`);
      }
    }
    expect(nahodki).toEqual([]);
    // отворът е ИЗБРОЕН · второ викане в джоба вдига червено
    for (const [pat, { broy }] of Object.entries(TELEFONIRAT_S_PRICHINA)) {
      expect({ [pat]: broyPoFayl[pat] ?? 0 }).toEqual({ [pat]: broy });
    }
  });
});
