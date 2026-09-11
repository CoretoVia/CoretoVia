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
  await stapka('Задачи', 'zadachi', 'upravlenie.dobaviZadacha', [
    {
      kletki: {
        kam: tekst(imot(0)),
        vid: nomer(1),
        ime: tekst('Сондаж'),
        ot: tekst(den(dnes, 1, 10)),
        do: tekst(den(dnes, 1, 24)),
        otsenka: nomer(1),
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
  ]);

  // ── Сметки · приход и разход по месеци ─────────────────────────────────
  const dvizhenie = (
    ime: string,
    mesets: string,
    suma: number,
    prihod: boolean,
  ): { readonly kletki: Kletki } => ({
    kletki: {
      ime: tekst(ime),
      ...(prihod ? { sektsiya: nomer(1) } : { sektsiyaR: nomer(1) }),
      funktsiya: nomer(3),
      mesets: tekst(mesets),
      suma: evro(suma),
    } satisfies Kletki,
  });

  await stapka('Движения по Сметки', 'dvizheniya', 'smetki.dobaviDvizhenie', [
    dvizhenie('Наем · Слънчева поляна', mesetsPredi(dnes, 2), 1_200, true),
    dvizhenie('Наем · Слънчева поляна', mesetsPredi(dnes, 1), 1_200, true),
    dvizhenie('Наем · Бяла къща', mesetsPredi(dnes, 1), 850, true),
    dvizhenie('Наем · Бяла къща', mesetsPredi(dnes, 0), 850, true),
    dvizhenie('Фактура · строителни материали', mesetsPredi(dnes, 2), -2_400, false),
    dvizhenie('Фактура · ток и вода', mesetsPredi(dnes, 1), -310, false),
    dvizhenie('Заплати', mesetsPredi(dnes, 1), -3_600, false),
    dvizhenie('Заплати', mesetsPredi(dnes, 0), -3_600, false),
  ]);

  await stapka('Кеш по месеци', 'kesh', 'smetki.zapishiKesh', [
    {
      mesets: mesetsPredi(dnes, 1),
      zaplati: evro(1_500),
      fakturi: evro(400),
      izvlechenie: evro(1_900),
    },
    {
      mesets: mesetsPredi(dnes, 0),
      zaplati: evro(1_500),
      fakturi: evro(260),
      izvlechenie: evro(1_760),
    },
  ]);

  await stapka('ДДС по месеци', 'dds', 'smetki.zapishiDds', [
    {
      mesets: mesetsPredi(dnes, 1),
      nachislen: evro(2_400),
      kredit: evro(900),
      deklarirano: evro(1_500),
      plateno: evro(1_500),
      izdadeni: evro(12_000),
      plateni: evro(4_500),
    },
    {
      mesets: mesetsPredi(dnes, 0),
      nachislen: evro(2_050),
      kredit: evro(620),
      deklarirano: evro(1_430),
      plateno: evro(1_000),
      izdadeni: evro(10_250),
      plateni: evro(3_100),
    },
  ]);

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
