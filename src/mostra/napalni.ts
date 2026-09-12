/**
 * МОСТРАТА · програмата, напълнена с ИЗМИСЛЕНИ данни, с едно натискане.
 *
 * Негово, 11.09 (запис 184): „Искам да ми напълниш всяка функционалност с
 * информация измислена… След толкова много време и пари имаш ли нещо работещо."
 *
 * Дотук програмата тръгваше ПРАЗНА: човекът виждаше осем прозореца с нула реда
 * и трябваше сам да въведе всичко, преди да разбере какво прави. Тук е един
 * бутон, който пише РЕАЛНИ събития през Портата — същите команди, същата Врата,
 * същият Журнал, както ако човек ги беше натракал. Нищо не се подменя и нищо не
 * се прескача: мострата е данни, не режим.
 *
 * ТРИ ГРАНИЦИ:
 *
 *   1. Само през Портата (К2 · правило 2). Никакъв пряк запис в Журнала.
 *   2. Имената са ИЗМИСЛЕНИ. Нито едно лично име, нито един истински имейл,
 *      нито едно число от неговите таблици (правило 21).
 *   3. Не пипа заварено. Има ли вече редове в таблицата, тя се прескача —
 *      мострата не удвоява и не трие.
 */

import type { Kletka, Kletki } from '../model/kletka.js';
import { TABLITSI } from '../model/osnova.js';
import type { Ogledalo } from '../ogledalo/ogledalo.js';
import type { Porta } from '../porta/porta.js';

/**
 * ЦЕЛИЯТ ред, не само попълненото · схемата на командата иска ВСЯКА колона.
 *
 * Празната клетка е `null` и това е решение, не пропуск (`Kletki`): така
 * „не съм попълнил" и „изпразних" са едно и също нещо за Вратата, и мострата
 * не може да изпусне колона, добавена утре от Настройки.
 */
function redNa(tablitsa: string, dadeni: Kletki): { readonly kletki: Kletki } {
  const t = TABLITSI.find((x) => x.klyuch === tablitsa);
  if (t === undefined) throw new TypeError(`Мострата не намира таблица „${tablitsa}".`);
  const kletki: Record<string, Kletka | null> = {};
  for (const k of t.koloni) {
    if (k.vid === 'nomeratsiya' || k.zatvorena) continue;
    kletki[k.klyuch] = dadeni[k.klyuch] ?? null;
  }
  return { kletki };
}

/** Какво е напълнено · за разписката на екрана. */
export interface RedNaMostrata {
  readonly kakvo: string;
  readonly broy: number;
  /** думите на отказа, ако Вратата е отказала · празно, когато е минало */
  readonly otkaz: string;
}

const evro = (cyalo: number): { readonly stoynost_st: number } => ({ stoynost_st: cyalo * 100 });
const kvm = (m2: number): { readonly chislo: number } => ({ chislo: Math.round(m2 * 10_000) });
const tekst = (t: string): { readonly tekst: string } => ({ tekst: t });
const nomer = (n: number): { readonly nomer: number } => ({ nomer: n });

/** Ключ на действие · нов при всяко викане, за да не се сблъска с предишно пълнене. */
function klyuchNaDeystvie(): string {
  return `mostra-${crypto.randomUUID()}`;
}

/** Броят живи редове в таблица · 0, ако таблицата още я няма в Огледалото. */
function broyRedove(o: Ogledalo, tablitsa: string): number {
  return o.tablitsi.get(tablitsa)?.broy ?? 0;
}

/** Идентификаторът на n-тия ред отзад напред · за връзките между таблиците. */
function idNaRed(o: Ogledalo, tablitsa: string, otKraya = 0): string {
  const t = o.tablitsi.get(tablitsa);
  const spisak = t?.id ?? [];
  return spisak[spisak.length - 1 - otKraya] ?? '';
}

/**
 * Месец в миналото · `YYYY-MM`, броено от подадения ден.
 *
 * Денят идва отвън: часовникът е на повикващия, а не скрит тук — инак тестът
 * щеше да дава различен резултат според това кога се пуска.
 */
function mesetsPredi(dnes: string, nazad: number): string {
  const [g, m] = dnes.split('-');
  const obshto = Number(g) * 12 + (Number(m) - 1) - nazad;
  const godina = Math.floor(obshto / 12);
  const mesets = obshto - godina * 12 + 1;
  return `${godina}-${String(mesets).padStart(2, '0')}`;
}

/** Ден от месец в миналото · `YYYY-MM-DD`. */
function den(dnes: string, nazad: number, chislo: number): string {
  return `${mesetsPredi(dnes, nazad)}-${String(chislo).padStart(2, '0')}`;
}

const IME_NA_STOPANINA = 'Стопанинът на пробната Книга';
const IMOTITE = ['Слънчева поляна', 'Бяла къща', 'Крайречен парцел'] as const;

/**
 * НАПЪЛВА програмата с мостра · връща по един ред за всяка стъпка.
 *
 * `imeyl` е актьорът на това устройство: Книгата се открива с неговия имейл
 * (`stopanin.otkriy` го проверява), затова мострата не си измисля друг.
 */
export async function napalniSMostra(
  porta: Porta,
  imeyl: string,
  dnes: string,
): Promise<readonly RedNaMostrata[]> {
  const redove: RedNaMostrata[] = [];

  /** Едно действие през Портата · връща думите на отказа или празно. */
  const deystvie = async (klyuch: string, tovar: unknown): Promise<string> => {
    const r = await porta.izpalni(klyuchNaDeystvie(), klyuch, tovar);
    return 'seqove' in r ? '' : r.zashto.join(' ');
  };

  /** Една стъпка · прескача се, ако таблицата вече има редове. */
  const stapka = async (
    kakvo: string,
    tablitsa: string,
    komanda: string,
    tovari: readonly unknown[],
  ): Promise<void> => {
    if (broyRedove(porta.ogledalo(), tablitsa) > 0) {
      redove.push({ kakvo, broy: 0, otkaz: 'вече има редове · мострата не удвоява' });
      return;
    }
    let broy = 0;
    let otkaz = '';
    for (const t of tovari) {
      // товарът за нов ред се допълва до ЦЕЛИЯ ред; месечните команди са плоски
      const tovar =
        typeof t === 'object' && t !== null && 'kletki' in t
          ? redNa(tablitsa, (t as { readonly kletki: Kletki }).kletki)
          : t;
      const dumi = await deystvie(komanda, tovar);
      if (dumi === '') broy += 1;
      else if (otkaz === '') otkaz = dumi;
    }
    redove.push({ kakvo, broy, otkaz });
  };

  // ── Книгата · първото събитие в Журнала ────────────────────────────────
  if (porta.ogledalo().stopanin === '') {
    const dumi = await deystvie('stopanin.otkriy', { imeyl });
    redove.push({ kakvo: 'Книгата е открита', broy: dumi === '' ? 1 : 0, otkaz: dumi });
  }

  // ── Служители · Стопанинът, двама души, две длъжности ──────────────────
  await stapka('Стопани', 'stopani', 'sluzhiteli.dobaviStopan', [
    {
      kletki: {
        ime: tekst(IME_NA_STOPANINA),
        imeyl: tekst(imeyl),
        telefon: tekst('0888 000 001'),
        dlazhnost: nomer(1),
      } satisfies Kletki,
    },
  ]);

  await stapka('Служители и техните данни', 'sluzhiteli', 'sluzhiteli.dobaviSluzhitel', [
    {
      kletki: {
        ime: tekst('Мария Пробна'),
        imeyl: tekst('mariya@example.bg'),
        telefon: tekst('0888 000 002'),
        dlazhnost: nomer(3),
      } satisfies Kletki,
    },
    {
      kletki: {
        ime: tekst('Георги Пробен'),
        imeyl: tekst('georgi@example.bg'),
        telefon: tekst('0888 000 003'),
        dlazhnost: nomer(3),
      } satisfies Kletki,
    },
  ]);

  await stapka('Достъп на Длъжности', 'dostap', 'sluzhiteli.dobaviDlazhnost', [
    {
      kletki: {
        dlazhnost: nomer(3),
        tabove: tekst('Вижда всичко'),
        hedari: tekst('Вижда само всичко'),
        redove: tekst('Вижда само всичко'),
        zhurnal: tekst('Вижда само всичко'),
      } satisfies Kletki,
    },
  ]);

  // ── Имоти · Обекти · Бизнеси ───────────────────────────────────────────
  await stapka(
    'Имоти',
    'imoti',
    'imoti.sazdayImot',
    IMOTITE.map((ime, i) => ({
      kletki: {
        ime: tekst(ime),
        sastoyanie: nomer(i === 2 ? 1 : 2),
        plosht: kvm([1200, 640, 2400][i] ?? 500),
        tsena: evro([180_000, 95_000, 240_000][i] ?? 50_000),
        adres: tekst(`ул. Пробна ${i + 1}`),
      } satisfies Kletki,
    })),
  );

  const imot = (i: number): string => idNaRed(porta.ogledalo(), 'imoti', IMOTITE.length - 1 - i);

  await stapka('Обекти', 'obekti', 'imoti.dobaviObekt', [
    {
      kletki: {
        imot: tekst(imot(0)),
        kategoriya: nomer(1),
        vid: nomer(1),
        nomer: { chislo: 1 },
        plosht: kvm(78),
        tsena: evro(96_000),
      } satisfies Kletki,
    },
    {
      kletki: {
        imot: tekst(imot(0)),
        kategoriya: nomer(1),
        vid: nomer(1),
        nomer: { chislo: 2 },
        plosht: kvm(64.5),
        tsena: evro(81_000),
      } satisfies Kletki,
    },
    {
      kletki: {
        imot: tekst(imot(1)),
        kategoriya: nomer(1),
        vid: nomer(1),
        nomer: { chislo: 3 },
        plosht: kvm(120),
        tsena: evro(150_000),
      } satisfies Kletki,
    },
  ]);

  await stapka('Бизнеси', 'biznesi', 'imoti.dobaviBiznes', [
    {
      kletki: {
        imot: tekst(imot(2)),
        sastoyanie: nomer(1),
        nomer: { chislo: 1 },
        plosht: kvm(45),
        tsena: evro(30_000),
        drugi: tekst('кафене на партера'),
      } satisfies Kletki,
    },
  ]);

  // ── Управление · задачи с бюджет и срок ────────────────────────────────
  /**
   * ОТГОВОРНИЦИТЕ · негово, 05.09: „Да се добави отговорник за всяка задача."
   *
   * Без тях Програмата за Задачи стои на нули, а седмичната програма на всеки
   * човек е празна — тоест мострата не показва точно онова, което той поиска
   * да види (запис 195 т.7). Две от задачите остават БЕЗ отговорник нарочно:
   * така се вижда и че нераздадените се броят и се раздават с десния бутон.
   */
  const chovek = (i: number): string =>
    idNaRed(porta.ogledalo(), 'sluzhiteli', broyRedove(porta.ogledalo(), 'sluzhiteli') - 1 - i);

  await stapka('Задачи', 'zadachi', 'upravlenie.dobaviZadacha', [
    {
      kletki: {
        kam: tekst(imot(0)),
        vid: nomer(1),
        ime: tekst('Сондаж'),
        ot: tekst(den(dnes, 1, 10)),
        do: tekst(den(dnes, 1, 24)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(1)),
        byudzhet: evro(12_000),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(0)),
        vid: nomer(1),
        ime: tekst('Ограда и порта'),
        ot: tekst(den(dnes, 1, 12)),
        do: tekst(den(dnes, 0, 8)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(0)),
        byudzhet: evro(8_500),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(1)),
        vid: nomer(1),
        ime: tekst('Смяна на дограма'),
        ot: tekst(den(dnes, 0, 3)),
        do: tekst(den(dnes, 0, 20)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(1)),
        byudzhet: evro(21_400),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(2)),
        vid: nomer(1),
        ime: tekst('Проект за преустройство'),
        ot: tekst(den(dnes, 0, 5)),
        do: tekst(den(dnes, 0, 28)),
        otsenka: nomer(1),
        byudzhet: evro(6_000),
      } satisfies Kletki,
    },
    // задачи ОКОЛО днешния ден · за да има какво да покаже светофарът на Ганта
    {
      kletki: {
        kam: tekst(imot(0)),
        vid: nomer(1),
        ime: tekst('Ремонт на покрива'),
        ot: tekst(den(dnes, 0, 2)),
        do: tekst(den(dnes, 0, 26)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(1)),
        byudzhet: evro(15_800),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(1)),
        vid: nomer(1),
        ime: tekst('Довършване на банята'),
        ot: tekst(den(dnes, 0, 18)),
        do: tekst(den(dnes, 0, 27)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(0)),
        byudzhet: evro(4_300),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(2)),
        vid: nomer(1),
        ime: tekst('Геодезично заснемане'),
        ot: tekst(den(dnes, 2, 6)),
        do: tekst(den(dnes, 2, 19)),
        otsenka: nomer(1),
        otgovornik: tekst(chovek(1)),
        byudzhet: evro(2_100),
      } satisfies Kletki,
    },
    {
      kletki: {
        kam: tekst(imot(0)),
        vid: nomer(1),
        ime: tekst('Договор за поддръжка'),
        ot: tekst(den(dnes, 3, 4)),
        do: tekst(den(dnes, 0, 30)),
        otsenka: nomer(1),
        byudzhet: evro(9_600),
      } satisfies Kletki,
    },
  ]);

  // ── Сметки · приход и разход по месеци ─────────────────────────────────
  /**
   * Едно движение · СЕКЦИЯТА е номер от номенклатурата, не текст.
   *
   * Приход: 1 Наем Банка · 2 Наем Кеш · 3 Бизнес · 4 Други.
   * Разход: 1 Заплати Кеш · 2 Фактури Кеш · 3 Фактури Карта · 4 Фактури Банка ·
   * 5 Кредити · 6 Банкови такси · 7 Заплати Банка · 8 Бизнес.
   * Мостра, в която всичко пада в една секция, не показва нито сбор по секции,
   * нито филтър — затова тук секцията се подава, вместо да е закована.
   */
  /**
   * РОДИТЕЛЯТ на движението · негова дума за кои редове го НЯМА: „към Имот,
   * Обект, Бизнес или без родител, когато са заплати, кредит или банкова такса"
   * (главата „име Имот" на Сметки). Затова заплатите, вноската и таксите тук
   * стоят без родител, а наемите, токът и материалите са под своя ред — инак
   * Управление щеше да показва дърво без пари и бутонът „Скрий Сметки" да няма
   * какво да крие.
   */
  const obekt = (i: number): string =>
    idNaRed(porta.ogledalo(), 'obekti', broyRedove(porta.ogledalo(), 'obekti') - 1 - i);
  const biznes = (): string => idNaRed(porta.ogledalo(), 'biznesi', 0);
  const dvizhenie = (
    ime: string,
    mesets: string,
    suma: number,
    sektsiyata: number,
    kam = '',
    den = 0,
  ): { readonly kletki: Kletki } => ({
    kletki: {
      ...(kam === '' ? {} : { kam: tekst(kam) }),
      ime: tekst(ime),
      ...(suma >= 0 ? { sektsiya: nomer(sektsiyata) } : { sektsiyaR: nomer(sektsiyata) }),
      funktsiya: nomer(3),
      mesets: tekst(mesets),
      // ДЕНЯТ е по избор (запис 195 т.3) · част от редовете го носят, за да личи
      // разликата: с дата редът пада на своя ден, без нея — на първия от месеца
      ...(den === 0 ? {} : { data: tekst(`${mesets}-${String(den).padStart(2, '0')}`) }),
      suma: evro(suma),
    } satisfies Kletki,
  });

  /**
   * ДВАНАЙСЕТ МЕСЕЦА НАЗАД · колкото са колоните на календара.
   *
   * Мострата с три месеца оставяше девет празни колони и човек не виждаше нито
   * сбора за периода, нито филтрите. Числата се менят по месец с проста стъпка —
   * без случайност, за да дава мострата ВИНАГИ едно и също (тестът го брои).
   */
  const dvizheniya: { readonly kletki: Kletki }[] = [];
  for (let n = 11; n >= 0; n -= 1) {
    const m = mesetsPredi(dnes, n);
    const stapkata = 11 - n;
    dvizheniya.push(
      dvizhenie('Наем · Слънчева поляна', m, 1_200, 1, obekt(0), 5),
      dvizhenie('Наем · Бяла къща · в брой', m, 850 + stapkata * 10, 2, imot(1), 7),
      dvizhenie('Заплати по банка', m, -3_600, 7, '', 25),
      dvizhenie('Ток и вода', m, -280 - stapkata * 5, 4, imot(0), 18),
      dvizhenie('Такси по сметката', m, -18, 6),
      dvizhenie('Вноска по кредита', m, -1_450, 5, '', 10),
    );
    // едрите разходи не са всеки месец · инак календарът изглежда нарисуван
    if (n % 3 === 0) dvizheniya.push(dvizhenie('Строителни материали', m, -2_400, 2, imot(2)));
    if (n % 4 === 1) dvizheniya.push(dvizhenie('Кафене на партера', m, 600, 3, biznes()));
    if (n % 6 === 2) dvizheniya.push(dvizhenie('Гориво и командировки', m, -320, 3));
  }
  await stapka('Движения по Сметки', 'dvizheniya', 'smetki.dobaviDvizhenie', dvizheniya);

  await stapka(
    'Кеш по месеци',
    'kesh',
    'smetki.zapishiKesh',
    Array.from({ length: 12 }, (_, i) => {
      const n = 11 - i;
      return {
        mesets: mesetsPredi(dnes, n),
        zaplati: evro(1_500),
        fakturi: evro(260 + i * 20),
        izvlechenie: evro(1_760 + i * 20),
      };
    }),
  );

  await stapka(
    'ДДС по месеци',
    'dds',
    'smetki.zapishiDds',
    Array.from({ length: 12 }, (_, i) => {
      const n = 11 - i;
      const nachislen = 2_050 + i * 30;
      const kredit = 620 + i * 10;
      return {
        mesets: mesetsPredi(dnes, n),
        nachislen: evro(nachislen),
        kredit: evro(kredit),
        deklarirano: evro(nachislen - kredit),
        // последният месец е ДЕКЛАРИРАН, но още неплатен · остатъкът се вижда
        plateno: evro(n === 0 ? 0 : nachislen - kredit),
        izdadeni: evro(nachislen * 5),
        plateni: evro(kredit * 5),
      };
    }),
  );

  // ── Продажби · двете сгради ────────────────────────────────────────────
  await stapka('Продажби · първа сграда', 'prodazhbi', 'prodazhbi.dobaviParva', [
    {
      kletki: {
        apartament: tekst('апарт. № 1'),
        ime: tekst('Иван Пробен'),
        telefon: tekst('0888 000 011'),
        kvadratura: { chislo: 8_450 },
        tsena: evro(101_400),
        tsenaBanka: evro(40_000),
        tsenaSmr: evro(61_400),
        pdBanka: evro(20_000),
        pdSmr: evro(30_000),
        nsBanka: evro(15_000),
        nsSmr: evro(31_400),
      } satisfies Kletki,
    },
    {
      kletki: {
        apartament: tekst('апарт. № 2'),
        ime: tekst('Елена Пробна'),
        telefon: tekst('0888 000 012'),
        kvadratura: { chislo: 7_220 },
        tsena: evro(86_640),
        tsenaBanka: evro(46_640),
        tsenaSmr: evro(40_000),
        pdBanka: evro(20_000),
        pdSmr: evro(20_000),
      } satisfies Kletki,
    },
  ]);

  await stapka('Продажби · втора сграда', 'prodazhbi2', 'prodazhbi.dobaviVtora', [
    {
      kletki: {
        apartament: tekst('апартамент № 3'),
        ime: tekst('Петър Пробен'),
        telefon: tekst('0888 000 013'),
        kvadratura: { chislo: 6_331 },
        evroKvadrat: evro(2_000),
        tsena: evro(126_620),
        tsenaBanka: evro(50_000),
        tsenaSmr: evro(76_620),
        pdBanka: evro(25_000),
        pdKesh: evro(38_310),
        nsBanka: evro(20_000),
        nsKesh: evro(38_310),
      } satisfies Kletki,
    },
  ]);

  return redove;
}
