/**
 * ТАБЛИЦАТА · една таблица на прозорец, като ДАННИ (ADR-003).
 *
 * Лента в Книгата = таблица тук. Носи колоните си, същността на реда си в
 * Журнала, родителя си (Обект → Имот), номерацията си и по какво се групира на
 * екрана и в Книгата. Нищо от това не е код по таблица: екранът и износът четат
 * описанието и рисуват.
 */

import type { KlyuchNaProzorets, Vid } from './klyuchove.js';
import type { Kolona } from './kolona.js';
import { type Pomosht, pomosht } from './pomosht.js';

/**
 * Сегмент на номерацията · откъде идва числото:
 *
 *   · `broyach`              — брояч при създаване (Имот · 1, 2, 3…);
 *   · `roditel`              — номерацията на родителя (Обект → Имот);
 *   · `nomenklatura`         — замразеният номер на избраната стойност в колона `kolona`;
 *   · `kategoriya-fiksirana` — заковано число (Бизнесите са винаги категория 3);
 *   · `kolona`               — НЕГОВОТО въведено число в колона `kolona` (№ 27).
 */
export type Segment =
  | { readonly ot: 'broyach' }
  | { readonly ot: 'roditel' }
  | { readonly ot: 'nomenklatura'; readonly kolona: string }
  | { readonly ot: 'kategoriya-fiksirana'; readonly nomer: number }
  | { readonly ot: 'kolona'; readonly kolona: string };

export interface Nomeratsiya {
  readonly razdelitel: '.';
  readonly segmenti: readonly Segment[];
}

export interface Roditel {
  readonly tablitsa: string;
  /** колоната на ТАЗИ таблица, която сочи родителя */
  readonly kolona: string;
}

/**
 * ГРУПА · по коя колона се събират редовете под общ групов ред.
 *
 * Неговият лист: „2.1 · Гара Яна · Сграда" е групов ред над обектите на Гара
 * Яна в Сграда. Категорията няма СВОЯ колона в Книгата — стои в клетката на
 * колоната „Състояние" на груповия ред (`vKletkataNa: 'vid'`). Групираща
 * колона с `vKletkataNa` НЯМА своя колона в Книгата и на екрана.
 */
export interface Grupa {
  readonly kolona: string;
  readonly vKletkataNa?: string;
}

/**
 * СЛЯТА КЛЕТКА · две колони на Модела в ЕДНА клетка на Книгата.
 *
 * Неговото E20 „Дело / Сондаж" е вид + име, F18 „Начало/Край" е две дати. В
 * Модела видът е НОМЕР, а името — текст (редовете пазят номера, не думата), затова
 * са две колони; в Книгата се пишат като `‹колона›‹разделител›‹опашка›` и се четат
 * по ПЪРВИЯ разделител. Опашката НЯМА своя колона в Книгата и на екрана.
 */
export interface Slyata {
  readonly kolona: string;
  readonly opashka: string;
  readonly razdelitel: string;
}

export interface Tablitsa {
  readonly klyuch: string;
  /** лентата в Книгата · дословно */
  readonly ime: string;
  /**
   * ОБЯСНЕНИЕТО ПРИ ЗАДЪРЖАНЕ върху лентата · какво е един ред тук и коя е
   * главната сметка на таблицата (`pomosht.ts`). ЗАДЪЛЖИТЕЛНО — пада компилацията.
   */
  readonly pomosht: Pomosht;
  readonly prozorets: KlyuchNaProzorets;
  /** видът на същността на реда в Журнала */
  readonly sashtnost: Vid;
  readonly koloni: readonly Kolona[];
  readonly roditel?: Roditel;
  readonly nomeratsiya?: Nomeratsiya;
  /** в реда на вложеност · Обекти: Имот, после Категория */
  readonly grupirane?: readonly Grupa[];
  readonly slyati?: readonly Slyata[];
  /** втори ред глави в Книгата · неговите подглави (Управление ред 18) · по колона */
  readonly podglava?: Readonly<Record<string, string>>;
  /** ред „филтър" под главите в Книгата (Управление B19:R19 · Сметки B17:W17) */
  readonly redFiltar?: boolean;
  /** таблицата е НАША (не е блок от неговата Книга) · липсата ѝ там е бележка, не грешка */
  readonly nashaTablitsa?: true;
  /**
   * БАЗОВИТЕ редове · неговите, от Книгата, докато никой не е записал свои.
   * Пишат се в листа без ключ (картина, не данни) и четенето ги ПОЗНАВА: ред,
   * еднакъв с базовия, не е нов. Промени ли се в Ексел, влиза като нов ред и
   * оттам нататък записаният бие базовия (ADR-008).
   */
  readonly bazovi?: readonly Readonly<Record<string, string>>[];
}

export function kolonaNa(t: Tablitsa, klyuch: string): Kolona | undefined {
  return t.koloni.find((k) => k.klyuch === klyuch);
}

/** Колоните, които имат СВОЯ колона в Книгата и на екрана · в реда им. */
export function koloniNaReda(t: Tablitsa): readonly Kolona[] {
  const vChuzhdaKletka = new Set(
    (t.grupirane ?? []).filter((g) => g.vKletkataNa !== undefined).map((g) => g.kolona),
  );
  for (const s of t.slyati ?? []) vChuzhdaKletka.add(s.opashka);
  return t.koloni.filter((k) => !vChuzhdaKletka.has(k.klyuch));
}

/** Слятата клетка, в която колоната е ГЛАВА · `undefined`, ако стои сама. */
export function slyataNa(t: Tablitsa, kolona: string): Slyata | undefined {
  return (t.slyati ?? []).find((s) => s.kolona === kolona);
}

/**
 * ПОМОЩТА НА ТАБЛИЦА, РОДЕНА ОТ ЖУРНАЛА · когато никой не е писал текст.
 *
 * Таблица, добавена от Настройки (десетият тип събитие), тръгва без колони и
 * без автор на обяснение. Казва се онова, което Е сигурно: наша е, не от
 * Книгата; редовете ѝ са събития като всички други; колоните ѝ идват една по
 * една от същото място.
 */
export function pomoshtNaNovaTablitsa(ime: string): Pomosht {
  return pomosht(
    `Таблица „${ime}", създадена от Настройки — няма я в Книгата. Редовете ѝ са събития в Журнала като на всяка друга таблица, а колоните ѝ се добавят една по една оттам.`,
    'наша таблица · колоните се добавят от Настройки · всеки ред е събитие в Журнала',
  );
}
