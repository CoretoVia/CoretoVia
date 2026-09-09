/**
 * КАРТАТА · единственият вход за всеки, който идва след нас.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Негово, 09.09.2026: „Как ще гарантираш, че всеки трети колега след теб веднага
 * ще се ориентира и ще разбира къде е попаднал и какво прави… Направи някакво
 * решение, което ще даде резултат накрая."
 *
 * Дотук отговорът беше документ, писан на ръка (`docs/00-CHETI-PARVO.md`). Такъв
 * документ остарява МЪЛЧАЛИВО: новият файл не се вписва, изтритият остава, а
 * числата се преписват. Тоест обещание.
 *
 * Тази карта се ГЕНЕРИРА от самите файлове и от самите команди. Тя не може да
 * остарее, защото никой не я пише: ако документ се появи, изчезне или смени
 * заглавието си, картата се разминава и портата ЧЕРВЕНЕЕ (както `dumi:proveri`).
 *
 * ═══ КАКВО ПРАВИ ═══
 *
 * `--pishi`    строи `docs/00-KARTA.md` от дървото и от регистъра.
 * `--proveri`  строи същото в паметта и го сравнява със записаното; разлика е
 *              находка. Плюс: нула документа извън картата, нула сочени файла,
 *              които ги няма.
 *
 * ЕДИН ФАКТ, ЕДИН ДОМ (правило 14): описанието на всеки документ идва от НЕГО —
 * първото заглавие и първият му абзац. Картата не преразказва; тя сочи.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KOREN = process.env['KARTA_KOREN'] ?? '.';
const KARTA = join(KOREN, 'docs/00-KARTA.md');
const REGISTAR = join(KOREN, 'docs/registar-na-vaprosite.json');

/** Папките, които картата описва · в реда, в който се четат. */
const OBHVAT = [
  { papka: 'zadanie', kakvo: 'ЗАДАНИЕТО · Книгата му, клетка по клетка (К1)' },
  {
    papka: 'zadanie/FINALNO',
    kakvo: 'ФИНАЛНОТО ЗАДАНИЕ · какво ПРАВИ програмата, изведено от кода',
  },
  { papka: 'docs/izvori', kakvo: 'ИЗВОРИТЕ · неговите думи, както са казани' },
  { papka: 'docs', kakvo: 'РЕШЕНИЯТА · какво е решено и защо' },
  { papka: 'docs/dokladi', kakvo: 'ДОКЛАДИТЕ · проверките, цели' },
  { papka: 'docs/arhiv', kakvo: 'АРХИВЪТ · приключеното (правило 13)' },
];

/**
 * Картата НЕ описва себе си.
 *
 * Инак се получава кръг: писането ѝ добавя документ, документът мени картата, и
 * тя е „остаряла" в мига след записа. Един файл е изключен, поименно, и това се
 * казва тук.
 */
const SEBE_SI = '00-KARTA.md';

function faylovete(papka) {
  const pat = join(KOREN, papka);
  try {
    return readdirSync(pat)
      .filter((i) => i.endsWith('.md') && i !== SEBE_SI)
      .filter((i) => statSync(join(pat, i)).isFile())
      .sort();
  } catch {
    return [];
  }
}

/** Заглавието и първият абзац на един документ · неговите думи, не мои. */
function litseto(pat) {
  const redove = readFileSync(pat, 'utf8').split('\n');
  let zaglavie = '';
  let parvi = '';
  for (const r of redove) {
    const g = r.trim();
    if (g === '') continue;
    if (zaglavie === '' && g.startsWith('# ')) {
      zaglavie = g.slice(2).trim();
      continue;
    }
    if (zaglavie !== '' && !g.startsWith('#') && !g.startsWith('|') && !g.startsWith('```')) {
      parvi = g.replace(/\*\*/g, '').replace(/\s+/g, ' ');
      break;
    }
  }
  return { zaglavie, parvi: parvi.slice(0, 160) };
}

function brutoOtRegistara() {
  try {
    const r = JSON.parse(readFileSync(REGISTAR, 'utf8'));
    const b = {};
    for (const v of r.vaprosi) b[v.sastoyanie] = (b[v.sastoyanie] ?? 0) + 1;
    return { obshto: r.vaprosi.length, ...b };
  } catch {
    return { obshto: 0 };
  }
}

function redoveNa(pat) {
  try {
    return readFileSync(join(KOREN, pat), 'utf8').split('\n').length;
  } catch {
    return 0;
  }
}

function sglobi() {
  const reg = brutoOtRegistara();
  const b = [];

  b.push('# КАРТАТА · започни оттук');
  b.push('');
  b.push('> **Този файл се ГЕНЕРИРА.** Не го редактирай на ръка — пиши се `npm run karta`,');
  b.push('> а `npm run proverka` пада, ако е остарял. Описанието на всеки документ идва от');
  b.push('> самия него (заглавието и първия му абзац), затова не може да лъже.');
  b.push('');
  b.push('---');
  b.push('');
  b.push('## 1 · КЪДЕ СИ ПОПАДНАЛ');
  b.push('');
  b.push('**Coretovia** е български счетоводен и имотен продукт, роден от ЕДНА екселска');
  b.push('книга с ОСЕМ листа. Всеки лист е прозорец на програмата — осем са, „само това и');
  b.push('нищо повече или по-малко" (К1). Данните живеят при клиента, не при нас');
  b.push('(правило 21). Истината е Журнал само за добавяне; всичко останало се смята от него.');
  b.push('');
  b.push('**Трите закона, които не се нарушават:**');
  b.push('');
  b.push('1. Журналът е само за добавяне — поправка е ново събитие (сторно).');
  b.push('2. Вратата е единственият вход за запис — нищо не пише в Журнала директно.');
  b.push('3. Парите са цели центове — никакъв плаващ знак, никога.');
  b.push('');
  b.push('Пълните правила: `CLAUDE.md` (32 правила + К1 К2 К3). Те са конституция —');
  b.push('менят се само срещу довод ЗА КОДА (правило 32), и промяната се записва.');
  b.push('');
  b.push('---');
  b.push('');
  b.push('## 2 · РЕДЪТ НА ЧЕТЕНЕ · четири стъпала, всяко ражда следващото');
  b.push('');
  b.push('```');
  b.push('ИЗВОРИТЕ          →  ЧИСТОТО ЗАДАНИЕ  →  АРХИТЕКТУРАТА  →  КОДЪТ');
  b.push('неговите думи,       филтърът на          как е устроено     по номера');
  b.push('както са казани      думите му');
  b.push('docs/izvori/         zadanie/CHISTO/      docs/15            src/ app/');
  b.push('```');
  b.push('');
  b.push('И отделно, изведено ОТ КОДА: **`zadanie/FINALNO/`** — какво ПРАВИ програмата');
  b.push('днес, написано така, че ИИ, който не е виждал кода, да построи същото.');
  b.push('');
  b.push('**Ако си нов и имаш пет минути:** `CLAUDE.md` → тази карта → `docs/14-dalgat.md`');
  b.push('(какво е отворено) → `docs/registar-na-vaprosite.json` (кой въпрос има отговор).');
  b.push('');
  b.push('---');
  b.push('');
  b.push('## 3 · КОЛКО СМЕ · броено, не преписано');
  b.push('');
  b.push('| какво | колко | къде се брои |');
  b.push('| :---- | ---: | :---- |');
  b.push(`| въпроса в регистъра | **${reg.obshto}** | \`npm run registar\` |`);
  b.push(`| — с негов отговор | **${reg.otgovoren ?? 0}** | същото |`);
  b.push(`| — решени от кода | **${reg.reshen_ot_koda ?? 0}** | същото |`);
  b.push(`| — още открити | **${reg.otkrit ?? 0}** | същото |`);
  b.push(`| — отпаднали | **${reg.otpadnal ?? 0}** | същото |`);
  b.push(`| — още неустановени | **${reg.nepoznat ?? 0}** | същото |`);
  b.push(`| реда в дълга | **${redoveNa('docs/14-dalgat.md')}** | \`docs/14-dalgat.md\` |`);
  b.push(
    `| реда извори (неговите думи) | **${redoveNa('docs/izvori/01-chist-dopiska.md') + redoveNa('docs/izvori/02-po-temi.md') + redoveNa('docs/izvori/03-koloni-hedari-tablitsi.md') + redoveNa('docs/izvori/04-prozortsite-i-vrazkite.md')}** | \`docs/izvori/\` |`,
  );
  b.push('');
  b.push('Числата на портите (тестове, обходи, модули, лицензи) НЕ стоят тук: те се броят');
  b.push('от `npm run proverka` в мига, в който я пуснеш. Число в документ остарява;');
  b.push('число от команда — не (правило 14).');
  b.push('');
  b.push('---');
  b.push('');
  b.push('## 4 · ВСИЧКИТЕ ДОКУМЕНТИ · нито един извън картата');
  b.push('');

  let broy = 0;
  const vidyani = new Set();
  for (const { papka, kakvo } of OBHVAT) {
    const imena = faylovete(papka).filter((i) => {
      const p = `${papka}/${i}`;
      if (vidyani.has(p)) return false;
      vidyani.add(p);
      return true;
    });
    if (imena.length === 0) continue;
    b.push(`### ${papka}/ · ${kakvo}`);
    b.push('');
    b.push('| файл | какво е |');
    b.push('| :---- | :---- |');
    for (const ime of imena) {
      const { zaglavie, parvi } = litseto(join(KOREN, papka, ime));
      const dumi = zaglavie === '' ? parvi : zaglavie;
      b.push(`| [\`${ime}\`](${ime === 'ДА' ? '' : `../${papka}/${ime}`}) | ${dumi} |`);
      broy += 1;
    }
    b.push('');
  }

  b.push('---');
  b.push('');
  b.push('## 5 · МАШИНИТЕ, КОИТО ПАЗЯТ ТОВА');
  b.push('');
  b.push('| команда | какво не позволява |');
  b.push('| :---- | :---- |');
  b.push('| `npm run proverka` | всичките порти наведнъж · спира на първата червена |');
  b.push(
    '| `npm run registar` | въпрос без дом · отговор без негови думи · документ, който пита нещо вече отговорено |',
  );
  b.push(
    '| `npm run karta` | тази карта да остарее · нов или изтрит документ, който не се вижда тук |',
  );
  b.push('| `npm run proba` | построеното да не работи в истински браузър · пуска се ДВА пъти |');
  b.push('');
  b.push(
    `**Броено при последното писане на картата:** ${broy} документа в ${OBHVAT.length} папки.`,
  );
  b.push('');

  return b.join('\n');
}

const nov = sglobi();

if (process.argv.includes('--pishi')) {
  writeFileSync(KARTA, `${nov}\n`, 'utf8');
  console.log(`Картата е записана · ${nov.split('\n').length} реда`);
  process.exit(0);
}

let star = '';
try {
  star = readFileSync(KARTA, 'utf8');
} catch {
  console.log('НАХОДКА: картата я няма · пусни `npm run karta`');
  process.exit(1);
}

const svereni = star.trim() === nov.trim();
console.log('');
console.log('═══ КАРТАТА ═══');
console.log('');
console.log(`  описани документи: ${(nov.match(/^\| \[`/gmu) ?? []).length}`);
console.log(`  състояние: ${svereni ? 'сверена с дървото' : 'ОСТАРЯЛА'}`);
console.log('');

if (!svereni) {
  console.log('НАХОДКА: картата се разминава с дървото — документ е добавен, махнат или');
  console.log('преименуван, или число се е сменило. Пусни `npm run karta` и виж дифа.');
  process.exit(1);
}
console.log('Картата е жива: всеки документ е описан от самия себе си.');
