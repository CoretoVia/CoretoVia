/**
 * МЕНЮТО „СЪЗДАВАНЕ" · четирите неща, които се раждат отвсякъде.
 *
 * Негово, 11.09 (запис 195), точка 11: „**Създаването на Имот, Обект, Задачи,
 * Срещи да става в искачащ прозорец…**" и 11.09 (запис 193): „**Създаването е
 * отделно падащо меню навсякъде.**"
 *
 * Четирите са НЕГОВИ и са изброени от самия него в клетката на бутона:
 * „Добавяне(падащо меню за Имот, Обект, Кредит, Среща)". Срещата не е пета
 * таблица — тя е задача с вид „Среща" от неговата номенклатура; затова тук
 * видът се подава готов, вместо човекът да го избира наново всеки път.
 *
 * Кредитът стои в списъка, но е СИВ и казва защо (правило 12) — таблицата му
 * идва с ход 11б.
 */

import { NOMENKLATURA } from '../../src/model/osnova.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { otvoriIzskachasht } from './izskachasht.js';
import { pokazhiMenyu, type Tochka } from './menyu.js';

/** Номерът на един вид задача по името му · `null`, ако номенклатурата го няма. */
function vidNaZadachata(k: KonteksNaEkrana, ime: string): number | null {
  const n = k.porta.ogledalo().nomenklaturi.get(NOMENKLATURA.vidNaZadacha);
  if (n === undefined) return null;
  for (const s of n.stoynosti) if (s.tekst === ime) return s.nomer;
  return null;
}

/**
 * ПУНКТОВЕТЕ на менюто · отделно от рисуването, за да се броят и проверяват.
 *
 * Списъкът е ДАННИ: кой пункт какво създава и защо е сив. Рисуването е друго
 * нещо и живее едно ниво по-нагоре.
 */
/**
 * Един пункт за задача · Срещата е същата таблица със заложен вид.
 *
 * `nomerNaVida` е номерът, който трябва да СЪЩЕСТВУВА, за да е разрешен
 * пунктът; `zalozhen` е онзи, който влиза готов в товара (при Задача — нито
 * един, човек избира сам).
 */
function zadachaIliSreshta(
  k: KonteksNaEkrana,
  klyuch: string,
  ime: string,
  zaglavie: string,
  nomerNaVida: number | null,
  zalozhen: number | null,
): Tochka {
  return {
    klyuch,
    ime,
    razreshena: nomerNaVida !== null,
    zashto: 'номенклатурата „Вид на задача" още не е заредена',
    deystvie: () =>
      otvoriIzskachasht(k, {
        tablitsa: 'zadachi',
        komanda: 'upravlenie.dobaviZadacha',
        zaglavie,
        ...(zalozhen === null ? {} : { dadeni: { vid: { nomer: zalozhen } } }),
      }),
  };
}

export function tochkiteNaSazdavaneto(k: KonteksNaEkrana): readonly Tochka[] {
  const sreshta = vidNaZadachata(k, 'Среща');
  const delo = vidNaZadachata(k, 'Дело');
  const tochki: Tochka[] = [
    {
      klyuch: 'imot',
      ime: 'Имот',
      razreshena: true,
      zashto: '',
      deystvie: () =>
        otvoriIzskachasht(k, {
          tablitsa: 'imoti',
          komanda: 'imoti.sazdayImot',
          zaglavie: 'Нов Имот',
        }),
    },
    {
      klyuch: 'obekt',
      ime: 'Обект',
      razreshena: true,
      zashto: '',
      deystvie: () =>
        otvoriIzskachasht(k, {
          tablitsa: 'obekti',
          komanda: 'imoti.dobaviObekt',
          zaglavie: 'Нов Обект',
        }),
    },
    // ЗАДАЧАТА И СРЕЩАТА СА ЕДНО И СЪЩО НЕЩО · различава ги само видът от
    // неговата номенклатура. Затова се раждат от един строител: два преписани
    // блока биха се разминали при първата промяна на полетата на задачата.
    zadachaIliSreshta(k, 'zadacha', 'Задача', 'Нова Задача', delo, null),
    zadachaIliSreshta(k, 'sreshta', 'Среща', 'Нова Среща', sreshta, sreshta),
    {
      klyuch: 'kredit',
      ime: 'Кредит',
      razreshena: false,
      zashto: 'идва с ход 11б',
      deystvie: () => {},
    },
  ];
  return tochki;
}

function pokazhiSazdavaneto(k: KonteksNaEkrana, x: number, y: number): void {
  pokazhiMenyu(x, y, tochkiteNaSazdavaneto(k));
}

/** Отваря менюто под самия бутон · двата прозореца го правеха с едни и същи редове. */
export function sazdavaneOtButona(k: KonteksNaEkrana, el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  pokazhiSazdavaneto(k, r.left, r.bottom);
}
