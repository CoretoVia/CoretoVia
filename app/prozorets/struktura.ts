/**
 * НАСТРОЙКИ · СТРУКТУРАТА · петте промени, дадени в ръцете му.
 *
 * ═══ ДВАТА ВЪПРОСА НА ПРАВИЛО 28, отговорени преди първия ред ═══
 *
 * **Коя таблица е това?** Таблица „Структура": по един ред на КОЛОНА,
 * групирана по таблица — същата форма като Номенклатурите отгоре (една голяма
 * таблица с подтаблици), защото едно и също нещо трябва да изглежда едно и
 * също (правило 29).
 *
 * **Коя формула я смята?** Аритметика няма. Редовете идват от `o.model` — тоест
 * от СГЪНАТИЯ Модел, онзи, който Журналът е направил. Броячът под всяка
 * подтаблица е: живи + затворени = всички.
 *
 * ═══ ПЕТТЕ ПЪТЯ ═══
 *
 *   · пише в празния последен ред + Enter          → НОВА КОЛОНА
 *   · поправя главата на ред + Enter               → ПРЕИМЕНУВАНА ГЛАВА
 *   · натиска „затвори" на ред                     → ЗАТВОРЕНА КОЛОНА
 *   · пише в реда „нова таблица" + Enter           → НОВА ТАБЛИЦА
 *   · натиска ▲ или ▼ на ред                       → СМЕНЕН РЕД НА КОЛОНИТЕ
 *
 * Без диалози, както при Номенклатурите: обратимо и видимо. `komandaId` се
 * ражда при отварянето на полето и се преизползва до успех (правило 5): двоен
 * Enter е един запис, не два.
 *
 * ═══ ЗАЩО ЗАТВАРЯНЕТО НЕ Е „ИЗТРИЙ ТЕКСТА" ═══
 *
 * При Номенклатурите изтритият текст спира стойността. Тук главата не може да
 * е празна — колона без глава е колона без име в Книгата. Затова затварянето е
 * СВОЙ бутон, и той казва какво прави: „никой не я пише занапред; старите
 * стойности остават и пак се смятат" (правило 18).
 */

import type { Kolona } from '../../src/model/kolona.js';
import type { Ogledalo } from '../../src/ogledalo/ogledalo.js';
import { VIDOVE_ZA_CHOVEK } from '../../src/model/struktura.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { h, sloji, type Zapechatan } from '../reshetka/shablon.js';
import { podskazkaSDumi } from '../reshetka/podskazka.js';
import { naEnterIEscape } from '../reshetka/redaktsiya.js';
import { zakachiZebrata } from '../reshetka/zebra.js';
import { chetiEkranno, zapomniEkranno } from '../reshetka/pamet-ekran.js';

/** Нашите думи на екрана · главите на голямата таблица. */
const GLAVI = ['Ключ', 'Глава', 'Вид', 'Номенклатура', 'Състояние', 'Ред'] as const;

/** Коя таблица се гледа · помни се на УСТРОЙСТВОТО, не в Журнала. */
const PAMET = 'struktura:tablitsa';

/** Полето, което трябва да получи фокуса след прерисуване. */
let fokusSled: string | null = null;

/** Думите на вида · машината ги знае на латиница, човекът — на български. */
const DUMITE_ZA_VIDA: Readonly<Record<string, string>> = Object.freeze({
  evro: 'пари',
  protsent: 'процент',
  chislo: 'число',
  tekst: 'текст',
  data: 'дата',
  izbor: 'избор',
  vrazka: 'връзка',
  nomeratsiya: 'номерация',
});

const vidatSDumi = (v: string): string => DUMITE_ZA_VIDA[v] ?? v;

/**
 * ЗАЩО КОЛОНАТА НЕ СЕ ПИПА · и това се КАЗВА, вместо бутонът да мълчи.
 *
 * Сивият бутон казва ЗАЩО е сив (правило 12). Тук причините са две и двете са
 * за адреса на реда, не за смятането му.
 */
function zashtoNeSePipa(o: Ogledalo, tablitsa: string, k: Kolona): string {
  const t = o.model.tablitsi.get(tablitsa);
  if (t === undefined) return '';
  if (t.roditel?.kolona === k.klyuch) return 'държи родителя на реда';
  if ((t.nomeratsiya?.segmenti ?? []).some((s) => 'kolona' in s && s.kolona === k.klyuch)) {
    return 'участва в номерацията';
  }
  return '';
}

/** Редът на една колона. */
function redNaKolonata(
  o: Ogledalo,
  tablitsa: string,
  k: Kolona,
  i: number,
  posledna: number,
): Zapechatan {
  const zashto = zashtoNeSePipa(o, tablitsa, k);
  const zatvorena = k.zatvorena === true;
  return h`<tr class="red${zatvorena ? ' spryana' : ''}" data-tablitsa="${tablitsa}" data-kolona="${k.klyuch}">
    <td class="kletka" translate="no">${k.klyuch}</td>
    <td class="kletka" data-glava tabindex="0" translate="no">${k.ime}</td>
    <td class="kletka">${vidatSDumi(k.vid)}</td>
    <td class="kletka" translate="no">${k.nomenklatura ?? ''}</td>
    <td class="kletka">${
      zatvorena
        ? h`затворена`
        : zashto !== ''
          ? h`<span class="siv"${podskazkaSDumi(`${zashto} — затворена, редът губи адреса си`)}>не се затваря · ${zashto}</span>`
          : h`<button type="button" class="malak" data-zatvori${podskazkaSDumi('Никой не я пише занапред. Старите ѝ стойности остават и пак се смятат.')}>затвори</button>`
    }</td>
    <td class="kletka">
      <button type="button" class="malak" data-gore ${i === 0 ? 'disabled' : ''}${podskazkaSDumi(i === 0 ? 'първата колона няма накъде нагоре' : 'мести колоната с едно място нагоре')}>▲</button>
      <button type="button" class="malak" data-dolu ${i === posledna ? 'disabled' : ''}${podskazkaSDumi(i === posledna ? 'последната колона няма накъде надолу' : 'мести колоната с едно място надолу')}>▼</button>
    </td>
  </tr>`;
}

/**
 * Рисува В ПОДАДЕН ВЪЗЕЛ, не в цялото тяло.
 *
 * Структурата живее ПОД Номенклатурите в същия прозорец, тъй че не може да
 * ползва `k.tyalo` — той е общият. Всеки селектор долу е спрямо `kade`.
 */
export function narisuvayStruktura(k: KonteksNaEkrana, kade: HTMLElement): void {
  const o = k.porta.ogledalo();
  const vsichki = [...o.model.tablitsi.values()];

  /*
   * ЕДНА ТАБЛИЦА НАВЕДНЪЖ · избрана от падащо меню.
   *
   * Първата версия рисуваше ВСЯКА колона на ВСЯКА таблица — двайсет таблици
   * по петнайсет колони, всяка с падащо меню на всички номенклатури. Екранът
   * стана дванайсет хиляди пиксела висок, а проходът изтичаше на трийсет
   * секунди. Стена от редове не е екран: човек я подминава, а машината се
   * задавя (същият довод като при пазача на историята — пет реда плюс
   * „и още N").
   *
   * Изборът се помни на устройството · екранна памет, не събитие.
   */
  const zapomneno = chetiEkranno(PAMET, vsichki[0]?.klyuch ?? '');
  const t = vsichki.find((x) => x.klyuch === zapomneno) ?? vsichki[0];
  if (t === undefined) return;

  const koloni = t.koloni;
  const redove: Zapechatan[] = koloni.map((kol, i) =>
    redNaKolonata(o, t.klyuch, kol, i, koloni.length - 1),
  );

  // празният ред · тук се ражда НОВА КОЛОНА
  redove.push(
    h`<tr class="nov" data-nova-kolona="${t.klyuch}">
      <td><input class="pole" data-nov-klyuch placeholder="ключ · латиница"></td>
      <td><input class="pole" data-nova-glava placeholder="глава · Enter"></td>
      <td><select class="pole" data-nov-vid>${VIDOVE_ZA_CHOVEK.map(
        (v) => h`<option value="${v}">${vidatSDumi(v)}</option>`,
      )}</select></td>
      <td><select class="pole" data-nova-nomenklatura>
        <option value="">—</option>
        ${[...o.model.nomenklaturi.values()].map(
          (n) => h`<option value="${n.klyuch}">${n.ime}</option>`,
        )}
      </select></td>
      <td class="kletka" colspan="2"></td>
    </tr>`,
  );

  const zhivi = koloni.filter((x) => x.zatvorena !== true).length;

  sloji(
    kade,
    h`
    <h2 class="lenta">Структура</h2>
    <p class="vest">Пиши в празния ред и натисни Enter — влиза нова колона. Поправи главата — ключът остава и нито един ред не мърда. „Затвори" спира писането, но старите стойности остават и пак се смятат (правило 18). ▲▼ мени реда на колоните.</p>
    <p class="greshka" data-greshka-struktura></p>
    <p><label>Таблица: <select class="pole" data-izbor-tablitsa>${vsichki.map(
      (x) =>
        h`<option value="${x.klyuch}" ${x.klyuch === t.klyuch ? 'selected' : ''}>${x.ime}</option>`,
    )}</select></label></p>
    <table class="reshetka struktura" data-reshetka="struktura">
      <thead><tr>${GLAVI.map((g) => h`<th>${g}</th>`)}</tr></thead>
      <tbody class="tablitsa">${redove}</tbody>
    </table>
    <p class="sverka" data-sverka="${t.klyuch}">живи ${zhivi} · затворени ${koloni.length - zhivi} · всички ${koloni.length}</p>
    <h3 class="lenta">Нова таблица</h3>
    <p class="vest">Таблицата влиза в СЪЩЕСТВУВАЩ прозорец. Прозорците са осем и не се добавят (К1).</p>
    <table class="reshetka struktura" data-reshetka="nova-tablitsa">
      <tbody class="tablitsa">
        <tr class="nov" data-nova-tablitsa>
          <td><input class="pole" data-nt-klyuch placeholder="ключ · латиница"></td>
          <td><input class="pole" data-nt-ime placeholder="име · Enter"></td>
          <td><select class="pole" data-nt-prozorets>${o.model.prozortsi.map(
            (pr) => h`<option value="${pr.klyuch}">${pr.list}</option>`,
          )}</select></td>
          <td><input class="pole" data-nt-sashtnost placeholder="вид на същността"></td>
        </tr>
      </tbody>
    </table>`,
  );
  zakachiZebrata(kade);
  zakachi(k, kade);
  varniFokusa(kade);
}

/** Едно изпълнение · думите на отказа отиват на екрана, не в конзолата. */
async function izpalni(
  k: KonteksNaEkrana,
  kade: HTMLElement,
  komandaId: string,
  klyuch: string,
  tovar: unknown,
  fokus: string | null,
): Promise<boolean> {
  fokusSled = fokus;
  const r = await k.porta.izpalni(komandaId, klyuch, tovar);
  if ('otkaz' in r) {
    fokusSled = null;
    kade.querySelector('[data-greshka-struktura]')!.textContent = r.zashto.join(' ');
    return false;
  }
  k.prerisuvay();
  return true;
}

function zakachi(k: KonteksNaEkrana, kade: HTMLElement): void {
  // ── КОЯ ТАБЛИЦА СЕ ГЛЕДА ───────────────────────────────────────────────
  const izbor = kade.querySelector<HTMLSelectElement>('[data-izbor-tablitsa]');
  izbor?.addEventListener('change', () => {
    zapomniEkranno(PAMET, izbor.value);
    k.prerisuvay();
  });

  // ── НОВА КОЛОНА ────────────────────────────────────────────────────────
  for (const tr of kade.querySelectorAll<HTMLElement>('tr[data-nova-kolona]')) {
    const tablitsa = tr.dataset['novaKolona'] ?? '';
    const klyuchPole = tr.querySelector<HTMLInputElement>('[data-nov-klyuch]')!;
    const glava = tr.querySelector<HTMLInputElement>('[data-nova-glava]')!;
    const vid = tr.querySelector<HTMLSelectElement>('[data-nov-vid]')!;
    const nom = tr.querySelector<HTMLSelectElement>('[data-nova-nomenklatura]')!;
    const komandaId = crypto.randomUUID();
    let vDvizhenie = false;

    const dobavi = async (): Promise<void> => {
      if (vDvizhenie) return;
      vDvizhenie = true;
      await izpalni(
        k,
        kade,
        komandaId,
        'nastroyki.novaKolona',
        {
          tablitsa,
          kolona: klyuchPole.value.trim(),
          ime: glava.value.trim(),
          vid: vid.value,
          nomenklatura: nom.value,
        },
        `nova:${tablitsa}`,
      );
      vDvizhenie = false;
    };

    for (const pole of [klyuchPole, glava]) {
      naEnterIEscape(
        pole,
        () => void dobavi(),
        () => {
          pole.value = '';
        },
      );
    }
  }

  // ── ПРЕИМЕНУВАНА ГЛАВА ─────────────────────────────────────────────────
  for (const td of kade.querySelectorAll<HTMLElement>('[data-glava]')) {
    td.addEventListener('dblclick', () => otvoriGlavata(k, kade, td));
    td.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        otvoriGlavata(k, kade, td);
      }
    });
  }

  // ── ЗАТВОРЕНА КОЛОНА ───────────────────────────────────────────────────
  for (const buton of kade.querySelectorAll<HTMLElement>('[data-zatvori]')) {
    const tr = buton.closest<HTMLElement>('tr')!;
    const komandaId = crypto.randomUUID();
    buton.addEventListener('click', () => {
      void izpalni(
        k,
        kade,
        komandaId,
        'nastroyki.zatvoriKolona',
        { tablitsa: tr.dataset['tablitsa'], kolona: tr.dataset['kolona'] },
        null,
      );
    });
  }

  // ── РЕДЪТ НА КОЛОНИТЕ ──────────────────────────────────────────────────
  for (const buton of kade.querySelectorAll<HTMLElement>('[data-gore], [data-dolu]')) {
    const tr = buton.closest<HTMLElement>('tr')!;
    const nagore = buton.hasAttribute('data-gore');
    const komandaId = crypto.randomUUID();
    buton.addEventListener('click', () => {
      const tablitsa = tr.dataset['tablitsa'] ?? '';
      const t = k.porta.ogledalo().model.tablitsi.get(tablitsa);
      if (t === undefined) return;
      const redut = t.koloni.map((x) => x.klyuch);
      const i = redut.indexOf(tr.dataset['kolona'] ?? '');
      const j = nagore ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= redut.length) return;
      [redut[i], redut[j]] = [redut[j]!, redut[i]!];
      void izpalni(k, kade, komandaId, 'nastroyki.podrediKoloni', { tablitsa, redut }, null);
    });
  }

  // ── НОВА ТАБЛИЦА ───────────────────────────────────────────────────────
  const nt = kade.querySelector<HTMLElement>('[data-nova-tablitsa]');
  if (nt !== null) {
    const klyuch = nt.querySelector<HTMLInputElement>('[data-nt-klyuch]')!;
    const ime = nt.querySelector<HTMLInputElement>('[data-nt-ime]')!;
    const prozorets = nt.querySelector<HTMLSelectElement>('[data-nt-prozorets]')!;
    const sasht = nt.querySelector<HTMLInputElement>('[data-nt-sashtnost]')!;
    const komandaId = crypto.randomUUID();
    let vDvizhenie = false;

    const sazday = async (): Promise<void> => {
      if (vDvizhenie) return;
      vDvizhenie = true;
      await izpalni(
        k,
        kade,
        komandaId,
        'nastroyki.novaTablitsa',
        {
          tablitsa: klyuch.value.trim(),
          ime: ime.value.trim(),
          prozorets: prozorets.value,
          sashtnost: sasht.value.trim(),
        },
        null,
      );
      vDvizhenie = false;
    };

    for (const pole of [klyuch, ime, sasht]) {
      naEnterIEscape(
        pole,
        () => void sazday(),
        () => {
          pole.value = '';
        },
      );
    }
  }
}

/** Отваря главата за поправка · Enter записва, Escape отказва. */
function otvoriGlavata(k: KonteksNaEkrana, kade: HTMLElement, td: HTMLElement): void {
  if (td.querySelector('input') !== null) return;
  const tr = td.closest<HTMLElement>('tr')!;
  const staro = td.textContent ?? '';
  const vhod = document.createElement('input');
  vhod.className = 'pole';
  vhod.value = staro;
  td.replaceChildren(vhod);
  vhod.focus();
  vhod.select();

  const komandaId = crypto.randomUUID();
  naEnterIEscape(
    vhod,
    () => {
      const novo = vhod.value.trim();
      if (novo === staro || novo === '') {
        td.textContent = staro;
        return;
      }
      void izpalni(
        k,
        kade,
        komandaId,
        'nastroyki.preimenuvayGlava',
        { tablitsa: tr.dataset['tablitsa'], kolona: tr.dataset['kolona'], ime: novo },
        null,
      );
    },
    () => {
      td.textContent = staro;
    },
  );
}

/** Фокусът се връща там, откъдето е тръгнал · инак всеки запис го гони. */
function varniFokusa(kade: HTMLElement): void {
  if (fokusSled === null) return;
  const [vid, klyuch] = fokusSled.split(':');
  fokusSled = null;
  if (vid !== 'nova') return;
  kade.querySelector<HTMLElement>(`tr[data-nova-kolona="${klyuch}"] [data-nov-klyuch]`)?.focus();
}
