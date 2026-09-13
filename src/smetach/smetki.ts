/**
 * СМЕТКИТЕ · секциите, сборовете и кешът (ADR-006).
 *
 * Листът му (36–91) е ДВЕ ленти — ПРИХОД и Разходи — и под всяка неговите
 * секции (Наем Банка · Наем Кеш · Бизнес · Други; Заплати Кеш · Фактури Кеш ·
 * Фактури Карта · Фактури Бнка · Кредити · Банкови такси · Заплати Банка ·
 * Бизнес), всяка с ред „ОБЩ Бюджет Сметки" (негови K37 · K43).
 *
 * ЗНАКЪТ решава страната (правило 16): приходът е +, разходът е −. Секцията
 * назовава МЯСТОТО вътре в страната; двете трябва да си съответстват, и това е
 * предусловие на командата, не мълчалива поправка. „Бизнес" е дума и в двете
 * номенклатури — точно неговото B6: „Ако е на загуба се изпраща сметката с
 * знак - в Разходи."
 *
 * Всичко тук е ЧИСТО смятане върху Огледалото: нищо не пише, нищо не помни.
 * Парите са цели центове (правило 3); сверката се записва и когато е нула
 * (правило 7).
 */

import type { Strana } from '../model/kolona.js';
import { podravni } from '../model/nomenklatura.js';
import { NOMENKLATURA } from '../model/osnova.js';
import { type Pomosht, pomosht } from '../model/pomosht.js';
import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { kletkaNa, zhiviteRedove } from '../ogledalo/tablitsa.js';
import { sabiri, tsentove } from '../yadro/pari.js';
import { sverka, type Sverka } from '../yadro/sverka.js';

const TABLITSA_NA_DVIZHENIYATA = 'dvizheniya';
const TABLITSA_NA_KESHA = 'kesh';
/** месецът е ГГГГ-ММ · наша колона под неговата глава „Дата" */
export const OBRAZETS_NA_MESETSA = /^\d{4}-(0[1-9]|1[0-2])$/;
/** неговите две секции за кеш · сверката в края на месеца е за тях (05.09 т.2) */
export const SEKTSIYA_ZAPLATI_KESH = 'Заплати Кеш';
export const SEKTSIYA_FAKTURI_KESH = 'Фактури Кеш';
/** третата от секцията „Вкарване" · негово т.3 */
const SEKTSIYA_FAKTURI_KARTA = 'Фактури Карта';

export type { Strana } from '../model/kolona.js';

/** Коя колона на движението носи секцията на всяка страна. */
export const KOLONA_NA_SEKTSIYATA: Readonly<Record<Strana, string>> = Object.freeze({
  prihod: 'sektsiya',
  razhod: 'sektsiyaR',
});

export const NOMENKLATURA_NA_STRANATA: Readonly<Record<Strana, string>> = Object.freeze({
  prihod: NOMENKLATURA.sektsiiPrihod,
  razhod: NOMENKLATURA.sektsiiRazhodi,
});

export const IMENA_NA_STRANITE: Readonly<Record<Strana, string>> = Object.freeze({
  prihod: 'ПРИХОД',
  razhod: 'Разходи',
});

/**
 * ИЗВЕДЕНА КОЛОНА · число, което се СМЯТА и се показва като глава, но никой не
 * го пише — затова не е колона на Модела и няма дом в `osnova.ts`. Домът ѝ е при
 * формулата: тук, в `dds.ts` и в калкулатора. Екранът взима главата и помощта
 * оттук, за да не ги изписва на ръка над всяка таблица.
 */
export interface IzvedenaKolona {
  readonly klyuch: string;
  readonly ime: string;
  readonly pomosht: Pomosht;
}

/**
 * ИЗВЕДЕНИТЕ НА СМЕТКИ · главите на сборовете и на кеша, с помощта им.
 *
 * Всяка казва точно онова, което функциите долу смятат: `smetkite` дава сбора по
 * секция и по страна върху периода на екрана; ОБЩ на страната на екрана е този
 * сбор плюс редовете на ДДС от същата страна; `vkarvaneto` — трите секции;
 * `keshatNaMeseca` — трите числа на кеша. Скрита страна ПАК се смята.
 */
export const IZVEDENITE_NA_SMETKITE: readonly IzvedenaKolona[] = Object.freeze([
  {
    klyuch: 'prihod',
    ime: 'ОБЩ ПРИХОД',
    pomosht: pomosht(
      'Сборът на секциите в ПРИХОД за периода на екрана плюс редовете на ДДС за възстановяване. Скрита страна пак се смята; спряна секция с редове пак се брои.',
      'сбор на секциите в Приход + ДДС за възстановяване',
    ),
  },
  {
    klyuch: 'razhod',
    ime: 'ОБЩ Разходи',
    pomosht: pomosht(
      'Сборът на секциите в Разходи за периода на екрана плюс редовете на ДДС за внасяне — всичко с минус. Скрита страна пак се смята; спряна секция с редове пак се брои.',
      'сбор на секциите в Разходи + ДДС за внасяне · с минус',
    ),
  },
  {
    klyuch: 'rezultat',
    ime: 'Резултат',
    pomosht: pomosht(
      'Приход плюс разход — разходът е записан с минус, затова се събира, не се вади. Плюс е печалба за периода, минус е загуба.',
      'приход + разход · разходът е с минус',
    ),
  },
  {
    klyuch: 'sektsiya',
    ime: 'ОБЩ Бюджет Сметки',
    pomosht: pomosht(
      'Сборът на редовете в една секция за периода на екрана, в цели центове и със знака им. Секция, спряна от Настройки, пак се брои, ако има редове.',
      'сбор на редовете в секцията · влиза в ОБЩ на страната',
    ),
  },
  {
    klyuch: 'vkarvane',
    ime: 'ОБЩ Вкарване',
    pomosht: pomosht(
      'Сборът на редовете в трите секции за вкарване — Заплати Кеш, Фактури Кеш, Фактури Карта — за периода. Липсва ли секция (преименувана), липсата се казва и вкарването се затваря.',
      'сбор на Заплати Кеш + Фактури Кеш + Фактури Карта',
    ),
  },
  {
    klyuch: 'kesh-dadeno',
    ime: 'Кеш дадено',
    pomosht: pomosht(
      'Даденото в брой за месеца · СМЯТА СЕ от редовете в двете кеш секции, не се пише (негово, 13.09). Сверява се с изтегленото по банковото извлечение, и разликата се записва и когато е нула.',
      'сборът на редовете в Заплати Кеш и Фактури Кеш за месеца',
    ),
  },
  {
    klyuch: 'kesh-izvlechenie',
    ime: 'Кеш изтеглено',
    pomosht: pomosht(
      'Изтегленото в брой по банковото извлечение за месеца · ЕДИНСТВЕНОТО, което се пише в реда на кеша. Сверява се срещу даденото — банката срещу въведеното, два независими пътя.',
      'изтеглено по извлечение · сверка: дадено ↔ изтеглено',
    ),
  },
  {
    klyuch: 'kesh-razlika',
    ime: 'Кеш разлика',
    pomosht: pomosht(
      'Дадено минус изтеглено за месеца. Нулата значи, че сверката банка ↔ въведено затваря; всяко друго число са пари, които стоят между банката и ръката.',
      'дадено − изтеглено за месеца · нулата значи, че сверката затваря',
    ),
  },
]);

/** Страната по ЗНАКА (правило 16) · нулата не е движение и няма страна. */
export function stranaNaSuma(suma_st: number): Strana | null {
  if (suma_st > 0) return 'prihod';
  if (suma_st < 0) return 'razhod';
  return null;
}

export interface RedVSektsiya {
  readonly i: number;
  readonly id: string;
  readonly suma_st: number;
  readonly mesets: string;
  /**
   * ДЕНЯТ НА ПАРИТЕ · `ГГГГ-ММ-ДД` · празен, когато не е попълнен.
   *
   * Негово, 11.09 (запис 195), точка 3: „Да има дата на всяка цифра." Датата е
   * ПО ИЗБОР: празна ли е, редът пада на първия ден от месеца си, както беше
   * винаги — месецът остава задължителен, защото по него се сверяват кешът и
   * ДДС, а те са месечни по негова дума.
   */
  readonly data: string;
}

export interface Sektsiya {
  readonly strana: Strana;
  readonly nomer: number;
  readonly tekst: string;
  readonly redove: readonly RedVSektsiya[];
  /** цели центове · със знака, както е записан */
  readonly sbor: number;
  /**
   * СПРЯНА от Настройки · но редовете ѝ ПАК СЕ СМЯТАТ (правило 18).
   *
   * Спирането маха стойността от ИЗБОРА за нови редове, не от миналото.
   * Екранът я рисува с „· спряна", а сборът я брои — инак пари изчезват.
   */
  readonly spryana: boolean;
}

export interface Smetki {
  readonly prihod: readonly Sektsiya[];
  readonly razhod: readonly Sektsiya[];
  readonly sborPrihod: number;
  readonly sborRazhod: number;
  /** приход + разход · разходът е отрицателен, затова се СЪБИРА */
  readonly rezultat: number;
  /** движения без секция или с празна сума · казват се, не се крият */
  readonly bezSektsiya: readonly number[];
  readonly broyDvizheniya: number;
  readonly sverka: Sverka;
}

function tekstNa(o: Ogledalo, tablitsa: string, i: number, kolona: string): string {
  const tv = o.tablitsi.get(tablitsa);
  const k = tv === undefined ? null : kletkaNa(tv, i, kolona);
  return k !== null && 'tekst' in k ? k.tekst : '';
}

function tsentoveNa(o: Ogledalo, tablitsa: string, i: number, kolona: string): number | null {
  const tv = o.tablitsi.get(tablitsa);
  const k = tv === undefined ? null : kletkaNa(tv, i, kolona);
  return k !== null && 'stoynost_st' in k ? k.stoynost_st : null;
}

/**
 * Секциите на двете страни · всяка с редовете и сбора си · плюс резултатът.
 *
 * `prezMeseca` пресява по месец (периодът на екрана); без него влиза всичко.
 * Сверка (правило 7): движенията в секции + без секция = всички живи движения.
 */
export function smetkite(
  o: Ogledalo,
  kogato: string,
  prezMeseca?: (mesets: string) => boolean,
): Smetki {
  const tv = o.tablitsi.get(TABLITSA_NA_DVIZHENIYATA);
  const poSektsiya = new Map<string, RedVSektsiya[]>();
  const bezSektsiya: number[] = [];
  let broyDvizheniya = 0;
  if (tv !== undefined) {
    for (const i of zhiviteRedove(tv)) {
      const mesets = tekstNa(o, TABLITSA_NA_DVIZHENIYATA, i, 'mesets');
      if (prezMeseca !== undefined && !prezMeseca(mesets)) continue;
      broyDvizheniya += 1;
      const suma_st = tsentoveNa(o, TABLITSA_NA_DVIZHENIYATA, i, 'suma') ?? 0;
      const data = tekstNa(o, TABLITSA_NA_DVIZHENIYATA, i, 'data');
      const red: RedVSektsiya = { i, id: tv.id[i] ?? '', suma_st, mesets, data };
      let namerena = false;
      for (const strana of ['prihod', 'razhod'] as const) {
        const k = kletkaNa(tv, i, KOLONA_NA_SEKTSIYATA[strana]);
        if (k === null || !('nomer' in k)) continue;
        const klyuch = `${strana}#${k.nomer}`;
        poSektsiya.set(klyuch, [...(poSektsiya.get(klyuch) ?? []), red]);
        namerena = true;
      }
      if (!namerena) bezSektsiya.push(i);
    }
  }
  const sektsiiteNa = (strana: Strana): Sektsiya[] => {
    const n = o.nomenklaturi.get(NOMENKLATURA_NA_STRANATA[strana]);
    if (n === undefined) return [];
    /**
     * ВСИЧКИ стойности, не само живите · поправка 08.09.2026.
     *
     * Дотук се вървеше по `zhivite(n)`. Спряна секция тогава изобщо не се
     * раждаше, а редовете ѝ вече бяха отбелязани с `namerena = true` (клетката
     * ИМА номер) и затова не падаха и в `bezSektsiya`. Резултатът: движение в
     * спряна секция изчезваше от `sborPrihod`/`sborRazhod` И от изнесената
     * Книга — мълчаливо, с разписка, която го брои за изнесен.
     *
     * Правило 18 казва обратното с четири думи: „скритото пак се смята".
     *
     * Спряна секция БЕЗ редове не се ражда — тя е шум, не история.
     */
    return n.stoynosti
      .map((s) => {
        const redove = poSektsiya.get(`${strana}#${s.nomer}`) ?? [];
        return {
          strana,
          nomer: s.nomer,
          tekst: s.tekst,
          redove,
          // сборът минава през преградата за цели центове (правило 3): число извън тях е отказ
          sbor: sabiri(...redove.map((r) => tsentove(r.suma_st))),
          spryana: s.spryana === true,
        };
      })
      .filter((sek) => !sek.spryana || sek.redove.length > 0);
  };
  const prihod = sektsiiteNa('prihod');
  const razhod = sektsiiteNa('razhod');
  const sborPrihod = sabiri(...prihod.map((s) => tsentove(s.sbor)));
  const sborRazhod = sabiri(...razhod.map((s) => tsentove(s.sbor)));
  const vSektsii = [...prihod, ...razhod].reduce((a, s) => a + s.redove.length, 0);
  return {
    prihod,
    razhod,
    sborPrihod,
    sborRazhod,
    rezultat: sabiri(sborPrihod, sborRazhod),
    bezSektsiya,
    broyDvizheniya,
    sverka: sverka(
      'Сметки · движения в секции + без секция',
      broyDvizheniya,
      vSektsii + bezSektsiya.length,
      kogato,
    ),
  };
}

export interface Vkarvane {
  readonly sektsii: readonly Sektsiya[];
  readonly redove: readonly RedVSektsiya[];
  readonly sbor: number;
  /**
   * КОИ ОТ ТРИТЕ ЛИПСВАТ · и защо това поле съществува (Т29).
   *
   * Трите секции се познават по ТЕКСТ срещу зашити низове. Преименува ли се
   * някоя от Настройки, тя изпадаше МЪЛЧАЛИВО — `.filter(x !== undefined)`
   * я махаше и никой не научаваше. А гардът на екрана беше `sektsii.every(…)`,
   * тъй че при изпаднали и трите списъкът ставаше празен, `[].every(...)` е
   * `true`, и „Вкарване" се ОТВАРЯШЕ за всички.
   *
   * Сега липсата се НОСИ и се КАЗВА (правило 12), вместо да се преглъща.
   */
  readonly lipsvashti: readonly string[];
}

/**
 * СЕКЦИЯТА „ВКАРВАНЕ" · трите му секции на ЕДНО място (негово, 05.09 т.3):
 * „В таблиците за вкарването на Заплати, Фактури Кеш и Фактури Карта да са на
 * едно място в една секция за да се дава за Помощник Управителя да вкарва тези
 * три таблици." Правото на Помощник Управителя се ЧЕТЕ от листа Служители
 * (резен 4 · ADR-008) и отказът се КАЗВА на екрана.
 */
export function vkarvaneto(
  o: Ogledalo,
  kogato: string,
  prezMeseca?: (m: string) => boolean,
): Vkarvane {
  const s = smetkite(o, kogato, prezMeseca);
  const trite = [SEKTSIYA_ZAPLATI_KESH, SEKTSIYA_FAKTURI_KESH, SEKTSIYA_FAKTURI_KARTA];
  const namereni = trite.map((tekst) => ({
    tekst,
    sek: s.razhod.find((x) => podravni(x.tekst) === podravni(tekst)),
  }));
  const sektsii = namereni.map((x) => x.sek).filter((x): x is Sektsiya => x !== undefined);
  const lipsvashti = namereni.filter((x) => x.sek === undefined).map((x) => x.tekst);
  const redove = sektsii.flatMap((x) => x.redove);
  return { sektsii, redove, sbor: sabiri(...redove.map((r) => tsentove(r.suma_st))), lipsvashti };
}

export interface Kesh {
  readonly mesets: string;
  /**
   * ДАДЕНИТЕ ПАРИ В БРОЙ · СМЯТАТ СЕ, не се пишат.
   *
   * Негово, 13.09 (запис 203), точка 3: „**дадени за Заплати Кеш и дадени за
   * Фактури Кеш се смятат в подтабовете и тук идват готови без възможност да
   * се коригират.**" Домът им са редовете в двете кеш секции на Разходи; тук
   * само се събират. Дотук те бяха ВТОРИ независим път срещу същите редове —
   * човек ги пишеше на ръка и сверката ги сравняваше. Той махна ръката, значи
   * и сверката „дадено ↔ вкарано" си отива: тя стана тъждество.
   *
   * Втората СВЕРКА остава и тя е важната (правило 3): дадено ↔ ИЗТЕГЛЕНО по
   * банковото извлечение — въведеното срещу банката, два наистина различни пътя.
   */
  readonly zaplati: number;
  readonly fakturi: number;
  readonly dadeno: number;
  /** изтеглено по банковото извлечение в края на месеца */
  readonly izvlechenie: number;
  /** вкараното по редовете · сборът на движенията в двете кеш секции за месеца */
  readonly vkarano: number;
  readonly sverki: readonly Sverka[];
}

/**
 * НАТРУПАНИЯТ КЕШ · през ВСИЧКИ месеци · за Трезора.
 *
 * Негово, 13.09 (запис 203), точка 4: вноските „**се трупат**" в Трезора, и
 * той показва „**всичко което притежаваме Кеш**". Каса не се води по месец —
 * затова тук няма месец, а сбор по всички живи редове.
 */
export function natrupaniyatKesh(
  o: Ogledalo,
  kogato: string,
): Pick<Kesh, 'izvlechenie' | 'dadeno'> {
  const tv = o.tablitsi.get(TABLITSA_NA_KESHA);
  let izvlechenie = 0;
  if (tv !== undefined)
    for (const i of zhiviteRedove(tv))
      izvlechenie += tsentoveNa(o, TABLITSA_NA_KESHA, i, 'izvlechenie') ?? 0;
  const s = smetkite(o, kogato);
  const vSektsiyata = (tekst: string): number =>
    s.razhod.find((x) => podravni(x.tekst) === podravni(tekst))?.sbor ?? 0;
  const dadeno =
    Math.abs(vSektsiyata(SEKTSIYA_ZAPLATI_KESH)) + Math.abs(vSektsiyata(SEKTSIYA_FAKTURI_KESH));
  return { izvlechenie, dadeno };
}

/**
 * КЕШЪТ за един месец · дадено ↔ изтеглено ↔ вкарано по редовете.
 *
 * Негово (05.09 т.2): „…дава възможност за въвеждане на информация за дадени
 * Кеш пари за Заплати и Фактури Кеш и сверка на края на месеца от извлечението."
 * Разходите са записани с МИНУС (знакът решава страната), затова вкараното се
 * сравнява по абсолютна стойност с дадените пари.
 */
export function keshatNaMeseca(o: Ogledalo, mesets: string, kogato: string): Kesh {
  const tv = o.tablitsi.get(TABLITSA_NA_KESHA);
  let i: number | undefined;
  if (tv !== undefined) {
    for (const r of zhiviteRedove(tv)) {
      if (tekstNa(o, TABLITSA_NA_KESHA, r, 'mesets') === mesets) i = r;
    }
  }
  const pole = (kolona: string): number =>
    i === undefined ? 0 : (tsentoveNa(o, TABLITSA_NA_KESHA, i, kolona) ?? 0);
  const izvlechenie = pole('izvlechenie');
  const s = smetkite(o, kogato, (m) => m === mesets);
  const vSektsiyata = (tekst: string): number =>
    s.razhod.find((x) => podravni(x.tekst) === podravni(tekst))?.sbor ?? 0;
  const vkarano = vSektsiyata(SEKTSIYA_ZAPLATI_KESH) + vSektsiyata(SEKTSIYA_FAKTURI_KESH);
  // редовете са РАЗХОД и се пазят с минус · дадените пари са положително число
  const zaplati = Math.abs(vSektsiyata(SEKTSIYA_ZAPLATI_KESH));
  const fakturi = Math.abs(vSektsiyata(SEKTSIYA_FAKTURI_KESH));
  const dadeno = zaplati + fakturi;
  return {
    mesets,
    zaplati,
    fakturi,
    dadeno,
    izvlechenie,
    vkarano,
    // ЕДНА сверка · другата стана тъждество, когато дадените пари почнаха да се
    // смятат от същите редове, срещу които се сверяваха (негово, 13.09 т.3)
    sverki: [sverka(`кеш ${mesets} · дадено ↔ изтеглено`, dadeno, izvlechenie, kogato)],
  };
}
