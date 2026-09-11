/**
 * КАЛКУЛАТОРЪТ НАД ПРОДАЖБИТЕ · „Стойност на Състояние" (ADR-012).
 *
 * Негово (05.09, `zadanie/10` т.3): „Добави и калкулатора над Продажбите."
 * И (09.08): „две таблици едновременно с ДВЕ ЦЕНОВИ КОЛОНИ ЕДНА ДО ДРУГА за
 * сравнение… А продава, Б оценява." Разминаването между договорената цена и
 * оценената е ИНФОРМАЦИЯТА, затова тук се смятат и двете, и разликата се казва.
 *
 * ВИДЪТ НА ОБЕКТА се ЧЕТЕ от неговата колона „апартамент": там пише „апарт. № 1"
 * · „гараж № 4" · „НПМ № 12" · „ателие № 1". Тя носи вида в текста си, а не в
 * отделна колона — затова се разпознава по дума и РАЗПОЗНАТОТО СЕ КАЗВА на
 * екрана. Гадаене без обяснение е по-лошо от липса (правило 12).
 *
 * Нищо тук не пише: чисто смятане върху Огледалото.
 */

import { pomosht } from '../../model/pomosht.js';
import type { Ogledalo } from '../../ogledalo/ogledalo.js';
import { sabiri, tsentove } from '../../yadro/pari.js';
import { evroZaKvadrat, type Prodazhba, prodazhbite } from '../prodazhbi.js';
import type { IzvedenaKolona } from '../smetki.js';
import {
  ochakvanNaem_st,
  saglasuvana,
  type Saglasuvane,
  tsenaPazarno,
  tsenaPoRazhod,
  tsenaPoSastoyanie,
} from './matritsa.js';
import { type NastroykiNaKalkulatora, PO_PODRAZBIRANE, type VidObekt } from './nastroyki.js';

/**
 * ДУМИТЕ, по които се познава видът · неговите, от листа Продажби.
 *
 * Редът има значение: „НПМ" (непокрито паркомясто) се проверява преди „място",
 * а „ателие" пада при апартаментите, защото се оценява като жилище.
 */
const DUMI_NA_VIDA: readonly { readonly duma: string; readonly vid: VidObekt }[] = Object.freeze([
  { duma: 'апарт', vid: 'apartament' },
  { duma: 'ателие', vid: 'apartament' },
  { duma: 'жилище', vid: 'apartament' },
  { duma: 'гараж', vid: 'garazh' },
  { duma: 'нпм', vid: 'parkomyasto' },
  { duma: 'паркомясто', vid: 'parkomyasto' },
  { duma: 'п. място', vid: 'parkomyasto' },
  { duma: 'място', vid: 'parkomyasto' },
  { duma: 'мазе', vid: 'sklad' },
  { duma: 'склад', vid: 'sklad' },
]);

export interface Razpoznat {
  readonly vid: VidObekt;
  /** думата, по която е познат · празна, когато нищо не е съвпаднало */
  readonly poDumata: string;
}

/**
 * ШЕСТТЕ КОЛОНИ НА ОЦЕНКАТА · главите над калкулатора, с помощта им.
 *
 * Формулите са тези на `matritsa.ts`, казани с думи; числата в тях (бази ·
 * наем на квадрат · земя · строителна · полезен живот · тегла) са от
 * настройките на калкулатора и текстът не ги изписва — те се менят там, а
 * текстът не бива да остарява с тях. Теглата и разходните числа са НАШИ.
 */
export const KOLONI_NA_OTSENKATA: readonly IzvedenaKolona[] = Object.freeze([
  {
    klyuch: 'pazaren',
    ime: 'пазарен',
    pomosht: pomosht(
      'Пазарният подход: площта по базата за квадратен метър според вида на обекта. Базата идва от настройките на калкулатора; всичко се смята в цели числа и се дели веднъж, накрая.',
      'площ × база по вид',
    ),
  },
  {
    klyuch: 'dohoden',
    ime: 'доходен',
    pomosht: pomosht(
      'Доходният подход: годишният очакван наем без незаетостта и оперативните разходи, делен на доходността. Наемът е очакван — площ по наем на квадрат по вид; нула значи, че подходът отпада.',
      'очакван наем × 12 × (1 − незаетост) × (1 − разходи) ÷ доходност',
    ),
  },
  {
    klyuch: 'razhoden',
    ime: 'разходен',
    pomosht: pomosht(
      'Разходният подход: земя плюс строителна стойност, намалена с овехтяването — земята не овехтява. Възрастта и полезният живот са наши числа; липсва ли едно число, подходът дава нула и отпада.',
      'площ × (земя + строителна × (1 − възраст ÷ полезен живот))',
    ),
  },
  {
    klyuch: 'otsenena',
    ime: 'ОЦЕНЕНА',
    pomosht: pomosht(
      'Съгласуваната цена от трите подхода с тегла от настройките — наши числа; разходният никога не води. Подход с нула отпада и теглата на останалите се преразпределят до сто на сто.',
      'пазарен × тегло + доходен × тегло + разходен × тегло · нулевият подход отпада',
    ),
  },
  {
    klyuch: 'dogovorena',
    ime: 'договорена',
    pomosht: pomosht(
      'Неговата колона „цена" от реда на продажбата — договореното с купувача. Пише се на реда; тук само се показва до оценената, за да се виждат една до друга.',
      'колоната цена на продажбата · пише се на реда',
    ),
  },
  {
    klyuch: 'razlika',
    ime: 'разлика',
    pomosht: pomosht(
      'Оценена минус договорена в цели центове. Плюс значи, че оценката е над договорената цена; минус — под нея. Сборът отдолу е върху всички редове на двете таблици.',
      'оценена − договорена · плюс = оценката е над цената',
    ),
  },
]);

/** Видът от името му · „друго", когато нито една дума не съвпадне. */
export function vidatOtImeto(ime: string): Razpoznat {
  const dolu = ime.toLowerCase();
  for (const d of DUMI_NA_VIDA) {
    if (dolu.includes(d.duma)) return { vid: d.vid, poDumata: d.duma };
  }
  return { vid: 'drug', poDumata: '' };
}

export interface OtsenkaNaProdazhba {
  readonly id: string;
  readonly tablitsa: string;
  readonly ime: string;
  readonly vid: VidObekt;
  readonly poDumata: string;
  readonly kvadratura: number;
  /** договорената цена · неговата колона „цена" */
  readonly dogovorena_st: number;
  /** А · пазарният подход */
  readonly pazaren_st: number;
  /** Б · доходният · от ОЧАКВАН наем, защото Продажби не носи действителен */
  readonly dohoden_st: number;
  /** В · разходният */
  readonly razhoden_st: number;
  readonly saglasuvane: Saglasuvane;
  /** оценена − договорена · плюс значи, че оценката е над цената */
  readonly razlika_st: number;
  /** евро на квадрат по договорената цена · неговата производна колона */
  readonly dogovoreni_st_kvm: number;
  readonly otseneni_st_kvm: number;
}

export interface OtsenkataNaProdazhbite {
  readonly redove: readonly OtsenkaNaProdazhba[];
  readonly dogovoreni_st: number;
  readonly otseneni_st: number;
  readonly razlika_st: number;
  /** сборната квадратура · за средното евро на квадрат */
  readonly kvadratura: number;
  /** подходите, отпаднали поне веднъж · назовани, не преброени (правило 15) */
  readonly otpadnali: readonly string[];
  readonly nastroyki: NastroykiNaKalkulatora;
}

/** Оценката на ЕДНА продажба · трите подхода и съгласуването им. */
export function otseni(r: Prodazhba, nastroyki: NastroykiNaKalkulatora): OtsenkaNaProdazhba {
  const { vid, poDumata } = vidatOtImeto(r.ime);
  const obshta_kvsm = r.kvadratura;
  const pazaren_st = tsenaPazarno({ obshta_kvsm, vid, nastroyki });
  const dohoden_st = tsenaPoSastoyanie({
    naem_mesechen_st: ochakvanNaem_st(obshta_kvsm, vid, nastroyki),
    nastroyki,
  });
  const razhoden_st = tsenaPoRazhod({ obshta_kvsm, vid, nastroyki });
  const s = saglasuvana({ pazaren_st, dohoden_st, razhoden_st, tegla: nastroyki.tegla });
  const dogovorena_st = r.tsena;
  return {
    id: r.id,
    tablitsa: r.tablitsa,
    ime: r.ime,
    vid,
    poDumata,
    kvadratura: obshta_kvsm,
    dogovorena_st,
    pazaren_st,
    dohoden_st,
    razhoden_st,
    saglasuvane: s,
    razlika_st: s.tochno_st - dogovorena_st,
    dogovoreni_st_kvm: evroZaKvadrat(dogovorena_st, obshta_kvsm),
    otseneni_st_kvm: evroZaKvadrat(s.tochno_st, obshta_kvsm),
  };
}

/** Калкулаторът над ДВЕТЕ му таблици · за екрана и за Книгата. */
export function otsenkata(
  o: Ogledalo,
  kogato: string,
  nastroyki: NastroykiNaKalkulatora = PO_PODRAZBIRANE,
): OtsenkataNaProdazhbite {
  const vsichki = prodazhbite(o, kogato).tablitsi.flatMap((t) => t.redove);
  const redove = vsichki.map((r) => otseni(r, nastroyki));
  const otpadnali = [...new Set(redove.flatMap((r) => r.saglasuvane.otpadnali))];
  return {
    redove,
    // парите минават през преградата за цели центове (правило 3); квадратурата е кв. см, не пари
    dogovoreni_st: sabiri(...redove.map((r) => tsentove(r.dogovorena_st))),
    otseneni_st: sabiri(...redove.map((r) => tsentove(r.saglasuvane.tochno_st))),
    razlika_st: sabiri(...redove.map((r) => tsentove(r.razlika_st))),
    kvadratura: redove.reduce((s, r) => s + r.kvadratura, 0),
    otpadnali,
    nastroyki,
  };
}
