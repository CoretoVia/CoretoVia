/**
 * ПОДСКАЗКАТА · обяснението при задържане · ЕДНА кутия за целия екран (правило 31).
 *
 * Негово, 08.09 (запис 62): „при задържане на мишката — така се прави, старото е
 * по-лошо." И 11.09 (запис 151): „в хелповете само при задържане да се показват".
 * Затова тук няма панел: има белег `data-podskazka` върху самото нещо и една
 * кутия, която идва при него.
 *
 * ═══ ЗАЩО НЕ `title` ═══
 *
 * `title` на браузъра идва след секунда, изчезва при най-малкото движение, не се
 * показва при фокус с клавиатура и не знае за двете СТЕПЕНИ. Тук текстът се
 * смята при рисуване от `tekstNaPomoshtta(p, stepen)`, тъй че смяната на
 * степента е едно прерисуване, а не втори набор надписи.
 *
 * ═══ ДВЕТЕ СТЕПЕНИ ═══
 *
 * Латински ключ в паметта на екрана (`ui.v1.pomosht.stepen`), етикетът е в
 * `IMENATA_NA_STEPENITE`. Паметта е на устройството, без префикс на прозорец —
 * степента не е поглед към един прозорец и не влиза в снимките на моделите.
 * Счупен запис пада към подразбраното (`eStepen`), както всичко екранно.
 *
 * ═══ КАК СЕ ЗАКАЧА ═══
 *
 * Един делегиран набор слушатели върху корена (`#ekran`): `mouseover`/`mouseout`
 * (изкачват се; `mouseenter` — не), `focusin`/`focusout`, и Escape на
 * документа, в улавящата фаза, за да спре САМО кутията, а не и менюто или
 * диалога наведнъж. Котвата е най-близкият `[data-podskazka]`. Сивите бутони
 * остават `disabled`; Chromium ≥ 116 им праща `mouseover`, и проходът го
 * ДОКАЗВА, вместо тук да се обещава.
 *
 * Позицията се дава през CSSOM (`el.style.left`): атрибутът `style=` и
 * `cssText` са спрени от `style-src 'self'`, а свойствата — не.
 */

import {
  eStepen,
  IMENATA_NA_STEPENITE,
  type Pomosht,
  STEPEN_PO_PODRAZBIRANE,
  STEPENI_NA_POMOSHTTA,
  type StepenNaPomoshtta,
  tekstNaPomoshtta,
} from '../../src/model/pomosht.js';
import { chetiEkranno, zapomniEkranno } from './pamet-ekran.js';
import { h, type Zapechatan } from './shablon.js';

/** ключът в паметта на екрана · `pamet-ekran.ts` слага `ui.v1.` отпред */
export const KLYUCH_NA_STEPENTA = 'pomosht.stepen';
const ID_NA_KUTIYATA = 'podskazkata';
/** задържане преди показване · при фокус кутията идва веднага */
const ZADARZHANE_MS = 300;
/** толеранс, докато мишката минава от котвата към кутията */
const TOLERANS_MS = 120;
const OTSTAP_PX = 6;
const RAB_PX = 8;

export function stepenNaPomoshtta(): StepenNaPomoshtta {
  const s = chetiEkranno<unknown>(KLYUCH_NA_STEPENTA, STEPEN_PO_PODRAZBIRANE);
  return eStepen(s) ? s : STEPEN_PO_PODRAZBIRANE;
}

export function zapomniStepenta(s: StepenNaPomoshtta): void {
  zapomniEkranno(KLYUCH_NA_STEPENTA, s);
}

/** Белегът за подсказка · текстът е по текущата степен · екранира се от `h`. */
export function podskazka(p: Pomosht): Zapechatan {
  return podskazkaSDumi(tekstNaPomoshtta(p, stepenNaPomoshtta()));
}

/** Същото за вече готов текст · причината за сив бутон, сметнато изречение · празното е нищо. */
export function podskazkaSDumi(tekst: string): Zapechatan {
  return tekst === '' ? h`` : h` data-podskazka="${tekst}"`;
}

const ZA_IZBORA =
  'Хелпът е при задържане на мишката или при фокус. Начало казва защо съществува нещото и формулата му; Нормален — само формулата.';

/** Изборът на степен · един и същ в главата и в Настройки (негово, 08.09: „тикче в настройки"). */
export function izborNaStepenHTML(): Zapechatan {
  const tekushta = stepenNaPomoshtta();
  return h`<label class="malak buton-grupa"${podskazkaSDumi(ZA_IZBORA)}>Хелп <select class="pole malak" data-pomosht-stepen>${STEPENI_NA_POMOSHTTA.map(
    (s) =>
      h`<option value="${s}" ${s === tekushta ? 'selected' : ''}>${IMENATA_NA_STEPENITE[s]}</option>`,
  )}</select></label>`;
}

/**
 * Смяната на степента · запомня и прерисува.
 *
 * Закача се ВЕДНЪЖ, върху корена на екрана: изборът в главата и изборът в
 * Настройки са вътре в него и един делегиран слушател стига до двата.
 */
export function zakachiIzboraNaStepen(koren: ParentNode, prerisuvay: () => void): void {
  koren.addEventListener('change', (e) => {
    const sel = e.target;
    if (!(sel instanceof HTMLSelectElement) || !sel.hasAttribute('data-pomosht-stepen')) return;
    if (eStepen(sel.value)) zapomniStepenta(sel.value);
    prerisuvay();
  });
}

let kutiya: HTMLElement | null = null;
let kotva: HTMLElement | null = null;
let chakaPokazvane: ReturnType<typeof setTimeout> | null = null;
let chakaSkrivane: ReturnType<typeof setTimeout> | null = null;
let dokumentatSlusha = false;

function spriChakaneto(): void {
  if (chakaPokazvane !== null) clearTimeout(chakaPokazvane);
  if (chakaSkrivane !== null) clearTimeout(chakaSkrivane);
  chakaPokazvane = null;
  chakaSkrivane = null;
}

/** Кутията се строи ВЕДНЪЖ и стои в `body`, над менюто (20) и диалога (30). */
function kutiyata(): HTMLElement {
  if (kutiya !== null) return kutiya;
  const k = document.createElement('div');
  k.className = 'podskazka';
  k.id = ID_NA_KUTIYATA;
  k.setAttribute('role', 'tooltip');
  k.hidden = true;
  // кутията е достижима с мишката · излизането от нея крие, влизането в нея — не
  k.addEventListener('mouseover', () => {
    if (chakaSkrivane !== null) clearTimeout(chakaSkrivane);
    chakaSkrivane = null;
  });
  k.addEventListener('mouseout', (e) => {
    const kam = e.relatedTarget;
    if (kam instanceof Node && (k.contains(kam) || kotva?.contains(kam) === true)) return;
    skriySled();
  });
  document.body.append(k);
  kutiya = k;
  return k;
}

/** Мястото · под котвата, подравнено вляво; обръща се, когато не се събира в прозореца. */
function polozhi(el: HTMLElement, k: HTMLElement): void {
  const r = el.getBoundingClientRect();
  // мери се от левия ръб: при `fixed` ширината е ограничена от старото `left`
  k.style.left = '0px';
  const shirina = k.offsetWidth;
  const visina = k.offsetHeight;
  let lyavo = r.left;
  let gore = r.bottom + OTSTAP_PX;
  if (lyavo + shirina > window.innerWidth - RAB_PX) {
    lyavo = Math.max(RAB_PX, window.innerWidth - RAB_PX - shirina);
  }
  if (gore + visina > window.innerHeight - RAB_PX) gore = r.top - OTSTAP_PX - visina;
  if (gore < RAB_PX) gore = RAB_PX;
  k.style.left = `${lyavo}px`;
  k.style.top = `${gore}px`;
}

function pokazhi(el: HTMLElement): void {
  spriChakaneto();
  const tekst = el.dataset['podskazka'] ?? '';
  if (tekst === '') {
    skriyPodskazkata();
    return;
  }
  if (kotva !== null && kotva !== el) kotva.removeAttribute('aria-describedby');
  kotva = el;
  const k = kutiyata();
  // гол текст, не HTML · причината за сив бутон може да носи негово име
  k.textContent = tekst;
  k.classList.toggle('nachalo', stepenNaPomoshtta() === 'nachalo');
  k.hidden = false;
  el.setAttribute('aria-describedby', ID_NA_KUTIYATA);
  polozhi(el, k);
}

function skriySled(): void {
  if (chakaSkrivane !== null) clearTimeout(chakaSkrivane);
  chakaSkrivane = setTimeout(skriyPodskazkata, TOLERANS_MS);
}

/** Скрива кутията · вика се и при всяко рисуване, инак тя увисва без котва. */
export function skriyPodskazkata(): void {
  spriChakaneto();
  if (kotva !== null) kotva.removeAttribute('aria-describedby');
  kotva = null;
  if (kutiya !== null) kutiya.hidden = true;
}

function kotvataNa(e: Event): HTMLElement | null {
  const cel = e.target;
  return cel instanceof Element ? cel.closest<HTMLElement>('[data-podskazka]') : null;
}

/** Закача слушателите ВЕДНЪЖ върху корена на екрана. */
export function zakachiPodskazkite(koren: HTMLElement): void {
  koren.addEventListener('mouseover', (e) => {
    const el = kotvataNa(e);
    if (el === null) return;
    if (el === kotva) {
      if (chakaSkrivane !== null) clearTimeout(chakaSkrivane);
      chakaSkrivane = null;
      return;
    }
    if (chakaPokazvane !== null) clearTimeout(chakaPokazvane);
    chakaPokazvane = setTimeout(() => pokazhi(el), ZADARZHANE_MS);
  });
  koren.addEventListener('mouseout', (e) => {
    const el = kotvataNa(e);
    if (el === null) return;
    const kam = e.relatedTarget;
    if (kam instanceof Node && (el.contains(kam) || kutiya?.contains(kam) === true)) return;
    if (chakaPokazvane !== null) clearTimeout(chakaPokazvane);
    chakaPokazvane = null;
    if (el === kotva) skriySled();
  });
  koren.addEventListener('focusin', (e) => {
    const el = kotvataNa(e);
    if (el === null) return;
    // поле за писане получава фокус и програмно (черновата) · кутия над реда,
    // която се мести с всеки Tab, пречи на писането; там остава задържането
    if (el.matches('input, select, textarea')) return;
    pokazhi(el);
  });
  koren.addEventListener('focusout', (e) => {
    const el = kotvataNa(e);
    if (el !== null && el === kotva) skriyPodskazkata();
  });
  if (dokumentatSlusha) return;
  dokumentatSlusha = true;
  // Escape крие кутията и НЕ спира събитието: подсказката не е диалог, и
  // черновата, менюто или диалогът се затварят от същото натискане, не от второ.
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || kutiya === null || kutiya.hidden) return;
      skriyPodskazkata();
    },
    true,
  );
  // при превъртане котвата се мести, а кутията е закована · по-честно е да се скрие
  document.addEventListener('scroll', skriyPodskazkata, { capture: true, passive: true });
}
