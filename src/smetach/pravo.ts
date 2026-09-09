/**
 * ПРАВОТО на Длъжността · четирите оси на неговия лист „Служители" (ADR-008).
 *
 * Негови глави (C16:F16): достъп до табове без Журнал · достъп до хедъри ·
 * достъп до Секци Редове · Таб Журнал. Всяка клетка е НЕГОВО изречение,
 * дословно („Редактира всичко" · „Вижда само всичко" · „Редактира  хедъри:
 * Заплати, Фактури Кеш, Фактури Карта").
 *
 * Кодът чете от изречението ДВЕ неща: ПРАВОТО — по първата дума — и ОБХВАТА:
 * останалото. Правило 23: правото има три стойности и само СТЕСНЯВА; „Редактира"
 * значи „не съм стеснил нищо", а не „давам редакция на този човек". Кой изобщо
 * може да пише, решават Длъжността ТУК и видът на колоната; важи най-тясното.
 *
 * Нищо тук не пише и нищо не пази: чисто смятане върху Огледалото.
 */

import { tablitsata } from '../model/model.js';
import { podravni } from '../model/nomenklatura.js';
import {
  DOSTAP_PO_PODRAZBIRANE,
  MODEL,
  type OsNaDostapa,
  OSI_NA_DOSTAPA,
} from '../model/osnova.js';
import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { kletkaNa, zhiviteRedove } from '../ogledalo/tablitsa.js';
import { tekstNaIzbora } from './kletki.js';

export type { OsNaDostapa } from '../model/osnova.js';

/** Трите стойности на правото (правило 23) · в реда на стесняването. */
export const PRAVA = ['redaktira', 'vizhda', 'skrito'] as const;
export type Pravo = (typeof PRAVA)[number];

export const DUMI_NA_PRAVOTO: Readonly<Record<Pravo, string>> = Object.freeze({
  redaktira: 'Редактира',
  vizhda: 'Вижда',
  skrito: 'Скрито',
});

const TABLITSA = 'dostap';
const HORA = ['stopani', 'sluzhiteli'];

/**
 * СВЕДЕНА дума · NFC и свити интервали (`podravni`) ПЛЮС малки букви.
 *
 * `podravni` НЕ смалява буквите — и точно това тук беше дупка:
 * неговото „Редактира" не започваше с „редактира" и ВСЯКА ос излизаше „Скрито".
 * Сравнението на ДУМИ се прави само оттук (един дом).
 */
function svedeno(dumi: string): string {
  return podravni(dumi).toLowerCase();
}

/**
 * ТИ ЛИ СИ СТОПАНИНЪТ · един дом на въпроса (правило 14).
 *
 * Същият израз стоеше преписан на ТРИ места (`pravotoNaImeyla` ·
 * `mozheDaRedaktira` · `mozheDaRazdavaDlazhnosti`). Преписан въпрос е въпрос,
 * който ще се промени на две от трите места.
 *
 * Стопанинът е онзи, чийто имейл стои в Огледалото — той идва от ПЪРВОТО
 * събитие и се замразява там. Негово, 08.09: „Длъжността на първия стопанин
 * не се променя никога от никого. Неприкосновена е."
 */
function eStopaninat(o: Ogledalo, imeyl: string): boolean {
  return o.stopanin !== '' && svedeno(imeyl) === svedeno(o.stopanin);
}

/**
 * ЗАЩО НЕ ПИПА НАСТРОЙКИТЕ · и думите на отказа (правило 12).
 *
 * Негово (`zadanie/02-imoti-obekti-biznesi.md:16`): номенклатурите „се добавят
 * и редактират и премахват от секция Номенклатура при **Настройки на
 * Стопанина**". И самият прозорец се казва „Настройки(Стопанин)".
 *
 * ═══ ЗАЩО ТОВА Е СИГУРНОСТ, А НЕ ПОДРЕДБА (Т23 · и коренът на Т28) ═══
 *
 * Номенклатурите РАЖДАТ секциите, а секциите се назовават в обхвата на правото.
 * Доказано с изпълнение на 08.09: Наблюдател преименува разходна секция и с това
 * РАЗДАДЕ право върху нея. Тоест отворените Настройки не са удобство — те са
 * заден вход към правото.
 */
export function zashtoNePipaNastroykite(o: Ogledalo, imeyl: string): string | null {
  return eStopaninat(o, imeyl)
    ? null
    : 'Номенклатурите се създават, преименуват и спират само от Стопанина (Настройки · негово, 05.09).';
}

/** Правото от НЕГОВОТО изречение · по първата дума; празното е скрито. */
export function pravoOtDumite(izrechenie: string): Pravo {
  const parva = svedeno(izrechenie).split(/\s+/)[0] ?? '';
  if (parva.startsWith('редактира')) return 'redaktira';
  if (parva.startsWith('вижда')) return 'vizhda';
  return 'skrito';
}

/** Обхватът от изречението · всичко след първата дума, както го е написал. */
export function obhvatOtDumite(izrechenie: string): string {
  const bezParvata = izrechenie
    .trim()
    .replace(/^\S+\s*/, '')
    .trim();
  return bezParvata;
}

/** По-ТЯСНОТО от две права · стеснението е еднопосочно (правило 23). */
export function poTyasnoto(a: Pravo, b: Pravo): Pravo {
  return PRAVA[Math.max(PRAVA.indexOf(a), PRAVA.indexOf(b))]!;
}

export interface DostapNaDlazhnost {
  readonly dlazhnost: string;
  /** изречението му по ос · дословно */
  readonly dumi: Readonly<Record<OsNaDostapa, string>>;
  /** правото по ос · сметнато от думите */
  readonly pravo: Readonly<Record<OsNaDostapa, Pravo>>;
  /** редът е записан в таблицата · иначе е базовият от Книгата му */
  readonly zapisan: boolean;
}

function ottsenka(dumi: Record<OsNaDostapa, string>): Record<OsNaDostapa, Pravo> {
  const pravo = {} as Record<OsNaDostapa, Pravo>;
  for (const os of OSI_NA_DOSTAPA) pravo[os] = pravoOtDumite(dumi[os]);
  return pravo;
}

/**
 * Достъпът на една Длъжност · записаният ред бие базовия от Книгата му.
 *
 * Длъжност без ред и без базов ред получава НАЙ-ТЯСНОТО: непозната длъжност не
 * отваря врати (правило 15: изключено ≠ липсващо, но липсващото не е позволено).
 */
export function dostapaNaDlazhnostta(o: Ogledalo, dlazhnost: string): DostapNaDlazhnost {
  const tv = o.tablitsi.get(TABLITSA);
  if (tv !== undefined) {
    for (const i of zhiviteRedove(tv)) {
      const kl = kletkaNa(tv, i, 'dlazhnost');
      const tekst = kl === null ? '' : tekstNaIzbora(o, TABLITSA, 'dlazhnost', kl);
      if (svedeno(tekst) !== svedeno(dlazhnost)) continue;
      const dumi = {} as Record<OsNaDostapa, string>;
      for (const os of OSI_NA_DOSTAPA) {
        const k = kletkaNa(tv, i, os);
        dumi[os] = k !== null && 'tekst' in k ? k.tekst : '';
      }
      return { dlazhnost, dumi, pravo: ottsenka(dumi), zapisan: true };
    }
  }
  const bazov = DOSTAP_PO_PODRAZBIRANE.find((d) => svedeno(d.dlazhnost) === svedeno(dlazhnost));
  const dumi = {} as Record<OsNaDostapa, string>;
  for (const os of OSI_NA_DOSTAPA) dumi[os] = bazov?.[os] ?? '';
  return { dlazhnost, dumi, pravo: ottsenka(dumi), zapisan: false };
}

/**
 * ВСИЧКИТЕ Длъжности на един имейл · Стопани и Служители, в този ред.
 *
 * Един човек може да стои в двете таблици. Тогава не печели първата намерена:
 * важи НАЙ-ТЯСНОТО от тях (правило 23) — затова тук се връщат всички.
 */
function dlazhnostiteNaImeyla(o: Ogledalo, imeyl: string): string[] {
  // имейлът се сравнява СВЕДЕН: доставчикът не различава голяма от малка буква
  const tarsen = svedeno(imeyl);
  if (tarsen === '') return [];
  const namereni: string[] = [];
  for (const tablitsa of HORA) {
    const tv = o.tablitsi.get(tablitsa);
    if (tv === undefined) continue;
    for (const i of zhiviteRedove(tv)) {
      const k = kletkaNa(tv, i, 'imeyl');
      if (k === null || !('tekst' in k) || svedeno(k.tekst) !== tarsen) continue;
      const d = kletkaNa(tv, i, 'dlazhnost');
      const tekst = d === null ? '' : tekstNaIzbora(o, tablitsa, 'dlazhnost', d);
      if (tekst !== '') namereni.push(tekst);
    }
  }
  return namereni;
}

/** Длъжността на един имейл · за показване · първата намерена. */
export function dlazhnosttaNaImeyla(o: Ogledalo, imeyl: string): string {
  return dlazhnostiteNaImeyla(o, imeyl)[0] ?? '';
}

/**
 * Правото на ЕДИН ЧОВЕК по ос · по имейла му.
 *
 * Стопанинът на Книгата (онзи, който я е открил) е Стопанин, дори още да няма
 * ред в таблицата: иначе първият вход би заключил сам себе си.
 *
 * ═══ ЧОВЕК БЕЗ ДЛЪЖНОСТ Е СКРИТ · подразбирането е ОТКАЗ ═══
 *
 * Негово, 08.09.2026: „Вход с Имейл без длъжност няма." И по-късно същия ден,
 * когато стана дума кой изобщо може да влезе:
 *
 *   „Заплахата е от Лица, които искат да влязат и да атакуват по всякакъв
 *    начин. ЛИЦАТА СА ЗАПЛАХА, АКО НЕ СА ПОКАНЕНИ С ДЛЪЖНОСТ."
 *
 * Дотогава тук стоеше `return 'vizhda'`, а коментарът го наричаше „най-тясното,
 * което върши работа". Това беше НЕВЯРНО по собствената константа на файла:
 * `PRAVA` реди правата в реда на стесняването и последното е `skrito`, не
 * `vizhda`. Тоест правило 23 („най-тясното печели") беше нарушено от функцията,
 * която го изпълнява — и уволнението работеше НАОПАКИ: махнеш ли Длъжността на
 * човек, правото му по ВСИЧКИТЕ четири оси СТАВАШЕ „Вижда" (Т34 · Т41).
 *
 * Съседката `mozheDaRedaktira` (по-долу) винаги е връщала `false` за същия
 * човек. Един файл, две противоположни подразбирания, на 42 реда разстояние.
 * Сега и двете затварят.
 */
export function pravotoNaImeyla(o: Ogledalo, imeyl: string, os: OsNaDostapa): Pravo {
  if (eStopaninat(o, imeyl)) return 'redaktira';
  const dlazhnosti = dlazhnostiteNaImeyla(o, imeyl);
  if (dlazhnosti.length === 0) return 'skrito';
  return dlazhnosti
    .map((dl) => dostapaNaDlazhnostta(o, dl).pravo[os])
    .reduce((a, b) => poTyasnoto(a, b));
}

/**
 * МОЖЕ ЛИ ТОЗИ ЧОВЕК ДА ПИШЕ В РЕДОВЕ · и ДУМИТЕ на отказа.
 *
 * ═══ ЗАЩО ЕДНА ФУНКЦИЯ, А НЕ ПРОВЕРКА НА ДВЕ МЕСТА ═══
 *
 * До 08.09.2026 оста „редове" се питаше САМО от екрана
 * (`app/reshetka/redaktsiya.ts`), с думите на отказа, написани там. Портата не
 * я питаше изобщо — тоест служител „Вижда само", който извика командата ПРЕЗ
 * Портата вместо през клетката, ЗАПИСВАШЕ.
 *
 * К2 казва „Портата е една". Това беше вярно за ПЪТЯ и невярно за ПРАВОТО.
 *
 * Сега проверката и думите имат ЕДИН дом (правило 14) и се викат и от двете
 * места. Ако някой ден отказът се преформулира, той се мени тук — инак екранът
 * и Портата биха казвали различни неща за едно и също.
 *
 * Стопанинът минава винаги (`pravotoNaImeyla` го връща `redaktira`).
 */
export function zashtoNeRedaktiraRedove(o: Ogledalo, imeyl: string): string | null {
  return pravotoNaImeyla(o, imeyl, 'redove') === 'redaktira'
    ? null
    : 'Ти само гледаш редовете · правото е на Длъжността ти (лист Служители).';
}

/**
 * Може ли този човек да РЕДАКТИРА този хедър (секция · блок)?
 *
 * Негово (05.09 т.3): секцията „Вкарване" (Заплати Кеш · Фактури Кеш · Фактури
 * Карта) се дава на Помощник Управителя — и точно това пише в неговия ред D19:
 * „Редактира  хедъри: Заплати, Фактури Кеш, Фактури Карта". Затова обхватът се
 * чете по ДУМА: хедър, който се среща в изречението, е позволен; „всичко"
 * отваря всички.
 */
export function mozheDaRedaktira(o: Ogledalo, imeyl: string, hedar: string): boolean {
  if (eStopaninat(o, imeyl)) return true;
  const dlazhnosti = dlazhnostiteNaImeyla(o, imeyl);
  if (dlazhnosti.length === 0) return false;
  // две Длъжности на един човек · важи НАЙ-ТЯСНАТА, затова „всяка", не „някоя"
  return dlazhnosti.every((dlazhnost) => {
    const d = dostapaNaDlazhnostta(o, dlazhnost);
    if (d.pravo.hedari !== 'redaktira') return false;
    const obhvat = svedeno(obhvatOtDumite(d.dumi.hedari));
    if (obhvat === '' || obhvat.startsWith('всичко')) return true;
    return obhvatatPokriva(obhvat, hedar);
  });
}

/** Думите на едно име · без празните · сведени. */
function dumite(ime: string): string[] {
  return svedeno(ime)
    .split(/[\s,:;]+/)
    .filter((x) => x !== '');
}

/**
 * ПОКРИВА ЛИ ОБХВАТЪТ ТОЗИ ХЕДЪР · и защо НЕ по подниз.
 *
 * Обхватът е СПИСЪК ОТ ИМЕНА, разделени със запетая, както той го пише в D19:
 * „Редактира  хедъри: Заплати, Фактури Кеш, Фактури Карта".
 *
 * ═══ ДУПКАТА, КОЯТО СЕ ЗАТВАРЯ (Т28 · Т30) ═══
 *
 * Дотук сравнението беше `obhvat.includes(duma)` — СЪДЪРЖАНЕ НА ПОДНИЗ върху
 * целия обхват като един низ. Проверено с изпълнение: секция на име „Кеш"
 * даваше `true`, защото „кеш" се съдържа във „фактури кеш". А секции се раждат
 * от Настройки, които днес всеки може да пипне. Тоест:
 *
 *   всеки, който може да пише ред, създава секция „Кеш" — и Помощникът
 *   получава право над нея, без никой да му го е давал.
 *
 * И втора дупка на същия ред: `.filter((x) => x.length > 2).every(...)` над
 * ПРАЗЕН масив дава `true` (празната истина). Хедър с празно име минаваше.
 *
 * ═══ КАК СЕ СРАВНЯВА СЕГА ═══
 *
 * Влизането е по ЕДНО ИМЕ ОТ СПИСЪКА, не по разпилени думи: хедърът е позволен,
 * ако ДУМИТЕ НА НЯКОЕ ИМЕ ОТ ОБХВАТА се съдържат ЦЕЛИ в думите на хедъра.
 * Така неговият стенопис оцелява („Заплати" отваря „Заплати Кеш"), а „Кеш" сам
 * по себе си не отваря нищо — защото нито едно име от списъка не се побира в
 * него.
 *
 * ОСТАВА ЕДНА ДВУСМИСЛИЦА, И ТЯ Е В НЕГОВИЯ ТЕКСТ: „Заплати" се побира и в
 * „Заплати Кеш", и в „Заплати Банка". Разходните секции са осем и две от тях
 * започват със „Заплати". Това не се решава от кода — чака негова дума
 * (`docs/14` · Т44).
 */
export function obhvatatPokriva(obhvat: string, hedar: string): boolean {
  const tozi = dumite(hedar);
  // празният или само-къс хедър НЕ отваря · `[].every(...)` е `true` и това беше дупка
  if (tozi.length === 0) return false;
  const negovi = new Set(tozi);
  return obhvat
    .replace(/^[^:]*:\s*/, '') // маха водещия етикет „хедъри:", ако го има
    .split(',')
    .map((ime) => dumite(ime))
    .filter((d) => d.length > 0)
    .some((imeto) => imeto.every((duma) => negovi.has(duma)));
}

/**
 * ДОСТЪПЪТ НА ЕДИН ЧОВЕК · Длъжността му и четирите оси с НЕГОВИТЕ изречения.
 *
 * Живее тук, при смятането, а не при екрана: Профилът и Служители го четат
 * еднакво, а екран, който вика друг екран, прави кръг (`sloeve`).
 */
export function dostapaMi(
  o: Ogledalo,
  imeyl: string,
): { dlazhnost: string; osi: readonly { os: string; dumi: string; pravo: string }[] } {
  const dlazhnost = dlazhnosttaNaImeyla(o, imeyl);
  const d = dostapaNaDlazhnostta(o, dlazhnost);
  const koloni = tablitsata(MODEL, TABLITSA).koloni;
  return {
    dlazhnost,
    osi: OSI_NA_DOSTAPA.map((os) => ({
      os: koloni.find((c) => c.klyuch === os)?.ime ?? os,
      dumi: d.dumi[os],
      pravo: DUMI_NA_PRAVOTO[d.pravo[os]],
    })),
  };
}

/**
 * КОИ Длъжности раздават Длъжности · НЕГОВО, 05.09: „Длъжности се раздават от
 * управителите и помощник управители."
 *
 * Стопанинът е над двете (базовият му ред е „Редактира всичко" по четирите оси)
 * и затова също раздава — иначе първият вход не би могъл да назначи никого.
 */
export const DLAZHNOSTI_S_RAZDAVANE: readonly string[] = Object.freeze([
  'Стопанин',
  'Управител',
  'Помощник Управител',
]);

/**
 * Може ли този човек да РАЗДАВА Длъжности и достъп?
 *
 * Раздаване е всяко пипане на колоната „Длъжност" (в Стопани и в Служители) и
 * на четирите оси на Достъпа: те са ЕДНА и съща врата, гледана от две страни.
 * Заключим ли само „Създаване на Длъжност с достъп", всеки би могъл да си впише
 * ред в Служители с Длъжност Управител и да влезе отзад.
 */
export function mozheDaRazdavaDlazhnosti(o: Ogledalo, imeyl: string): boolean {
  if (eStopaninat(o, imeyl)) return true;
  const dlazhnost = svedeno(dlazhnosttaNaImeyla(o, imeyl));
  if (dlazhnost === '') return false;
  return DLAZHNOSTI_S_RAZDAVANE.some((d) => svedeno(d) === dlazhnost);
}

/** Думите на отказа · казват КОЙ може, не само че не може (правило 12). */
export function zashtoNeRazdava(o: Ogledalo, imeyl: string): string {
  const dlazhnost = dlazhnosttaNaImeyla(o, imeyl);
  return `Длъжности се раздават от Управител и Помощник Управител (негово, 05.09). Ти си ${
    dlazhnost === '' ? 'без Длъжност в листа Служители' : dlazhnost
  }.`;
}

/**
 * РАЗДАВА ЛИ достъп това пипане · таблицата и пипнатите колони.
 *
 * „Длъжност" в кой да е ред за човек и четирите оси на Достъпа са раздаване;
 * телефонът и адресът не са.
 */
export function razdavaDostap(tablitsa: string, koloni: readonly string[]): boolean {
  if (tablitsa === TABLITSA) return true;
  if (tablitsa !== 'stopani' && tablitsa !== 'sluzhiteli') return false;
  return koloni.includes('dlazhnost');
}
