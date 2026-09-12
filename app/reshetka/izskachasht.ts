/**
 * ИЗСКАЧАЩИЯТ ПРОЗОРЕЦ ЗА СЪЗДАВАНЕ · Имот · Обект · Задача · Среща.
 *
 * Негово, 11.09 (запис 195), точка 11, ДОСЛОВНО: „**Създаването на Имот, Обект,
 * Задачи, Срещи да става в искачащ прозорец когато редактираш ред на наем или
 * продажба.**" И по-рано, 08.09 (запис 21): „**да се отварят прозорците… като
 * прозорец върху екрана както в Клод**".
 *
 * ЗАЩО ТОЧНО ТУК: черновата в реда работи, докато си В таблицата на нещото. Но
 * когато пишеш ред на продажба и ти трябва Обект, който още го няма, редът в
 * чужда таблица не помага — трябва да излезеш, да създадеш, да се върнеш и да
 * започнеш отначало. Изскачащият прозорец създава на място и връща човека там,
 * където е бил.
 *
 * БЕЗ НИТО ЕДНА БИБЛИОТЕКА (правило 9): `<dialog>` на браузъра носи готово
 * всичко, за което иначе се внася пакет — затъмнението отзад, капана на фокуса,
 * затварянето с Escape и връщането на фокуса там, откъдето е дошъл.
 *
 * ПОЛЕТАТА СА СЪЩИТЕ като на черновата (`poleZaKolona` · `kletkaOtPoleto`) — не
 * втори строител на полета, който да се разминава с първия при първата промяна
 * на някой вид колона.
 */

import type { Kletka, Kletki } from '../../src/model/kletka.js';
import type { Kolona } from '../../src/model/kolona.js';
import { tablitsata } from '../../src/model/model.js';
import { MODEL } from '../../src/model/osnova.js';
import { slotNaKolonata } from '../../src/model/kolona.js';
import { tekstNaPomoshtta } from '../../src/model/pomosht.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { otgovoratNaPortata } from '../prozorets/deystviya.js';
import { dumiZaGreshka } from '../../src/yadro/dumi.js';
import { stepenNaPomoshtta } from './podskazka.js';
import { kletkaOtPoleto, poleZaKolona } from './redaktsiya.js';
import { h, sloji } from './shablon.js';

export interface OpisNaSazdavaneto {
  /** таблицата на Модела, в която се създава редът */
  readonly tablitsa: string;
  /** командата на Портата */
  readonly komanda: string;
  /** какво пише на шапката · негова дума, където я има */
  readonly zaglavie: string;
  /** клетки, дадени отвън · не се показват като полета, но влизат в товара */
  readonly dadeni?: Readonly<Record<string, Kletka | null>>;
}

/** Отваря прозореца · затваря се сам след успешен запис. */
export function otvoriIzskachasht(k: KonteksNaEkrana, opis: OpisNaSazdavaneto): void {
  document.querySelector('dialog[data-izskachasht]')?.remove();
  const o = k.porta.ogledalo();
  const t = tablitsata(MODEL, opis.tablitsa);
  const dadeni = opis.dadeni ?? {};
  const komandaId = crypto.randomUUID();

  const prozorets = document.createElement('dialog');
  prozorets.className = 'izskachasht';
  prozorets.dataset['izskachasht'] = opis.tablitsa;
  sloji(
    prozorets,
    h`<form method="dialog" class="izskachasht-forma">
      <h2 class="lenta">${opis.zaglavie}</h2>
      <p class="greshka" data-izskachasht-greshka></p>
      <div class="poleta" data-izskachasht-poleta></div>
      <div class="deystviya butoni-malki">
        <button type="button" class="malak" data-izskachasht-sazday>Създай</button>
        <button type="button" class="malak vtorichen" data-izskachasht-otkazhi>Откажи</button>
      </div>
    </form>`,
  );

  const gnezdo = prozorets.querySelector<HTMLElement>('[data-izskachasht-poleta]')!;
  const poleta = new Map<string, HTMLInputElement | HTMLSelectElement>();
  const tekushti: Record<string, Kletka> = {};
  for (const kol of t.koloni) {
    if (slotNaKolonata(kol) === undefined || kol.klyuch in dadeni) continue;
    const red = document.createElement('label');
    red.className = 'pole-red';
    const ime = document.createElement('span');
    ime.className = 'ime';
    ime.textContent = kol.ime;
    const pole = poleZaKolona(o, kol, null, tekushti);
    // СВОЙ клас, не общият `.pole`: правилата за решетката са дълбоки и всяко
    // правило тук би тръгнало да ги надбягва по специфичност (biome го брои).
    pole.classList.add('pole-v-prozoretsa');
    pole.dataset['podskazka'] = tekstNaPomoshtta(kol.pomosht, stepenNaPomoshtta());
    red.append(ime, pole);
    gnezdo.append(red);
    poleta.set(kol.klyuch, pole);
  }

  const kazhi = (dumi: string): void => {
    const myasto = prozorets.querySelector<HTMLElement>('[data-izskachasht-greshka]');
    if (myasto !== null) myasto.textContent = dumi;
  };

  let vDvizhenie = false;
  const sazday = async (): Promise<void> => {
    if (vDvizhenie) return;
    const kletki: Record<string, Kletka | null> = { ...dadeni };
    try {
      for (const [klyuch, pole] of poleta) {
        const kol = t.koloni.find((c: Kolona) => c.klyuch === klyuch)!;
        kletki[klyuch] = kletkaOtPoleto(kol, pole);
      }
    } catch (g) {
      kazhi(dumiZaGreshka(g));
      return;
    }
    vDvizhenie = true;
    const r = await k.porta.izpalni(komandaId, opis.komanda, { kletki: kletki as Kletki });
    vDvizhenie = false;
    if ('otkaz' in r) {
      // отказът остава В прозореца · зад него човекът вече не гледа
      kazhi(r.zashto.join(' · '));
      return;
    }
    prozorets.close();
    prozorets.remove();
    otgovoratNaPortata(k, r);
  };

  prozorets
    .querySelector<HTMLButtonElement>('[data-izskachasht-sazday]')
    ?.addEventListener('click', () => void sazday());
  prozorets
    .querySelector<HTMLButtonElement>('[data-izskachasht-otkazhi]')
    ?.addEventListener('click', () => {
      prozorets.close();
      prozorets.remove();
    });
  prozorets.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    void sazday();
  });
  prozorets.addEventListener('close', () => prozorets.remove());

  document.body.append(prozorets);
  prozorets.showModal();
  poleta.values().next().value?.focus();
}
