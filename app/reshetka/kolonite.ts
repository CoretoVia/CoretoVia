/**
 * КОЛОНИТЕ КАТО В ЕКСЕЛ · ширина с влачене, скриване, подредба от главата.
 *
 * Негово, 11.09 (запис 193), ДОСЛОВНО: „**Да има скриване на колони в Управление
 * и Сметки и колоната да се мести ширината като на ексел. Искам изгледа на
 * ексел. Казвам го за 100тен път. Почти си го докарал, но мястото е ценно. Няма
 * празни пространства.**" И (запис 192): „**Филтър значи да ги сортираш.**"
 *
 * Затова главата на всяка колона е ЕДНА контрола с три работи:
 *
 *   · натискаш името → меню: подреди нагоре · надолу · както е в Книгата ·
 *     скрий колоната (това е „най-модерният филтър", избора на който той ми
 *     остави, запис 193 т. 6);
 *   · хващаш десния ѝ ръб → влачиш ширината, както в Ексел;
 *   · скритите колони не изчезват безследно — лента под таблицата ги брои и
 *     ги връща (правило 12: изключено ≠ липсващо, отказът се КАЗВА).
 *
 * ШИРИНИТЕ И СКРИТОТО СА ПОГЛЕД, не данни: живеят в паметта на екрана
 * (`ui.v1.`), нула събития в Журнала. Негово, 11.08: „Скритите колони: Лично,
 * като ширините."
 */

import { pokazhiMenyu } from './menyu.js';
import { chetiEkranno, zapomniEkranno } from './pamet-ekran.js';

/** Най-тясната колона, под която текстът става нечетим. */
const NAY_TYASNA = 40;

function klyuchNaShirinite(tablitsa: string): string {
  return `kolonite.shirini.${tablitsa}`;
}

function klyuchNaSkritite(tablitsa: string): string {
  return `kolonite.skriti.${tablitsa}`;
}

function skrititeKoloni(tablitsa: string): readonly string[] {
  return chetiEkranno<readonly string[]>(klyuchNaSkritite(tablitsa), []);
}

function zapomniSkritite(tablitsa: string, spisak: readonly string[]): void {
  zapomniEkranno(klyuchNaSkritite(tablitsa), [...new Set(spisak)]);
}

export function skriyKolona(tablitsa: string, klyuch: string): void {
  zapomniSkritite(tablitsa, [...skrititeKoloni(tablitsa), klyuch]);
}

export function varniVsichkiKoloni(tablitsa: string): void {
  zapomniSkritite(tablitsa, []);
}

function shirinite(tablitsa: string): Readonly<Record<string, number>> {
  return chetiEkranno<Readonly<Record<string, number>>>(klyuchNaShirinite(tablitsa), {});
}

function zapomniShirinata(tablitsa: string, klyuch: string, px: number): void {
  zapomniEkranno(klyuchNaShirinite(tablitsa), {
    ...shirinite(tablitsa),
    [klyuch]: Math.max(NAY_TYASNA, Math.round(px)),
  });
}

/**
 * Слага запомнените ширини върху една таблица.
 *
 * Ширината се пише на `<col>`, не на `<th>`: така всяка клетка под главата я
 * следва, и таблицата не преизчислява разположението при всяко рисуване.
 */
function sloziShirinite(tabl: HTMLTableElement): void {
  const tablitsa = tabl.dataset['reshetka'] ?? '';
  if (tablitsa === '') return;
  const zapomneni = shirinite(tablitsa);
  const glavi = [...tabl.querySelectorAll<HTMLElement>('thead tr:first-child th')];
  let grupa = tabl.querySelector('colgroup');
  if (grupa === null) {
    grupa = document.createElement('colgroup');
    tabl.prepend(grupa);
  }
  while (grupa.children.length > glavi.length) grupa.lastElementChild?.remove();
  while (grupa.children.length < glavi.length) grupa.append(document.createElement('col'));
  glavi.forEach((th, i) => {
    const col = grupa.children[i];
    if (!(col instanceof HTMLTableColElement)) return;
    const klyuch = th.dataset['kolona'] ?? '';
    const px = klyuch === '' ? undefined : zapomneni[klyuch];
    col.style.width = px === undefined ? '' : `${px}px`;
  });
}

/** Скрива запомнените колони · и връща колко са. */
function sloziSkritite(tabl: HTMLTableElement): number {
  const tablitsa = tabl.dataset['reshetka'] ?? '';
  if (tablitsa === '') return 0;
  const skriti = new Set(skrititeKoloni(tablitsa));
  for (const kletka of tabl.querySelectorAll<HTMLElement>('[data-kolona]')) {
    const klyuch = kletka.dataset['kolona'] ?? '';
    kletka.hidden = skriti.has(klyuch);
  }
  for (const kletka of tabl.querySelectorAll<HTMLElement>('[data-sbor-kolona]')) {
    kletka.hidden = skriti.has(kletka.dataset['sborKolona'] ?? '');
  }
  return skriti.size;
}

/** Прилага ширини и скрити · вика се след всяко рисуване. */
export function prilozhiKolonite(koren: HTMLElement): void {
  for (const tabl of koren.querySelectorAll<HTMLTableElement>('table.reshetka.redove')) {
    sloziShirinite(tabl);
    const skriti = sloziSkritite(tabl);
    const lenta = tabl.parentElement?.querySelector<HTMLElement>('[data-skriti-koloni]');
    if (lenta === undefined || lenta === null) continue;
    lenta.hidden = skriti === 0;
    const broy = lenta.querySelector<HTMLElement>('[data-skriti-broy]');
    if (broy !== null) broy.textContent = String(skriti);
  }
}

/**
 * СКРИВАНЕТО е на ДЕСНИЯ БУТОН върху главата · негова конвенция.
 *
 * Негово, 31.08: „на всеки обект, който се движи из различни таблици, да има
 * опция **с десен бутон да го управляваш**… и да са съобразени от мястото,
 * където е самият обект." Лявото натискане подрежда (запис 192), дясното
 * управлява — така главата носи двете, без нито едно допълнително копче да
 * яде място (запис 193: „мястото е ценно").
 */
export function zakachiDesniyaButonNaGlavata(koren: HTMLElement): void {
  koren.addEventListener('contextmenu', (e) => {
    const th = (e.target as HTMLElement | null)?.closest<HTMLElement>('th[data-kolona]');
    if (th === null || th === undefined) return;
    const tabl = th.closest('table.reshetka.redove');
    if (!(tabl instanceof HTMLTableElement)) return;
    const tablitsa = tabl.dataset['reshetka'] ?? '';
    const klyuch = th.dataset['kolona'] ?? '';
    if (tablitsa === '' || klyuch === '') return;
    e.preventDefault();
    const ime = (th.textContent ?? '').trim();
    pokazhiMenyu(e.clientX, e.clientY, [
      {
        klyuch: 'skriy',
        ime: `Скрий колоната „${ime}"`,
        razreshena: true,
        zashto: '',
        deystvie: () => {
          skriyKolona(tablitsa, klyuch);
          prilozhiKolonite(koren);
        },
      },
      {
        klyuch: 'varni',
        ime: 'Покажи всички колони',
        razreshena: true,
        zashto: '',
        deystvie: () => {
          varniVsichkiKoloni(tablitsa);
          prilozhiKolonite(koren);
        },
      },
    ]);
  });
}

/**
 * ЗАЛЕПЕНАТА ЛЯВА ЧАСТ · номерът и името остават, докато тактовете се движат.
 *
 * Негово, 11.09 (запис 195), точка 2: „**Ганта обхваща всички редове изцяло и
 * се сливат двете. Направи ги едно ако може. Те работят заедно.**" Сляти са —
 * един ред, едни клетки (ход 88). Оставаше едно: календарът стоеше отвъд
 * десния ръб и до него се стигаше само със скролиране, при което името на
 * задачата излизаше от екрана и лентата преставаше да значи нещо.
 *
 * `docs/24` го е решил още тогава: „трябва да остават видими, докато тактовете
 * се движат наляво — залепена лява". Точно това е тук, и точно така изглежда MS
 * Project: имената стоят, времето тече.
 *
 * ОТМЕСТВАНЕТО СЕ МЕРИ, НЕ СЕ ЗАКОВАВА: ширините се влачат с ръка (ход 87),
 * тъй че второто залепено се лепи там, където СВЪРШВА първото — а не на кръгло
 * число, което остарява при първото влачене.
 */
const ZALEPENI_KOLONI = 2;

export function zalepiLyavata(koren: HTMLElement): void {
  for (const tabl of koren.querySelectorAll<HTMLTableElement>('table.reshetka.darvo')) {
    const glavi = [...tabl.querySelectorAll<HTMLElement>('thead tr:first-child th')];
    const dokade = Math.min(ZALEPENI_KOLONI, glavi.length);
    let otmestvane = 0;
    for (let i = 0; i < dokade; i += 1) {
      const shirina = glavi[i]?.getBoundingClientRect().width ?? 0;
      for (const red of tabl.rows) {
        const kletka = red.cells[i];
        if (kletka === undefined) continue;
        kletka.classList.add('zalepena-kolona');
        if (i === dokade - 1) kletka.classList.add('posledna-zalepena');
        kletka.style.left = `${Math.round(otmestvane)}px`;
      }
      otmestvane += shirina;
    }
  }
}

/**
 * ШИРИНИТЕ НА ДЪРВОТО · всяка колона поотделно, а календарът — всички наведнъж.
 *
 * Негово, 12.09 (запис 199), точка 4, ДОСЛОВНО: „**Да може да се мести с мишката
 * всяка колона колко е широка в таблицата за всяка отделно, а за календара
 * местейки не местиш всички както в ексел когато ги маркираш.**"
 *
 * Тоест две различни правила върху една и съща таблица, и това е вярното: в
 * лявата половина колоните са РАЗНИ неща и всяка иска своята ширина; в дясната
 * са едно и също нещо — дни — и различни ширини там биха излъгали за времето.
 *
 * Тактовете вървят през една променлива на самата таблица (`--shirina-takt`),
 * не през сто отделни ширини: една стойност, едно запомняне, един ред стил.
 */
const KLYUCH_NA_TAKTA = 'takt';

/**
 * ШИРИНИТЕ ПО ПОДРАЗБИРАНЕ · сборът им е около половин широк екран.
 *
 * Негово, 12.09 (запис 199): „Направи самите колони тесни за данните да се
 * видят добре… но да се събират в половината екран. Да се вижда в останалата
 * картина календарът."
 *
 * Числата са в пиксели, защото ширината на колона се влачи в пиксели и
 * запомненото е в пиксели: две мерки за едно нещо се разминават при първото
 * влачене.
 */
const SHIRINI_PO_PODRAZBIRANE: Readonly<Record<string, number>> = Object.freeze({
  nomeratsiya: 48,
  ime: 96,
  sastoyanie: 80,
  nomer: 42,
  vid: 144,
  ot: 128,
  otsenka: 64,
  plosht: 64,
  tsena: 80,
  byudzhet: 80,
  otgovornik: 80,
});
/** денят в календара · всички дни носят ЕДНА ширина (негово, запис 199 т.4) */
const SHIRINA_NA_TAKTA = 38;

/**
 * Слага ширините върху дървото · през `<colgroup>`, не през главите.
 *
 * Главата може да покрива ДВЕ колони (неговите „Задачи" и „Дата" са слети от
 * две), а ширина, сложена върху такава глава, се разпределя както реши
 * браузърът — и редът се разминава с главата си. `<col>` е по колона и няма
 * какво да разпределя.
 */
export function sloziShiriniteNaDarvoto(koren: HTMLElement): void {
  for (const tabl of koren.querySelectorAll<HTMLTableElement>('table.reshetka.darvo')) {
    const tablitsa = tabl.dataset['reshetka'] ?? '';
    if (tablitsa === '') continue;
    const zapomneni = shirinite(tablitsa);
    const shiriniNaKolonite: number[] = [];
    for (const th of tabl.querySelectorAll<HTMLElement>('thead tr.glavi th')) {
      // липсващият `colspan` значи ЕДНА колона · нула би изяла колоната мълчаливо
      const kazano = th.getAttribute('colspan');
      const broy = kazano === null ? 1 : Math.max(1, Number(kazano));
      const takt = th.classList.contains('takt');
      const klyuch = takt ? KLYUCH_NA_TAKTA : (th.dataset['glava'] ?? '');
      const cyala =
        zapomneni[klyuch] ?? (takt ? SHIRINA_NA_TAKTA : (SHIRINI_PO_PODRAZBIRANE[klyuch] ?? 80));
      for (let i = 0; i < broy; i += 1) shiriniNaKolonite.push(Math.round(cyala / broy));
    }
    let grupa = tabl.querySelector('colgroup');
    if (grupa === null) {
      grupa = document.createElement('colgroup');
      tabl.prepend(grupa);
    }
    while (grupa.children.length > shiriniNaKolonite.length) grupa.lastElementChild?.remove();
    while (grupa.children.length < shiriniNaKolonite.length)
      grupa.append(document.createElement('col'));
    // ШИРИНАТА НА ТАБЛИЦАТА Е СБОРЪТ · инак браузърът смята своя `max-content`
    // от съдържанието и РАЗДАВА разликата между колоните: зададените ширини
    // стават предложение и всяка колона излиза по-широка от поисканото.
    tabl.style.width = `${shiriniNaKolonite.reduce((a, x) => a + x, 0)}px`;
    shiriniNaKolonite.forEach((px, i) => {
      const col = grupa.children[i];
      if (col instanceof HTMLTableColElement) col.style.width = `${px}px`;
    });
  }
}
/**
 * ВЛАЧЕНЕТО на десния ръб · както в Ексел · за ДВЕТЕ таблици.
 *
 * Слушателите се закачат на документа само докато трае влаченето: мишката
 * често излиза извън тясната дръжка, а човек, който пусне бутона навън, иначе
 * би оставил таблицата да го следва завинаги.
 *
 * ДВЕ ПРАВИЛА, ЕДНО ВЛАЧЕНЕ (негово, 12.09 · запис 199 т.4): в решетката и в
 * лявата половина на дървото всяка колона носи СВОЯТА ширина; в календара
 * всички дни носят ЕДНА, защото са едно и също нещо и различни ширини там биха
 * излъгали за времето. Двата случая се различават по дръжката, не по код:
 * преписаното веднъж вече беше хванато от обход 8 на чистотата.
 */
export function zakachiVlacheneto(koren: HTMLElement): void {
  koren.addEventListener('pointerdown', (e) => {
    const drazhka = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-shirina], [data-shirina-darvo]',
    );
    if (drazhka === null || drazhka === undefined) return;
    const darvo = drazhka.hasAttribute('data-shirina-darvo');
    const th = drazhka.closest('th');
    const tabl = drazhka.closest(darvo ? 'table.reshetka.darvo' : 'table.reshetka.redove');
    if (!(th instanceof HTMLTableCellElement) || !(tabl instanceof HTMLTableElement)) return;
    const tablitsa = tabl.dataset['reshetka'] ?? '';
    const klyuch = darvo
      ? th.classList.contains('takt')
        ? KLYUCH_NA_TAKTA
        : (th.dataset['glava'] ?? '')
      : (th.dataset['kolona'] ?? '');
    if (tablitsa === '' || klyuch === '') return;
    e.preventDefault();

    const nachalo = e.clientX;
    const shirinaOtNachaloto = th.getBoundingClientRect().width;
    document.body.classList.add('vlacha-shirina');

    const mesti = (dvizhi: PointerEvent): void => {
      const nova = Math.max(NAY_TYASNA, shirinaOtNachaloto + (dvizhi.clientX - nachalo));
      zapomniShirinata(tablitsa, klyuch, nova);
      if (darvo) {
        sloziShiriniteNaDarvoto(koren);
        zalepiLyavata(koren);
      } else sloziShirinite(tabl);
    };
    const pusni = (): void => {
      document.removeEventListener('pointermove', mesti);
      document.removeEventListener('pointerup', pusni);
      document.body.classList.remove('vlacha-shirina');
    };
    document.addEventListener('pointermove', mesti);
    document.addEventListener('pointerup', pusni);
  });
}
