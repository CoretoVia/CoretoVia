/**
 * УПРАВЛЕНИЕ · прозорецът на листа „УправлениеДелаПреписки" (ADR-005).
 *
 * Негово (B11): „Видима част която седи залепена горе и под нея започват
 * таблиците. Горе на хедъра няма нищо друго." И от 05.09 т.2: бутоните в малки
 * полета с един размер, а над тях полетата с цифри — от ляво надясно най-важните.
 *
 * Залепената част е ДВА реда: полетата с цифри (`polata.ts`) и неговите
 * четиринайсет бутона (`BUTONI_NA_UPRAVLENIE` — данни, всеки казва какво прави
 * днес). Под нея — дървото Имот → Обект/Бизнес → Задача (`darvo.ts`) с неговите
 * десет глави, подглавите, редът „филтър" (`filtar.ts`) и редът СБОР
 * (`sbor.ts`), а тактовете са КОЛОНИ на същия ред — календарът е в таблицата,
 * не втора таблица встрани (негово, запис 194: „както изглежда в МС Проджект").
 *
 * Нищо тук не се записва без Портата: задача се добавя от десния бутон върху
 * Имот, Обект или Бизнес (чернова под реда), клетките се поправят на място,
 * изключване · връщане · сторно са от същото меню. Филтърът, сметките, тактът,
 * периодът и скриването са памет на екрана — нула събития.
 */

import { DUMI_OT_KNIGATA } from '../../src/model/dumi-ot-knigata.js';
import type { Kletka } from '../../src/model/kletka.js';
import type { Kolona } from '../../src/model/kolona.js';
import { tablitsata } from '../../src/model/model.js';
import {
  BUTONI_NA_UPRAVLENIE,
  type ButonNaProzoretsa,
  type GlavaNaOblika,
  MODEL,
  OBLIK_NA_UPRAVLENIE,
  PROZORTSI,
} from '../../src/model/osnova.js';
import { kolonaNa, slyataNa } from '../../src/model/tablitsa.js';
import { type Ogledalo, tablitsaVOgledaloto } from '../../src/ogledalo/ogledalo.js';
import { type Red, redKato } from '../../src/ogledalo/tablitsa.js';
import { darvoto, type RoditelVDarvoto } from '../../src/smetach/darvo.js';
import { eFiltarPrazen, filtrirayDarvoto, type RedZaFiltar } from '../../src/smetach/filtar.js';
import {
  dumataNaButona,
  type KoeSeVizhda,
  lentaNa,
  prevkluchi,
  broyPokrivashti,
  sboroveVKolonite,
  svetofarNaSroka,
} from '../../src/smetach/gant.js';
import { dumiNaKletka, imeNaReda, tekstNaIzbora } from '../../src/smetach/kletki.js';
import { tekstNaNomera } from '../../src/smetach/nomeratsiya.js';
import { nomerNaSpeshnoto, poletataNaUpravlenie } from '../../src/smetach/polata.js';
import {
  IMENA_NA_SMETKITE,
  POMOSHT_NA_SMETKITE,
  type Smetka,
  smetkataPoPodrazbirane,
  smetkiteNaKolonata,
  smetni,
} from '../../src/smetach/sbor.js';
import {
  IMENA_NA_TAKTOVETE,
  koloniNaTakta,
  type KolonaNaTakta,
  type SvoyPeriod,
  type Takt,
  TAKTOVE,
} from '../../src/smetach/vreme.js';
import { pishi } from '../../src/yadro/pari.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { otvoriChernova } from '../reshetka/chernova.js';
import { pokazhiMenyu } from '../reshetka/menyu.js';
import { otvoriModel, zapaziModela } from '../reshetka/modeli.js';
import { podskazka, podskazkaSDumi } from '../reshetka/podskazka.js';
import { h, sloji, type Zapechatan } from '../reshetka/shablon.js';
import { chetiEkranno, zapomniEkranno } from '../reshetka/pamet-ekran.js';
import { pokazhiGreshka } from '../reshetka/redaktsiya.js';
import { kletkaHTML, zakachiReshetkata } from '../reshetka/reshetka.js';
import {
  dumiteIIznosHTML,
  izpalniOtMenyuto,
  zakachiDyasnoMenyu,
  zapaziKnigata,
} from './deystviya.js';

const PAMET = Object.freeze({
  filtar: 'upravlenie.filtar',
  smetki: 'upravlenie.smetki',
  takt: 'upravlenie.takt',
  period: 'upravlenie.period',
  vizhda: 'upravlenie.vizhda',
  skriyDela: 'upravlenie.skriyDela',
  dnes: 'upravlenie.dnes',
});
const TABLITSA = 'zadachi';
/** ширината на една колона на такта · при ден (часове) по-тясна */
const _SHIRINA_NA_KOLONATA: Readonly<Record<Takt, number>> = Object.freeze({
  den: 28,
  sedmitsa: 40,
  mesets: 36,
  trimesechie: 44,
  godina: 56,
  svoy: 36,
});
/** височините, когато таблицата е скрита и няма какво да се измери */
const _VISINA_NA_GLAVATA_BEZ_TABLITSA = 84;
const _VISINA_NA_REDA_BEZ_TABLITSA = 28;

/** лицето на бутона · до първата скоба · неговата дума */
function litse(b: ButonNaProzoretsa): string {
  return b.ime.split('(')[0]!.trim();
}

/** Колоните на Модела, които стоят под една негова глава · 1 или 2 (слятата). */
function koloniPodGlavata(g: GlavaNaOblika): readonly string[] {
  if (g.ot === 'nomeratsiya' || g.kolona === undefined) return [];
  if (g.ot === 'roditel') return [g.kolona];
  const sl = slyataNa(tablitsata(MODEL, TABLITSA), g.kolona);
  return sl === undefined ? [g.kolona] : [g.kolona, sl.opashka];
}

/** Колоната, по която се смята СБОР под главата · Имотите за име/състояние, Обектите за числата. */
function kolonaZaSbora(g: GlavaNaOblika): { tablitsa: string; kol: Kolona } | null {
  if (g.ot === 'nomeratsiya' || g.kolona === undefined) return null;
  if (g.ot === 'zadacha') {
    const kol = kolonaNa(tablitsata(MODEL, TABLITSA), g.kolona);
    return kol === undefined ? null : { tablitsa: TABLITSA, kol };
  }
  const tablitsa = g.kolona === 'ime' || g.kolona === 'sastoyanie' ? 'imoti' : 'obekti';
  const kol = kolonaNa(tablitsata(MODEL, tablitsa), g.kolona);
  return kol === undefined ? null : { tablitsa, kol };
}

/** Бюджетът на реда · цели центове, нула когато няма. */
function byudzhetaNa(r: RedNaEkrana): number {
  for (const k of r.kletki) if (k !== null && 'stoynost_st' in k) return k.stoynost_st;
  return 0;
}

/**
 * КЛЕТКИТЕ НА ТАКТА за един ред · дясната половина на СЪЩИЯ ред.
 *
 * Негово, 08.09 (запис 64в): „Календар със Задачи с ТЕКСТ в календара в
 * Управление и цифри в Сметки". Затова в клетката влиза името на задачата, а
 * не число: първата покрита клетка го носи, останалите са плътни.
 *
 * Светофарът идва от срока: нормално · жълто седмица преди · червено два дни
 * преди · просрочено. „Спешно и Важно" е негова дума и слага свой клас.
 */
function taktKletkiHTML(
  r: RedNaEkrana,
  koloni: readonly KolonaNaTakta[],
  dnes: string,
): readonly Zapechatan[] {
  const lenta = r.vid === 'zadacha' ? lentaNa({ id: r.id, ot: r.ot, do: r.do }, koloni) : null;
  const svetofar = r.vid === 'zadacha' && r.do !== '' ? svetofarNaSroka(r.do, dnes) : null;
  return koloni.map((kol, i) => {
    const vatre = lenta !== null && i >= lenta.ot && i < lenta.ot + lenta.broy;
    if (!vatre) return h`<td class="takt${kol.dnes ? ' dnes' : ''}"></td>`;
    const klas = `takt lenta ${svetofar ?? 'normalno'}${r.speshno ? ' speshno' : ''}${kol.dnes ? ' dnes' : ''}`;
    return h`<td class="${klas}" data-lenta="${r.id}">${i === lenta.ot ? r.ime : ''}</td>`;
  });
}

interface RedNaEkrana {
  readonly vid: 'roditel' | 'zadacha';
  readonly nivo: 0 | 1 | 2;
  readonly tablitsa: string;
  readonly id: string;
  /** думите под всяка негова глава · за филтъра */
  readonly dumi: readonly string[];
  /** клетката под всяка негова глава · за сбора */
  readonly kletki: readonly (Kletka | null)[];
  /** клетките на реда · `<tr>` се сглобява НАКРАЯ, за да легнат до него и тактовете */
  readonly tds: readonly Zapechatan[];
  /** класът и белезите на реда · същите, каквито бяха в готовия `<tr>` */
  readonly klas: string;
  readonly seq: number;
  readonly roditelId: string;
  readonly ime: string;
  readonly ot: string;
  readonly do: string;
  readonly speshno: boolean;
}

function redNaRoditel(
  o: Ogledalo,
  r: RoditelVDarvoto,
  oblik: readonly GlavaNaOblika[],
): RedNaEkrana {
  const tv = tablitsaVOgledaloto(o, r.tablitsa);
  const red = redKato(tv, r.i);
  const t = tablitsata(o.model, r.tablitsa);
  const dumi: string[] = [];
  const kletki: (Kletka | null)[] = [];
  const tds: Zapechatan[] = [];
  const nomer = tekstNaNomera(r.nomer);
  for (const g of oblik) {
    const broy = Math.max(1, koloniPodGlavata(g).length);
    if (g.ot === 'nomeratsiya') {
      dumi.push(nomer);
      kletki.push(null);
      tds.push(h`<td class="kletka nomer" data-kolona="nomeratsiya" translate="no">${nomer}</td>`);
      continue;
    }
    if (g.ot === 'zadacha') {
      dumi.push('');
      kletki.push(null);
      tds.push(h`<td class="kletka prazna" colspan="${broy}"></td>`);
      continue;
    }
    // колоната на родителя · Състоянието на Обекта е Видът му · името на Обект/Бизнес е Имотът му
    const klyuch = g.kolona === 'sastoyanie' && r.tablitsa === 'obekti' ? 'vid' : (g.kolona ?? '');
    const kol = kolonaNa(t, klyuch);
    if (g.kolona === 'ime' && r.tablitsa !== 'imoti') {
      const imot = t.roditel === undefined ? undefined : red.kletki[t.roditel.kolona];
      const ime = imot !== undefined && 'tekst' in imot ? imeNaReda(o, 'imoti', imot.tekst) : '';
      dumi.push(ime);
      kletki.push(ime === '' ? null : { tekst: ime });
      tds.push(h`<td class="kletka tekst" data-kolona="ime" translate="no">${ime}</td>`);
      continue;
    }
    if (kol === undefined) {
      dumi.push('');
      kletki.push(null);
      tds.push(h`<td class="kletka prazna"></td>`);
      continue;
    }
    const k = red.kletki[kol.klyuch] ?? null;
    kletki.push(k);
    dumi.push(
      kol.vid === 'izbor'
        ? tekstNaIzbora(o, r.tablitsa, kol.klyuch, k, red.kletki)
        : dumiNaKletka(o, r.tablitsa, kol.klyuch, k, red.kletki),
    );
    tds.push(kletkaHTML(o, r.tablitsa, kol, red));
  }
  const ime = r.tablitsa === 'imoti' ? dumi[1]! : `${nomer} · ${dumi[1] ?? ''}`;
  const klas = `red roditel nivo-${r.nivo}`;
  return {
    vid: 'roditel',
    nivo: r.nivo,
    tablitsa: r.tablitsa,
    id: r.id,
    dumi,
    kletki,
    ime,
    ot: '',
    do: '',
    speshno: false,
    tds,
    klas,
    seq: red.seq,
    roditelId: '',
  };
}

function redNaZadacha(
  o: Ogledalo,
  red: Red,
  roditelId: string,
  oblik: readonly GlavaNaOblika[],
  speshnoNomer: number | null,
): RedNaEkrana {
  const t = tablitsata(o.model, TABLITSA);
  const dumi: string[] = [];
  const kletki: (Kletka | null)[] = [];
  const tds: Zapechatan[] = [];
  for (const g of oblik) {
    const koloni = koloniPodGlavata(g);
    if (g.ot !== 'zadacha' || koloni.length === 0) {
      dumi.push('');
      kletki.push(null);
      tds.push(h`<td class="kletka prazna" colspan="${Math.max(1, koloni.length)}"></td>`);
      continue;
    }
    const chasti: string[] = [];
    for (const klyuch of koloni) {
      const kol = kolonaNa(t, klyuch)!;
      chasti.push(dumiNaKletka(o, TABLITSA, klyuch, red.kletki[klyuch] ?? null, red.kletki));
      tds.push(kletkaHTML(o, TABLITSA, kol, red));
    }
    const duma = chasti.filter((c) => c !== '').join(' / ');
    dumi.push(duma);
    // слятата глава се брои по думите си; единичната — по клетката си
    kletki.push(
      koloni.length === 1 ? (red.kletki[koloni[0]!] ?? null) : duma === '' ? null : { tekst: duma },
    );
  }
  const tekst = (klyuch: string): string => {
    const k = red.kletki[klyuch];
    return k !== undefined && 'tekst' in k ? k.tekst : '';
  };
  const ots = red.kletki['otsenka'];
  return {
    vid: 'zadacha',
    nivo: 2,
    tablitsa: TABLITSA,
    id: red.id,
    dumi,
    kletki,
    ime: `${tekstNaIzbora(o, TABLITSA, 'vid', red.kletki['vid'] ?? null)} ${tekst('ime')}`.trim(),
    ot: tekst('ot'),
    do: tekst('do'),
    speshno:
      speshnoNomer !== null && ots !== undefined && 'nomer' in ots && ots.nomer === speshnoNomer,
    tds,
    klas: 'red zadacha nivo-2',
    seq: red.seq,
    roditelId,
  };
}

/** Физическата клетка (0-базирана) на всяка колона на задачата · за черновата под реда. */
function fizicheskiKletki(oblik: readonly GlavaNaOblika[]): {
  broy: number;
  naKolonata: Map<string, number>;
} {
  const naKolonata = new Map<string, number>();
  let broy = 0;
  for (const g of oblik) {
    const koloni = koloniPodGlavata(g);
    if (koloni.length === 0) {
      broy += 1;
      continue;
    }
    for (const klyuch of koloni) {
      if (g.ot === 'zadacha') naKolonata.set(klyuch, broy);
      broy += 1;
    }
  }
  return { broy, naKolonata };
}

export function narisuvayUpravlenie(k: KonteksNaEkrana): void {
  const o = k.porta.ogledalo();
  const p = PROZORTSI.find((x) => x.klyuch === 'upravlenie')!;
  const oblik = OBLIK_NA_UPRAVLENIE;
  const dnesNaMashinata = new Date().toISOString().slice(0, 10);
  const dnes = chetiEkranno<string | null>(PAMET.dnes, null) ?? dnesNaMashinata;
  const takt = chetiEkranno<Takt>(PAMET.takt, 'mesets');
  const period = chetiEkranno<SvoyPeriod | null>(PAMET.period, null);
  const vizhda = chetiEkranno<KoeSeVizhda>(PAMET.vizhda, { tablitsa: true, diagrama: true });
  const skriyDela = chetiEkranno<boolean>(PAMET.skriyDela, false);
  const filtar = chetiEkranno<(string | null)[]>(PAMET.filtar, []).map((f) => f ?? '');
  const smetki = chetiEkranno<Record<string, Smetka>>(PAMET.smetki, {});
  const kogato = new Date().toISOString();

  // ═══ редовете на дървото · думи · клетки · HTML ═══
  const darvo = darvoto(o);
  const tvZ = o.tablitsi.get(TABLITSA);
  const speshnoNomer = nomerNaSpeshnoto(o);
  const redove: RedNaEkrana[] = [];
  for (const r of darvo.redove) {
    if (r.vid === 'roditel') redove.push(redNaRoditel(o, r, oblik));
    else if (!skriyDela && tvZ !== undefined)
      redove.push(redNaZadacha(o, redKato(tvZ, r.i), r.roditelId, oblik, speshnoNomer));
  }
  const zaFiltar: RedZaFiltar[] = redove.map((r) => ({ nivo: r.nivo, dumi: r.dumi }));
  const f = filtrirayDarvoto(zaFiltar, filtar);
  const vidimi = f.vidimi.map((i) => redove[i]!);

  // ═══ сборът под всяка глава · върху видимите ═══
  /**
   * ТАКТОВЕТЕ · КОЛОНИ НА СЪЩАТА ТАБЛИЦА, не втора таблица встрани.
   *
   * Негово, 11.09 (запис 194): „Искам да се сливат редовете на таблицата и на
   * календара, са еднакви редове. Искам да са едно както изглежда в МС
   * Проджект." И самата му Книга ги държи така: тактовете `K17:R17` са клетки
   * на реда. Дотук вдясно стоеше SVG, подравнен с мерене на височини — красиво,
   * но два отделни свята, които се разминават при първия скрол.
   */
  const deystvashtTakt: Takt = takt === 'svoy' && period === null ? 'mesets' : takt;
  const koloniNaTaktove =
    deystvashtTakt === 'svoy' && period !== null
      ? koloniNaTakta('svoy', dnes, period)
      : koloniNaTakta(deystvashtTakt, dnes);

  const sborKletki: Zapechatan[] = [];
  for (const [j, g] of oblik.entries()) {
    const broy = Math.max(1, koloniPodGlavata(g).length);
    if (j === 0) {
      sborKletki.push(h`<td class="sbor-duma" translate="no">сбор</td>`);
      continue;
    }
    const zs = kolonaZaSbora(g);
    if (zs === null) {
      sborKletki.push(h`<td colspan="${broy}"></td>`);
      continue;
    }
    const smetka = smetki[String(j)] ?? smetkataPoPodrazbirane(zs.kol);
    const rez = smetni(
      smetka,
      zs.kol,
      vidimi.map((r) => r.kletki[j] ?? null),
    );
    const dumi =
      rez.kletka === null
        ? ''
        : rez.smetka === 'broy' || rez.smetka === 'razlichni'
          ? String('chislo' in rez.kletka ? rez.kletka.chislo : '')
          : dumiNaKletka(o, zs.tablitsa, zs.kol.klyuch, rez.kletka);
    const izbor = smetkiteNaKolonata(zs.kol).map(
      (s) =>
        h`<option value="${s}" ${s === smetka ? 'selected' : ''}>${IMENA_NA_SMETKITE[s]}</option>`,
    );
    // помощта на избраната сметка казва и дали влиза в по-горен сбор · спанът няма своя
    sborKletki.push(
      h`<td class="sbor-kletka ${zs.kol.vid}" colspan="${broy}" data-sbor="${j}"><select class="pole malak" data-smetka="${j}" aria-label="${`сметката под „${g.glava}"`}"${podskazka(POMOSHT_NA_SMETKITE[smetka])}>${izbor}</select><span class="sbor-stoynost" data-sbor-stoynost="${j}" translate="no">${dumi}</span></td>`,
    );
  }

  // ═══ главите · подглавите · редът „филтър" ═══
  const glavi = oblik.map(
    (g) =>
      h`<th colspan="${Math.max(1, koloniPodGlavata(g).length)}" data-glava="${g.kolona ?? 'nomeratsiya'}"${podskazka(g.pomosht)}>${g.glava}</th>`,
  );
  /** сборът под всеки такт · бюджетът на задачите, които почват в него */
  /** колко задачи има на екрана и за колко от тях пада лента в този такт */
  const zadachiteNaEkrana = vidimi.filter((r) => r.vid === 'zadacha');
  const broyZadachi = zadachiteNaEkrana.length;
  const broyLenti = zadachiteNaEkrana.filter(
    (r) => lentaNa({ id: r.id, ot: r.ot, do: r.do }, koloniNaTaktove) !== null,
  ).length;
  const lentiteNaEkrana = zadachiteNaEkrana
    .map((r) => lentaNa({ id: r.id, ot: r.ot, do: r.do }, koloniNaTaktove))
    .filter((l) => l !== null);
  const pokrivashti = broyPokrivashti(koloniNaTaktove, lentiteNaEkrana);
  const sboroveNaTaktovete = sboroveVKolonite(
    koloniNaTaktove,
    zadachiteNaEkrana
      .filter((r) => r.ot !== '')
      .map((r) => ({ data: r.ot, chislo: byudzhetaNa(r) })),
  ).map((s, i) => {
    const broy = pokrivashti[i] ?? 0;
    return h`<td class="takt evro" translate="no">${
      s.obhvat === 0 || s.sbor === 0 ? '' : pishi(s.sbor)
    }${broy === 0 ? '' : h`<span class="pokrivashti">${String(broy)}</span>`}</td>`;
  });
  const glaviNaTaktovete = koloniNaTaktove.map(
    (kol) =>
      h`<th class="takt${kol.dnes ? ' dnes' : ''}"${podskazkaSDumi(kol.opis)}>${kol.nadpis}</th>`,
  );
  const podglaviNaTaktovete = koloniNaTaktove.map(
    (kol) => h`<th class="podglava takt${kol.dnes ? ' dnes' : ''}"></th>`,
  );
  const podglavi = oblik.map(
    (g) =>
      h`<th class="podglava" colspan="${Math.max(1, koloniPodGlavata(g).length)}">${g.podglava ?? ''}</th>`,
  );
  const redFiltar = oblik.map((g, j) =>
    j === 0
      ? h`<td class="filtar-duma" translate="no">филтър</td>`
      : h`<td colspan="${Math.max(1, koloniPodGlavata(g).length)}"><input class="pole malak filtar" data-filtar="${j}" value="${filtar[j] ?? ''}" placeholder="филтър" aria-label="${`филтър под „${g.glava}"`}"></td>`,
  );

  // ═══ полетата с цифри · бутоните ═══
  const poleta = poletataNaUpravlenie(o, dnes, kogato);
  const poletaHTML = poleta.poleta.map(
    (pl) =>
      h`<div class="pole-s-tsifra" data-pole="${pl.klyuch}"${podskazka(pl.pomosht)}><span class="tsifra" data-tsifra="${pl.klyuch}" translate="no">${pl.vid === 'evro' ? pishi(pl.stoynost) : pl.stoynost}</span><span class="ime">${pl.ime}</span></div>`,
  );
  const butonHTML = (b: ButonNaProzoretsa): Zapechatan => {
    const d = b.deystvie;
    if (d.vid === 'idva')
      return h`<button type="button" class="malak" data-buton-ekran="${b.klyuch}" disabled${podskazkaSDumi(d.dumi ?? `идва с ход ${d.hod}`)}>${litse(b)}</button>`;
    if (b.klyuch === 'takt') {
      const izbor = (b.izbor ?? []).map((duma) => {
        const t = TAKTOVE.find((x) => IMENA_NA_TAKTOVETE[x].toLowerCase() === duma.toLowerCase());
        return t === undefined
          ? ''
          : h`<option value="${t}" ${t === takt ? 'selected' : ''}>${duma}</option>`;
      });
      return h`<label class="malak buton-grupa" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${litse(b)} <select class="pole malak" data-takt>${takt === 'svoy' ? '<option value="svoy" selected>свой</option>' : ''}${izbor}</select></label>`;
    }
    if (b.klyuch === 'period')
      return h`<label class="malak buton-grupa" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${litse(b)} <input type="date" class="pole malak" data-period-ot value="${period?.ot ?? ''}"${podskazkaSDumi(b.izbor?.[0] ?? '')}><input type="date" class="pole malak" data-period-do value="${period?.do ?? ''}"${podskazkaSDumi(b.izbor?.[1] ?? '')}></label>`;
    let duma = litse(b);
    if (b.klyuch === 'skriy-tablitsa') duma = dumataNaButona(vizhda, 'tablitsa');
    if (b.klyuch === 'skriy-diagrama') duma = dumataNaButona(vizhda, 'diagrama');
    if (b.klyuch === 'skriy-dela') duma = skriyDela ? 'Покажи Дела' : 'Скрий Дела';
    return h`<button type="button" class="malak" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${duma}</button>`;
  };

  sloji(
    k.tyalo,
    h`
    <div class="zalepeno" data-zalepeno="upravlenie">
      <div class="poleta-s-tsifri" data-poleta>${poletaHTML}</div>
      <div class="deystviya butoni-malki" data-butoni>${BUTONI_NA_UPRAVLENIE.map(butonHTML)}</div>
    </div>
    <p class="greshka" data-greshka></p>
    <section class="upravlenie-tyalo" data-upravlenie>
      <div class="tablitsa-blok darvo-blok" data-blok="darvo" ${vizhda.tablitsa ? '' : 'hidden'}>
        <h2 class="lenta" translate="no">${p.lenti[1] ?? 'ОБЕКТИ'}</h2>
        <table class="reshetka darvo${vizhda.diagrama ? '' : ' bez-taktove'}" data-reshetka="${TABLITSA}">
          <thead>
            <tr class="glavi">${glavi}${glaviNaTaktovete}</tr>
            <tr class="podglavi">${podglavi}${podglaviNaTaktovete}</tr>
            <tr class="filtar" data-filtar-red>${redFiltar}${koloniNaTaktove.map(() => h`<td class="takt"></td>`)}</tr>
          </thead>
          <tbody class="tablitsa">${vidimi.map(
            (r) =>
              h`<tr class="${r.klas}" data-id="${r.id}" data-tablitsa="${r.tablitsa}" data-nivo="${String(r.nivo)}" data-seq="${String(r.seq)}"${
                r.roditelId === '' ? '' : h` data-roditel="${r.roditelId}"`
              }>${r.tds}${taktKletkiHTML(r, koloniNaTaktove, dnes)}</tr>`,
          )}</tbody>
          <tfoot><tr class="sbor" data-sbor-red>${sborKletki}${sboroveNaTaktovete}</tr></tfoot>
        </table>
        <p class="pod-tablitsata" data-sverka="gant">ленти ${String(broyLenti)} · без дати или извън обхвата ${String(
          broyZadachi - broyLenti,
        )} · задачи ${String(broyZadachi)} · такт ${IMENA_NA_TAKTOVETE[deystvashtTakt].toLocaleLowerCase('bg')} · колони ${String(
          koloniNaTaktove.length,
        )}</p>
        <p class="pod-tablitsata" data-sverka="darvo">видими ${f.broyVidimi} от ${redove.length} · родители ${darvo.broyRoditeli} · задачи ${darvo.broyZadachi} · сираци ${darvo.siratsi.length}${eFiltarPrazen(filtar) ? '' : ' · филтърът е включен'}</p>
      </div>
      ${dumiteIIznosHTML(DUMI_OT_KNIGATA.upravlenie)}`,
  );

  zakachiReshetkata(k);

  // ═══ филтърът · сметките · памет на екрана ═══
  for (const pole of k.tyalo.querySelectorAll<HTMLInputElement>('[data-filtar]')) {
    const zapomni = (): void => {
      const nov = oblik.map((_g, j) => filtar[j] ?? '');
      nov[Number(pole.dataset['filtar'])] = pole.value;
      zapomniEkranno(PAMET.filtar, nov);
      k.prerisuvay();
    };
    // Enter в текстово поле вдига `change` сам · втори слушател би рисувал два пъти
    pole.addEventListener('change', zapomni);
  }
  for (const s of k.tyalo.querySelectorAll<HTMLSelectElement>('[data-smetka]')) {
    s.addEventListener('change', () => {
      zapomniEkranno(PAMET.smetki, { ...smetki, [s.dataset['smetka'] ?? '']: s.value });
      k.prerisuvay();
    });
  }
  k.tyalo.querySelector<HTMLSelectElement>('[data-takt]')?.addEventListener('change', (e) => {
    zapomniEkranno(PAMET.takt, (e.target as HTMLSelectElement).value);
    k.prerisuvay();
  });
  const periodOt = k.tyalo.querySelector<HTMLInputElement>('[data-period-ot]');
  const periodDo = k.tyalo.querySelector<HTMLInputElement>('[data-period-do]');
  const smeniPerioda = (): void => {
    const ot = periodOt?.value ?? '';
    const doo = periodDo?.value ?? '';
    if (ot === '' || doo === '') return;
    if (doo < ot) {
      pokazhiGreshka(k.tyalo, 'Краят на периода е преди началото му.');
      return;
    }
    zapomniEkranno(PAMET.period, { ot, do: doo });
    zapomniEkranno(PAMET.takt, 'svoy');
    k.prerisuvay();
  };
  periodOt?.addEventListener('change', smeniPerioda);
  periodDo?.addEventListener('change', smeniPerioda);

  // ═══ бутоните · всеки казва какво прави ═══
  for (const b of k.tyalo.querySelectorAll<HTMLButtonElement>('button[data-buton-ekran]')) {
    const opis = BUTONI_NA_UPRAVLENIE.find((x) => x.klyuch === b.dataset['butonEkran']);
    if (opis === undefined) continue;
    b.addEventListener('click', () => deystvieNaButona(k, opis, b, vizhda, skriyDela, takt));
  }

  // ═══ дясното меню · задача под родител · изключи · върни · сторно ═══
  const fizicheski = fizicheskiKletki(oblik);
  zakachiDyasnoMenyu(
    k,
    'upravlenie',
    (b, red) => {
      if (!b.otvaryaChernova) {
        void izpalniOtMenyuto(k, b.klyuch, b.tovar);
        return;
      }
      const dadeni = (b.tovar as { kletki?: Record<string, Kletka | null> }).kletki ?? {};
      otvoriChernova(k.tyalo, k, TABLITSA, b.klyuch, {
        broyKletki: fizicheski.broy,
        kletkaNaKolonata: (kol) => fizicheski.naKolonata.get(kol.klyuch),
        sled: red,
        dadeni: Object.fromEntries(Object.entries(dadeni).filter(([, v]) => v !== null)),
        klas: 'zadacha nivo-2',
      });
    },
    (izbran) =>
      izbran.tablitsa === TABLITSA
        ? []
        : [
            {
              klyuch: 'golyamo-delo',
              ime: 'Голямо дело',
              razreshena: false,
              zashto: 'идва с ход 11б · само при Строеж (негово B4)',
              deystvie: () => {},
            },
          ],
  );
}

function deystvieNaButona(
  k: KonteksNaEkrana,
  b: ButonNaProzoretsa,
  el: HTMLButtonElement,
  vizhda: KoeSeVizhda,
  skriyDela: boolean,
  takt: Takt,
): void {
  const d = b.deystvie;
  switch (d.vid) {
    case 'kniga':
      void zapaziKnigata(k);
      return;
    case 'nastroyki':
      location.hash = '#/nastroyki';
      return;
    case 'komanda':
      void izpalniOtMenyuto(k, d.klyuch, {});
      return;
    case 'idva':
      return;
    case 'ekran':
      break;
  }
  switch (d.klyuch) {
    // неговите „Отвори" и „Запази" · моделът е ИМЕНУВАН поглед (ADR-014)
    case 'otvori':
      otvoriModel(k, 'upravlenie', el);
      return;
    case 'zapazi':
      void zapaziModela(k, 'upravlenie');
      return;
    case 'obnovi':
      k.prerisuvay();
      return;
    case 'nachalo-sega':
      zapomniEkranno(PAMET.dnes, null);
      if (takt === 'svoy') zapomniEkranno(PAMET.takt, 'mesets');
      k.prerisuvay();
      return;
    case 'skriy-dela':
      zapomniEkranno(PAMET.skriyDela, !skriyDela);
      k.prerisuvay();
      return;
    case 'skriy-tablitsa':
    case 'skriy-diagrama': {
      const r = prevkluchi(vizhda, d.klyuch === 'skriy-tablitsa' ? 'tablitsa' : 'diagrama');
      if (r.otkaz !== '') {
        pokazhiGreshka(k.tyalo, r.otkaz);
        return;
      }
      zapomniEkranno(PAMET.vizhda, r.sled);
      k.prerisuvay();
      return;
    }
    case 'dobavyane': {
      const r = el.getBoundingClientRect();
      pokazhiMenyu(r.left, r.bottom, [
        {
          klyuch: 'imot',
          ime: 'Имот · в прозореца Имоти',
          razreshena: true,
          zashto: '',
          deystvie: () => {
            location.hash = '#/imoti';
          },
        },
        {
          klyuch: 'obekt',
          ime: 'Обект · в прозореца Имоти',
          razreshena: true,
          zashto: '',
          deystvie: () => {
            location.hash = '#/imoti';
          },
        },
        {
          klyuch: 'kredit',
          ime: 'Кредит',
          razreshena: false,
          zashto: 'идва с ход 11б',
          deystvie: () => {},
        },
        {
          klyuch: 'sreshta',
          ime: 'Среща',
          razreshena: false,
          zashto: 'от десния бутон върху Имот, Обект или Бизнес',
          deystvie: () => {},
        },
      ]);
      return;
    }
    default:
      pokazhiGreshka(k.tyalo, `Бутонът „${litse(b)}" още няма действие.`);
  }
}
