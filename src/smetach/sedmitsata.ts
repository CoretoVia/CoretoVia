/**
 * СЕДМИЧНАТА ПРОГРАМА НА ЕДИН ЧОВЕК · и онова, което се трупа от миналото.
 *
 * Негово, 11.09 (запис 195), точка 7, ДОСЛОВНО: „**Да се отваря за всеки
 * работник седмичната програма, не днешната а седмичната. Ако не е изпълнена се
 * пренастройва за следващия ден и се трупа, докато не се отбележи, че е
 * свършена задачата.**"
 *
 * Оттам двете неща тук:
 *
 *   1. СЕДМИЦАТА, не денят — седем дни от понеделник, с днешния отбелязан.
 *   2. ТРУПАНЕТО — задача, чийто край е МИНАЛ, не изчезва: тя пада на днешния
 *      ден и стои там. „Пренастройва се за следващия ден" всеки ден отново е
 *      точно това: докато не се затвори, тя е на днес.
 *
 * ТРУПАНЕТО СЕ СМЯТА, НЕ СЕ ЗАПИСВА (правило 16). Задача, която се пренася с
 * ЗАПИС всеки ден, би напълнила Журнала с по едно събитие на човек на ден за
 * нищо — и би излъгала, ако програмата не е пусната някой ден.
 *
 * ТРУПА СЕ ОНОВА, КОЕТО НЕ Е ПОТВЪРДЕНО · точно по думата му.
 *
 * До 13.09 тук стоеше догадка: трупаше се задачата с МИНАЛ край, защото колона
 * за потвърждаване нямаше. Тя беше вярна за всичко наистина несвършено и
 * прекалена за онова, което е свършено, но никой не го е казал на програмата —
 * тоест човек виждаше свършените си задачи като натрупани, завинаги.
 *
 * Сега колоната я има (`svarshena`) и се пълни от десния бутон върху реда —
 * негово, 13.09 (запис 206): „**Задачата се потвърждава през приложението от
 * десния бутон.**" Празната клетка значи несвършена, и само тя се трупа.
 */

import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { zhiviteRedove } from '../ogledalo/tablitsa.js';
import { tekstNaKletka } from './kletki.js';
import { imeNaReda } from './kletki.js';
import { nachaloNaSedmitsata } from './programa.js';

const ZADACHI = 'zadachi';

export interface ZadachaVDenya {
  readonly id: string;
  readonly ime: string;
  readonly ot: string;
  readonly do: string;
  /** краят е минал · задачата се трупа на днешния ден */
  readonly natrupana: boolean;
}

export interface DenNaProgramata {
  /** `ГГГГ-ММ-ДД` */
  readonly den: string;
  /** името на деня с думи · „понеделник" */
  readonly ime: string;
  readonly dnes: boolean;
  readonly zadachi: readonly ZadachaVDenya[];
}

export interface SedmichnaPrograma {
  /** id-то на човека · `sluzhitel:…` или `stopan:…` */
  readonly chovek: string;
  readonly ime: string;
  readonly dni: readonly DenNaProgramata[];
  /** колко задачи се трупат от минали дни · казва се, не се крие */
  readonly natrupani: number;
  /** задачи на този човек БЕЗ нито една дата · нямат кога да са */
  readonly bezData: readonly string[];
}

const DNITE = ['понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота', 'неделя'] as const;

function plyusDni(den: string, dni: number): string {
  const d = new Date(`${den}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + dni);
  return d.toISOString().slice(0, 10);
}

export function sedmichnataPrograma(o: Ogledalo, chovek: string, dnes: string): SedmichnaPrograma {
  const ponedelnik = nachaloNaSedmitsata(dnes);
  const dni = DNITE.map((ime, i) => ({ den: plyusDni(ponedelnik, i), ime }));

  const poDen = new Map<string, ZadachaVDenya[]>();
  for (const d of dni) poDen.set(d.den, []);
  const bezData: string[] = [];
  let natrupani = 0;

  const tv = o.tablitsi.get(ZADACHI);
  if (tv !== undefined) {
    for (const i of zhiviteRedove(tv)) {
      if (tekstNaKletka(o, ZADACHI, i, 'otgovornik') !== chovek) continue;
      const ime = tekstNaKletka(o, ZADACHI, i, 'ime');
      const ot = tekstNaKletka(o, ZADACHI, i, 'ot');
      const doo = tekstNaKletka(o, ZADACHI, i, 'do');
      const id = tv.id[i] ?? '';
      if (ot === '' && doo === '') {
        bezData.push(ime === '' ? id : ime);
        continue;
      }
      const nachalo = ot === '' ? doo : ot;
      const kray = doo === '' ? nachalo : doo;
      const svarshena = tekstNaKletka(o, ZADACHI, i, 'svarshena');
      // ПОТВЪРДЕНАТА не се трупа и не заема ден · тя е приключила
      if (svarshena !== '') continue;
      // МИНАЛ край и НЕпотвърдена · трупа се на ДНЕС и стои там, докато не се потвърди
      if (kray < dnes) {
        natrupani += 1;
        poDen.get(dnes)?.push({ id, ime, ot, do: doo, natrupana: true });
        continue;
      }
      for (const d of dni)
        if (nachalo <= d.den && kray >= d.den)
          poDen.get(d.den)?.push({ id, ime, ot, do: doo, natrupana: false });
    }
  }

  return {
    chovek,
    ime: imeNaReda(o, chovek.startsWith('stopan:') ? 'stopani' : 'sluzhiteli', chovek),
    dni: dni.map((d) => ({ ...d, dnes: d.den === dnes, zadachi: poDen.get(d.den) ?? [] })),
    natrupani,
    bezData,
  };
}

/** Задачите БЕЗ отговорник · оттук се раздават (негово, запис 195 т.7). */
export function zadachiBezOtgovornik(
  o: Ogledalo,
): readonly { readonly id: string; readonly ime: string }[] {
  const tv = o.tablitsi.get(ZADACHI);
  if (tv === undefined) return [];
  const spisak: { id: string; ime: string }[] = [];
  for (const i of zhiviteRedove(tv)) {
    if (tekstNaKletka(o, ZADACHI, i, 'otgovornik') !== '') continue;
    const ime = tekstNaKletka(o, ZADACHI, i, 'ime');
    const id = tv.id[i] ?? '';
    spisak.push({ id, ime: ime === '' ? id : ime });
  }
  return spisak;
}
