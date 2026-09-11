/**
 * БЕЛЕЗИТЕ · един белег, един вид · Етап 2.0, стъпка 2.0а (решение 6 от плана на 10.09.2026).
 * 2.0а е машината и генерираното съответствие; 2.0б е преномерирането до пин нула;
 * 2.0в е регистърът без евристики.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Измерено на 10.09: дванайсет схеми на номериране в деветнайсетте файла на
 * Чистото Задание, буквени серии в дълга, регистъра и инвариантите — и същите
 * букви значеха различни неща: К1 беше правило, клетка и въпрос; И75 беше
 * изискване и адрес; Т1 беше въпрос, изискване и дълг. Един белег с три смисъла
 * не може да се проследи от машина, а нишката Задание ↔ Архитектура ↔ Код ↔ Тест
 * (Етап 2) стъпва точно на проследяването.
 *
 * ═══ ГРАМАТИКАТА · четири вида, видът стои отпред ═══
 *
 *   ИЗ-‹тема›-‹n›   изискване · тема = двете цифри на файла в zadanie/CHISTO/,
 *                   n = собственият номер на реда в него (2.7 · Ж12 · Р3) —
 *                   номерът НЕ се сменя, само получава темата отпред
 *   ИН-‹група›‹n›   инвариант · редът в docs/arhitektura/chasti/5-invariantite.md (А24)
 *   ВП-‹серия›‹n›   въпрос · записът в docs/registar-na-vaprosite.json (А3 · Т49)
 *   ДЛ-‹серия›‹n›   дълг · редът в docs/14-dalgat.md (Т45 · П1)
 *
 * Тирето е ASCII. Старият формат (гола буква + число) остава в ЗАПИСИТЕ завинаги —
 * те не се пренаписват; в ЖИВИТЕ документи той е тресчотка: броят му може само да
 * пада, докато стане нула (2.0б). Жив е документът, чиято шапка (ред 3) казва
 * `жив` или `генериран`; `запис` и `надживян` не се съдят, където и да стоят.
 *
 * ═══ ПРЕНОМЕРИРАНЕТО · 2.0б · какво става със старите (измерено 11.09) ═══
 *
 *   · К1 · К2 · К3 са ПРАВИЛА на конституцията, не белези — остават голи и не се броят.
 *   · У‹n› е вид работа от протокола, М‹nn› е модул — не са белези на никой дом.
 *   · Т‹n› и П‹n› в проза са ДЪЛГЪТ (ДЛ-), включително затворените в §3 на docs/14;
 *     огледалото им в регистъра (ВП-Т‹n›) остава адресируемо, но прозата не го сочи.
 *   · Обвивка в регистъра (запис без `vapros`) не е въпрос и не дава ВП- белег —
 *     евристиките на `registar.mjs` ги бяха родили от номера на изисквания (2.0в, същия
 *     ден, ги изтри и `registar.mjs` вече чете само `ВП-`).
 *   · Собствената серия на тема от Чистото (К‹n› в 04 · Д‹n› в 13 · Т‹n› в 19) е ИЗ-
 *     САМО вътре в своя файл; отвън същите букви са въпроси, инварианти или дълг.
 *   · Домовете приемат и двете форми на реда си (`| А1 |` и `| ИН-А1 |`), за да може
 *     преномерирането да върви файл по файл, без съответствието да трепне.
 *
 * ═══ ЕДИН ДОМ НА СЪОТВЕТСТВИЕТО ═══
 *
 * `zadanie/CHISTO/00-saotvetstvie-na-belezite.json` се ГЕНЕРИРА от четирите дома
 * (`--sazday`) и `--proveri` го строи наново в паметта и го сравнява — както
 * картата. Ред: `{ staro, fayl, novo, vid }`. Никой не го пише на ръка.
 *
 * ═══ КАКВО ПРОВЕРЯВА `--proveri` ═══
 *
 *   1 · съответствието е свежо (регенерирано в паметта = записаното)
 *   2 · всеки нов белег, употребен в документ, съществува в съответствието
 *   3 · един нов белег не сочи две различни места
 *   4 · старият формат в живите документи не расте (пин · само надолу)
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KOREN = process.env['BELEZI_KOREN'] ?? '.';
const SAOTVETSTVIE = 'zadanie/CHISTO/00-saotvetstvie-na-belezite.json';
const REGISTAR = 'docs/registar-na-vaprosite.json';
const DALG = 'docs/14-dalgat.md';
const INVARIANTI = 'docs/arhitektura/chasti/5-invariantite.md';
const CHISTO = 'zadanie/CHISTO';

/** Записите не се пренаписват · старият формат в тях не се брои (както в registar.mjs). */
const ZAPISI = ['arhiv', 'izvori', 'dokladi', 'dnevnik'];
/** Шапката на ред 3 · състоянието на документа (`stroezh/karta.mjs` я пази). */
const SASTOYANIE = /^\*\*Дата:\*\*.*\*\*Състояние:\*\*\s*(\S+)/u;
const ZHIVI_SASTOYANIYA = new Set(['жив', 'генериран']);

/**
 * ПИН · старият формат в живите документи, броен с тази машина. При раждането ѝ
 * (11.09.2026 сутринта) беше 1 555; същия ден 2.0б го свали до НУЛА — 912 появи в
 * 48 живи документа получиха вида си отпред, 3 въпроса получиха свои записи
 * (ВП-В14 · ВП-В15 · ВП-В16), а лъжливите белези (клетки B2 · B3 · проверките Д1–Д9
 * · името на варианта „Г2+В") бяха пренаписани. Може само да стои на нула: гол
 * белег в жив документ е находка. 2.0в (същия ден): `registar.mjs` губи евристиките
 * си и чете само `ВП-`; 43-те обвивки без въпрос паднаха от регистъра.
 */
const PIN_STAR_FORMAT = 0;

const NOV =
  /(?<![\p{L}\p{N}-])(ИЗ-\d{2}-[А-Я]?\d+(?:\.\d+)*|ИН-[А-Я]\d{1,3}|ВП-[А-Я]\d{1,3}[а-я]?|ДЛ-[А-Я]\d{1,3}[а-я]?)(?![\p{L}\p{N}])/gu;
/**
 * Сериите на четирите дома · без И (изворите), Ж/Р (собствени номерации на теми, само
 * с точка след номера), М (модулите · М12-01 е номер на изискване в тема 12) и У (видове
 * работа). К1 · К2 · К3 са правила и се пропускат след съвпадението (`ePravilo`).
 */
const STAR = /(?<![\p{L}\p{N}-])([ТАБВГДЕОСФПК]\d{1,3}[а-я]?)(?![\p{L}\p{N}])(?!\.\d)/gu;
const ePravilo = (b) => /^К[1-3]$/u.test(b);
/** `**К1.** При кредит…` · собственият номер на ред от Чистото · дом на изискване, не употреба на белег. */
const eNomerNaReda = (red, m) =>
  /^\s*\**$/u.test(red.slice(0, m.index)) && /^[.*)]/u.test(red.slice(m.index + m[1].length));

const pat = (...p) => join(KOREN, ...p);
const ima = (p) => {
  try {
    statSync(pat(p));
    return true;
  } catch {
    return false;
  }
};
const cheti = (p) => readFileSync(pat(p), 'utf8');

function vsichkiMd(papka, sabrani = []) {
  if (!ima(papka)) return sabrani;
  for (const ime of readdirSync(pat(papka))) {
    const p = `${papka}/${ime}`;
    if (statSync(pat(p)).isDirectory()) vsichkiMd(p, sabrani);
    else if (ime.endsWith('.md')) sabrani.push(p);
  }
  return sabrani;
}
const eZapis = (f) => ZAPISI.some((z) => f.includes(`/${z}/`));
/** Жив документ · по папката И по шапката · документ без шапка се смята за жив (картата ще го хване). */
function eZhiv(f) {
  if (eZapis(f)) return false;
  const tretiRed = cheti(f).split('\n')[2] ?? '';
  const m = SASTOYANIE.exec(tretiRed);
  return m === null || ZHIVI_SASTOYANIYA.has(m[1]);
}

/** Без цитатите („…" · "…") и без обратните апострофи · остава онова, което документът твърди сам. */
function bezTsitati(red) {
  return red.replace(/„[^“”"]*[“”"]/gu, ' ').replace(/`[^`]*`/g, ' ');
}

// ── СЪОТВЕТСТВИЕТО · четирите дома ──────────────────────────────────────────

function redoveOtRegistara() {
  if (!ima(REGISTAR)) return [];
  const reg = JSON.parse(cheti(REGISTAR));
  // обвивка без въпрос (`vapros` празен) не е въпрос · родена от евристиките, чака 2.0в
  return (reg.vaprosi ?? [])
    .filter((v) => (v.vapros ?? '').trim() !== '')
    .map((v) => ({
      staro: v.beleg,
      fayl: REGISTAR,
      novo: `ВП-${v.beleg}`,
      vid: 'ВП',
    }));
}

function redoveOtDalga() {
  if (!ima(DALG)) return [];
  const t = cheti(DALG);
  // §1 отворени · §2 невикано · §3 затворени · белегът е самоличност и не изчезва при затваряне
  const a = t.indexOf('\n## 1 ');
  const b = t.indexOf('\n## 4 ');
  const dalg = a >= 0 && b > a ? t.slice(a, b) : t;
  const redove = [];
  const videni = new Set();
  // `| **Т45** |` · `| ~~**Т14**~~ |` · `| **Т48 · стъпалото…** |` · и с вида отпред: `| **ДЛ-Т45** |`
  for (const m of dalg.matchAll(/^\| (?:~~)?\*\*(?:ДЛ-)?([А-Я]\d{1,3}[а-я]?)(?:\*\*| ·)/gmu)) {
    if (videni.has(m[1])) continue;
    videni.add(m[1]);
    redove.push({ staro: m[1], fayl: DALG, novo: `ДЛ-${m[1]}`, vid: 'ДЛ' });
  }
  return redove;
}

function redoveOtInvariantite() {
  if (!ima(INVARIANTI)) return [];
  const redove = [];
  // `| А24 |` и с вида отпред `| ИН-А24 |`
  for (const m of cheti(INVARIANTI).matchAll(/^\| (?:ИН-)?([А-Я]\d{1,3}) \|/gmu)) {
    redove.push({ staro: m[1], fayl: INVARIANTI, novo: `ИН-${m[1]}`, vid: 'ИН' });
  }
  return redove;
}

/**
 * Изискванията · всеки ред на тема, който започва със собствения си номер:
 * `2.7 При …` · `**Ж12** …` · `Р3 …` · `И1.1 …` · `**М12-01.** …` (тема 12 носи
 * темата си в номера · старото остава `М12-01`, новото е `ИЗ-12-01`). Темата е
 * двете цифри на файла. С вида отпред (`**ИЗ-04-К1.**`) редът се чете същият.
 */
function redoveOtChistoto() {
  if (!ima(CHISTO)) return [];
  const redove = [];
  for (const ime of readdirSync(pat(CHISTO)).sort()) {
    const m = /^(\d{2})-.*\.md$/.exec(ime);
    if (!m || m[1] === '00') continue;
    const tema = m[1];
    const videni = new Set();
    for (const red of cheti(`${CHISTO}/${ime}`).split('\n')) {
      const r = /^\*{0,2}(?:ИЗ-\d{2}-)?(?:(М\d{2})-)?([А-Я]?\d+(?:\.\d+)*)\*{0,2}[ .·]\s*\S/u.exec(
        red,
      );
      if (!r || red.startsWith('|') || red.startsWith('#')) continue;
      const n = r[2];
      const staro = r[1] ? `${r[1]}-${n}` : n;
      if (videni.has(n)) continue; // втори ред със същия номер · първият е домът
      videni.add(n);
      redove.push({ staro, fayl: `${CHISTO}/${ime}`, novo: `ИЗ-${tema}-${n}`, vid: 'ИЗ' });
    }
  }
  return redove;
}

function sglobiSaotvetstvie() {
  const redove = [
    ...redoveOtChistoto(),
    ...redoveOtInvariantite(),
    ...redoveOtRegistara(),
    ...redoveOtDalga(),
  ];
  redove.sort((x, y) => (x.novo < y.novo ? -1 : x.novo > y.novo ? 1 : x.fayl < y.fayl ? -1 : 1));
  return {
    kakvo:
      'Съответствие старо → ново на белезите · ГЕНЕРИРАНО от `node stroezh/belezi.mjs --sazday` · не се пише на ръка',
    gramatika: 'ИЗ-‹тема›-‹n› · ИН-‹група›‹n› · ВП-‹серия›‹n› · ДЛ-‹серия›‹n›',
    broy: {
      ИЗ: redove.filter((r) => r.vid === 'ИЗ').length,
      ИН: redove.filter((r) => r.vid === 'ИН').length,
      ВП: redove.filter((r) => r.vid === 'ВП').length,
      ДЛ: redove.filter((r) => r.vid === 'ДЛ').length,
    },
    redove,
  };
}

// ── ПРОВЕРКИТЕ ──────────────────────────────────────────────────────────────

function proveri() {
  const nahodki = [];
  const novo = sglobiSaotvetstvie();
  const novTekst = `${JSON.stringify(novo, null, 2)}\n`;

  // 1 · свежо
  let zapisano = '';
  if (ima(SAOTVETSTVIE)) zapisano = cheti(SAOTVETSTVIE);
  else nahodki.push(`1 · съответствието го няма · пусни \`node stroezh/belezi.mjs --sazday\``);
  if (zapisano !== '' && zapisano !== novTekst) {
    nahodki.push(
      `1 · съответствието е остаряло спрямо четирите дома · пусни \`node stroezh/belezi.mjs --sazday\` и виж дифа`,
    );
  }

  // 3 · един нов белег, едно място
  const poNovo = new Map();
  for (const r of novo.redove) {
    if (!poNovo.has(r.novo)) poNovo.set(r.novo, []);
    poNovo.get(r.novo).push(r.fayl);
  }
  for (const [b, faylove] of poNovo) {
    if (faylove.length > 1)
      nahodki.push(`3 · „${b}" сочи ${faylove.length} места: ${faylove.join(' · ')}`);
  }

  // 2 · всеки употребен нов белег съществува · 4 · старият формат не расте
  const dokumenti = [...vsichkiMd('docs'), ...vsichkiMd('zadanie')].filter(
    (f) => f !== SAOTVETSTVIE,
  );
  let upotrebeni = 0;
  const nepoznati = new Map();
  let star = 0;
  const starPoFayl = new Map();
  for (const f of dokumenti) {
    // записите (по папка и по шапка) не се съдят: планът от 10.09 дава примери на
    // граматиката, преди тя да е имала дом — това не е употреба
    if (!eZhiv(f)) continue;
    const tekst = cheti(f);
    for (const m of tekst.matchAll(NOV)) {
      upotrebeni++;
      if (!poNovo.has(m[1])) nepoznati.set(m[1], [...(nepoznati.get(m[1]) ?? []), f]);
    }
    let vFayla = 0;
    for (const red of tekst.split('\n')) {
      const chist = bezTsitati(red);
      vFayla += [...chist.matchAll(STAR)].filter(
        (m) => !ePravilo(m[1]) && !eNomerNaReda(chist, m),
      ).length;
    }
    if (vFayla > 0) starPoFayl.set(f, vFayla);
    star += vFayla;
  }
  for (const [b, faylove] of nepoznati) {
    nahodki.push(`2 · непознат нов белег „${b}" · стои в ${[...new Set(faylove)].join(' · ')}`);
  }
  if (star > PIN_STAR_FORMAT) {
    nahodki.push(`4 · старият формат в живите документи расте: ${star} > пин ${PIN_STAR_FORMAT}`);
  }

  console.log('');
  console.log('═══ БЕЛЕЗИТЕ ═══');
  console.log('');
  console.log(
    `  съответствие: ${novo.redove.length} реда · ИЗ ${novo.broy['ИЗ']} · ИН ${novo.broy['ИН']} · ВП ${novo.broy['ВП']} · ДЛ ${novo.broy['ДЛ']}`,
  );
  console.log(`  нови белези в документите: ${upotrebeni} · непознати: ${nepoznati.size}`);
  console.log(
    `  стар формат в живите документи: ${star} · пин ${PIN_STAR_FORMAT} · файлове с него: ${starPoFayl.size}`,
  );
  if (process.argv.includes('--po-fayl')) {
    for (const [f, n] of [...starPoFayl].sort((x, y) => y[1] - x[1]).slice(0, 25))
      console.log(`    ${n}\t${f}`);
  }
  console.log('');
  if (nahodki.length > 0) {
    console.log(`НАХОДКИ · ${nahodki.length}:`);
    for (const n of nahodki) console.log(`  · ${n}`);
    console.log('');
    process.exit(1);
  }
  console.log('Белезите са цели: един белег, един вид, едно място.');
}

if (process.argv.includes('--sazday')) {
  const s = sglobiSaotvetstvie();
  writeFileSync(pat(SAOTVETSTVIE), `${JSON.stringify(s, null, 2)}\n`, 'utf8');
  console.log(
    `Съответствието е записано · ${s.redove.length} реда · ИЗ ${s.broy['ИЗ']} · ИН ${s.broy['ИН']} · ВП ${s.broy['ВП']} · ДЛ ${s.broy['ДЛ']}`,
  );
  process.exit(0);
}

proveri();
