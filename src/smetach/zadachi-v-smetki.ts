/**
 * ЗАДАЧИТЕ С БЮДЖЕТ ВЛИЗАТ В СМЕТКИ · и само те.
 *
 * Негово, 11.09 (запис 163), ДОСЛОВНО: „**Скриването на Задачите с Бюджет(само
 * те се пренасят от Управление в Сметки, това е важно) от Управление в Сметки
 * ще ги изключва от изчисленията**, а в Упраление и да скриеш Сметките не се
 * променят там." И (запис 145): „**Бюджет без дата не се приема и дава сигнал с
 * цвят на полето**."
 *
 * Оттук три правила, всяко проверимо:
 *
 *   1. Пренася се САМО задача, която има бюджет. Задача без бюджет не е пари и
 *      няма работа в Сметки.
 *   2. Бюджетът стои в календара на ДАТАТА на задачата — началото ѝ, а при
 *      липсващо начало краят. Бюджет без нито една дата НЕ влиза и се ВРЪЩА
 *      като находка, вместо да падне в „днес" и да размаже сметката.
 *   3. Знакът е негов: бюджетът е РАЗХОД, планиран за харчене, затова влиза с
 *      минус (правило 16 · знакът се смята, не се записва).
 */

import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { redKato, zhiviteRedove } from '../ogledalo/tablitsa.js';

const TABLITSA = 'zadachi';

export interface ZadachaSByudzhet {
  readonly id: string;
  readonly ime: string;
  /** цели центове · ЗАПИСАНИЯТ бюджет, без знак */
  readonly byudzhet_st: number;
  /** `YYYY-MM-DD` · началото, а при липса — краят */
  readonly data: string;
}

export interface ZadachiteVSmetki {
  readonly redove: readonly ZadachaSByudzhet[];
  /** задачи с бюджет, но без нито една дата · думите за екрана (запис 145) */
  readonly bezData: readonly string[];
  /** колко задачи изобщо са гледани · обход, който не го казва, е сляп */
  readonly ogledani: number;
}

function tekstNa(o: Ogledalo, i: number, kolona: string): string {
  const tv = o.tablitsi.get(TABLITSA);
  if (tv === undefined) return '';
  const k = redKato(tv, i).kletki[kolona] ?? null;
  return k !== null && 'tekst' in k ? k.tekst : '';
}

export function zadachiteSByudzhet(o: Ogledalo): ZadachiteVSmetki {
  const tv = o.tablitsi.get(TABLITSA);
  if (tv === undefined) return { redove: [], bezData: [], ogledani: 0 };

  const redove: ZadachaSByudzhet[] = [];
  const bezData: string[] = [];
  let ogledani = 0;

  for (const i of zhiviteRedove(tv)) {
    ogledani += 1;
    const r = redKato(tv, i);
    const b = r.kletki['byudzhet'] ?? null;
    if (b === null || !('stoynost_st' in b) || b.stoynost_st === 0) continue;
    const ime = tekstNa(o, i, 'ime');
    const ot = tekstNa(o, i, 'ot');
    const doo = tekstNa(o, i, 'do');
    const data = ot !== '' ? ot : doo;
    if (data === '') {
      bezData.push(ime === '' ? r.id : ime);
      continue;
    }
    redove.push({ id: r.id, ime, byudzhet_st: b.stoynost_st, data });
  }

  return { redove, bezData, ogledani };
}
