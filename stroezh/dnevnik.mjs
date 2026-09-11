/**
 * ДНЕВНИКЪТ · следата от всяка сесия, направена НЕИЗБЕЖНА.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Негово, 10.09.2026: „Начина на работа не остава следи. Няма правилна система
 * на работа между сесиите и нище не остава трайно на правилното място."
 *
 * Измерено същия ден: дванайсет машини пазят КОДА и нула пазят слоя „какво
 * стана днес". `docs/10` (домът на думите му) и регистърът замръзнаха на 09.09,
 * докато 10.09 донесе пет коммита и три документа. Трийсет затворени реда на
 * дълга стояха в раздел „ОТВОРЕНИ". Номерът на коммита се пишеше на ръка и се
 * дублира три пъти за три дни.
 *
 * Дисциплина не пази това. Машина — пази. Тази.
 *
 * ═══ КАКВО ПРАВИ ═══
 *
 * `--nachalo`   началото на сесия · ПЕЧАТА състоянието (клон · следващ номер ·
 *               последният ден · неговите последни думи · отворените редове ·
 *               портите) и СЪЗДАВА, само ако липсват: дневника за деня,
 *               файла за думите му за деня, `.rabotni/`, `core.hooksPath`.
 *               Никога не променя съществуващ файл.
 * `--kray`      краят на сесия · ПУСКА портите и записва изхода им в §5 (само
 *               машината пише там) · картата · README · после `--proveri`.
 * `--proveri`   деветте проверки Д1–Д9 · ненулев изход при първата находка.
 * `--sledvasht-nomer` · `--za-agenta` · `--kratko` · `--bez-porti`
 *
 * ЕДИН ДОМ, ЕДИН ВИД (правило 14):
 *   думите му        → `docs/izvori/dni/ГГГГ-ММ-ДД.md`   · журнал, само добавяне
 *   какво стана      → `docs/dnevnik/ГГГГ-ММ-ДД.md`      · шест раздела
 *   портите          → §5 на дневника                    · пише го САМО машината
 *   номерът на коммит→ `git log`                          · тук се СМЯТА, не се пази
 *
 * КОРЕНЪТ ИДВА ОТВЪН (`DNEVNIK_KOREN`) и ДЕНЯТ ИДВА ОТВЪН (`DNEVNIK_DEN`) —
 * инак мярката не се доказва: доказващият тест вдига счупено дърво във временна
 * папка без git и без „днес" (урокът на обход К: проверка, която зависи от деня
 * на пускане, мига).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KOREN = process.env['DNEVNIK_KOREN'] ?? '.';
const DNEVNIK = 'docs/dnevnik';
const DNI = 'docs/izvori/dni';
const DALG = 'docs/14-dalgat.md';
const REGISTAR_DALG = 'docs/registar-na-dalga.json';
const REGISTAR = 'docs/registar-na-vaprosite.json';
const PROTOKOL = 'docs/00-PROTOKOL.md';
const RABOTNI = '.rabotni';
const PORTI_POSLEDEN = join(RABOTNI, 'porti-posleden.json');

/**
 * ПИН · първият ден с дневник. Дни преди него не се съдят — иначе `git bisect`
 * върху историята преди системата би бил вечно червен.
 */
const PARVIYAT_DEN = '2026-09-10';

/**
 * ПИН · коммитът, след който номерата не смеят да се дублират. Трите истински
 * дублажа (34 · 35 · 36) са ПРЕДИ него и не се пренаписват (правило 1 важи и
 * за историята).
 */
const OT_KOMMIT = '2a59f14';

/** Ключът, с който `--za-agenta` вади заданието на сесията от CLAUDE.md. */
const ZA_AGENTA = ['<!-- zadanieto-na-sesiyata -->', '<!-- /zadanieto-na-sesiyata -->'];
const IZDANIE = ['<!-- izdanie -->', '<!-- /izdanie -->'];

const DEN = /^\d{4}-\d{2}-\d{2}$/;
const FAYL_DEN = /^(\d{4}-\d{2}-\d{2})\.md$/;

const argv = new Set(process.argv.slice(2));
const kratko = argv.has('--kratko');

// ── ПОМОЩНИ ─────────────────────────────────────────────────────────────────

const pat = (...p) => join(KOREN, ...p);
const ima = (...p) => existsSync(pat(...p));
const cheti = (...p) => readFileSync(pat(...p), 'utf8');

/** git, ако го има · `null`, ако дървото не е хранилище (доказващият тест). */
function git(...args) {
  const r = spawnSync('git', args, { cwd: KOREN, encoding: 'utf8', timeout: 15_000 });
  if (r.status !== 0) return null;
  return r.stdout.trimEnd();
}
const IMA_GIT = git('rev-parse', '--is-inside-work-tree') === 'true';

/** Днес · от средата (тестът) или от часовника, в местно време. */
function dnes() {
  const ot = process.env['DNEVNIK_DEN'];
  if (ot && DEN.test(ot)) return ot;
  const d = new Date();
  const dd = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
}

/**
 * ДЕНЯТ, КОЙТО СЕ СЪДИ.
 *
 * Пред коммит дървото е мръсно → съди се ДНЕС (записът за днешната работа).
 * В CI дървото е чисто → съди се денят на HEAD по АВТОРСКАТА дата, в нейния
 * часови пояс (той работи нощем; UTC би преместил коммит от 01:10 във вчера).
 */
function denyatKoytoSeSadi() {
  if (process.env['DNEVNIK_DEN']) return { den: dnes(), po: 'DNEVNIK_DEN' };
  if (!IMA_GIT) return { den: dnes(), po: 'часовника · без git' };
  const mrasno = (git('status', '--porcelain') ?? '') !== '';
  if (mrasno) return { den: dnes(), po: 'работното дърво е мръсно → днес' };
  const head = git('log', '-1', '--format=%aI') ?? '';
  return { den: head.slice(0, 10), po: `HEAD (${head})` };
}

function faylovePoDen(papka) {
  if (!ima(papka)) return [];
  return readdirSync(pat(papka))
    .filter((f) => FAYL_DEN.test(f) && statSync(pat(papka, f)).isFile())
    .sort();
}

/** Разделите `## N · ИМЕ` на един дневник · N → редовете му. */
function razdeli(tekst) {
  const r = new Map();
  let tekusht = null;
  for (const red of tekst.split('\n')) {
    const m = /^## (\d) · /.exec(red);
    if (m) {
      tekusht = m[1];
      r.set(tekusht, []);
      continue;
    }
    if (tekusht) r.get(tekusht).push(red);
  }
  return r;
}

/** Редовете-данни на markdown таблица · без главата и без разделителя. */
function redoveNaTablitsa(redove) {
  return redove
    .filter((r) => r.startsWith('|'))
    .filter((r) => !/^\|\s*:?-+/.test(r))
    .slice(1)
    .map((r) =>
      r
        .split('|')
        .slice(1, -1)
        .map((k) => k.trim()),
    );
}

/** Следващият номер на коммит · max + 1 от не-merge заглавията · `null` без git. */
function sledvashtNomer() {
  const zaglaviya = git('log', '--no-merges', '--format=%s');
  if (zaglaviya === null) return null;
  let max = 0;
  for (const z of zaglaviya.split('\n')) {
    const m = /^(\d+)[а-я]? · /u.exec(z);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

/** Следващият номер на негов запис · продължава `docs/10` (последен там: 104). */
function sledvashtZapis() {
  let max = 104;
  for (const f of faylovePoDen(DNI)) {
    for (const red of redoveNaTablitsa(cheti(DNI, f).split('\n'))) {
      const n = Number(red[0]);
      if (Number.isInteger(n)) max = Math.max(max, n);
    }
  }
  return max + 1;
}

/**
 * ТАБЛОТО НА ТРЕСЧОТКИТЕ (0.12) · числа, които вървят само в една посока.
 * `kray` ги записва в §5 на деня; `nachalo` ги показва срещу предишния ден;
 * `proveri` (Д5б) пада, когато растат в грешната посока. Един дом на списъка.
 */
const TRESCHOTKI = [
  ['nepoznati', 'непознати', 'надолу'],
  ['dlBezUslovie', 'ДЛ без условие', 'надолу'],
  ['dniSKommitiBezZapis', 'дни с коммити без дневник', 'нула'],
  ['otkriti', 'открити', 'инфо'],
  ['dlOtvoreni', 'ДЛ отворени', 'инфо'],
];

function treschotkite(den) {
  const reg = registarat();
  const otvoreni = otvoreniteRedove();
  const dlBezUslovie = otvoreni.filter(
    (o) => !o.predi || o.predi.trim() === '' || o.predi.trim() === '—',
  ).length;
  // дни, в които има коммит, но няма дневник (от първия ден на ритуала)
  let dniSKommitiBezZapis = 0;
  if (IMA_GIT) {
    const dniSDnevnik = new Set(faylovePoDen(DNEVNIK).map((f) => f.slice(0, 10)));
    const dniSKommit = new Set(
      (git('log', '--format=%ad', '--date=short', `--since=${PARVIYAT_DEN}`, '--no-merges') ?? '')
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => DEN.test(r) && r >= PARVIYAT_DEN && r <= den),
    );
    for (const d of dniSKommit) if (!dniSDnevnik.has(d)) dniSKommitiBezZapis++;
  }
  return {
    nepoznati: reg.nepoznat ?? 0,
    dlBezUslovie,
    dniSKommitiBezZapis,
    otkriti: reg.otkrit ?? 0,
    dlOtvoreni: otvoreni.length,
  };
}

function redTreschotki(t) {
  return `тресчотки · ${TRESCHOTKI.map(([k, ime]) => `${ime} ${t[k]}`).join(' · ')}`;
}

/** Стойностите от §5 на последния ден ПРЕДИ `den` · null, ако там още няма ред „тресчотки". */
function predishniteTreschotki(den) {
  const f = faylovePoDen(DNEVNIK)
    .filter((x) => x < `${den}.md`)
    .at(-1);
  if (!f) return null;
  const red = (razdeli(cheti(DNEVNIK, f)).get('5') ?? [])
    .map((x) => x.trim())
    .find((x) => x.startsWith('тресчотки'));
  if (!red) return null;
  const t = {};
  for (const [k, ime] of TRESCHOTKI) {
    const m = new RegExp(`${ime} (\\d+)`, 'u').exec(red);
    if (m) t[k] = Number(m[1]);
  }
  return t;
}

/** Отворените редове на дълга · §1 на `docs/14`, незачеркнати, с белег. */
function otvoreniteRedove() {
  // от 2.1 (11.09) домът е регистърът на дълга · md-то е генериран изглед
  if (ima(REGISTAR_DALG)) {
    try {
      return (JSON.parse(cheti(REGISTAR_DALG)).redove ?? [])
        .filter((r) => r.sastoyanie === 'otvoren')
        .map((r) => ({
          beleg: `ДЛ-${r.beleg}`,
          kakvo: (r.kakvo ?? '').slice(0, 80),
          predi: [
            ...(r.predi ?? []).map((b) => `ДЛ-${b}`),
            ...(r.chaka ? [r.chaka] : []),
            ...(r.otpushva ?? []).map((u) => u.vid),
            ...(r.uslovia ?? []).map((u) => u.vid),
          ].join(' · '),
          kak: r.kak ?? '',
        }));
    } catch {
      return [];
    }
  }
  if (!ima(DALG)) return [];
  const tekst = cheti(DALG);
  const nachalo = tekst.indexOf('\n## 1 ');
  const kray = tekst.indexOf('\n## 2 ');
  if (nachalo < 0 || kray < 0) return [];
  return tekst
    .slice(nachalo, kray)
    .split('\n')
    .filter((r) => /^\| \*\*[А-Я]+\d*/u.test(r))
    .map((r) => {
      const k = r
        .split('|')
        .slice(1, -1)
        .map((x) => x.trim().replace(/\*\*/g, ''));
      return { beleg: k[0], kakvo: (k[1] ?? '').slice(0, 80), predi: k[3] ?? '', kak: k[4] ?? '' };
    });
}

function registarat() {
  try {
    const r = JSON.parse(cheti(REGISTAR));
    const b = {};
    for (const v of r.vaprosi) b[v.sastoyanie] = (b[v.sastoyanie] ?? 0) + 1;
    return { obshto: r.vaprosi.length, belezi: new Set(r.vaprosi.map((v) => v.beleg)), ...b };
  } catch {
    return { obshto: 0, belezi: new Set() };
  }
}

function vidoveRabota() {
  if (!ima(PROTOKOL)) return [];
  return [...cheti(PROTOKOL).matchAll(/^### (У\d+) · (.+)$/gmu)].map((m) => ({
    beleg: m[1],
    ime: m[2],
  }));
}

/** Стойността между два маркера в текст · `null`, ако ги няма. */
function mezhdu(tekst, [a, b]) {
  const i = tekst.indexOf(a);
  const j = tekst.indexOf(b);
  if (i < 0 || j < 0 || j < i) return null;
  return tekst.slice(i + a.length, j).trim();
}

// ── ШАБЛОНИТЕ · разделите носят номер, за да е парсът строг ────────────────

const ZAGLAVIE_SHABLON = '<заглавие на деня · пет до десет думи>';
const IZRECHENIE_SHABLON = '<едно изречение какво стана · това вижда картата>';
const RABOTA_SHABLON = 'вид работа У? · умения: …';

function shablonDen(den) {
  return [
    `# ${den} · ${ZAGLAVIE_SHABLON}`,
    '',
    `**Дата:** ${den} · **Вид:** запис-ден · **Състояние:** запис`,
    '',
    IZRECHENIE_SHABLON,
    '',
    '## 1 · НЕГОВО',
    '',
    `Думите му, дословно: \`${DNI}/${den}.md\``,
    '',
    '## 2 · КАКВО СТАНА',
    '',
    RABOTA_SHABLON,
    '',
    '- ЧЧ:ММ · …',
    '',
    '## 3 · ЗАТВОРЕНО',
    '',
    '| белег | как се познава, че е затворен | доказателство · път, който съдържа белега |',
    '| :---- | :---- | :---- |',
    '',
    '## 4 · РОДЕНО',
    '',
    '| белег | какво | къде живее |',
    '| :---- | :---- | :---- |',
    '',
    '## 5 · ПОРТИТЕ · пише го САМО `npm run kray`',
    '',
    'чака CI',
    '',
    '## 6 · СЛЕДВАЩОТО',
    '',
    '- …',
    '',
  ].join('\n');
}

function shablonDumi(den) {
  return [
    `# ${den} · неговите думи · ДОСЛОВНО`,
    '',
    `**Дата:** ${den} · **Вид:** думи-ден · **Състояние:** запис`,
    '',
    'Журнал · само добавяне · всяка дума В МОМЕНТА, преди отговора ѝ (правило 17 · правило 25).',
    'Ако денят мине без негова дума, тук стои единственият ред: `без негови думи днес`.',
    '',
    '| # | час | негово, дословно | какво тръгна от него |',
    '| ---: | :---- | :---- | :---- |',
    '',
  ].join('\n');
}

// ── ПРОВЕРКИТЕ Д1–Д9 ────────────────────────────────────────────────────────

function proveri() {
  const nahodki = [];
  const propusnati = [];
  const { den, po } = denyatKoytoSeSadi();
  const dnevnitsi = faylovePoDen(DNEVNIK);
  const dni = faylovePoDen(DNI);

  const sadiSe = den >= PARVIYAT_DEN;

  // Д1 · дневник за деня
  const dnevnikPat = `${DNEVNIK}/${den}.md`;
  const imaDnevnik = ima(dnevnikPat);
  if (sadiSe && !imaDnevnik) {
    nahodki.push(`Д1 · няма дневник за ${den} (${dnevnikPat}) · пусни \`npm run nachalo\``);
  }

  // Д2 · думите му за деня · ≥ 1 запис ИЛИ изричното „без негови думи днес"
  const dumiPat = `${DNI}/${den}.md`;
  if (sadiSe) {
    if (!ima(dumiPat)) {
      nahodki.push(`Д2 · няма файл за думите му за ${den} (${dumiPat})`);
    } else {
      const t = cheti(dumiPat);
      const zapisi = redoveNaTablitsa(t.split('\n')).filter((k) => k[0] !== '');
      const bezDumi = /^без негови думи днес$/mu.test(t);
      if (zapisi.length === 0 && !bezDumi) {
        nahodki.push(
          `Д2 · ${dumiPat} е празен · или ред с негова дума, или точният ред \`без негови думи днес\``,
        );
      }
      if (zapisi.length > 0 && bezDumi) {
        nahodki.push(`Д2 · ${dumiPat} и носи думи, и твърди „без негови думи днес"`);
      }
      // Д2б · „без думи" не противоречи на видимите следи в дифа на деня
      if (bezDumi && IMA_GIT) {
        const dif = git('log', `--since=${den}T00:00`, '-p', '--', 'docs', 'zadanie', 'CLAUDE.md');
        const dd = `${den.slice(8, 10)}.${den.slice(5, 7)}`;
        if (dif && new RegExp(`^\\+.*Негово, ${dd}`, 'mu').test(dif)) {
          nahodki.push(`Д2б · „без негови думи днес", а дифът на деня добавя „Негово, ${dd}"`);
        }
      } else if (bezDumi) propusnati.push('Д2б');
    }
  }

  // Д3 · §2 не е шаблонът и назовава вид работа от протокола
  if (imaDnevnik) {
    const t = cheti(dnevnikPat);
    const r = razdeli(t);
    const parvi = t.split('\n')[0] ?? '';
    if (parvi.includes(ZAGLAVIE_SHABLON))
      nahodki.push(`Д3 · ${dnevnikPat} е още със заглавието-заготовка`);
    if (t.includes(IZRECHENIE_SHABLON))
      nahodki.push(`Д3 · ${dnevnikPat} няма изречението за картата`);
    const rabota = (r.get('2') ?? []).map((x) => x.trim()).filter(Boolean);
    const vidove = new Set(vidoveRabota().map((v) => v.beleg));
    const nazovan = rabota.join(' ').match(/У\d+/gu) ?? [];
    if (rabota.length === 0 || rabota[0] === RABOTA_SHABLON) {
      nahodki.push(`Д3 · §2 „КАКВО СТАНА" на ${dnevnikPat} е заготовка`);
    } else if (nazovan.length === 0) {
      nahodki.push(`Д3 · §2 на ${dnevnikPat} не назовава вид работа (У + число)`);
    } else {
      for (const u of nazovan) {
        if (vidove.size > 0 && !vidove.has(u)) {
          nahodki.push(`Д3 · §2 назовава „${u}", а протоколът няма такъв вид работа`);
        }
      }
    }
    for (const n of ['3', '4', '5', '6']) {
      if (!r.has(n)) nahodki.push(`Д3 · ${dnevnikPat} няма раздел ${n}`);
    }
    const sledvashto = (r.get('6') ?? []).map((x) => x.trim()).filter(Boolean);
    if (sledvashto.length === 0 || sledvashto[0] === '- …') {
      nahodki.push(
        `Д3 · §6 „СЛЕДВАЩОТО" на ${dnevnikPat} е празен · сесията не казва какво следва`,
      );
    }
    const porti = (r.get('5') ?? [])
      .map((x) => x.trim())
      .filter(Boolean)
      .join(' ');
    if (!/proverka · EXIT \d/u.test(porti) && !/чака CI/u.test(porti)) {
      nahodki.push(
        `Д3 · §5 „ПОРТИТЕ" на ${dnevnikPat} не е писан от \`kray\` и не казва „чака CI"`,
      );
    }

    // Д4б · затвореното носи доказателство · път, който съществува и съдържа белега
    for (const k of redoveNaTablitsa(r.get('3') ?? [])) {
      const [beleg, , dokazatelstvo = ''] = k;
      if (!beleg) continue;
      const patishta = [...dokazatelstvo.matchAll(/`([^`]+)`/g)].map((m) => m[1].split(':')[0]);
      if (patishta.length === 0) {
        nahodki.push(`Д4б · ${beleg} е „затворен" без път за доказателство`);
        continue;
      }
      const chist = beleg.replace(/[*~]/g, '');
      // белегът може да носи вида си отпред (ДЛ-Т4) · доказателството може да го пише голо („Т4 · …“ в името на тест)
      const golo = chist.replace(/^(?:ВП|ДЛ|ИН)-/u, '');
      const ok = patishta.some((p) => {
        if (!ima(p)) return false;
        const t = cheti(p);
        return t.includes(chist) || t.includes(golo);
      });
      if (!ok)
        nahodki.push(`Д4б · ${beleg} · нито един от пътищата не съществува и съдържа белега`);
    }

    // Д5 · роденото е вписано · в регистъра или в дълга
    const reg = registarat();
    const dalgTekst = ima(DALG) ? cheti(DALG) : '';
    for (const k of redoveNaTablitsa(r.get('4') ?? [])) {
      const beleg = (k[0] ?? '').replace(/[*~]/g, '');
      if (!beleg) continue;
      // белегът носи вида си отпред от 2.0б (ВП-В14 · ДЛ-Т50) · регистърът пази голия ключ,
      // редът на дълга е `| **ДЛ-Т45** |` (до 11.09 · `| **Т45** |`)
      const golo = beleg.replace(/^(?:ВП|ДЛ)-/u, '');
      const vRegistara = reg.belezi.has(golo);
      const vDalga = dalgTekst.includes(`**${golo}**`) || dalgTekst.includes(`**ДЛ-${golo}**`);
      if (!vRegistara && !vDalga)
        nahodki.push(`Д5 · роден белег „${beleg}" не е вписан нито в регистъра, нито в дълга`);
    }

    // Д5б · тресчотките не растат спрямо предишния ден · непознатите (от текста
    // на предишния ден или от реда „тресчотки" в §5) · ДЛ без условие · дни с коммити без дневник
    const predishen = dnevnitsi.filter((f) => f < `${den}.md`).at(-1);
    if (predishen) {
      const m = /непознати: (\d+)/u.exec(cheti(DNEVNIK, predishen));
      if (m && (reg.nepoznat ?? 0) > Number(m[1])) {
        nahodki.push(`Д5б · непознатите в регистъра растат: ${m[1]} → ${reg.nepoznat}`);
      }
    }
    const predT = predishniteTreschotki(den);
    const segaT = treschotkite(den);
    for (const [k, ime, posoka] of TRESCHOTKI) {
      if (posoka === 'надолу' && predT?.[k] !== undefined && segaT[k] > predT[k]) {
        nahodki.push(`Д5б · тресчотката „${ime}" расте: ${predT[k]} → ${segaT[k]}`);
      }
      if (posoka === 'нула' && segaT[k] > 0) {
        nahodki.push(`Д5б · тресчотката „${ime}" не е нула: ${segaT[k]}`);
      }
    }
  }

  // Д4 · затвореното е слязло · нула зачеркнати реда в §1 на дълга
  if (ima(DALG)) {
    const t = cheti(DALG);
    const a = t.indexOf('\n## 1 ');
    const b = t.indexOf('\n## 2 ');
    if (a >= 0 && b > a) {
      const zacherknati = t
        .slice(a, b)
        .split('\n')
        .filter((r) => r.startsWith('| ~~'));
      if (zacherknati.length > 0) {
        nahodki.push(
          `Д4 · ${zacherknati.length} затворени реда стоят в §1 „ОТВОРЕНИ" на ${DALG} · слизат в §3 със записа как са затворени`,
        );
      }
    }
  }

  // Д6 · README носи изданието за последния дневник
  const posleden = dnevnitsi.at(-1);
  if (posleden && ima('README.md')) {
    const d = posleden.slice(0, 10);
    const stoi = mezhdu(cheti('README.md'), IZDANIE);
    const ochakvano = izdanieRed(d);
    if (stoi === null) nahodki.push('Д6 · README.md няма маркера `<!-- izdanie -->`');
    else if (stoi !== ochakvano)
      nahodki.push(`Д6 · README „Издание" е остарял · пусни \`npm run kray\``);
  }

  // Д7 · вчерашни записи не се пипат (правило 1 за дневника)
  if (IMA_GIT) {
    const st = git('status', '--porcelain', '--', DNEVNIK, DNI) ?? '';
    for (const red of st.split('\n').filter(Boolean)) {
      const f = red.slice(3).trim();
      const m = /(\d{4}-\d{2}-\d{2})\.md$/.exec(f);
      if (m && m[1] !== den && red.startsWith(' M')) {
        nahodki.push(
          `Д7 · ${f} е от друг ден и е променен · поправка на вчера е ред „сторно" в днешния §2`,
        );
      }
    }
  } else propusnati.push('Д7');

  // Д8 · номерата на коммитите не се дублират след пина
  if (IMA_GIT) {
    const z = git('log', '--no-merges', '--format=%s', `${OT_KOMMIT}..HEAD`);
    if (z !== null) {
      const videni = new Map();
      for (const s of z.split('\n')) {
        const m = /^(\d+[а-я]?) · /u.exec(s);
        if (!m) continue;
        if (videni.has(m[1]))
          nahodki.push(`Д8 · номер ${m[1]} е на ДВА коммита: „${videni.get(m[1])}" и „${s}"`);
        videni.set(m[1], s);
      }
    } else propusnati.push('Д8');
  } else propusnati.push('Д8');

  // Д9 · коренът без чужди файлове · включително игнорирани
  if (IMA_GIT) {
    const POZVOLENI_IGNORIRANI = new Set([
      'node_modules/',
      'dist/',
      'kniga-lichna/',
      `${RABOTNI}/`,
    ]);
    const st = git('status', '--porcelain', '--ignored') ?? '';
    for (const red of st.split('\n').filter(Boolean)) {
      const f = red.slice(3).trim();
      const vKorena = !f.slice(0, -1).includes('/');
      if (!vKorena) continue;
      if (red.startsWith('!!') && POZVOLENI_IGNORIRANI.has(f)) continue;
      if (red.startsWith('!!') || red.startsWith('??')) {
        nahodki.push(
          `Д9 · чужд файл в корена: ${f} (${red.startsWith('!!') ? 'игнориран' : 'непроследен'})`,
        );
      }
    }
  } else propusnati.push('Д9');

  return { den, po, dnevnitsi, dni, nahodki, propusnati, sadiSe };
}

function izdanieRed(den) {
  return `**Издание:** ден ${den} · [дневникът](docs/dnevnik/${den}.md) · започни от [картата](docs/00-KARTA.md)`;
}

function pechatayProverkata(p) {
  console.log('');
  console.log('═══ ДНЕВНИКЪТ ═══');
  console.log('');
  console.log(`  ден: ${p.den} · по: ${p.po}${p.sadiSe ? '' : ' · ПРЕДИ първия ден · не се съди'}`);
  console.log(
    `  дневници: ${p.dnevnitsi.length} · дни с думи: ${p.dni.length} · последен: ${p.dnevnitsi.at(-1) ?? '—'}`,
  );
  console.log(
    `  проверки: 9 · пуснати: ${9 - p.propusnati.length} · пропуснати: ${p.propusnati.length}${p.propusnati.length ? ` (${p.propusnati.join(' · ')} · без git)` : ''}`,
  );
  console.log('');
  if (p.nahodki.length > 0) {
    console.log(`НАХОДКИ · ${p.nahodki.length}:`);
    for (const n of p.nahodki) console.log(`  · ${n}`);
    console.log('');
    return 1;
  }
  console.log('Дневникът е цял: денят има запис, думите му имат дом, затвореното е слязло.');
  return 0;
}

// ── НАЧАЛОТО ────────────────────────────────────────────────────────────────

function nachalo() {
  const den = dnes();
  const redove = [];
  const kazhi = (s = '') => redove.push(s);

  // 0 · създава, само ако липсва · никога не пипа съществуващ файл
  const sazdadeni = [];
  for (const [papka, fayl, shablon] of [
    [DNEVNIK, `${den}.md`, shablonDen],
    [DNI, `${den}.md`, shablonDumi],
  ]) {
    mkdirSync(pat(papka), { recursive: true });
    if (!ima(papka, fayl)) {
      writeFileSync(pat(papka, fayl), shablon(den), 'utf8');
      sazdadeni.push(`${papka}/${fayl}`);
    }
  }
  if (!ima(RABOTNI)) {
    mkdirSync(pat(RABOTNI), { recursive: true });
    sazdadeni.push(`${RABOTNI}/`);
  }
  if (IMA_GIT && ima('stroezh/kuki') && git('config', 'core.hooksPath') !== 'stroezh/kuki') {
    git('config', 'core.hooksPath', 'stroezh/kuki');
    sazdadeni.push('core.hooksPath = stroezh/kuki');
  }

  const protokolVersiya = ima(PROTOKOL)
    ? (/\*\*Версия:\*\*\s*(\S+)/u.exec(cheti(PROTOKOL))?.[1] ?? '—')
    : '—';
  kazhi(`═══ НАЧАЛО · ${den} · моделът на работа v${protokolVersiya} ═══`);
  kazhi('');

  // 1 · git
  if (IMA_GIT) {
    const klon = git('branch', '--show-current') ?? '?';
    const head = git('log', '-1', '--format=%h · %s') ?? '?';
    const promeneni = (git('status', '--porcelain') ?? '').split('\n').filter(Boolean).length;
    let spryamoOrigin = 'не е сверено с origin';
    const fetch = spawnSync('git', ['fetch', '--quiet'], { cwd: KOREN, timeout: 3_000 });
    if (fetch.status === 0) {
      const ab = git('rev-list', '--left-right', '--count', `origin/${klon}...HEAD`);
      if (ab) {
        const [nazad, napred] = ab.split(/\s+/);
        spryamoOrigin = `origin: ${napred} напред · ${nazad} назад`;
      }
    }
    kazhi(`клон ${klon} · ${head.slice(0, 70)} · променени: ${promeneni} · ${spryamoOrigin}`);
    kazhi(`СЛЕДВАЩ КОММИТ: ${sledvashtNomer()} · (заглавието започва с „N · ")`);
  } else {
    kazhi('git: няма · номерът на коммита и портите за HEAD не могат да се кажат');
  }
  kazhi(
    `СЛЕДВАЩ ЗАПИС на негова дума: ${sledvashtZapis()} · в ${DNI}/${den}.md · В МОМЕНТА, преди отговора`,
  );
  kazhi('');

  // 2 · последният ден и следващото
  const dnevnitsi = faylovePoDen(DNEVNIK).filter((f) => f !== `${den}.md`);
  const posleden = dnevnitsi.at(-1);
  if (posleden) {
    const t = cheti(DNEVNIK, posleden);
    const zaglavie = t.split('\n')[0]?.replace(/^# /, '') ?? '';
    const r = razdeli(t);
    kazhi(`ПОСЛЕДЕН ДЕН: ${zaglavie}`);
    const sledvashto = (r.get('6') ?? []).map((x) => x.trim()).filter(Boolean);
    kazhi('СЛЕДВАЩОТО (§6 на последния ден):');
    for (const s of sledvashto.slice(0, 5)) kazhi(`  ${s}`);
    const porti = (r.get('5') ?? []).map((x) => x.trim()).filter(Boolean);
    kazhi(`ПОРТИТЕ: ${porti.join(' · ') || '—'}`);
    if (IMA_GIT && ima(PORTI_POSLEDEN)) {
      try {
        const p = JSON.parse(cheti(PORTI_POSLEDEN));
        const ottogava = git('rev-list', '--count', `${p.head}..HEAD`);
        kazhi(
          `  последно пуснати на ${p.head} · оттогава ${ottogava ?? '?'} коммита · за ТОЗИ HEAD са ${ottogava === '0' ? 'проверени' : 'НЕПРОВЕРЕНИ'}`,
        );
      } catch {
        /* повреден файл · казва се долу, че портите не са известни */
      }
    }
  } else {
    kazhi('ПОСЛЕДЕН ДЕН: няма · това е първият дневник');
  }
  kazhi('');

  // 3 · последните му думи
  const dni = faylovePoDen(DNI);
  let posledniDumi = [];
  for (const f of [...dni].reverse()) {
    const zapisi = redoveNaTablitsa(cheti(DNI, f).split('\n')).filter((k) => k[0] !== '');
    if (zapisi.length > 0) {
      posledniDumi = zapisi
        .slice(-3)
        .map((k) => `  ${k[0]} · ${f.slice(0, 10)} ${k[1]} · „${k[2].slice(0, 90)}"`);
      break;
    }
  }
  kazhi('ПОСЛЕДНИТЕ МУ ДУМИ:');
  if (posledniDumi.length > 0) for (const d of posledniDumi) kazhi(d);
  else kazhi('  няма записани в docs/izvori/dni/ · до 09.09 са в docs/10 §5 (записи 1–104)');
  kazhi('');

  // 4 · отворените редове на дълга
  const otvoreni = otvoreniteRedove();
  kazhi(`ОТВОРЕНИ РЕДОВЕ НА ДЪЛГА: ${otvoreni.length}`);
  if (!kratko) {
    for (const o of otvoreni.slice(0, 12)) {
      kazhi(
        `  ${o.beleg} · ${o.kakvo}${o.predi && o.predi !== '—' ? ` · преди: ${o.predi.slice(0, 40)}` : ''}`,
      );
    }
    if (otvoreni.length > 12) kazhi(`  … и още ${otvoreni.length - 12}`);
  }
  kazhi('');

  // 5 · регистърът и тресчотките
  const reg = registarat();
  kazhi(
    `РЕГИСТЪРЪТ: ${reg.obshto} въпроса · отговорени ${reg.otgovoren ?? 0} · открити ${reg.otkrit ?? 0} · решени от кода ${reg.reshen_ot_koda ?? 0} · непознати ${reg.nepoznat ?? 0}`,
  );
  const sega = treschotkite(den);
  const predi = predishniteTreschotki(den);
  kazhi('ТАБЛОТО НА ТРЕСЧОТКИТЕ · вървят само в една посока · `kray` ги записва в §5:');
  for (const [k, ime, posoka] of TRESCHOTKI) {
    const s = sega[k];
    const p = predi?.[k];
    const znak =
      p === undefined ? '' : s < p ? ` (↓ от ${p})` : s > p ? ` (↑ от ${p})` : ` (= ${p})`;
    const greshna =
      (posoka === 'надолу' && p !== undefined && s > p) || (posoka === 'нула' && s > 0);
    kazhi(`  ${ime}: ${s}${znak}${greshna ? ' · В ГРЕШНА ПОСОКА — находка' : ''}`);
  }
  kazhi('');

  // 6 · протоколът и заданието
  const vidove = vidoveRabota();
  kazhi(`ВИДОВЕТЕ РАБОТА: ${vidove.map((v) => `${v.beleg} ${v.ime.split(' · ')[0]}`).join(' · ')}`);
  kazhi('  кажи КОЙ вид започваш · назови трите умения · прочети задължителното за него ЦЯЛО');
  kazhi('');

  // 7 · планове с незатворени точки
  if (ima(DNEVNIK)) {
    const planove = readdirSync(pat(DNEVNIK))
      .filter((f) => /-plan-.*\.md$/.test(f))
      .filter((f) => cheti(DNEVNIK, f).includes('- [ ]'));
    if (planove.length > 0) kazhi(`ОТВОРЕНИ ПЛАНОВЕ: ${planove.join(' · ')}`);
  }

  // 8 · чужди файлове в корена
  if (IMA_GIT) {
    const st = (git('status', '--porcelain', '--ignored') ?? '')
      .split('\n')
      .filter((r) => /^(\?\?|!!)/.test(r))
      .map((r) => r.slice(3).trim())
      .filter((f) => !f.slice(0, -1).includes('/'))
      .filter((f) => !['node_modules/', 'dist/', 'kniga-lichna/', `${RABOTNI}/`].includes(f));
    if (st.length > 0) kazhi(`ЧУЖДО В КОРЕНА: ${st.join(' · ')} · Д9 ще падне`);
  }

  if (sazdadeni.length > 0) {
    kazhi('');
    kazhi(`СЪЗДАДЕНО СЕГА: ${sazdadeni.join(' · ')}`);
  }
  kazhi('');
  kazhi(
    'в края: `npm run kray` (портите · §5 · картата · README) · от телефона: `npm run kray -- --bez-porti`',
  );

  console.log(redove.join('\n'));
}

// ── КРАЯТ ───────────────────────────────────────────────────────────────────

/**
 * `shell` само за npm (на Windows `npm.cmd` иска обвивка). За node — НЕ: пътят
 * му носи интервал (`C:\Program Files\…`) и обвивката го реже на „C:\Program".
 */
function pusni(komanda, args, prezObvivka = false) {
  const nachaloVreme = Date.now();
  const r = spawnSync(komanda, args, {
    cwd: KOREN,
    encoding: 'utf8',
    stdio: 'inherit',
    shell: prezObvivka && process.platform === 'win32',
    timeout: 20 * 60_000,
  });
  return { status: r.status ?? 1, sekundi: ((Date.now() - nachaloVreme) / 1000).toFixed(1) };
}

function zamestiRazdel5(den, redove) {
  const p = pat(DNEVNIK, `${den}.md`);
  const t = cheti(DNEVNIK, `${den}.md`);
  const a = t.indexOf('\n## 5 ');
  const b = t.indexOf('\n## 6 ');
  if (a < 0 || b < 0) return false;
  const glava = t.slice(a, t.indexOf('\n', a + 1) + 1);
  writeFileSync(p, `${t.slice(0, a)}${glava}\n${redove.join('\n')}\n${t.slice(b)}`, 'utf8');
  return true;
}

function kray() {
  const den = dnes();
  if (!ima(DNEVNIK, `${den}.md`)) {
    console.log(`Няма дневник за ${den} · първо \`npm run nachalo\``);
    process.exit(1);
  }
  const bezPorti = argv.has('--bez-porti');
  const head = IMA_GIT ? (git('rev-parse', '--short', 'HEAD') ?? '?') : '?';
  const chas = new Date().toTimeString().slice(0, 5);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  // картата ПРЕДИ портите: тя е производна (регистър · документи) и `proverka`
  // я сверява — регенерирана след нея, портата пада за нещо, което `kray` сам
  // щеше да оправи миг по-късно (платено 10.09: EXIT 1 заради един нов ред в регистъра)
  if (ima('stroezh/karta.mjs')) pusni(process.execPath, ['stroezh/karta.mjs', '--pishi']);

  if (bezPorti) {
    zamestiRazdel5(den, [
      `портите: НЕ са пускани от тази сесия (${chas}) · чака CI`,
      redTreschotki(treschotkite(den)),
    ]);
    console.log('§5: „чака CI" · портите ще ги пусне CI при push');
  } else {
    // ПЪРВО честният междинен ред: proverka включва dnevnik:proveri, който иска §5
    zamestiRazdel5(den, [
      `портите: пускат се от \`kray\` в ${chas} · резултатът се записва след края · чака CI`,
    ]);
    const p = pusni(npm, ['run', 'proverka'], true);
    const pb = pusni(npm, ['run', 'proba:dva'], true);
    const redove = [
      `proverka · EXIT ${p.status} · ${p.sekundi} s · HEAD ${head} · ${den} ${chas}`,
      `proba · EXIT ${pb.status} · 2 пъти · ${pb.sekundi} s`,
      redTreschotki(treschotkite(den)),
    ];
    zamestiRazdel5(den, redove);
    mkdirSync(pat(RABOTNI), { recursive: true });
    writeFileSync(
      pat(PORTI_POSLEDEN),
      JSON.stringify({ head, den, chas, proverka: p.status, proba: pb.status }, null, 2),
      'utf8',
    );
    console.log(`§5: ${redove.join(' · ')}`);
  }

  // README · изданието
  if (ima('README.md')) {
    const t = cheti('README.md');
    if (mezhdu(t, IZDANIE) !== null) {
      const [a, b] = IZDANIE;
      const nov = t.replace(
        new RegExp(`${a}[\\s\\S]*?${b}`, 'u'),
        `${a}\n${izdanieRed(den)}\n${b}`,
      );
      if (nov !== t) writeFileSync(pat('README.md'), nov, 'utf8');
    }
  }

  process.exit(pechatayProverkata(proveri()));
}

// ── ВХОДЪТ ──────────────────────────────────────────────────────────────────

if (argv.has('--sledvasht-nomer')) {
  const n = sledvashtNomer();
  console.log(n === null ? 'git: няма' : String(n));
  process.exit(n === null ? 1 : 0);
}

if (argv.has('--za-agenta')) {
  const t = ima('CLAUDE.md') ? mezhdu(cheti('CLAUDE.md'), ZA_AGENTA) : null;
  if (t === null) {
    console.log(
      'CLAUDE.md няма раздел „ЗАДАНИЕТО НА СЕСИЯТА" между маркерите · виж docs/00-PROTOKOL.md У10',
    );
    process.exit(1);
  }
  console.log(t);
  process.exit(0);
}

if (argv.has('--nachalo')) {
  nachalo();
  process.exit(0);
}

if (argv.has('--kray')) kray();

if (argv.has('--proveri')) process.exit(pechatayProverkata(proveri()));

console.log(
  'употреба: node stroezh/dnevnik.mjs --nachalo | --kray [--bez-porti] | --proveri | --sledvasht-nomer | --za-agenta',
);
process.exit(2);
