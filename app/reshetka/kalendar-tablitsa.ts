/**
 * КАЛЕНДАРЪТ НА СМЕТКИ · таблица с цифри, не картина (правило 28).
 *
 * Негово, 08.09 (запис 64в) и 11.09 (записи 145 · 147 · 149): цифрата стои В
 * клетката, със знака си; под колоните има общ сбор; при период — сбор на реда.
 * Дотук на това място стоеше SVG с ленти: красиво, но човек не може да прочете
 * число от него, нито да го сравни с Книгата си.
 *
 * Редовете са СЕКЦИИТЕ (Наеми, Фактури, Заплати…), както са в Книгата му, а не
 * отделните движения: неговият календар събира по секция и месец.
 */

import type { Kalendar } from '../../src/smetach/kalendar.js';
import { pishi } from '../../src/yadro/pari.js';
import { podskazka, podskazkaSDumi } from './podskazka.js';
import { pomosht } from '../../src/model/pomosht.js';
import { h, type Zapechatan } from './shablon.js';

const POMOSHT_NA_PERIODA = pomosht(
  'Сборът на реда за целия показан период · когато се сменя тактът или периодът, числото се смята наново от клетките вдясно.',
  'сборът на клетките по реда',
);

const POMOSHT_NA_SBORA = pomosht(
  'Сборът на колоната по всички секции · долният ред на календара; двата пътя до ъгъла — по редове и по колони — се сверяват и разликата се казва.',
  'сборът на клетките в колоната',
);

/** Числото със знака си · плюс се ПИШЕ, защото той го поиска (запис 145). */
function sasZnak(st: number): string {
  if (st === 0) return '';
  return st > 0 ? `+${pishi(st)}` : pishi(st);
}

function klas(st: number): string {
  if (st === 0) return 'nula';
  return st > 0 ? 'prihod' : 'razhod';
}

export function kalendarHTML(k: Kalendar): Zapechatan {
  return h`<table class="reshetka kalendar" data-kalendar>
      <thead>
        <tr>
          <th class="ime">секция</th>
          <th class="evro"${podskazka(POMOSHT_NA_PERIODA)}>Период</th>
          ${k.koloni.map(
            (kol) =>
              h`<th class="evro takt${kol.dnes ? ' dnes' : ''}"${podskazkaSDumi(kol.opis)}>${kol.nadpis}</th>`,
          )}
        </tr>
      </thead>
      <tbody class="tablitsa">
        ${k.redove.map(
          (r) => h`<tr class="red" data-kalendar-red="${r.id}">
            <th class="ime" scope="row">${r.ime}</th>
            <td class="evro period ${klas(r.period)}" translate="no">${sasZnak(r.period)}</td>
            ${r.kletki.map(
              (c, i) =>
                h`<td class="evro ${klas(c.sbor)}${k.koloni[i]?.dnes === true ? ' dnes' : ''}" data-takt="${String(i)}" translate="no">${c.obhvat === 0 ? '' : sasZnak(c.sbor)}</td>`,
            )}
          </tr>`,
        )}
      </tbody>
      <tfoot>
        <tr class="sbor">
          <td class="ime"${podskazka(POMOSHT_NA_SBORA)}>Общо</td>
          <td class="evro period ${klas(k.vsichko)}" data-kalendar-vsichko translate="no">${sasZnak(k.vsichko)}</td>
          ${k.podKolonite.map(
            (s, i) =>
              h`<td class="evro ${klas(s)}" data-kalendar-sbor="${String(i)}" translate="no">${sasZnak(s)}</td>`,
          )}
        </tr>
      </tfoot>
    </table>
    <p class="pod-tablitsata" data-sverka="kalendar">редове ${String(k.redove.length)} · колони ${String(k.koloni.length)} · сверката ${k.razlika === 0 ? 'затваря' : `не затваря (${pishi(k.razlika)})`}</p>`;
}
