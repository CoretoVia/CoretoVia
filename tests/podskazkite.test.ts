/**
 * ПОДСКАЗКИТЕ · помощта на две степени · ход Х (ADR-025 · правило 31).
 *
 * Негово, 10.09 (запис 132): „…обясненията при задържане някъде да се появяват с
 * твои думи правилна и подробна информация при избор на начален HELP и съкратена
 * информация при нормален HELP." И 11.09 (запис 151): „използвай моите текстове за
 * теб да ги разбереш а в хелповете само при задържане да се показват".
 *
 * Оттук шестте неща, които този файл пази с машина:
 *
 *   1 · ВСЯКО нещо, което човек вижда, носи `pomosht { zashto, kratko }` — и двете
 *       части са пълни, различни, а Нормален е ЧАСТ от Начало (изведено, не
 *       преписано · правило 14). Обхватът се БРОИ преди присъдата (обход Г · Й на
 *       честността): празен списък прави всяко твърдение под себе си зелено.
 *   2 · С НАШИ ДУМИ · нито един текст не е негово изречение от Книгата
 *       (`dumi-ot-knigata.ts`), нито негова глава, нито носи дълъг откъс от тях.
 *       Неговите думи са ИЗВОР, не екран.
 *   3 · ЗАБРАНИТЕ · без „(правило N)" (екранът не цитира конституцията), без
 *       „днес · вече · още" (остаряват мълчаливо), без смесени азбуки (правило 10),
 *       и никой текст не е просто името на лист.
 *   4 · НОСИТЕЛЯТ · `title=` в `app/` е нула. Атрибутът не се показва от клавиатура
 *       и при докосване (MDN); подсказката ни е своя кутия при задържане и фокус.
 *   5 · КАТАЛОГЪТ · `Komanda` няма втори низ `opisanie`; описанието за агента се
 *       ИЗВЕЖДА от помощта на степен Начало.
 *   6 · РОДЕНОТО ОТ ЖУРНАЛА · колона и таблица, добавени от Настройки, получават
 *       помощ по вида си — празна подсказка не се допуска и там.
 *
 * Пиновете са с ръка и се броят с командите до тях. Нищо не се пише на диска.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { KATALOG, opisNaKataloga } from '../src/komandi/katalog.js';
import { DUMI_OT_KNIGATA } from '../src/model/dumi-ot-knigata.js';
import { pomoshtNaKolonaPoVida } from '../src/model/kolona.js';
import {
  BUTONI_NA_UPRAVLENIE,
  MODEL,
  OBLIK_NA_SMETKI,
  OBLIK_NA_UPRAVLENIE,
  PROZORTSI,
  TABLITSI,
} from '../src/model/osnova.js';
import { type Pomosht, tekstNaPomoshtta } from '../src/model/pomosht.js';
import { VIDOVE_ZA_CHOVEK } from '../src/model/struktura.js';
import { pomoshtNaNovaTablitsa } from '../src/model/tablitsa.js';
import { fold } from '../src/ogledalo/ogledalo.js';
import { IZVEDENITE_NA_DDSA } from '../src/smetach/dds.js';
import { KOLONI_NA_OTSENKATA } from '../src/smetach/kalkulator/stoynost.js';
import { poletataNaUpravlenie } from '../src/smetach/polata.js';
import { POMOSHT_NA_SMETKITE } from '../src/smetach/sbor.js';
import { IZVEDENITE_NA_SMETKITE } from '../src/smetach/smetki.js';

const KOGATO = '2026-09-11T12:00:00.000Z';
const DNES = '2026-09-11';

/**
 * ПИНОВЕТЕ · с ръка, по вид · всяко число е броено с командата до него
 * (11.09.2026, ход Х). Расте ли едно, тук се вижда в диф заедно с причината.
 *
 *   prozortsi  · `tests/osemte.test.ts` · 8
 *   tablitsi   · `grep -c "^const [A-Z0-9_]*: Tablitsa" src/model/osnova.ts` · 12
 *   koloni     · `TABLITSI.reduce((a, t) => a + t.koloni.length, 0)` · 113
 *   komandi    · `tests/katalog.test.ts` · 30
 *   butoni     · `grep -c "^    klyuch: '" …` в `BUTONI_NA_UPRAVLENIE` · 14
 *   glavi      · `OBLIK_NA_UPRAVLENIE` 11 + `OBLIK_NA_SMETKI` 10 · 21
 *   poleta     · `src/smetach/polata.ts` · „ПОМОЩТА НА ОСЕМТЕ" · 8
 *   smetki     · `SMETKI` в `src/smetach/sbor.ts` · 6
 *   otsenka    · `KOLONI_NA_OTSENKATA` · 6
 *   dds        · `IZVEDENITE_NA_DDSA` · 2
 *   smetkiIzv  · `IZVEDENITE_NA_SMETKITE` · 8
 */
const PIN = Object.freeze({
  prozortsi: 8,
  tablitsi: 12,
  koloni: 113,
  komandi: 32,
  butoni: 14,
  glavi: 21,
  poleta: 8,
  smetki: 6,
  otsenka: 6,
  dds: 2,
  smetkiIzvedeni: 8,
});
/** Сборът е ЕДНО число · пин с ръка · сумата на редовете горе. */
const PIN_VSICHKI = 230;

interface Nositel {
  /** къде стои · за находката */
  readonly kade: string;
  readonly pomosht: Pomosht;
}

/** ВСИЧКИ носители на помощ в Модела и каталога · по вид, за да се брои всеки. */
function nositelite(): Record<keyof typeof PIN, Nositel[]> {
  const koloni: Nositel[] = [];
  for (const t of TABLITSI)
    for (const k of t.koloni) koloni.push({ kade: `${t.klyuch}.${k.klyuch}`, pomosht: k.pomosht });
  const poleta = poletataNaUpravlenie(fold([], MODEL, KOGATO), DNES, KOGATO).poleta;
  return {
    prozortsi: PROZORTSI.map((p) => ({ kade: `prozorets ${p.klyuch}`, pomosht: p.pomosht })),
    tablitsi: TABLITSI.map((t) => ({ kade: `tablitsa ${t.klyuch}`, pomosht: t.pomosht })),
    koloni,
    komandi: KATALOG.map((k) => ({ kade: `komanda ${k.klyuch}`, pomosht: k.pomosht })),
    butoni: BUTONI_NA_UPRAVLENIE.map((b) => ({ kade: `buton ${b.klyuch}`, pomosht: b.pomosht })),
    glavi: [
      ...OBLIK_NA_UPRAVLENIE.map((g, i) => ({ kade: `upravlenie glava ${i}`, pomosht: g.pomosht })),
      ...OBLIK_NA_SMETKI.map((g, i) => ({ kade: `smetki glava ${i}`, pomosht: g.pomosht })),
    ],
    poleta: poleta.map((p) => ({ kade: `pole ${p.klyuch}`, pomosht: p.pomosht })),
    smetki: Object.entries(POMOSHT_NA_SMETKITE).map(([k, p]) => ({
      kade: `smetka ${k}`,
      pomosht: p,
    })),
    otsenka: KOLONI_NA_OTSENKATA.map((k) => ({ kade: `otsenka ${k.klyuch}`, pomosht: k.pomosht })),
    dds: IZVEDENITE_NA_DDSA.map((k) => ({ kade: `dds ${k.klyuch}`, pomosht: k.pomosht })),
    smetkiIzvedeni: IZVEDENITE_NA_SMETKITE.map((k) => ({
      kade: `smetki izvedena ${k.klyuch}`,
      pomosht: k.pomosht,
    })),
  };
}

function vsichkiNositeli(): Nositel[] {
  return Object.values(nositelite()).flat();
}

/**
 * Един низ за сравнение · NFC · малки букви · без кавички · без външни интервали ·
 * без крайна пунктуация · един интервал. Главна буква или кавичка не правят препис наш.
 */
function podravni(t: string): string {
  return t
    .normalize('NFC')
    .toLocaleLowerCase('bg')
    .replace(/[„“”"«»]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/[.,;:!?…]+$/u, '')
    .trim();
}

/**
 * НЕГОВИТЕ НИЗОВЕ · 42-те изречения от Книгата и всяка негова глава, дословно.
 * Колона с `nashaDuma` е наша и не влиза; всичко останало е негово.
 */
function negovite(): string[] {
  const n: string[] = [];
  for (const spisak of Object.values(DUMI_OT_KNIGATA)) for (const d of spisak) n.push(d.tekst);
  for (const p of PROZORTSI) n.push(p.list, ...p.lenti);
  for (const t of TABLITSI) {
    n.push(t.ime);
    for (const k of t.koloni) if (k.nashaDuma !== true) n.push(k.ime);
    for (const pg of Object.values(t.podglava ?? {})) n.push(pg);
  }
  for (const g of [...OBLIK_NA_UPRAVLENIE, ...OBLIK_NA_SMETKI]) {
    if (g.nashaGlava !== true) n.push(g.glava);
    if (g.podglava !== undefined) n.push(g.podglava);
    if (g.podglavaVtora !== undefined) n.push(g.podglavaVtora);
  }
  for (const b of BUTONI_NA_UPRAVLENIE) n.push(b.ime, ...(b.izbor ?? []));
  return n;
}

/** Дължината на откъс, който не е съвпадение на думи, а препис. */
const OTKAS = 40;
/** Негов низ, по-къс от откъса, но по-дълъг от една дума · вграден в наш текст пак е препис. */
const KASO = 12;

/** Всички откъси с дължина OTKAS от неговите низове · множество за бърза проверка. */
function otkasiteMu(): Set<string> {
  const s = new Set<string>();
  for (const t of negovite()) {
    const p = podravni(t);
    for (let i = 0; i + OTKAS <= p.length; i += 1) s.add(p.slice(i, i + OTKAS));
  }
  return s;
}

/**
 * Целите му ИЗРЕЧЕНИЯ под OTKAS · те нямат откъс и се търсят като цяло с `includes`.
 * Само изреченията от Книгата: главите и имената на колоните са кратки и нашите
 * текстове ги НАЗОВАВАТ по право („евро/квадрат × квадратура") — това не е препис.
 */
function kasiteMu(): string[] {
  const izrecheniya = Object.values(DUMI_OT_KNIGATA).flatMap((s) =>
    s.map((d) => podravni(d.tekst)),
  );
  return [...new Set(izrecheniya)].filter((p) => p.length >= KASO && p.length < OTKAS);
}

function nosiOtkasMu(
  tekst: string,
  otkasi: ReadonlySet<string>,
  kasi: readonly string[],
): string | null {
  const p = podravni(tekst);
  for (let i = 0; i + OTKAS <= p.length; i += 1) {
    const o = p.slice(i, i + OTKAS);
    if (otkasi.has(o)) return o;
  }
  for (const k of kasi) if (p.includes(k)) return k;
  return null;
}

/** Двата текста за екрана на един носител · Начало и Нормален. */
function tekstovete(n: Nositel): readonly string[] {
  return [tekstNaPomoshtta(n.pomosht, 'nachalo'), tekstNaPomoshtta(n.pomosht, 'normalno')];
}

describe('подсказките · помощта на две степени', () => {
  /**
   * ДЛ-П7 · машинното условие на дълга е ИМЕТО на този тест (`stroezh/dalg.mjs` ·
   * `testSBeleg`). Дотук (08.09) 17 подсказки стояха на експертно ниво и нито една
   * нямаше степен Начало.
   */
  it('ДЛ-П7 · всяка колона, таблица, прозорец, команда, бутон, глава и поле носи помощ на две степени', () => {
    const po = nositelite();
    // ПЪРВО обхватът · по вид, с ръка · после сборът като едно число
    for (const [vid, pin] of Object.entries(PIN)) {
      expect(po[vid as keyof typeof PIN], vid).toHaveLength(pin);
    }
    const vsichki = Object.values(po).flat();
    expect(vsichki).toHaveLength(PIN_VSICHKI);
    expect(Object.values(PIN).reduce((a, b) => a + b, 0)).toBe(PIN_VSICHKI);

    const nahodki: string[] = [];
    for (const n of vsichki) {
      const { zashto, kratko } = n.pomosht;
      if (zashto.trim() === '') nahodki.push(`${n.kade} · празно „защо"`);
      if (kratko.trim() === '') nahodki.push(`${n.kade} · празно „кратко"`);
      if (zashto === kratko) nahodki.push(`${n.kade} · „защо" и „кратко" са един и същ текст`);
      if (/[.]$/u.test(kratko)) nahodki.push(`${n.kade} · „кратко" завършва с точка: ${kratko}`);
      // Нормален е ЧАСТ от Начало по конструкция (`tekstNaPomoshtta` го извежда · правило 14);
      // договорът тук е, че двете части НЕ съвпадат — иначе Начало би повтаряло Нормален.
    }
    expect(nahodki).toEqual([]);
  });

  it('с НАШИ думи · нито един текст не е негово изречение, негова глава или дълъг откъс от тях', () => {
    const negovi = negovite();
    const nashi = vsichkiNositeli();
    // ПЪРВО броят на двете страни · без него сравнението е празно и зелено
    expect(negovi.length).toBeGreaterThan(150);
    expect(nashi).toHaveLength(PIN_VSICHKI);
    expect(Object.values(DUMI_OT_KNIGATA).flat()).toHaveLength(42);

    const negoviteChisti = new Set(negovi.map(podravni).filter((t) => t !== ''));
    const otkasi = otkasiteMu();
    const kasi = kasiteMu();
    expect(otkasi.size).toBeGreaterThan(1000);
    expect(kasi.length).toBeGreaterThan(0);

    const nahodki: string[] = [];
    for (const n of nashi) {
      for (const t of [n.pomosht.zashto, n.pomosht.kratko, ...tekstovete(n)]) {
        if (negoviteChisti.has(podravni(t))) nahodki.push(`${n.kade} · негов низ дословно: ${t}`);
        const o = nosiOtkasMu(t, otkasi, kasi);
        if (o !== null) nahodki.push(`${n.kade} · носи негов откъс „${o}"`);
      }
    }
    expect([...new Set(nahodki)]).toEqual([]);
  });

  it('забраните · без „(правило", без „днес · вече · още", без смесени азбуки, и никой текст не е име на лист', () => {
    const nashi = vsichkiNositeli();
    expect(nashi).toHaveLength(PIN_VSICHKI);
    const listove = new Set(PROZORTSI.map((p) => podravni(p.list)));
    const OSTARYAVASHTI = /(?<![\p{L}])(днес|вече|още)(?![\p{L}])/u;
    const SMESENI = /[A-Za-z][Ѐ-ӿ]|[Ѐ-ӿ][A-Za-z]/u;

    const nahodki: string[] = [];
    for (const n of nashi) {
      for (const t of [n.pomosht.zashto, n.pomosht.kratko]) {
        if (t.includes('(правило')) nahodki.push(`${n.kade} · цитира правило: ${t}`);
        const m = OSTARYAVASHTI.exec(t);
        if (m !== null) nahodki.push(`${n.kade} · дума, която остарява („${m[1]}"): ${t}`);
        const s = SMESENI.exec(t);
        if (s !== null) nahodki.push(`${n.kade} · смесени азбуки („${s[0]}"): ${t}`);
        if (listove.has(podravni(t))) nahodki.push(`${n.kade} · текстът е само име на лист: ${t}`);
      }
    }
    expect(nahodki).toEqual([]);
  });

  /**
   * НОСИТЕЛЯТ · `title=` не се показва от клавиатура и при докосване (MDN) — затова
   * подсказката е своя кутия (`app/reshetka/podskazka.ts`), не атрибут. Обходът е по
   * диска, за да хване и шаблон, и присвояване; `proba/` не се обхожда — проходът
   * е свидетел, не екран.
   */
  it('носителят · нито едно `title=` и нито едно `.title =` в app/', () => {
    // шаблонът има ЕДИН дом · условието `broy` на ДЛ-П7 в регистъра на дълга (правило 14)
    const registar = JSON.parse(readFileSync('docs/registar-na-dalga.json', 'utf8')) as {
      redove: { beleg: string; uslovia: { vid: string; shablon?: string }[] }[];
    };
    const p7 = registar.redove.find((r) => r.beleg === 'П7');
    const shablon = p7?.uslovia.find((u) => u.vid === 'broy')?.shablon;
    expect(shablon, 'ДЛ-П7 няма условие broy').toBeTypeOf('string');
    const TITLE = new RegExp(shablon as string, 'u');
    const nahodki: string[] = [];
    let pregledani = 0;
    const obhod = (papka: string): void => {
      for (const ime of readdirSync(papka)) {
        const pat = join(papka, ime);
        if (statSync(pat).isDirectory()) obhod(pat);
        else if (ime.endsWith('.ts') && !ime.endsWith('.d.ts')) {
          pregledani += 1;
          readFileSync(pat, 'utf8')
            .split('\n')
            .forEach((red, i) => {
              if (TITLE.test(red)) nahodki.push(`${pat.replace(/\\/g, '/')}:${i + 1}`);
            });
        }
      }
    };
    obhod('app');
    // обход, който не казва колко е видял, е зелен и когато не е гледал (обход Й)
    expect(pregledani).toBeGreaterThan(20);
    expect(nahodki, `title= в app · ${nahodki.length}`).toEqual([]);
  });

  it('каталогът · командата няма втори низ `opisanie` · описанието за агента е Начало, изведено', () => {
    expect(KATALOG).toHaveLength(PIN.komandi);
    const opis = opisNaKataloga();
    expect(opis).toHaveLength(PIN.komandi);
    for (const [i, k] of KATALOG.entries()) {
      expect('opisanie' in k, `${k.klyuch} носи opisanie`).toBe(false);
      expect(opis[i]!.klyuch).toBe(k.klyuch);
      expect(opis[i]!.opisanie).toBe(tekstNaPomoshtta(k.pomosht, 'nachalo'));
    }
  });

  it('роденото от Журнала · колона и таблица от Настройки получават помощ по вида си', () => {
    // обхватът · видовете, които човек може да добави от екрана · пин с ръка:
    // `grep -c "'" src/model/vid-stoynost.ts` → 5 стойности + 'izbor' (struktura.ts) = 6
    expect(VIDOVE_ZA_CHOVEK).toHaveLength(6);
    const videni = new Set<string>();
    for (const vid of VIDOVE_ZA_CHOVEK) {
      const p = pomoshtNaKolonaPoVida(vid, 'X');
      expect(p.zashto.length, vid).toBeGreaterThan(20);
      expect(p.kratko.length, vid).toBeGreaterThan(5);
      expect(p.zashto).toContain('„X"');
      expect(tekstNaPomoshtta(p, 'nachalo')).toContain(tekstNaPomoshtta(p, 'normalno'));
      videni.add(p.kratko);
    }
    // всеки вид казва СВОЕТО · един и същ текст за два вида би било мълчание с думи
    expect(videni.size).toBe(VIDOVE_ZA_CHOVEK.length);

    const t = pomoshtNaNovaTablitsa('X');
    expect(t.zashto).toContain('„X"');
    expect(t.kratko.length).toBeGreaterThan(5);
    expect(tekstNaPomoshtta(t, 'nachalo')).toContain(t.kratko);
  });
});
