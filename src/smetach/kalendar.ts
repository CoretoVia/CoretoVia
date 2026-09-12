/**
 * КАЛЕНДАРЪТ С ЦИФРИТЕ · Гантът на Сметки е ТАБЛИЦА, не картина (правило 28).
 *
 * Негово, 08.09 (запис 64в): цифрите живеят В КАЛЕНДАРНАТА КЛЕТКА; 11.09
 * (запис 145): „**да се показва цифрата с занака - или +**"; (запис 147):
 * „**Да има общ сбор в колоните най отдолу на Диаграмата.**"; (запис 149):
 * „**Когато има период от време да се събира сбора за всеки ред в колоната
 * бюджет.**"
 *
 * Тоест решетката има ЧЕТИРИ вида числа и всяко има свой дом:
 *
 *   · клетката      → сборът на реда в тази колона на такта;
 *   · „Период"      → сборът на реда по ВСИЧКИ видими колони (неговата колона
 *                     вляво от тактовете · в новата му Книга това е колона L);
 *   · долният ред   → сборът на колоната по всички редове (ред 92 в Книгата);
 *   · ъгълът        → сборът на сборовете.
 *
 * И понеже двата пътя до ъгъла са различни — по редове и по колони — те се
 * СВЕРЯВАТ, и разликата се връща ДОРИ когато е нула (правило 7). Разлика,
 * различна от нула, значи че число е попаднало извън всяка колона: не се
 * премълчава, а се показва.
 */

import { type ChisloPoData, type SborVKolona, sboroveVKolonite } from './gant.js';
import type { KolonaNaTakta } from './vreme.js';

export type { ChisloPoData } from './gant.js';

/** Един ред, както влиза: име и числата му с дати. */
export interface RedZaKalendara {
  readonly id: string;
  readonly ime: string;
  /** дата (`YYYY-MM-DD`) · число в цели центове, със знака си */
  readonly chisla: readonly ChisloPoData[];
}

export interface RedVKalendara {
  readonly id: string;
  readonly ime: string;
  readonly kletki: readonly SborVKolona[];
  /** сборът на реда по видимите колони · колоната „Период" */
  readonly period: number;
}

export interface Kalendar {
  readonly koloni: readonly KolonaNaTakta[];
  readonly redove: readonly RedVKalendara[];
  /** сборът под всяка колона · долният ред */
  readonly podKolonite: readonly number[];
  /** ъгълът · сборът по редове */
  readonly vsichko: number;
  /** сверка: сборът по редове минус сборът по колони · нула се записва също */
  readonly razlika: number;
}

/**
 * Месец (`YYYY-MM`) става дата · първото число.
 *
 * Движенията в Сметки носят МЕСЕЦ, не ден (неговата Книга е по месеци), а
 * решетката работи с дати. Първото число на месеца пада в колоната на този
 * месец при всеки такт от месец нагоре; при по-ситен такт — в първата му
 * колона, което е същият месец.
 */
export function denNaMeseca(mesets: string): string {
  return /^\d{4}-\d{2}$/.test(mesets) ? `${mesets}-01` : mesets;
}

/**
 * ДВАНАЙСЕТТЕ МЕСЕЦА на календара · периодът, който Книгата му показва.
 *
 * В листа Сметки тактовете са ТОЧНО дванайсет колони (в новата му Книга M…X), а
 * пред тях стои сборът за периода. Затова тук не се ползва тактът „година" — той
 * рисува шест години напред за скрол — а свой период от дванайсет месеца,
 * завършващ с показания месец.
 */
export function dvanaysetMeseca(mesets: string): { readonly ot: string; readonly do: string } {
  const [g, m] = mesets.split('-');
  const krayG = Number(g);
  const krayM = Number(m);
  const obshto = krayG * 12 + (krayM - 1) - 11;
  const nachaloG = Math.floor(obshto / 12);
  const nachaloM = obshto - nachaloG * 12 + 1;
  // последният ден на показания месец · нулевият ден на следващия
  const sledvashtG = krayM === 12 ? krayG + 1 : krayG;
  const sledvashtM = krayM === 12 ? 1 : krayM + 1;
  const posleden = new Date(Date.UTC(sledvashtG, sledvashtM - 1, 0)).getUTCDate();
  return {
    ot: `${nachaloG}-${String(nachaloM).padStart(2, '0')}-01`,
    do: `${g}-${m}-${String(posleden).padStart(2, '0')}`,
  };
}

export function kalendar(
  redove: readonly RedZaKalendara[],
  koloni: readonly KolonaNaTakta[],
): Kalendar {
  const gotovi: RedVKalendara[] = redove.map((r) => {
    const kletki = sboroveVKolonite(koloni, r.chisla);
    return {
      id: r.id,
      ime: r.ime,
      kletki,
      period: kletki.reduce((a, k) => a + k.sbor, 0),
    };
  });

  const podKolonite = koloni.map((_, i) =>
    gotovi.reduce((a, r) => a + (r.kletki[i]?.sbor ?? 0), 0),
  );
  const poRedove = gotovi.reduce((a, r) => a + r.period, 0);
  const poKoloni = podKolonite.reduce((a, s) => a + s, 0);

  return {
    koloni,
    redove: gotovi,
    podKolonite,
    vsichko: poRedove,
    razlika: poRedove - poKoloni,
  };
}
