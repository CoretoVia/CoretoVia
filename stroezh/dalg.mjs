/**
 * ДЪЛГЪТ · изпълним регистър · Етап 2.1 (решение 4 от плана на 10.09.2026).
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Негово, 08.09.2026: „да не се движи напред, докато нещо назад остава недовършено или
 * нерешено… не се строи, ако не е здраво и не издържа проверките и тестовете."
 *
 * Правило 30 иска всеки ред на дълга да носи „какво трябва ПРЕДИ него" и „как се познава,
 * че е затворен". Дотук двете бяха проза в `docs/14-dalgat.md`, и никоя машина не ги
 * четеше. Цената: на 10.09 трийсет затворени реда стояха в „ОТВОРЕНИ"; на 08.09 два реда
 * с ИЗПЪЛНЕНО отпушващо условие продължаваха да чакат („същият дефект, само по-тих").
 * Изречение без машина е пожелание.
 *
 * ═══ ЕДИН ДОМ · `docs/registar-na-dalga.json` ═══
 *
 * Всеки ред: `beleg` (Т45 · П1 · СВ1 · Н1) · `kakvo` · `kade` · `hod` (ходът от
 * `docs/03-plan.md` §1, който го затваря; празно = без ход) · `predi[]` (други редове на
 * дълга) · `chaka` (с думи · какво трябва преди него отвъд редовете) · `otpushva[]`
 * (машинни условия, за да ТРЪГНЕ) · `uslovia[]` (машинни условия, за да е ЗАТВОРЕН) ·
 * `kak` (с думи) · `sastoyanie` (otvoren · zatvoren · otpadnal) · `zatvoren_na` · `zatvoren_kak`.
 *
 * `docs/14-dalgat.md` §1–§3 се ГЕНЕРИРАТ оттук (`--pishi`) между два маркера; прозата
 * извън маркерите е на ръка. Никой не пише редове в md-то на ръка.
 *
 * ═══ УСЛОВИЯТА · осем вида, всяко е функция тук, не изречение ═══
 *
 *   test    · тест с името на белега (`it('Т27 · …')` · `'ДЛ-Т27 · …'`) съществува в `tests/`
 *   ima     · идентификаторът се среща в кода (без коментари и низове) в папките `v`,
 *             извън файловете `izvan`, поне `min` пъти · това е „има ли жив викащ"
 *   nyama   · идентификаторът НЕ се среща никъде в `v`
 *   fayl    · файлът съществува · и съдържа `sadarzha`, ако е дадено
 *   vapros  · въпросът в `docs/registar-na-vaprosite.json` е в едно от `sastoyaniya`
 *             (по подразбиране: отговорен · решен от кода · отпаднал — тоест думата му е дадена)
 *   dalg    · друг ред на дълга е затворен
 *   broy    · броят съвпадения на шаблон в папки `v` е ≤ `max` и/или ≥ `min`
 *   hod     · ходът в `docs/03-plan.md` §1 е `**готов**`
 *
 * ═══ КАКВО ПРОВЕРЯВА `--proveri` ═══
 *
 *   1 · регистърът е цял: белезите са уникални · `predi` сочат съществуващи редове ·
 *       `hod` с вид на номер сочи ход от плана · затвореният носи дата и „как"
 *   2 · отворен ред без нито едно машинно условие · ПИН (само надолу)
 *   3 · отворен ред, чиито условия ВСИЧКИ държат → „ВЕЧЕ ЗАТВОРЕН, а стои отворен"
 *       (машината не затваря — човек пише `zatvoren_kak`)
 *   4 · затворен ред, чието условие вече НЕ държи → „ОТВОРИЛ СЕ Е ТИХО"
 *   5 · генерираното md е свежо
 *   · отпушените (всички `predi` затворени и всички `otpushva` държат) се ПЕЧАТАТ:
 *     те чакат ред, не условие — това е информация, не находка
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KOREN = process.env['DALG_KOREN'] ?? '.';
const REGISTAR = 'docs/registar-na-dalga.json';
const DALG_MD = 'docs/14-dalgat.md';
const PLAN = 'docs/03-plan.md';
const VAPROSI = 'docs/registar-na-vaprosite.json';
const MARKER_A =
  '<!-- ДЪЛГЪТ · §1–§3 се ГЕНЕРИРАТ от docs/registar-na-dalga.json · `node stroezh/dalg.mjs --pishi` · не се пише на ръка · НАЧАЛО -->';
const MARKER_B = '<!-- ДЪЛГЪТ · генерирано · КРАЙ -->';

/**
 * ПИН · отворени редове без нито едно машинно условие · броени при раждането на регистъра
 * (11.09.2026). Може само да пада: всеки нов ред влиза с условие, а старите получават
 * условие, когато думите им станат проверими.
 */
const PIN_BEZ_USLOVIE = 20;

const pat = (...p) => join(KOREN, ...p);
const ima = (p) => existsSync(pat(p));
const cheti = (p) => readFileSync(pat(p), 'utf8');

function vsichkiFaylove(papka, razshireniya, sabrani = []) {
  if (!ima(papka)) return sabrani;
  for (const ime of readdirSync(pat(papka))) {
    const p = `${papka}/${ime}`;
    if (statSync(pat(p)).isDirectory()) vsichkiFaylove(p, razshireniya, sabrani);
    else if (razshireniya.some((r) => ime.endsWith(r))) sabrani.push(p);
  }
  return sabrani;
}

/** Кодът без коментари и без низове · остава онова, което се ИЗПЪЛНЯВА. */
function golKod(t) {
  return t
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

const ESKEYP = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── УСЛОВИЯТА ───────────────────────────────────────────────────────────────

function testSBeleg(beleg) {
  const r = new RegExp(`(?:it|describe|test)\\(\\s*['"\`](?:ДЛ-)?${ESKEYP(beleg)} ·`, 'u');
  for (const f of vsichkiFaylove('tests', ['.test.ts'])) {
    if (r.test(cheti(f))) return f;
  }
  return null;
}

function broyNaIme(ime, v, izvan = []) {
  const r = new RegExp(`(?<![\\p{L}\\p{N}_$])${ESKEYP(ime)}(?![\\p{L}\\p{N}_$])`, 'gu');
  let n = 0;
  const kade = [];
  for (const papka of v) {
    for (const f of vsichkiFaylove(papka, ['.ts', '.mjs'])) {
      if (izvan.includes(f) || f.endsWith('.test.ts') || f.endsWith('.d.ts')) continue;
      const k = [...golKod(cheti(f)).matchAll(r)].length;
      if (k > 0) {
        n += k;
        kade.push(f);
      }
    }
  }
  return { n, kade };
}

function proveriUslovie(u, ctx) {
  switch (u.vid) {
    case 'test': {
      const f = testSBeleg(u.beleg);
      return {
        darzhi: f !== null,
        dumi: f ? `тест „${u.beleg} · …" в ${f}` : `няма тест с име „${u.beleg} · …"`,
      };
    }
    case 'ima': {
      const { n, kade } = broyNaIme(u.ime, u.v ?? ['src', 'app'], u.izvan ?? []);
      const min = u.min ?? 1;
      return {
        darzhi: n >= min,
        dumi:
          n >= min
            ? `\`${u.ime}\` · ${n} в ${kade.join(' · ')}`
            : `\`${u.ime}\` няма викащ в ${(u.v ?? ['src', 'app']).join('/')}`,
      };
    }
    case 'nyama': {
      const { n, kade } = broyNaIme(u.ime, u.v ?? ['src', 'app'], u.izvan ?? []);
      return {
        darzhi: n === 0,
        dumi:
          n === 0 ? `\`${u.ime}\` го няма` : `\`${u.ime}\` стои ${n} пъти в ${kade.join(' · ')}`,
      };
    }
    case 'fayl': {
      if (!ima(u.pat)) return { darzhi: false, dumi: `\`${u.pat}\` го няма` };
      if (u.sadarzha && !cheti(u.pat).includes(u.sadarzha))
        return { darzhi: false, dumi: `\`${u.pat}\` не съдържа „${u.sadarzha}"` };
      return {
        darzhi: true,
        dumi: `\`${u.pat}\`${u.sadarzha ? ` съдържа „${u.sadarzha}"` : ' съществува'}`,
      };
    }
    case 'vapros': {
      const v = ctx.vaprosi.get(u.beleg);
      const dobri = u.sastoyaniya ?? ['otgovoren', 'reshen_ot_koda', 'otpadnal'];
      if (!v) return { darzhi: false, dumi: `ВП-${u.beleg} го няма в регистъра` };
      return { darzhi: dobri.includes(v.sastoyanie), dumi: `ВП-${u.beleg} е ${v.sastoyanie}` };
    }
    case 'dalg': {
      const r = ctx.poBeleg.get(u.beleg);
      if (!r) return { darzhi: false, dumi: `ДЛ-${u.beleg} го няма` };
      return { darzhi: r.sastoyanie !== 'otvoren', dumi: `ДЛ-${u.beleg} е ${r.sastoyanie}` };
    }
    case 'broy': {
      const r = new RegExp(u.shablon, 'gu');
      let n = 0;
      for (const papka of u.v ?? ['src', 'app']) {
        for (const f of vsichkiFaylove(papka, u.razshireniya ?? ['.ts']))
          n += [...cheti(f).matchAll(r)].length;
      }
      const dobre = (u.max === undefined || n <= u.max) && (u.min === undefined || n >= u.min);
      return {
        darzhi: dobre,
        dumi: `„${u.shablon}" · ${n}${u.max !== undefined ? ` (≤ ${u.max})` : ''}${u.min !== undefined ? ` (≥ ${u.min})` : ''}`,
      };
    }
    case 'hod': {
      const s = ctx.hodove.get(u.hod);
      if (!s) return { darzhi: false, dumi: `ход ${u.hod} го няма в плана` };
      return {
        darzhi: /\*\*готов\*\*/u.test(s.sastoyanie),
        dumi: `ход ${u.hod} е „${s.sastoyanie.replace(/\*/g, '').slice(0, 30)}"`,
      };
    }
    default:
      return { darzhi: false, dumi: `непознат вид условие „${u.vid}"` };
  }
}

// ── ДОМОВЕТЕ ────────────────────────────────────────────────────────────────

function hodoveOtPlana() {
  const m = new Map();
  if (!ima(PLAN)) return m;
  for (const red of cheti(PLAN).split('\n')) {
    // `| **9** | **Хигиената** · ПЪРВА след … | … | състояние |` · името е удебеленото в началото на втората клетка
    const r = /^\| \*{0,2}(\d+[а-я]?|Х)\*{0,2} \| \*\*([^*|]+)\*\*/u.exec(red);
    if (!r || m.has(r[1])) continue;
    const kletki = red
      .split('|')
      .slice(1, -1)
      .map((k) => k.trim());
    m.set(r[1], { ime: r[2].trim(), sastoyanie: kletki[kletki.length - 1] ?? '' });
  }
  return m;
}

function kontekst() {
  const reg = JSON.parse(cheti(REGISTAR));
  const vaprosi = new Map();
  if (ima(VAPROSI))
    for (const v of JSON.parse(cheti(VAPROSI)).vaprosi ?? []) vaprosi.set(v.beleg, v);
  const poBeleg = new Map(reg.redove.map((r) => [r.beleg, r]));
  return { reg, vaprosi, poBeleg, hodove: hodoveOtPlana() };
}

function otseni(r, ctx) {
  const otpushva = (r.otpushva ?? []).map((u) => ({ ...u, ...proveriUslovie(u, ctx) }));
  const uslovia = (r.uslovia ?? []).map((u) => ({ ...u, ...proveriUslovie(u, ctx) }));
  const predi = (r.predi ?? []).map((b) => ({
    beleg: b,
    zatvoren: (ctx.poBeleg.get(b)?.sastoyanie ?? 'otvoren') !== 'otvoren',
  }));
  return {
    otpushva,
    uslovia,
    predi,
    otpushen:
      r.sastoyanie === 'otvoren' &&
      predi.every((p) => p.zatvoren) &&
      otpushva.every((u) => u.darzhi) &&
      (predi.length > 0 || otpushva.length > 0),
    vsichkiDarzhat: uslovia.length > 0 && uslovia.every((u) => u.darzhi),
    nyakoeNeDarzhi: uslovia.some((u) => !u.darzhi),
  };
}

// ── ГЕНЕРИРАНЕТО ────────────────────────────────────────────────────────────

const DL = (b) => `**ДЛ-${b}**`;
const kletka = (s) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim() || '—';
const opishi = (u) => `${u.darzhi ? '✔' : '✘'} ${u.vid}: ${u.dumi}`;

function generiray(ctx) {
  const redove = ctx.reg.redove;
  const otvoreni = redove.filter((r) => r.sastoyanie === 'otvoren');
  const zatvoreni = redove.filter((r) => r.sastoyanie !== 'otvoren');
  const otsenki = new Map(redove.map((r) => [r.beleg, otseni(r, ctx)]));
  const bezUslovie = otvoreni.filter((r) => (r.uslovia ?? []).length === 0);
  const vecheZatvoreni = otvoreni.filter((r) => otsenki.get(r.beleg).vsichkiDarzhat);
  const otpusheni = otvoreni.filter((r) => otsenki.get(r.beleg).otpushen);
  const redHodove = [...ctx.hodove.keys()];
  const hodNaReda = (r) => r.hod ?? '';
  const grupi = new Map();
  for (const r of otvoreni) {
    const h = hodNaReda(r);
    if (!grupi.has(h)) grupi.set(h, []);
    grupi.get(h).push(r);
  }
  const podredeni = [...grupi.keys()].sort((a, b) => {
    const ia = redHodove.indexOf(a);
    const ib = redHodove.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, 'bg');
  });

  const b = [];
  b.push(MARKER_A);
  b.push('');
  b.push(
    `## 1 · ОТВОРЕНИ · по хода, който ги затваря · ${otvoreni.length} реда · без машинно условие ${bezUslovie.length} (пин ${PIN_BEZ_USLOVIE}, само надолу)`,
  );
  b.push('');
  b.push(
    'Колоната „машината казва" е ИЗХОД на `node stroezh/dalg.mjs --proveri`, не мнение: ✔ условието държи · ✘ не държи. Ред без нито едно машинно условие носи „—" и се брои в пина.',
  );
  for (const h of podredeni) {
    const ime =
      h === ''
        ? 'БЕЗ ХОД · редът чака ход или условие'
        : ctx.hodove.has(h)
          ? `ход ${h} · ${ctx.hodove.get(h).ime}`
          : h;
    b.push('');
    b.push(`### ${ime} · ${grupi.get(h).length}`);
    b.push('');
    b.push('| # | какво | къде | преди него | машината казва | как се познава, че е затворен |');
    b.push('| :--: | :---- | :---- | :---- | :---- | :---- |');
    for (const r of grupi.get(h)) {
      const o = otsenki.get(r.beleg);
      // думите на реда дословно · после какво казва машината за всеки ред и всяко условие пред него
      const mashinataPredi = [
        ...o.predi.map((p) => `ДЛ-${p.beleg} ${p.zatvoren ? '✔ затворен' : '✘ отворен'}`),
        ...o.otpushva.map(opishi),
      ];
      const predi = [
        r.chaka || (mashinataPredi.length === 0 ? '' : 'нищо с думи'),
        ...(mashinataPredi.length ? [`машината: ${mashinataPredi.join(' · ')}`] : []),
      ]
        .filter(Boolean)
        .join(' · ');
      const mashinata = o.uslovia.length > 0 ? o.uslovia.map(opishi).join(' · ') : '—';
      b.push(
        `| ${DL(r.beleg)} | ${kletka(r.kakvo)} | ${kletka(r.kade)} | ${kletka(predi)} | ${mashinata} | ${kletka(r.kak)} |`,
      );
    }
  }
  b.push('');
  b.push('## 2 · ПРОСРОЧЕНИ · смята се, не се пише');
  b.push('');
  b.push(
    'Правило 30: ред с ИЗПЪЛНЕНО отпушващо условие, който още стои, е същият дефект като ред без условие — само по-тих. Затова тук няма ръка.',
  );
  b.push('');
  b.push(
    `- **ВЕЧЕ ЗАТВОРЕН, а стои отворен** (всички условия държат · находка на портата): ${vecheZatvoreni.length > 0 ? vecheZatvoreni.map((r) => `ДЛ-${r.beleg}`).join(' · ') : 'няма'}`,
  );
  b.push(
    `- **ОТПУШЕН** (всичко преди него е затворено, чака ред, не условие): ${otpusheni.length > 0 ? otpusheni.map((r) => `ДЛ-${r.beleg}`).join(' · ') : 'няма'}`,
  );
  const otkriti = [...ctx.vaprosi.values()].filter((v) => v.sastoyanie === 'otkrit');
  b.push(
    `- **открити въпроси** в \`docs/registar-na-vaprosite.json\` (чакат негова дума): ${otkriti.length} · ${otkriti.map((v) => `ВП-${v.beleg}`).join(' · ')}`,
  );
  b.push('');
  b.push(`## 3 · ЗАТВОРЕНИ · със записа как · ${zatvoreni.length} реда`);
  b.push('');
  b.push(
    'Затвореното не се трие: правило 1 важи и за този регистър. „Държи ли още" е машинното условие, проверявано при всяко пускане — падне ли, редът се е ОТВОРИЛ ТИХО и портата пада.',
  );
  b.push('');
  b.push('| # | какво | как е затворен | кога | държи ли още |');
  b.push('| :--: | :---- | :---- | :---- | :---- |');
  const poData = [...zatvoreni].sort(
    (x, y) =>
      (y.zatvoren_na ?? '').localeCompare(x.zatvoren_na ?? '') ||
      x.beleg.localeCompare(y.beleg, 'bg'),
  );
  for (const r of poData) {
    const o = otsenki.get(r.beleg);
    const darzhi =
      o.uslovia.length > 0 ? o.uslovia.map(opishi).join(' · ') : '— (без машинно условие)';
    const kakvo = r.sastoyanie === 'otpadnal' ? `✘ отпаднал · ${kletka(r.kakvo)}` : kletka(r.kakvo);
    b.push(
      `| ${DL(r.beleg)} | ${kakvo} | ${kletka(r.zatvoren_kak)} | ${r.zatvoren_na ?? '—'} | ${darzhi} |`,
    );
  }
  b.push('');
  b.push(MARKER_B);
  return {
    tekst: b.join('\n'),
    otvoreni,
    zatvoreni,
    bezUslovie,
    vecheZatvoreni,
    otpusheni,
    otsenki,
  };
}

function vgradi(tekstNaMd, generirano) {
  const a = tekstNaMd.indexOf(MARKER_A);
  const b = tekstNaMd.indexOf(MARKER_B);
  if (a < 0 || b < 0 || b < a) return null;
  return tekstNaMd.slice(0, a) + generirano + tekstNaMd.slice(b + MARKER_B.length);
}

// ── ПРОВЕРКАТА ──────────────────────────────────────────────────────────────

function proveri() {
  const nahodki = [];
  if (!ima(REGISTAR)) {
    console.log(`НАХОДКИ · 1:\n  · регистърът на дълга го няма: ${REGISTAR}`);
    process.exit(1);
  }
  const ctx = kontekst();
  const g = generiray(ctx);
  const redove = ctx.reg.redove;

  // 1 · цял
  const videni = new Set();
  for (const r of redove) {
    if (videni.has(r.beleg)) nahodki.push(`1 · белегът „${r.beleg}" стои два пъти`);
    videni.add(r.beleg);
    if (!/^[А-Я]{1,2}\d{1,3}[а-я]?$/u.test(r.beleg))
      nahodki.push(`1 · „${r.beleg}" не е белег по граматиката (ДЛ-‹серия›‹n›)`);
    if (!['otvoren', 'zatvoren', 'otpadnal'].includes(r.sastoyanie))
      nahodki.push(`1 · „${r.beleg}" е в непознато състояние „${r.sastoyanie}"`);
    for (const p of r.predi ?? [])
      if (!ctx.poBeleg.has(p))
        nahodki.push(`1 · „${r.beleg}" чака „${p}", който го няма в регистъра`);
    if (r.hod && /^(\d+[а-я]?|Х)$/u.test(r.hod) && !ctx.hodove.has(r.hod))
      nahodki.push(`1 · „${r.beleg}" сочи ход „${r.hod}", който го няма в ${PLAN} §1`);
    if (r.sastoyanie !== 'otvoren' && (!r.zatvoren_na || !r.zatvoren_kak))
      nahodki.push(`1 · „${r.beleg}" е ${r.sastoyanie} без дата или без „как"`);
  }
  // 2 · без условие · пин
  if (g.bezUslovie.length > PIN_BEZ_USLOVIE)
    nahodki.push(
      `2 · отворените без машинно условие растат: ${g.bezUslovie.length} > пин ${PIN_BEZ_USLOVIE} · ${g.bezUslovie.map((r) => r.beleg).join(' · ')}`,
    );
  // 3 · вече затворен
  for (const r of g.vecheZatvoreni)
    nahodki.push(
      `3 · „${r.beleg}" е ВЕЧЕ ЗАТВОРЕН, а стои отворен: ${g.otsenki
        .get(r.beleg)
        .uslovia.map((u) => u.dumi)
        .join(' · ')} · човек пише zatvoren_kak`,
    );
  // 4 · отворил се е тихо
  for (const r of g.zatvoreni) {
    const o = g.otsenki.get(r.beleg);
    if (r.sastoyanie === 'zatvoren' && o.nyakoeNeDarzhi)
      nahodki.push(
        `4 · „${r.beleg}" се е ОТВОРИЛ ТИХО: ${o.uslovia
          .filter((u) => !u.darzhi)
          .map((u) => u.dumi)
          .join(' · ')}`,
      );
  }
  // 5 · md свежо
  if (!ima(DALG_MD)) nahodki.push(`5 · ${DALG_MD} го няма`);
  else {
    const sega = cheti(DALG_MD);
    const novo = vgradi(sega, g.tekst);
    if (novo === null) nahodki.push(`5 · ${DALG_MD} няма двата маркера на генерираното`);
    else if (novo !== sega)
      nahodki.push(
        `5 · ${DALG_MD} е остарял спрямо регистъра · пусни \`node stroezh/dalg.mjs --pishi\``,
      );
  }

  console.log('');
  console.log('═══ ДЪЛГЪТ ═══');
  console.log('');
  console.log(
    `  редове: ${redove.length} · отворени ${g.otvoreni.length} · затворени ${g.zatvoreni.filter((r) => r.sastoyanie === 'zatvoren').length} · отпаднали ${g.zatvoreni.filter((r) => r.sastoyanie === 'otpadnal').length}`,
  );
  console.log(`  без машинно условие: ${g.bezUslovie.length} · пин ${PIN_BEZ_USLOVIE}`);
  console.log(
    `  вече затворени, а стоят отворени: ${g.vecheZatvoreni.length} · отворили се тихо: ${nahodki.filter((n) => n.startsWith('4 ')).length}`,
  );
  console.log(
    `  отпушени (чакат ред, не условие): ${g.otpusheni.length}${g.otpusheni.length ? ` · ${g.otpusheni.map((r) => `ДЛ-${r.beleg}`).join(' · ')}` : ''}`,
  );
  console.log('');
  if (nahodki.length > 0) {
    console.log(`НАХОДКИ · ${nahodki.length}:`);
    for (const n of nahodki) console.log(`  · ${n}`);
    console.log('');
    process.exit(1);
  }
  console.log(
    'Дългът е цял: всеки ред носи условие или се брои, нищо затворено не се е отворило тихо, md-то е свежо.',
  );
}

if (process.argv.includes('--pishi')) {
  const ctx = kontekst();
  const g = generiray(ctx);
  const sega = ima(DALG_MD) ? cheti(DALG_MD) : `${MARKER_A}\n${MARKER_B}\n`;
  const novo = vgradi(sega, g.tekst);
  if (novo === null) {
    console.log(`${DALG_MD} няма двата маркера · сложи ги с ръка веднъж`);
    process.exit(1);
  }
  writeFileSync(pat(DALG_MD), novo, 'utf8');
  console.log(
    `Дългът е записан · отворени ${g.otvoreni.length} · затворени ${g.zatvoreni.length} · без условие ${g.bezUslovie.length}`,
  );
  process.exit(0);
}

proveri();
