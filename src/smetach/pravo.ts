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
import { podravni, zhivite } from '../model/nomenklatura.js';
import {
  DOSTAP_PO_PODRAZBIRANE,
  MODEL,
  type OsNaDostapa,
  OSI_NA_DOSTAPA,
} from '../model/osnova.js';
import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { kletkaNa, zhiviteRedove } from '../ogledalo/tablitsa.js';
import { tekstNaIzbora } from './kletki.js';
import { NOMENKLATURA_NA_STRANATA } from './smetki.js';

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

/**
 * ЗАЩО НЕ ПИПА ДЛЪЖНОСТТА НА ПЪРВИЯ СТОПАНИН · и защо това е ИНВАРИАНТ (Т42).
 *
 * Негово, 08.09.2026, казано като правило и веднага потвърдено с една дума:
 *
 *   „Длъжността на първия стопанин НЕ СЕ ПРОМЕНЯ НИКОГА ОТ НИКОГО."
 *   „НЕПРИКОСНОВЕНА е."
 *
 * ═══ ЗАЩО НЕ СТИГА, ЧЕ РАЗДАВАНЕТО Е ОГРАНИЧЕНО ═══
 *
 * `mozheDaRazdavaDlazhnosti` пуска Управител И Помощник Управител да пипат
 * колоната „Длъжност" (`razdavaDostap` го обявява за раздаване), и НЯМА нито
 * една проверка КОЙ Е ЦЕЛТА. Тоест Управител можеше да смени Длъжността на
 * Стопанина.
 *
 * Днес това още не му отнема властта, защото `eStopaninat` чете имейла от
 * Огледалото, не Длъжността. Но собственикът поиска Стопанинът да СЕ ПОДРАЗБИРА
 * ОТ ДЛЪЖНОСТТА („всички са Служители, а стопанинът се подразбира при избора на
 * длъжността"). В мига, в който това стане, незащитената Длъжност се превръща в
 * пътя за отнемане на властта — затова пазачът влиза ПРЕДИ извеждането, не след.
 *
 * Пази се и ИЗКЛЮЧВАНЕТО на реда: изключен ред не се брои за жив, тоест
 * Длъжността изчезва по друг път за същия резултат.
 */
export function zashtoNePipaStopanina(
  o: Ogledalo,
  tablitsa: string,
  id: string,
  koloni: readonly string[],
): string | null {
  if (o.stopanin === '') return null;
  if (tablitsa !== 'stopani' && tablitsa !== 'sluzhiteli') return null;
  // само раздаването и изключването пипат Длъжността · телефонът и адресът не
  if (!koloni.includes('dlazhnost')) return null;
  const tv = o.tablitsi.get(tablitsa);
  if (tv === undefined) return null;
  for (const i of zhiviteRedove(tv)) {
    if (tv.id[i] !== id) continue;
    const k = kletkaNa(tv, i, 'imeyl');
    const imeyl = k !== null && 'tekst' in k ? k.tekst : '';
    if (svedeno(imeyl) !== svedeno(o.stopanin)) return null;
    return 'Длъжността на първия Стопанин е НЕПРИКОСНОВЕНА · не се променя никога от никого (негово, 08.09).';
  }
  return null;
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
 *
 * ═══ ДВА ЖИВИ РЕДА ЗА ЕДНА ДЛЪЖНОСТ · ПЕЧЕЛИ ПОСЛЕДНИЯТ (Т31) ═══
 *
 * Журналът е само за добавяне (правило 1): поправката НЕ мени стария ред, а
 * добавя нов. Значи в таблицата може да стоят два живи реда за една и съща
 * Длъжност, и по-новият е поправката.
 *
 * Дотук тук се връщаше ПЪРВИЯТ намерен, тоест печелеше НАЙ-СТАРИЯТ — и стеснено
 * право, записано с нов ред, не влизаше в сила. Дупката е точно в посоката, в
 * която боли: отнемане на достъп, което не се случва.
 *
 * `zhiviteRedove` върви по реда на записване, затова последното съвпадение е
 * най-новото.
 */
export function dostapaNaDlazhnostta(o: Ogledalo, dlazhnost: string): DostapNaDlazhnost {
  const tv = o.tablitsi.get(TABLITSA);
  if (tv !== undefined) {
    let posleden: Record<OsNaDostapa, string> | null = null;
    for (const i of zhiviteRedove(tv)) {
      const kl = kletkaNa(tv, i, 'dlazhnost');
      const tekst = kl === null ? '' : tekstNaIzbora(o, TABLITSA, 'dlazhnost', kl);
      if (svedeno(tekst) !== svedeno(dlazhnost)) continue;
      const dumi = {} as Record<OsNaDostapa, string>;
      for (const os of OSI_NA_DOSTAPA) {
        const k = kletkaNa(tv, i, os);
        dumi[os] = k !== null && 'tekst' in k ? k.tekst : '';
      }
      posleden = dumi;
    }
    if (posleden !== null) {
      return { dlazhnost, dumi: posleden, pravo: ottsenka(posleden), zapisan: true };
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
    if (!obhvatatPokriva(obhvat, hedar)) return false;
    // късото име не бива да отваря ДВЕ секции · Т44
    return !imetoEDvusmisleno(o, obhvat, hedar);
  });
}

/**
 * ДВУСМИСЛЕНОТО КЪСО ИМЕ · Т44 · и защо не се пита човекът за него.
 *
 * Неговият D19 пише „Заплати", а секциите Разходи са осем и ДВЕ започват със
 * „Заплати": **Заплати Кеш** и **Заплати Банка**. Сравнението по цяло име отваря
 * и двете — тоест едно късо име раздава повече, отколкото стои в изречението.
 *
 * ═══ КОЯ Е ИМАЛ ПРЕДВИД · отговорът е в НЕГОВИТЕ думи, не в предположение ═══
 *
 * Трите имена в D19 са ТОЧНО трите секции на блока „Вкарване": Заплати Кеш ·
 * Фактури Кеш · Фактури Карта. Същата тройка я казва и другаде: „Всичко освен
 * Кредит, а именно: Заплати, Фактури Кеш и Фактури Карта" — онова, което се
 * пише НА РЪКА. Банковото изобщо не се въвежда: „При Фактури банка няма да се
 * въвеждат ръчно, а ще се обобщават от извлеченията."
 *
 * Значи „Заплати" в неговото изречение е **Заплати Кеш**.
 *
 * ═══ КАКВО ПРАВИ КОДЪТ ═══
 *
 * Изречението му НЕ се пипа (правило 17 · К1). Стеснява се СРАВНЯВАНЕТО: късо
 * име, което сочи повече от една жива секция, отваря САМО онази, която стои
 * заедно с останалите имена от същия обхват — тоест кешовата, когато обхватът
 * говори за кеш. Няма ли такава опора, не отваря НИТО ЕДНА (подразбирането е
 * отказ) и това се вижда в отказа на екрана.
 */
function imetoEDvusmisleno(o: Ogledalo, obhvat: string, hedar: string): boolean {
  const imena = obhvat
    .replace(/^[^:]*:\s*/, '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x !== '');

  // кое от имената покрива този хедър · то е „късото име"
  const kratkoto = imena.find((ime) => obhvatatPokriva(ime, hedar));
  if (kratkoto === undefined) return false;

  const vsichki = zhivitéSektsii(o);
  const pokriti = vsichki.filter((s) => obhvatatPokriva(kratkoto, s));
  if (pokriti.length <= 1) return false;

  // ДВЕ или повече · печели онази, чиято допълваща дума се среща и в останалите
  // имена от същия обхват („Кеш" стои във „Фактури Кеш")
  const drugite = new Set(imena.filter((x) => x !== kratkoto).flatMap((x) => dumite(x)));
  const kratkite = new Set(dumite(kratkoto));
  const podkrepeni = pokriti.filter((s) =>
    dumite(s)
      .filter((d) => !kratkite.has(d))
      .some((d) => drugite.has(d)),
  );

  // подкрепена е точно една → тя минава, другите са двусмислени
  if (podkrepeni.length === 1) return podkrepeni[0] !== svedeno(hedar) && podkrepeni[0] !== hedar;
  // няма опора или има повече от една → никоя не се отваря
  return true;
}

/** Живите секции · и двете страни, по имената им от номенклатурата. */
function zhivitéSektsii(o: Ogledalo): string[] {
  const imena: string[] = [];
  for (const klyuch of Object.values(NOMENKLATURA_NA_STRANATA)) {
    const n = o.nomenklaturi.get(klyuch);
    if (n === undefined) continue;
    for (const s of zhivite(n)) imena.push(s.tekst);
  }
  return imena;
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
 *
 * ═══ ПОКАЗАНОТО И ДЕЙСТВАЩОТО СА ЕДНО (Т32 · Т25) ═══
 *
 * Дотук тази функция четеше ПЪРВАТА намерена Длъжност и връщаше нейните думи —
 * а записът се пита от `pravotoNaImeyla`, което прави ДРУГИ три неща: знае за
 * Стопанина, отказва на човек без Длъжност, и взима НАЙ-ТЯСНОТО от всичките му
 * Длъжности.
 *
 * Тоест Профилът лъжеше в двете посоки наведнъж: Стопанин без ред в Достъп
 * четеше „Скрито" по четирите оси, докато реално редактира; а човек с две
 * Длъжности виждаше по-широката, докато го пази по-тясната.
 *
 * Екран, който казва различно от вратата, е по-опасен от екран, който мълчи:
 * човекът си вярва и се оплаква за нещо, което работи, или разчита на право,
 * което го няма. Затова тук се повтарят СЪЩИТЕ три правила, в същия ред.
 */
export function dostapaMi(
  o: Ogledalo,
  imeyl: string,
): { dlazhnost: string; osi: readonly { os: string; dumi: string; pravo: string }[] } {
  const dlazhnosti = dlazhnostiteNaImeyla(o, imeyl);
  const dlazhnost = dlazhnosti[0] ?? '';
  const koloni = tablitsata(MODEL, TABLITSA).koloni;
  const stopanin = eStopaninat(o, imeyl);

  return {
    dlazhnost,
    osi: OSI_NA_DOSTAPA.map((os) => {
      const ime = koloni.find((c) => c.klyuch === os)?.ime ?? os;

      // Стопанинът е над Длъжностите · същото заобикаляне като в `pravotoNaImeyla`
      if (stopanin) {
        const dumi = dlazhnosti
          .map((dl) => dostapaNaDlazhnostta(o, dl).dumi[os])
          .filter((d) => d !== '')
          .join(' · ');
        return {
          os: ime,
          dumi: dumi === '' ? 'Стопанин на Книгата · над Длъжностите' : dumi,
          pravo: DUMI_NA_PRAVOTO['redaktira'],
        };
      }

      // човек без Длъжност е СКРИТ · подразбирането е ОТКАЗ (Т41)
      if (dlazhnosti.length === 0) {
        return { os: ime, dumi: '', pravo: DUMI_NA_PRAVOTO['skrito'] };
      }

      // няколко Длъжности · печели НАЙ-ТЯСНОТО (правило 18), както при записа
      const dostapi = dlazhnosti.map((dl) => dostapaNaDlazhnostta(o, dl));
      const pravo = dostapi.map((d) => d.pravo[os]).reduce((a, b) => poTyasnoto(a, b));
      const dumi = dostapi
        .map((d) => d.dumi[os])
        .filter((d) => d !== '')
        .join(' · ');
      return { os: ime, dumi, pravo: DUMI_NA_PRAVOTO[pravo] };
    }),
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
