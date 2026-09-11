/**
 * ФИЛТЪРЪТ, СБОРЪТ И ОТМЕТКАТА „брой" · един дом за всяка решетка.
 *
 * Негово, 08.09 (запис 64⑨): „**най-долният ред дава сумите… отгоре е
 * филтърът**"; 11.09 (запис 148): „**В имената на колоните да има модерни
 * филтри.**"; (запис 147): „**Да има общ сбор в колоните най отдолу.**"; и
 * (запис 163) отметката, която ИЗКЛЮЧВА реда от сметката.
 *
 * Дотук всичко това го имаше САМО в дървото на Управление, вградено в неговия
 * облик с групи и подглави. Имоти и Продажби нямаха нито филтър, нито сбор —
 * при това помощта на прозореца Имоти ОБЕЩАВА „сборове под площ и цена върху
 * видимите редове". Обещание без ред е дефект.
 *
 * ═══ ПОГЛЕД, НЕ ДАННИ ═══
 *
 * Тук не се пише НИЩО в Журнала. Филтърът, отметката и изборът на сметка са
 * поглед: местят се в паметта на браузъра, не през Вратата. Затова и работят
 * върху вече нарисуваната таблица, вместо да я прерисуват — числата се менят
 * пред очите на човека, без да мига екранът.
 *
 * Числото се чете от клетката, не се смята наново: паричната клетка носи
 * `data-st` (цели центове, правило 3), а числовата — `data-surovo`. Така
 * сборът тук и сборът в сметача не могат да се разминат.
 */

import type { Kolona } from '../../src/model/kolona.js';
import { pishi } from '../../src/yadro/pari.js';
import { podskazka } from './podskazka.js';
import { pomosht } from '../../src/model/pomosht.js';
import { h, type Zapechatan } from './shablon.js';

const POMOSHT_NA_FILTARA = pomosht(
  'Търсенето стеснява таблицата, без да пипа нито един запис · сборовете отдолу веднага се смятат върху онова, което е останало на екрана.',
  'пише се част от думата · празно поле не филтрира нищо',
);

const POMOSHT_NA_OTMETKATA = pomosht(
  'Редът остава на екрана, но излиза от сметката · за да се види какво става без него, без да се трие каквото и да било.',
  'махната отметка · редът не влиза в сбора отдолу',
);

/** Видовете колони, които се събират · същите, които получават клетка отдолу. */
const VIDOVE_SAS_SBOR = ['evro', 'chislo', 'protsent'] as const;

/** Числова ли е колоната · само те получават сбор. */
function chislova(k: Kolona): boolean {
  return VIDOVE_SAS_SBOR.some((v) => v === k.vid);
}

/** Редът с филтрите · по едно поле на колона, точно под главите. */
export function redSFiltriHTML(koloni: readonly Kolona[]): Zapechatan {
  return h`<tr class="filtar">
      <th class="broy-kolona"></th>
      ${koloni.map(
        (k) =>
          h`<th data-filtar-glava="${k.klyuch}"><input class="pole malak" data-filtar-kolona="${k.klyuch}" placeholder="филтър" aria-label="${`филтър по „${k.ime}"`}"${podskazka(POMOSHT_NA_FILTARA)}></th>`,
      )}
    </tr>`;
}

/** Главата с отметката „брой" отпред · тя пази ширината на реда с филтрите. */
export function glavaSOtmetkaHTML(koloni: readonly Kolona[]): Zapechatan {
  return h`<tr>
      <th class="broy-kolona"${podskazka(POMOSHT_NA_OTMETKATA)}>брой</th>
      ${koloni.map(
        (k) =>
          h`<th data-kolona="${k.klyuch}" class="${k.vid}"${podskazka(k.pomosht)}>${k.ime}</th>`,
      )}
    </tr>`;
}

/** Клетката с отметката · стои първа на всеки ред. */
export function kletkaSOtmetkaHTML(id: string): Zapechatan {
  return h`<td class="broy-kolona"><input type="checkbox" data-broy="${id}" checked aria-label="брой този ред в сбора"></td>`;
}

/** Долният ред · сбор под всяка числова колона и брояч на видимите. */
export function redSSboroveHTML(koloni: readonly Kolona[]): Zapechatan {
  return h`<tfoot><tr class="sbor">
      <td class="broy-kolona" data-vidimi></td>
      ${koloni.map((k) =>
        chislova(k)
          ? h`<td class="${k.vid}" data-sbor-kolona="${k.klyuch}" translate="no"></td>`
          : h`<td data-sbor-kolona="${k.klyuch}"></td>`,
      )}
    </tr></tfoot>`;
}

/**
 * ЧИСЛОТО НА ЕДНА КЛЕТКА · парите ТОЧНО, останалото както се ЧЕТЕ.
 *
 * Паричната клетка носи `data-st` — цели центове; те се събират без нито едно
 * закръгляне (правило 3). Всяка друга числова клетка се чете от ЕКРАНА, защото
 * суровата ѝ стойност е във вътрешна мярка: площта се пази в цели квадратни
 * сантиметри, а човекът вижда квадратни метри. Сбор върху суровото би показал
 * „42 400 000" под колона, в която пише „1 200".
 */
function chislotoNa(td: HTMLElement): number | null {
  const st = td.dataset['st'];
  if (st !== undefined) {
    const n = Number(st);
    return Number.isFinite(n) ? n : null;
  }
  const vidyano = (td.textContent ?? '')
    .replace(/[\s\u00a0]/gu, '')
    .replace(/[^\d,.-]/gu, '')
    .replace(',', '.');
  if (vidyano === '' || vidyano === '-') return null;
  const n = Number(vidyano);
  return Number.isFinite(n) ? n : null;
}

/** Нецелите числа се пишат като на екрана · с българска запетая. */
function kakvoPishe(n: number): string {
  const tsyalo = Number.isInteger(n);
  return (tsyalo ? n.toString() : n.toFixed(2)).replace('.', ',');
}

/** Думите под таблицата · колко се виждат от колко (обход, който КАЗВА). */
function opishiVidimite(vidimi: number, vsichki: number, broeni: number): string {
  if (vidimi === vsichki && broeni === vsichki) return `${vsichki}`;
  const broi = broeni === vidimi ? '' : ` · броени ${broeni}`;
  return `${vidimi} от ${vsichki}${broi}`;
}

/**
 * Смята наново филтъра, сборовете и брояча на ЕДНА таблица.
 *
 * Редовете-групи (`tr.grupata`) и черновата не се филтрират и не се броят: те
 * не са данни, а заглавия и вход.
 */
function presmetni(tabl: HTMLTableElement): void {
  const filtri = [...tabl.querySelectorAll<HTMLInputElement>('[data-filtar-kolona]')]
    .map((p) => ({
      kolona: p.dataset['filtarKolona'] ?? '',
      dumi: p.value.trim().toLocaleLowerCase('bg'),
    }))
    .filter((x) => x.dumi !== '');
  const redove = [...tabl.querySelectorAll<HTMLTableRowElement>('tbody tr.red')];
  let vidimi = 0;
  let broeni = 0;
  const sborove = new Map<string, number>();

  for (const tr of redove) {
    const minava = filtri.every((f) => {
      const td = tr.querySelector<HTMLElement>(`[data-kolona="${f.kolona}"]`);
      return (td?.textContent ?? '').toLocaleLowerCase('bg').includes(f.dumi);
    });
    tr.hidden = !minava;
    if (!minava) continue;
    vidimi += 1;
    const otmetka = tr.querySelector<HTMLInputElement>('[data-broy]');
    const broi = otmetka === null || otmetka.checked;
    tr.classList.toggle('ne-broi', !broi);
    if (!broi) continue;
    broeni += 1;
    for (const td of tr.querySelectorAll<HTMLElement>('td[data-kolona]')) {
      const klyuch = td.dataset['kolona'] ?? '';
      if ((td.dataset['surovo'] ?? '') === '') continue;
      // САМО числовите колони се събират · класът на клетката казва вида ѝ.
      // Без тази проверка адресът „ул. Пробна 1" се четеше като „.1" и под
      // колоната се появяваше сбор 0,60 — число, което не значи нищо.
      if (!VIDOVE_SAS_SBOR.some((v) => td.classList.contains(v))) continue;
      const chislo = chislotoNa(td);
      if (chislo === null) continue;
      sborove.set(klyuch, (sborove.get(klyuch) ?? 0) + chislo);
    }
  }

  for (const td of tabl.querySelectorAll<HTMLElement>('tfoot [data-sbor-kolona]')) {
    const klyuch = td.dataset['sborKolona'] ?? '';
    const sbor = sborove.get(klyuch);
    if (sbor === undefined) {
      td.textContent = '';
      continue;
    }
    // паричната колона се познава по `data-st` на клетките ѝ
    const parichna = tabl.querySelector(`tbody td[data-kolona="${klyuch}"][data-st]`) !== null;
    td.textContent = parichna ? pishi(sbor) : kakvoPishe(sbor);
  }
  const broyach = tabl.querySelector<HTMLElement>('[data-vidimi]');
  if (broyach !== null) broyach.textContent = opishiVidimite(vidimi, redove.length, broeni);
}

/**
 * Закача филтъра, сборовете и отметките върху всяка решетка в тялото.
 *
 * Слушателят е ЕДИН, върху корена: тялото се сменя при всяко рисуване, а
 * елементът, който държиш в ръка, изчезва с него (урокът от разписката на
 * мострата).
 */
export function zakachiFiltarISbor(koren: HTMLElement): void {
  for (const tabl of koren.querySelectorAll<HTMLTableElement>('table.reshetka.redove'))
    presmetni(tabl);

  const otzovi = (e: Event): void => {
    const cel = e.target;
    if (!(cel instanceof HTMLElement)) return;
    if (cel.dataset['filtarKolona'] === undefined && cel.dataset['broy'] === undefined) return;
    const tabl = cel.closest('table.reshetka.redove');
    if (tabl instanceof HTMLTableElement) presmetni(tabl);
  };
  koren.addEventListener('input', otzovi);
  koren.addEventListener('change', otzovi);
}
