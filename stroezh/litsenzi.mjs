/**
 * ЛИЦЕНЗИТЕ · обход по `node_modules`, с праг НУЛА за заразяващ лиценз (правило 9).
 *
 * Списъкът на позволените НЕ Е ТУК · домът му е `pozvoleni-litsenzi.mjs`
 * (правило 17). Дотук той живееше на четири места и нито две не съвпадаха:
 * тази шапка казваше „MIT · Apache-2.0 · BSD · ISC", наборът долу съдържаше
 * шестнайсет имена (между тях MPL-2.0), редът накрая печаташе трети вариант,
 * а `tests/biblioteki.test.ts` признаваше пет и забраняваше Zlib.
 *
 * HyperFormula (GPL), SVAR Gantt (GPL) и няколко „SEE LICENSE IN" изглеждаха
 * като кандидати, докато полето `license` не беше прочетено — затова това не е
 * дисциплина, а машина, която пада в CI.
 *
 * Чете се `package.json` на ВСЕКИ инсталиран пакет (и на транзитивните), не само
 * на обявените: заразяващият лиценз идва през зависимост на зависимостта.
 *
 * SPDX изразите се четат ПО СМИСЪЛ: „A OR B" минава, ако поне едното е
 * позволено (jszip е „MIT OR GPL-3.0-or-later" и ние го ползваме под MIT);
 * „A AND B" минава само ако всички са позволени. „MIT/X11" е MIT.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumiteZaSpisaka, PRI_STROEZHA } from './pozvoleni-litsenzi.mjs';

const KOREN = fileURLToPath(new URL('..', import.meta.url));
const NM = join(KOREN, 'node_modules');

/** Позволените · ЧЕТАТ СЕ от единствения си дом, не се преписват. */
const POZVOLENI = new Set(PRI_STROEZHA);

/**
 * Пакети БЕЗ поле `license`, чийто лиценз е проверен С РЪКА в хранилището им.
 * Всеки ред носи къде е проверен; нов ред = нова проверка, не догадка.
 */
const PROVERENI_S_RAKA = {
  'buffers@0.1.1': 'MIT/X11 · README на substack/node-buffers · транзитивна на exceljs',
};

function paketi(papka, sabrani = []) {
  if (!existsSync(papka)) return sabrani;
  for (const ime of readdirSync(papka)) {
    if (ime.startsWith('.')) continue;
    const pat = join(papka, ime);
    if (!statSync(pat).isDirectory()) continue;
    if (ime.startsWith('@')) {
      paketi(pat, sabrani);
      continue;
    }
    const pj = join(pat, 'package.json');
    if (existsSync(pj)) {
      sabrani.push(pj);
      paketi(join(pat, 'node_modules'), sabrani);
    }
  }
  return sabrani;
}

/** SPDX израз → позволен ли е · OR = поне един · AND = всички. */
function pozvolenLi(izraz) {
  const chist = String(izraz)
    .trim()
    .replace(/^\(|\)$/g, '')
    .trim();
  if (chist.includes(' OR ')) return chist.split(' OR ').some((ch) => pozvolenLi(ch));
  if (chist.includes(' AND ')) return chist.split(' AND ').every((ch) => pozvolenLi(ch));
  return POZVOLENI.has(chist.replace(/\+$/, ''));
}

const nahodki = [];
let broy = 0;
for (const pj of paketi(NM)) {
  let p;
  try {
    p = JSON.parse(readFileSync(pj, 'utf8'));
  } catch {
    continue;
  }
  broy += 1;
  const ime = `${p.name}@${p.version}`;
  let l = p.license ?? p.licenses;
  if (Array.isArray(l)) l = l.map((x) => (typeof x === 'string' ? x : x?.type)).join(' OR ');
  if (l && typeof l === 'object') l = l.type;
  if (!l) {
    if (!(ime in PROVERENI_S_RAKA)) nahodki.push(`${ime} · без поле license`);
  } else if (!pozvolenLi(l)) {
    nahodki.push(`${ime} · ${l}`);
  }
}

console.log(`Лицензи: ${broy} пакета прочетени · ${nahodki.length} извън списъка`);
if (nahodki.length) {
  console.log('НАХОДКИ:');
  for (const n of nahodki) console.log(`  ✗ ${n}`);
  process.exitCode = 1;
} else {
  console.log(`Всички са в списъка: ${dumiteZaSpisaka(PRI_STROEZHA)} · или позволено съчетание.`);
}
