/**
 * ПОДРЕДБАТА, СБОРЪТ И ОТМЕТКАТА „брой" · един дом за всяка решетка.
 *
 * Негово, 11.09 (запис 192), ДОСЛОВНО: „**Филтър значи да ги сортираш бе
 * профан. Сортираш по име по цифри.**" Дотук на това място стоеше търсене по
 * текст — това НЕ е било искането. Неговият „филтър" в главата на колоната е
 * ПОДРЕДБА: натискаш главата и редовете се подреждат по нея.
 *
 * И от 08.09 (запис 64⑨): „**най-долният ред дава сумите**"; (запис 64б): „**и
 * за подредба най-отгоре**"; (запис 163): отметката, която ИЗКЛЮЧВА реда от
 * сметката.
 *
 * ═══ ТРИ ГРАНИЦИ ═══
 *
 *   1. **Поглед, не данни.** Нищо не влиза в Журнала. Подредбата и отметката
 *      местят вече нарисуваната таблица — числата се менят пред очите на
 *      човека, без екранът да мига.
 *   2. **Групите не се разбъркват.** В Имоти редовете стоят под своя Имот и
 *      категория; подредбата работи ВЪТРЕ в групата, защото номерацията му е
 *      дърво, а не списък.
 *   3. **Числото идва от клетката, не се смята наново.** Паричната носи
 *      `data-st` (цели центове, правило 3), числовата се чете както се вижда,
 *      защото суровата ѝ стойност е във вътрешна мярка (площта е в квадратни
 *      сантиметри).
 */

import type { Kolona } from '../../src/model/kolona.js';
import { pomosht } from '../../src/model/pomosht.js';
import { pishi } from '../../src/yadro/pari.js';
import { prilozhiKolonite, skriyKolona } from './kolonite.js';
import { pokazhiMenyu, type Tochka } from './menyu.js';
import { podskazka } from './podskazka.js';
import { h, type Zapechatan } from './shablon.js';

/** Видовете колони, които се събират · същите, които получават клетка отдолу. */
const VIDOVE_SAS_SBOR = ['evro', 'chislo', 'protsent'] as const;

/** Трите състояния на една глава · третото натискане връща реда на Книгата. */
type Posoka = 'nagore' | 'nadolu' | 'kakto-e';

const ZNAK: Readonly<Record<Posoka, string>> = Object.freeze({
  nagore: '▲',
  nadolu: '▼',
  'kakto-e': '',
});

const POMOSHT_NA_GLAVATA = pomosht(
  'Главата е контролата на колоната · натискаш я и избираш: подредба нагоре или надолу, обратно както е в Книгата, или скриване на колоната. Десният ѝ ръб се влачи и мести ширината, както в Ексел.',
  'подредба · скриване · ширина с влачене',
);

const POMOSHT_NA_OTMETKATA = pomosht(
  'Редът остава на екрана, но излиза от сметката · за да се види какво става без него, без да се трие каквото и да било.',
  'махната отметка · редът не влиза в сбора отдолу',
);

function chislova(k: Kolona): boolean {
  return VIDOVE_SAS_SBOR.some((v) => v === k.vid);
}

/** Главата · всяка колона се натиска и подрежда; отметката „брой" стои първа. */
export function glavaSPodredbaHTML(koloni: readonly Kolona[]): Zapechatan {
  return h`<tr>
      <th class="broy-kolona"${podskazka(POMOSHT_NA_OTMETKATA)}>брой</th>
      ${koloni.map(
        (k) =>
          h`<th data-kolona="${k.klyuch}" class="${k.vid}"${podskazka(k.pomosht)}><button type="button" class="glava-podredba" data-glava="${k.klyuch}"${podskazka(POMOSHT_NA_GLAVATA)}>${k.ime}<span class="strelka" data-strelka="${k.klyuch}"></span></button><span class="drazhka" data-shirina="${k.klyuch}" aria-hidden="true"></span></th>`,
      )}
    </tr>`;
}

/** Клетката с отметката · стои първа на всеки ред. */
export function kletkaSOtmetkaHTML(id: string): Zapechatan {
  return h`<td class="broy-kolona"><input type="checkbox" data-broy="${id}" checked aria-label="брой този ред в сбора"></td>`;
}

/** Долният ред · сбор под всяка числова колона и брояч на броените. */
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
 * Сбор върху суровото би показал „42 400 000" под колона, в която пише „1 200":
 * площта се пази в цели квадратни сантиметри.
 */
function chislotoNa(td: HTMLElement): number | null {
  const st = td.dataset['st'];
  if (st !== undefined) {
    const n = Number(st);
    return Number.isFinite(n) ? n : null;
  }
  const vidyano = (td.textContent ?? '')
    .replace(/[\s ]/gu, '')
    .replace(/[^\d,.-]/gu, '')
    .replace(',', '.');
  if (vidyano === '' || vidyano === '-') return null;
  const n = Number(vidyano);
  return Number.isFinite(n) ? n : null;
}

/** Нецелите числа се пишат като на екрана · с българска запетая. */
function kakvoPishe(n: number): string {
  return (Number.isInteger(n) ? n.toString() : n.toFixed(2)).replace('.', ',');
}

/** Думите на брояча · колко се броят от колко. */
function opishiBroenite(broeni: number, vsichki: number): string {
  return broeni === vsichki ? `${vsichki}` : `${broeni} от ${vsichki}`;
}

/** Числова ли е колоната НА ЕКРАНА · по класа на клетките ѝ. */
function chislovaNaEkrana(tabl: HTMLTableElement, klyuch: string): boolean {
  const td = tabl.querySelector<HTMLElement>(`tbody td[data-kolona="${klyuch}"]`);
  return td !== null && VIDOVE_SAS_SBOR.some((v) => td.classList.contains(v));
}

/** Сборовете и броячът · винаги върху ОТМЕТНАТИТЕ редове. */
function presmetniSborovete(tabl: HTMLTableElement): void {
  const redove = [...tabl.querySelectorAll<HTMLTableRowElement>('tbody tr.red')];
  const sborove = new Map<string, number>();
  let broeni = 0;

  for (const tr of redove) {
    const otmetka = tr.querySelector<HTMLInputElement>('[data-broy]');
    const broi = otmetka === null || otmetka.checked;
    tr.classList.toggle('ne-broi', !broi);
    if (!broi) continue;
    broeni += 1;
    for (const td of tr.querySelectorAll<HTMLElement>('td[data-kolona]')) {
      const klyuch = td.dataset['kolona'] ?? '';
      if ((td.dataset['surovo'] ?? '') === '') continue;
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
    const parichna = tabl.querySelector(`tbody td[data-kolona="${klyuch}"][data-st]`) !== null;
    td.textContent = parichna ? pishi(sbor) : kakvoPishe(sbor);
  }
  const broyach = tabl.querySelector<HTMLElement>('[data-vidimi]');
  if (broyach !== null) broyach.textContent = opishiBroenite(broeni, redove.length);
}

/** Запомня първоначалния ред · за да може третото натискане да го върне. */
function zapomniReda(tabl: HTMLTableElement): void {
  const tyalo = tabl.tBodies[0];
  if (tyalo === undefined) return;
  [...tyalo.rows].forEach((tr, i) => {
    if (tr.dataset['iznachalno'] === undefined) tr.dataset['iznachalno'] = String(i);
  });
}

/**
 * ПОДРЕЖДА една таблица по колона · вътре в групите си.
 *
 * Групиращият ред (`tr.grupata`) е ЗАГЛАВИЕ, не данни: той стои на мястото си, а
 * редовете под него се подреждат помежду си. Инак номерацията на Имота се къса
 * и екранът показва дърво, което не е дърво.
 */
function podredi(tabl: HTMLTableElement, klyuch: string, posoka: Posoka): void {
  const tyalo = tabl.tBodies[0];
  if (tyalo === undefined) return;
  zapomniReda(tabl);
  const chislova = chislovaNaEkrana(tabl, klyuch);
  const sravni = new Intl.Collator('bg', { numeric: true, sensitivity: 'base' });

  const klyuchNa = (tr: HTMLTableRowElement): { chislo: number | null; dumi: string } => {
    const td = tr.querySelector<HTMLElement>(`td[data-kolona="${klyuch}"]`);
    if (td === null) return { chislo: null, dumi: '' };
    return { chislo: chislova ? chislotoNa(td) : null, dumi: (td.textContent ?? '').trim() };
  };

  // редовете се цепят на групи: заглавието и онова, което върви под него
  const grupi: { readonly zaglavie: HTMLTableRowElement | null; redove: HTMLTableRowElement[] }[] =
    [];
  let sega: { zaglavie: HTMLTableRowElement | null; redove: HTMLTableRowElement[] } = {
    zaglavie: null,
    redove: [],
  };
  grupi.push(sega);
  for (const tr of [...tyalo.rows]) {
    if (tr.classList.contains('grupata')) {
      sega = { zaglavie: tr, redove: [] };
      grupi.push(sega);
      continue;
    }
    if (tr.classList.contains('red')) sega.redove.push(tr);
  }

  for (const g of grupi) {
    g.redove.sort((a, b) => {
      if (posoka === 'kakto-e')
        return Number(a.dataset['iznachalno'] ?? 0) - Number(b.dataset['iznachalno'] ?? 0);
      const ka = klyuchNa(a);
      const kb = klyuchNa(b);
      let r: number;
      if (chislova) {
        const na = ka.chislo;
        const nb = kb.chislo;
        // празната клетка стои НАКРАЯ и в двете посоки · инак нулите изместват данните
        if (na === null && nb === null) r = 0;
        else if (na === null) r = 1;
        else if (nb === null) r = -1;
        else r = na - nb;
      } else {
        if (ka.dumi === '' && kb.dumi === '') r = 0;
        else if (ka.dumi === '') r = 1;
        else if (kb.dumi === '') r = -1;
        else r = sravni.compare(ka.dumi, kb.dumi);
      }
      return posoka === 'nadolu' ? -r : r;
    });
  }

  for (const g of grupi) {
    if (g.zaglavie !== null) tyalo.append(g.zaglavie);
    for (const tr of g.redove) tyalo.append(tr);
  }

  for (const s of tabl.querySelectorAll<HTMLElement>('[data-strelka]')) {
    s.textContent = s.dataset['strelka'] === klyuch ? ZNAK[posoka] : '';
  }
}

/**
 * Закача подредбата, сборовете и отметките върху всяка решетка с редове.
 *
 * Слушателят е ЕДИН, върху корена: тялото се сменя при всяко рисуване, а
 * елементът, който държиш в ръка, изчезва с него.
 */
export function zakachiPodredbaISbor(koren: HTMLElement): void {
  for (const tabl of koren.querySelectorAll<HTMLTableElement>('table.reshetka.redove')) {
    zapomniReda(tabl);
    presmetniSborovete(tabl);
  }

  koren.addEventListener('click', (e) => {
    const cel = e.target;
    if (!(cel instanceof HTMLElement)) return;
    const buton = cel.closest<HTMLElement>('[data-glava]');
    if (buton === null) return;
    const tabl = buton.closest('table.reshetka.redove');
    if (!(tabl instanceof HTMLTableElement)) return;
    const klyuch = buton.dataset['glava'] ?? '';
    const tablitsa = tabl.dataset['reshetka'] ?? '';
    const ime = (buton.textContent ?? '').trim();
    const r = buton.getBoundingClientRect();

    const tochka = (
      klyuchNaTochkata: string,
      imeNaTochkata: string,
      deystvie: () => void,
    ): Tochka => ({
      klyuch: klyuchNaTochkata,
      ime: imeNaTochkata,
      razreshena: true,
      zashto: '',
      deystvie,
    });

    const podrediI = (posoka: Posoka): void => {
      tabl.dataset['podredenoPo'] = posoka === 'kakto-e' ? '' : klyuch;
      tabl.dataset['posoka'] = posoka;
      podredi(tabl, klyuch, posoka);
    };

    pokazhiMenyu(r.left, r.bottom, [
      tochka('nagore', `Подреди по „${ime}" нагоре`, () => podrediI('nagore')),
      tochka('nadolu', `Подреди по „${ime}" надолу`, () => podrediI('nadolu')),
      tochka('kakto-e', 'Както е в Книгата', () => podrediI('kakto-e')),
      tochka('skriy', `Скрий колоната „${ime}"`, () => {
        skriyKolona(tablitsa, klyuch);
        prilozhiKolonite(koren);
      }),
    ]);
  });

  koren.addEventListener('change', (e) => {
    const cel = e.target;
    if (!(cel instanceof HTMLElement) || cel.dataset['broy'] === undefined) return;
    const tabl = cel.closest('table.reshetka.redove');
    if (tabl instanceof HTMLTableElement) presmetniSborovete(tabl);
  });
}
