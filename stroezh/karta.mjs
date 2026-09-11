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
 * ═══ ШАПКАТА · ЕДИН ВИД, ЕДИН ДОМ (Етап 1.1 · 11.09.2026) ═══
 *
 * Измерено на 10.09: 128 живи документа в пет дървета, три реда на четене, които
 * не съвпадат, пет дома на плана, и картата виждаше 93 от 170 при надпис „нито
 * един извън картата". Решение 1 от плана на 10.09 (негово одобрение същата
 * вечер): РЕД 3 на всеки документ е шапка —
 *
 *     **Дата:** ГГГГ-ММ-ДД · **Вид:** ‹вид› · **Състояние:** ‹състояние› [· още]
 *
 * с ЗАКРИТ списък видове, четири състояния и МАТРИЦА папка ↔ вид. Документ без
 * шапка, с непознат вид, с вид извън папката си, втори дом на еднократен вид,
 * „надживян" извън архива или архивиран без „Вместо него" — всяко е находка и
 * `npm run proverka` пада. Новото знание има четири форми (ADR · ден в
 * `izvori/dni` · ден в `dnevnik` · именуван файл в папката на вида си); нов
 * `docs/NN` не е форма.
 *
 * ═══ КАКВО ПРАВИ ═══
 *
 * `--pishi`    строи `docs/00-KARTA.md` от дървото и от регистъра.
 * `--proveri`  строи същото в паметта и го сравнява със записаното; разлика е
 *              находка. Плюс: шапките на ВСИЧКИ документи (рекурсивно), нула
 *              документа извън картата.
 *
 * ЕДИН ФАКТ, ЕДИН ДОМ (правило 14): описанието на всеки документ идва от НЕГО —
 * първото заглавие и първият му абзац. Картата не преразказва; тя сочи.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KOREN = process.env['KARTA_KOREN'] ?? '.';
const KARTA = join(KOREN, 'docs/00-KARTA.md');
const REGISTAR = join(KOREN, 'docs/registar-na-vaprosite.json');

/** Картата НЕ описва себе си · инак писането ѝ я прави „остаряла" в мига след записа. */
const SEBE_SI = 'docs/00-KARTA.md';
/** Датата на раждане на картата · ФИКСИРАНА, защото генерирана дата би сменяла файла всеки ден. */
const RODENA = '2026-09-09';

/** Закритият списък видове · нов вид влиза САМО оттук, с ред в матрицата. */
const VIDOVE = new Set([
  'конституция',
  'витрина',
  'карта',
  'протокол',
  'план',
  'план-на-сесията',
  'дълг',
  'регистър',
  'решение',
  'гръбнак',
  'архитектура-къс',
  'архитектура-част',
  'думи-извор',
  'думи-ден',
  'думи-огледало',
  'задание-книга',
  'задание-чисто',
  'задание-финално',
  'доклад',
  'запис-ден',
  'проучване',
  'указател',
]);

/** Видове с ТОЧНО ЕДИН жив дом · втори жив документ от този вид е находка. */
const EDNOKRATNI = new Set(['конституция', 'карта', 'протокол', 'план', 'дълг', 'гръбнак']);

const SASTOYANIYA = new Set(['жив', 'запис', 'генериран', 'надживян']);

/**
 * МАТРИЦАТА папка ↔ вид · кой вид къде живее. `null` = всеки вид (архивът пази
 * документи от всякакъв вид, но само надживени). Папка без ред тук е находка —
 * нова папка иска ред, не мълчание.
 */
const MATRITSA = {
  '.': ['конституция', 'витрина'],
  docs: [
    'карта',
    'протокол',
    'план',
    'дълг',
    'гръбнак',
    'решение',
    'регистър',
    'указател',
    'проучване',
    'доклад',
    'думи-огледало',
  ],
  'docs/arhitektura': ['архитектура-къс', 'указател'],
  'docs/arhitektura/chasti': ['архитектура-част'],
  'docs/arhiv': null,
  'docs/dnevnik': ['запис-ден', 'план-на-сесията'],
  'docs/dokladi': ['доклад', 'указател'],
  'docs/izvori': ['думи-извор', 'указател'],
  'docs/izvori/dni': ['думи-ден'],
  'docs/izvori/temi': ['думи-огледало'],
  'docs/pazar': ['проучване', 'указател'],
  'docs/sigurnost': ['проучване'],
  zadanie: ['задание-книга', 'указател'],
  'zadanie/CHISTO': ['задание-чисто', 'указател'],
  'zadanie/FINALNO': ['задание-финално', 'указател'],
};

/** Какво е всяка папка · в реда, в който се чете. */
const OPISANIE = [
  ['.', 'КОРЕНЪТ · конституцията и витрината'],
  ['zadanie', 'ЗАДАНИЕТО · Книгата му, клетка по клетка (К1)'],
  ['zadanie/CHISTO', 'ЧИСТОТО ЗАДАНИЕ · филтърът на думите му · какво ТРЯБВА да прави програмата'],
  ['zadanie/FINALNO', 'ФИНАЛНОТО ЗАДАНИЕ · какво ПРАВИ програмата, изведено от кода'],
  ['docs/izvori', 'ИЗВОРИТЕ · неговите думи, както са казани'],
  ['docs/izvori/dni', 'ДУМИТЕ МУ ПО ДНИ · от 10.09.2026 · журнал, само добавяне · домът им'],
  ['docs/izvori/temi', 'ДУМИТЕ МУ ПО ТЕМИ · огледало на изворите, по деветнайсетте теми'],
  ['docs', 'РЕШЕНИЯТА · какво е решено и защо · планът · дългът · гръбнакът'],
  ['docs/arhitektura', 'АРХИТЕКТУРАТА ПО ТЕМИ · деветнайсетте къса'],
  ['docs/arhitektura/chasti', 'АРХИТЕКТУРАТА НАПРЕЧНО · седемте части'],
  [
    'docs/dnevnik',
    'ДНЕВНИКЪТ · какво стана, по дни · `npm run nachalo` го отваря, `npm run kray` го затваря',
  ],
  ['docs/dokladi', 'ДОКЛАДИТЕ · проверките, цели'],
  ['docs/pazar', 'ПАЗАРЪТ · проучванията за продукта и продажбата'],
  ['docs/sigurnost', 'СИГУРНОСТТА · проучванията'],
  ['docs/arhiv', 'АРХИВЪТ · приключеното (правило 13) · всяко казва какво идва вместо него'],
];

const SHAPKA =
  /^\*\*Дата:\*\*\s*(\d{4}-\d{2}-\d{2})\s*·\s*\*\*Вид:\*\*\s*([^·]+?)\s*·\s*\*\*Състояние:\*\*\s*(\S+?)(?:\s*·\s*(.*))?\s*$/u;

/** Шапката на ред 3 · null, ако я няма или не е по формата. */
function shapkata(tekst) {
  const red = tekst.split('\n')[2] ?? '';
  const m = SHAPKA.exec(red);
  if (!m) return null;
  return { data: m[1], vid: m[2].trim(), sastoyanie: m[3].trim(), oshte: m[4] ?? '' };
}

/** Всички `.md` · коренът (без рекурсия) + `docs/**` + `zadanie/**` · подредени по път. */
function vsichkiDokumenti() {
  const dokumenti = [];
  const obhodi = (papka) => {
    let imena;
    try {
      imena = readdirSync(join(KOREN, papka)).sort();
    } catch {
      return;
    }
    for (const ime of imena) {
      const pat = papka === '.' ? ime : `${papka}/${ime}`;
      const st = statSync(join(KOREN, pat));
      if (st.isDirectory()) {
        if (papka !== '.') obhodi(pat);
        continue;
      }
      if (!ime.endsWith('.md')) continue;
      dokumenti.push({ pat, papka, ime });
    }
  };
  obhodi('.');
  obhodi('docs');
  obhodi('zadanie');
  for (const d of dokumenti) {
    const tekst = readFileSync(join(KOREN, d.pat), 'utf8');
    d.shapka = shapkata(tekst);
    d.tekst = tekst;
  }
  return dokumenti.sort((a, b) => (a.pat < b.pat ? -1 : a.pat > b.pat ? 1 : 0));
}

/** Заглавието и първият абзац на един документ · неговите думи, не мои. */
function litseto(tekst) {
  let zaglavie = '';
  let parvi = '';
  for (const r of tekst.split('\n')) {
    const g = r.trim();
    if (g === '') continue;
    if (zaglavie === '' && g.startsWith('# ')) {
      zaglavie = g.slice(2).trim();
      continue;
    }
    if (
      zaglavie !== '' &&
      !g.startsWith('#') &&
      !g.startsWith('|') &&
      !g.startsWith('```') &&
      !g.startsWith('**Дата:**') &&
      !g.startsWith('<!--')
    ) {
      parvi = g.replace(/\*\*/g, '').replace(/\s+/g, ' ');
      break;
    }
  }
  return { zaglavie, parvi: parvi.slice(0, 160) };
}

/** Находките по шапките · всяка е ред с думи и път. */
function nahodkiteNaShapkite(dokumenti) {
  const nahodki = [];
  const domove = new Map();
  for (const d of dokumenti) {
    const s = d.shapka;
    if (!s) {
      nahodki.push(`без шапка на ред 3 · ${d.pat}`);
      continue;
    }
    if (!VIDOVE.has(s.vid)) nahodki.push(`непознат вид „${s.vid}" · ${d.pat}`);
    if (!SASTOYANIYA.has(s.sastoyanie))
      nahodki.push(`непознато състояние „${s.sastoyanie}" · ${d.pat}`);
    if (!(d.papka in MATRITSA)) {
      nahodki.push(`папка без ред в матрицата · ${d.papka}/ · ${d.pat}`);
    } else {
      const pozvoleni = MATRITSA[d.papka];
      if (pozvoleni !== null && VIDOVE.has(s.vid) && !pozvoleni.includes(s.vid))
        nahodki.push(`вид извън папката си · „${s.vid}" в ${d.papka}/ · ${d.pat}`);
    }
    const vArhiva = d.papka === 'docs/arhiv';
    if (vArhiva && s.vid !== 'указател' && s.sastoyanie !== 'надживян')
      nahodki.push(`в arhiv/ без състояние „надживян" · ${d.pat}`);
    if (!vArhiva && s.sastoyanie === 'надживян')
      nahodki.push(`надживян извън arhiv/ · ${d.pat} (правило 13)`);
    if (s.sastoyanie === 'надживян' && !/вместо него/iu.test(d.tekst))
      nahodki.push(`надживян без „Вместо него" · ${d.pat}`);
    if (EDNOKRATNI.has(s.vid) && s.sastoyanie !== 'надживян') {
      if (!domove.has(s.vid)) domove.set(s.vid, []);
      domove.get(s.vid).push(d.pat);
    }
  }
  for (const [vid, patishta] of domove) {
    if (patishta.length > 1)
      nahodki.push(`два дома на еднократен вид „${vid}": ${patishta.join(' · ')}`);
  }
  return nahodki;
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

/** JSON дом, ако го има · иначе `null` (картата казва „няма", не гадае). */
function chetiJson(pat) {
  try {
    return JSON.parse(readFileSync(join(KOREN, pat), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * БРОЯЧЪТ НА ИЗИСКВАНИЯТА · ход 9 (11.09.2026) · ЕДНО число вместо четири.
 *
 * До 10.09 документите казваха 1200 · 1221 · 1225 · 1248 изисквания — всяко
 * преброено на ръка в различен ден. Числото идва от съответствието на белезите
 * (`npm run belezi`), което се генерира от самите файлове на Чистото.
 */
function belezite() {
  const s = chetiJson('zadanie/CHISTO/00-saotvetstvie-na-belezite.json');
  return s?.broy ?? null;
}

function dalgat() {
  const d = chetiJson('docs/registar-na-dalga.json');
  if (!d) return null;
  const po = {};
  for (const r of d.redove ?? []) po[r.sastoyanie] = (po[r.sastoyanie] ?? 0) + 1;
  return { obshto: (d.redove ?? []).length, ...po };
}

function sglobi(dokumenti) {
  const reg = brutoOtRegistara();
  const opisvani = dokumenti.filter((d) => d.pat !== SEBE_SI);
  const b = [];

  b.push('# КАРТАТА · започни оттук');
  b.push('');
  b.push(`**Дата:** ${RODENA} · **Вид:** карта · **Състояние:** генериран`);
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
  b.push('книга. Всеки лист от нея е прозорец на програмата (К1) — осем от 05.09.2026,');
  b.push('единайсет от 11.09.2026 по неговата дума; кодът ги догонва в ход 8.0. Данните');
  b.push('живеят при клиента, не при нас (правило 21). Истината е Журнал само за добавяне;');
  b.push('всичко останало се смята от него.');
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
  b.push('**Всеки документ носи шапка на ред 3** — дата · вид · състояние. Видовете са');
  b.push(`${VIDOVE.size}, затворен списък в \`stroezh/karta.mjs\`; състоянията са четири:`);
  b.push('жив (поддържа се) · запис (замразен, не се пренаписва) · генериран (пише го');
  b.push('машина) · надживян (само в `docs/arhiv/`, с „Вместо него"). Нов документ има');
  b.push('четири форми: ADR · ден в `izvori/dni` · ден в `dnevnik` · именуван файл в');
  b.push('папката на вида си. Друга форма портата не пуска.');
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
  const dl = dalgat();
  if (dl) {
    b.push(
      `| реда в дълга | **${dl.obshto}** | \`npm run dalg\` · \`docs/registar-na-dalga.json\` |`,
    );
    b.push(`| — отворени | **${dl.otvoren ?? 0}** | същото |`);
    b.push(`| — затворени | **${dl.zatvoren ?? 0}** | същото |`);
  } else {
    b.push(`| реда в дълга | **${redoveNa('docs/14-dalgat.md')}** | \`docs/14-dalgat.md\` |`);
  }
  const bel = belezite();
  if (bel) {
    b.push(
      `| изисквания в Чистото (ИЗ-) | **${bel['ИЗ']}** | \`npm run belezi\` · \`zadanie/CHISTO/00-saotvetstvie-na-belezite.json\` — едно число, не четири |`,
    );
    b.push(`| инварианти (ИН-) | **${bel['ИН']}** | същото |`);
  }
  b.push(
    `| реда извори (неговите думи) | **${redoveNa('docs/izvori/01-chist-dopiska.md') + redoveNa('docs/izvori/02-po-temi.md') + redoveNa('docs/izvori/03-koloni-hedari-tablitsi.md') + redoveNa('docs/izvori/04-prozortsite-i-vrazkite.md')}** | \`docs/izvori/\` |`,
  );
  b.push('');

  const poVid = new Map();
  const poSastoyanie = new Map();
  for (const d of opisvani) {
    const vid = d.shapka?.vid ?? '— без шапка';
    const s = d.shapka?.sastoyanie ?? '— без шапка';
    poVid.set(vid, (poVid.get(vid) ?? 0) + 1);
    poSastoyanie.set(s, (poSastoyanie.get(s) ?? 0) + 1);
  }
  b.push('| документи по състояние | колко |');
  b.push('| :---- | ---: |');
  for (const s of ['жив', 'запис', 'генериран', 'надживян']) {
    if (poSastoyanie.has(s)) b.push(`| ${s} | **${poSastoyanie.get(s)}** |`);
  }
  for (const [s, n] of poSastoyanie) if (!SASTOYANIYA.has(s)) b.push(`| ${s} | **${n}** |`);
  b.push('');
  b.push('| документи по вид | колко |');
  b.push('| :---- | ---: |');
  for (const [vid, n] of [...poVid.entries()].sort((x, y) => y[1] - x[1])) {
    b.push(`| ${vid} | **${n}** |`);
  }
  b.push('');
  b.push('Числата на портите (тестове, обходи, модули, лицензи) НЕ стоят тук: те се броят');
  b.push('от `npm run proverka` в мига, в който я пуснеш. Число в документ остарява;');
  b.push('число от команда — не (правило 14).');
  b.push('');
  b.push('---');
  b.push('');
  b.push('## 4 · ВСИЧКИТЕ ДОКУМЕНТИ · нито един извън картата · всеки с вида и състоянието си');
  b.push('');

  let broy = 0;
  const poPapka = new Map();
  for (const d of opisvani) {
    if (!poPapka.has(d.papka)) poPapka.set(d.papka, []);
    poPapka.get(d.papka).push(d);
  }
  const red = OPISANIE.map(([p]) => p);
  const papki = [...poPapka.keys()].sort((x, y) => {
    const ix = red.indexOf(x);
    const iy = red.indexOf(y);
    if (ix >= 0 && iy >= 0) return ix - iy;
    if (ix >= 0) return -1;
    if (iy >= 0) return 1;
    return x < y ? -1 : 1;
  });
  for (const papka of papki) {
    const kakvo =
      OPISANIE.find(([p]) => p === papka)?.[1] ?? 'ПАПКА БЕЗ ОПИСАНИЕ · иска ред в матрицата';
    b.push(`### ${papka === '.' ? 'коренът' : `${papka}/`} · ${kakvo}`);
    b.push('');
    b.push('| файл | вид · състояние | какво е |');
    b.push('| :---- | :---- | :---- |');
    for (const d of poPapka.get(papka)) {
      const { zaglavie, parvi } = litseto(d.tekst);
      const dumi = zaglavie === '' ? parvi : zaglavie;
      const vidat = d.shapka ? `${d.shapka.vid} · ${d.shapka.sastoyanie}` : '**БЕЗ ШАПКА**';
      b.push(`| [\`${d.ime}\`](../${d.pat}) | ${vidat} | ${dumi} |`);
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
    '| `npm run karta` | тази карта да остарее · документ без шапка, с непознат вид или вид извън папката си · втори дом на еднократен вид · надживян извън архива |',
  );
  b.push(
    '| `npm run dnevnik:proveri` | ден без запис · негова дума без дом · роден белег без регистър · тресчотка в грешна посока |',
  );
  b.push('| `npm run proba` | построеното да не работи в истински браузър · пуска се ДВА пъти |');
  b.push('');
  b.push(`**Броено при последното писане на картата:** ${broy} документа в ${papki.length} папки.`);
  b.push('');

  return b.join('\n');
}

const dokumenti = vsichkiDokumenti();
const nahodki = nahodkiteNaShapkite(dokumenti);
const nov = sglobi(dokumenti);

if (process.argv.includes('--pishi')) {
  writeFileSync(KARTA, `${nov}\n`, 'utf8');
  console.log(`Картата е записана · ${nov.split('\n').length} реда`);
  if (nahodki.length > 0) {
    console.log(`ШАПКИТЕ · находки ${nahodki.length} (записът минава, \`--proveri\` ще падне):`);
    for (const n of nahodki) console.log(`  · ${n}`);
  }
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
console.log(`  шапки: ${dokumenti.length} документа · находки ${nahodki.length}`);
console.log(`  състояние: ${svereni ? 'сверена с дървото' : 'ОСТАРЯЛА'}`);
console.log('');

if (nahodki.length > 0) {
  console.log(`НАХОДКИ ПО ШАПКИТЕ · ${nahodki.length}:`);
  for (const n of nahodki) console.log(`  · ${n}`);
  console.log('');
}
if (!svereni) {
  console.log('НАХОДКА: картата се разминава с дървото — документ е добавен, махнат или');
  console.log('преименуван, или число се е сменило. Пусни `npm run karta` и виж дифа.');
}
if (nahodki.length > 0 || !svereni) process.exit(1);
console.log('Картата е жива: всеки документ е описан от самия себе си и носи шапка.');
