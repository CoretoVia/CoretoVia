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
