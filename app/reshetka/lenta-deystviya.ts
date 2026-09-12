/**
 * ЧЕТВЪРТИЯТ РЕД · бутоните, разделени на теми с падащи менюта.
 *
 * Негово, `zadanie/12-dopalneniya-08-09.md` (О1), ДОСЛОВНО: „**Всички бутони се
 * разделят на теми с падащи менюта, колкото са темите в таба.**" И пак негово,
 * 09.09: „**В началния главен хедър на всеки таб да има също падащи менюта по
 * теми за бутоните.**"
 *
 * И накрая, 11.09 (запис 193): „**4ти ред се правят падащи менюта с бутони.
 * Създаването е отделно падащо меню навсякъде. Тук се събират и такта и
 * датата.**"
 *
 * Оттук трите правила на този ред:
 *
 *   1. Създаването е СВОЯ тема, първа и навсякъде — не се смесва с изгледа.
 *   2. Тактът, периодът и „Начало Сега" стоят ОТКРИТИ на реда, не в меню:
 *      те се въртят непрекъснато, а меню при всяко завъртане е спънка.
 *   3. Нито един бутон не пада между темите. Ключ без тема е НАХОДКА (тестът
 *      го брои), а не тихо изчезнал бутон.
 *
 * Менюто е `<details>` — отваря се и се затваря без нито един ред скрипт;
 * скриптът тук прави само това, което браузърът не прави сам: затваря
 * останалите, когато едно се отвори, и затваря всички при клик отвън и Escape.
 */

import {
  type ButonNaProzoretsa,
  butoniBezTema,
  OTKRITITE,
  TEMI_NA_BUTONITE,
} from '../../src/model/osnova.js';
import {
  IMENA_NA_TAKTOVETE,
  type KolonaNaTakta,
  type SvoyPeriod,
  type Takt,
  TAKTOVE,
} from '../../src/smetach/vreme.js';
import { pishi } from '../../src/yadro/pari.js';
import { podskazka, podskazkaSDumi } from './podskazka.js';
import { h, type Zapechatan } from './shablon.js';

/**
 * Четвъртият ред · менютата по теми, после откритите.
 *
 * `dopalnitelno` влиза В Създаването: там живеят бутоните на прозореца, които
 * не идват от каталога му (в Сметки — „Добави ред с пари"), а създаването е
 * една тема навсякъде, не две на различни места.
 */
export function lentaNaDeystviyata(
  butoni: readonly ButonNaProzoretsa[],
  butonHTML: (b: ButonNaProzoretsa) => Zapechatan,
  dopalnitelno?: Zapechatan,
): Zapechatan {
  const po = new Map(butoni.map((b) => [b.klyuch, b]));
  const temi = TEMI_NA_BUTONITE.map((t) => {
    const vatre = t.klyuchove.map((klyuch) => po.get(klyuch)).filter((b) => b !== undefined);
    const oshte = t.klyuch === 'sazdavane' ? dopalnitelno : undefined;
    if (vatre.length === 0 && oshte === undefined) return h``;
    return h`<details class="tema" data-tema="${t.klyuch}">
      <summary class="malak">${t.ime}</summary>
      <div class="tochki">${vatre.map(butonHTML)}${oshte ?? ''}</div>
    </details>`;
  });
  const otkriti = [...OTKRITITE, ...butoniBezTema(butoni)]
    .map((klyuch) => po.get(klyuch))
    .filter((b) => b !== undefined)
    .map(butonHTML);
  return h`<div class="deystviya butoni-malki" data-butoni>${temi}<span class="otkriti" data-otkriti>${otkriti}</span></div>`;
}

/** Едно отворено меню наведнъж · клик отвън и Escape ги затварят. */
export function zakachiTemite(koren: HTMLElement): void {
  const vsichki = (): HTMLDetailsElement[] => [
    ...koren.querySelectorAll<HTMLDetailsElement>('details.tema'),
  ];
  for (const d of vsichki())
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      for (const drug of vsichki()) if (drug !== d) drug.open = false;
    });
  koren.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key !== 'Escape') return;
    for (const d of vsichki()) d.open = false;
  });
  // клик ИЗВЪН менютата ги затваря · слушателят е на корена на екрана, не на документа,
  // за да си отиде заедно с него при следващото рисуване
  koren.addEventListener('click', (e) => {
    const v = e.target as Node;
    for (const d of vsichki()) if (!d.contains(v)) d.open = false;
  });
}

/**
 * ТАКТЪТ И ПЕРИОДЪТ · едни и същи в Управление и в Сметки.
 *
 * Негово, 11.09 (запис 195), точка 4: „**Такта да се дава и в двете: Сметки и
 * Управление.**" Дотук тактът беше само в Управление, а Сметки показваше
 * дванайсет месеца, заковани в кода — човек не можеше да свие погледа до един
 * месец, нито да го разпъне.
 *
 * Домът на тези три бутона е ЕДИН (правило 14): преписани в два прозореца, те
 * биха се разминали при първата му дума за някой от тях.
 */
function kontroliteNaTakta(
  b: ButonNaProzoretsa,
  takt: Takt,
  period: SvoyPeriod | null,
): Zapechatan | null {
  const litseNa = (x: ButonNaProzoretsa): string => x.ime.split('(')[0]!.trim();
  if (b.klyuch === 'takt') {
    const izbor = (b.izbor ?? []).map((duma) => {
      const klyuch = TAKTOVE.find(
        (x) => IMENA_NA_TAKTOVETE[x].toLowerCase() === duma.toLowerCase(),
      );
      return klyuch === undefined
        ? ''
        : h`<option value="${klyuch}" ${klyuch === takt ? 'selected' : ''}>${duma}</option>`;
    });
    return h`<label class="malak buton-grupa" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${litseNa(b)} <select class="pole malak" data-takt>${takt === 'svoy' ? '<option value="svoy" selected>свой</option>' : ''}${izbor}</select></label>`;
  }
  if (b.klyuch === 'period')
    return h`<label class="malak buton-grupa" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${litseNa(b)} <input type="date" class="pole malak" data-period-ot value="${period?.ot ?? ''}"${podskazkaSDumi(b.izbor?.[0] ?? '')}><input type="date" class="pole malak" data-period-do value="${period?.do ?? ''}"${podskazkaSDumi(b.izbor?.[1] ?? '')}></label>`;
  return null;
}

/**
 * СЛУШАТЕЛИТЕ на такта и на периода · същите в двата прозореца.
 *
 * Периодът се приема САМО цял и само когато краят не е преди началото; щом се
 * приеме, тактът става „свой" — инак екранът би показвал един период, а долният
 * ред би сумирал друг.
 */
export function zakachiTakta(
  koren: HTMLElement,
  klyuchoveNaPametta: { readonly takt: string; readonly period: string },
  zapomni: (klyuch: string, stoynost: unknown) => void,
  prerisuvay: () => void,
  kazhiGreshka: (dumi: string) => void,
): void {
  koren.querySelector<HTMLSelectElement>('[data-takt]')?.addEventListener('change', (e) => {
    zapomni(klyuchoveNaPametta.takt, (e.target as HTMLSelectElement).value);
    prerisuvay();
  });
  const ot = koren.querySelector<HTMLInputElement>('[data-period-ot]');
  const doo = koren.querySelector<HTMLInputElement>('[data-period-do]');
  const smeni = (): void => {
    const a = ot?.value ?? '';
    const b = doo?.value ?? '';
    if (a === '' || b === '') return;
    if (b < a) {
      kazhiGreshka('Краят на периода е преди началото му.');
      return;
    }
    zapomni(klyuchoveNaPametta.period, { ot: a, do: b });
    zapomni(klyuchoveNaPametta.takt, 'svoy');
    prerisuvay();
  };
  ot?.addEventListener('change', smeni);
  doo?.addEventListener('change', smeni);
}

/**
 * ОБЩОТО НАЧАЛО НА ВСЕКИ БУТОН · сивият „идва с ход N" и контролите на времето.
 *
 * И двата прозореца започваха рисуването на бутон с едни и същи пет реда.
 * Обход 8 на чистотата ги хвана, и с право: преписаното се разминава при
 * първата промяна само на едното място. Тук стои общото, а всеки прозорец
 * продължава със СВОЕТО — кой бутон какво казва при него.
 *
 * Връща `null`, когато бутонът не е нито сив, нито от времето — тогава
 * прозорецът го рисува сам.
 */
export function obshtotoNaButona(
  b: ButonNaProzoretsa,
  takt: Takt,
  period: SvoyPeriod | null,
): Zapechatan | null {
  const d = b.deystvie;
  if (d.vid === 'idva')
    return h`<button type="button" class="malak" data-buton-ekran="${b.klyuch}" disabled${podskazkaSDumi(
      d.dumi ?? `идва с ход ${d.hod}`,
    )}>${b.ime.split('(')[0]!.trim()}</button>`;
  return kontroliteNaTakta(b, takt, period);
}

/**
 * ГЛАВИТЕ НА ТАКТА · едни и същи в Управление и в Сметки.
 *
 * Негово, 12.09 (запис 199): в двата прозореца календарът е част от таблицата,
 * значи и главите му са едни. Дръжката за ширина стои САМО на първия ден —
 * местиш един, местиш всички (т.4), защото дните са едно и също нещо.
 */
export function glaviteNaTakta(koloni: readonly KolonaNaTakta[]): readonly Zapechatan[] {
  return koloni.map(
    (kol, i) =>
      h`<th class="takt${kol.dnes ? ' dnes' : ''}"${podskazkaSDumi(kol.opis)}>${kol.nadpis}${
        i === 0 ? h`<span class="shirina" data-shirina-darvo aria-hidden="true"></span>` : ''
      }</th>`,
  );
}

/**
 * ЛИЦЕТО НА ЕДНА КЛЕТКА ОТ ТАКТА · и името, и числото, когато ги има двете.
 *
 * Негово, 12.09 (запис 201), ДОСЛОВНО: „**Всеки ред има бюджет с число или няма
 * число. Когато има едновременно и бюджет и текст на задачата да се показват и
 * двете в едно и също поле и само числата да влизат в сбора отдолу на всяка
 * колона.**"
 *
 * Оттам трите случая и нито един повече: само име · само число · и двете,
 * разделени с точка. Празната клетка си остава празна.
 *
 * СБОРЪТ ОТДОЛУ НЕ ЧЕТЕ ТУК. Той събира числата от данните, не от нарисуваното
 * — затова името в клетката не може да влезе в него дори по невнимание. Това е
 * същият урок, платен на 11.09: адрес „ул. Пробна 1" се четеше като „.1" и под
 * текстова колона се появяваше сбор.
 */
export function litseNaTakta(ime: string, st: number | null): string {
  const chislo = st === null || st === 0 ? '' : pishi(st);
  if (ime === '') return chislo;
  return chislo === '' ? ime : `${ime} · ${chislo}`;
}
