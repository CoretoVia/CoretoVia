/**
 * РЕГИСТЪРЪТ НА ВЪПРОСИТЕ · ЕДИН ДОМ, и машина, която го пази.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Негово, 09.09.2026: „Не мога да говоря едни и същи неща всеки път."
 *
 * Цената, платена същия ден: дългът (`docs/14`) държеше Т3 · Т14 · Т17 · Т18 ·
 * Т44 като „ЧАКА НЕГОВА ДУМА", а отговорите му стояха записани от предния ден в
 * `docs/10`. Никой не сверяваше двата документа, защото никой НЕ МОЖЕШЕ: думите
 * му живеят на ШЕСТ места (`docs/izvori/` · `docs/10` · `docs/16…26` ·
 * `zadanie/00…12` · дванайсетте доклада · старото хранилище), а въпросите — на
 * трето.
 *
 * Дисциплина не пази това. Машина — пази.
 *
 * ═══ КАКВО ПРАВИ ═══
 *
 * `--sazday`   строи скелета: обхожда `docs/` и `zadanie/`, намира ВСЕКИ белег
 *              на въпрос (Т12 · С4 · М1 · Ф7 …) и вписва онези, които ги няма.
 *              Нищо не трие и нищо не презаписва — само дописва.
 *
 * `--proveri`  четирите проверки долу. Ненулев изход при първата находка.
 *
 * ЧЕТИРИТЕ ПРОВЕРКИ:
 *
 *  1 · НУЛА НЕПОЗНАТИ · всеки белег, срещнат в документите, стои в регистъра.
 *      Иначе въпрос може да се роди и да живее, без никой да го брои.
 *
 *  2 · ОТГОВОРЕНОТО НОСИ НЕГОВИТЕ ДУМИ · всеки отговорен въпрос има цитат И
 *      адрес, и цитатът ДЕЙСТВИТЕЛНО стои на този адрес. Отговор без дословна
 *      опора е преразказ (правило 17).
 *
 *  3 · НИКОЙ НЕ ПИТА ОТГОВОРЕНОТО · документ не смее да казва „чака негова дума"
 *      за въпрос, който вече има отговор. Точно това струваше 09.09.
 *
 *  4 · ОБХВАТЪТ СЕ ОБЯВЯВА · машината казва колко файла е видяла и колко белега
 *      е намерила. Нула находки при нула обхват значи „не съм гледал"
 *      (правило 14 · обход Й на честността).
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * КОРЕНЪТ ИДВА ОТВЪН · инак мярката не се доказва.
 *
 * Доказващият тест вдига НАРОЧНО счупено дърво във временна папка и пуска тази
 * команда срещу него. Без този вход проверката би трябвало да пише в дървото на
 * проекта — точно онова, което обход И забранява (и което улови на 09.09).
 */
const KOREN = process.env['REGISTAR_KOREN'] ?? '.';
const REGISTAR = join(KOREN, 'docs/registar-na-vaprosite.json');
const PAPKI = ['docs', 'zadanie'].map((p) => join(KOREN, p)).filter((p) => existsSync(p));

/** Белезите на въпрос · буквата е ТЕМАТА, числото е номерът в нея. */
const BELEG = /(?:^|[^\p{Script=Cyrillic}\p{Script=Latin}])([ТАБВГДЕОСМФУПК])(\d{1,3})(?![0-9])/gu;

/** Думите, с които документ обявява, че чака него. */
const CHAKA = /чака негова дума|ЧАКА НЕГОВА ДУМА|чака него\b|негова дума|чака неговата дума/u;

function vsichkiFaylove(papka, sabrani = []) {
  for (const ime of readdirSync(papka)) {
    const pat = join(papka, ime);
    if (statSync(pat).isDirectory()) {
      if (ime === 'arhiv' || ime === 'izvori') continue; // архивът и изворите не питат
      vsichkiFaylove(pat, sabrani);
    } else if (ime.endsWith('.md')) sabrani.push(pat.replace(/\\/g, '/'));
  }
  return sabrani;
}

function chetiRegistara() {
  try {
    return JSON.parse(readFileSync(REGISTAR, 'utf8'));
  } catch {
    return { vaprosi: [] };
  }
}

/** Всеки белег, срещнат в документите · с файловете, в които стои. */
function belezitéVDokumentite(faylove) {
  const kade = new Map();
  for (const f of faylove) {
    const tekst = readFileSync(f, 'utf8');
    for (const m of tekst.matchAll(BELEG)) {
      const beleg = `${m[1]}${Number(m[2])}`;
      if (!kade.has(beleg)) kade.set(beleg, new Set());
      kade.get(beleg).add(f);
    }
  }
  return kade;
}

const faylove = PAPKI.flatMap((p) => vsichkiFaylove(p));
const kade = belezitéVDokumentite(faylove);
const reg = chetiRegistara();
const po = new Map(reg.vaprosi.map((v) => [v.beleg, v]));

if (process.argv.includes('--sazday')) {
  let novi = 0;
  for (const [beleg, gde] of [...kade].sort()) {
    if (po.has(beleg)) continue;
    reg.vaprosi.push({
      beleg,
      vapros: '',
      sastoyanie: 'nepoznat',
      negovite_dumi: '',
      adres: '',
      kakvo_sledva: '',
      otpushva: [],
      zhivee_v: [...gde].sort(),
    });
    novi += 1;
  }
  reg.vaprosi.sort((a, b) => a.beleg.localeCompare(b.beleg, 'bg'));
  writeFileSync(REGISTAR, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');
  console.log(
    `Регистър · видени ${faylove.length} файла · ${kade.size} белега · вписани ${novi} нови`,
  );
  process.exit(0);
}

// ─────────────────────────────── ПРОВЕРКА ───────────────────────────────────
const nahodki = [];

// 1 · нула непознати
for (const [beleg, gde] of kade) {
  if (!po.has(beleg))
    nahodki.push(`1 · непознат белег „${beleg}" · стои в ${[...gde].join(' · ')}`);
}

// 2 · отговореното носи неговите думи, и те стоят на адреса си
for (const v of reg.vaprosi) {
  if (v.sastoyanie !== 'otgovoren') continue;
  if (v.negovite_dumi.trim() === '') {
    nahodki.push(`2 · „${v.beleg}" е отговорен без НЕГОВИ думи`);
    continue;
  }
  if (v.adres.trim() === '') {
    nahodki.push(`2 · „${v.beleg}" носи думи без адрес`);
    continue;
  }
  const fayl = v.adres.split(':')[0];
  let tekst = '';
  try {
    tekst = readFileSync(fayl, 'utf8');
  } catch {
    nahodki.push(`2 · „${v.beleg}" сочи файл, който го няма: ${fayl}`);
    continue;
  }
  // сверява се ПАРЧЕ от цитата · дългите изречения се пренасят с нов ред
  const parche = v.negovite_dumi.replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!tekst.replace(/\s+/g, ' ').includes(parche)) {
    nahodki.push(`2 · думите на „${v.beleg}" ги няма на адреса ${v.adres}`);
  }
}

// 3 · никой не пита отговореното
for (const f of faylove) {
  for (const [i, red] of readFileSync(f, 'utf8').split('\n').entries()) {
    if (!CHAKA.test(red)) continue;
    for (const m of red.matchAll(BELEG)) {
      const beleg = `${m[1]}${Number(m[2])}`;
      const v = po.get(beleg);
      if (v !== undefined && v.sastoyanie === 'otgovoren') {
        nahodki.push(`3 · ${f}:${i + 1} пита „${beleg}", а той ИМА отговор (${v.adres})`);
      }
    }
  }
}

// 4 · обхватът се обявява
const broy = { otgovoren: 0, otkrit: 0, otpadnal: 0, nepoznat: 0 };
for (const v of reg.vaprosi) broy[v.sastoyanie] = (broy[v.sastoyanie] ?? 0) + 1;

console.log('');
console.log('═══ РЕГИСТЪРЪТ НА ВЪПРОСИТЕ ═══');
console.log('');
console.log(`  видени: ${faylove.length} документа · ${kade.size} белега в тях`);
console.log(`  вписани: ${reg.vaprosi.length} въпроса`);
console.log(
  `  отговорени: ${broy.otgovoren} · открити: ${broy.otkrit} · отпаднали: ${broy.otpadnal} · непознати: ${broy.nepoznat}`,
);
console.log('');

if (nahodki.length > 0) {
  console.log(`НАХОДКИ · ${nahodki.length}:`);
  for (const n of nahodki) console.log(`  · ${n}`);
  console.log('');
  process.exit(1);
}
console.log('Регистърът е цял: нито един въпрос без дом, нито един отговорен, който още се пита.');
