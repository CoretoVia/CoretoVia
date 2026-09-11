/**
 * РЕДЪТ СБОР · сметката под всяка колона, върху ВИДИМИТЕ редове (ADR-005).
 *
 * Негово (05.09 т.1): „Филтър на цидрите отфолу на колоните и в таблицата и в
 * диаграмата на Гант до нея. С опции за различни сметки отдолу."
 *
 * Сметката е ЧИСТА функция върху клетки: кой ред е видим решава екранът
 * (филтърът), кое число излиза — тук. Парите са цели центове (правило 3):
 * сборът е точен; средното се закръгля към цента и НЕ влиза в сбор —
 * резултатът го казва (`vlizaVSbor`). Резултатът е КЛЕТКА в слота на колоната,
 * за да се изписва с думите на колоната (`dumiNaKletka`), а броят — число.
 */

import type { Kletka } from '../model/kletka.js';
import type { Kolona } from '../model/kolona.js';
import { type Pomosht, pomosht } from '../model/pomosht.js';
import { deliZakragleno } from '../yadro/pari.js';

export const SMETKI = ['sbor', 'sredno', 'nay-malko', 'nay-golyamo', 'broy', 'razlichni'] as const;
export type Smetka = (typeof SMETKI)[number];

export const IMENA_NA_SMETKITE: Readonly<Record<Smetka, string>> = Object.freeze({
  sbor: 'сбор',
  sredno: 'средно',
  'nay-malko': 'най-малко',
  'nay-golyamo': 'най-голямо',
  broy: 'брой',
  razlichni: 'различни',
});

/**
 * ПОМОЩТА НА ШЕСТТЕ · за менюто под колоната · всяка казва онова, което `smetni`
 * прави: върху ВИДИМИТЕ редове, празните не участват, средното е закръглено и
 * затова не влиза в по-горен сбор (правило 3 · `vlizaVSbor`).
 */
export const POMOSHT_NA_SMETKITE: Readonly<Record<Smetka, Pomosht>> = Object.freeze({
  sbor: pomosht(
    'Сборът на пълните клетки в колоната върху видимите редове. Парите са в цели центове; сборът влиза в по-горен сбор.',
    'сбор на видимите редове · празните не участват · влиза в по-горен сбор',
  ),
  sredno: pomosht(
    'Средното на пълните клетки върху видимите редове, закръглено към цента или към квадратния сантиметър. Закръглено число не влиза в по-горен сбор.',
    'сбор ÷ брой на видимите редове · закръглено · не влиза в по-горен сбор',
  ),
  'nay-malko': pomosht(
    'Най-малката стойност сред пълните клетки върху видимите редове.',
    'най-малкото сред видимите редове',
  ),
  'nay-golyamo': pomosht(
    'Най-голямата стойност сред пълните клетки върху видимите редове.',
    'най-голямото сред видимите редове',
  ),
  broy: pomosht(
    'Колко видими реда имат стойност в колоната; празните не се броят. Броят е брой, не пари, и не влиза в сбор.',
    'брой пълни клетки сред видимите редове · не влиза в сбор',
  ),
  razlichni: pomosht(
    'Колко различни стойности има в колоната сред видимите редове — за думи, избор, връзка и дата.',
    'брой различни стойности сред видимите редове',
  ),
});

/** за парите и числата · сборът им значи нещо */
const ZA_CHISLA: readonly Smetka[] = ['sbor', 'sredno', 'nay-malko', 'nay-golyamo', 'broy'];
/**
 * за процентите · БЕЗ сбор: „12 % + 7 %" не е число за никого, а колоната казва
 * какво е (правило 3). Средното на проценти е смислено и остава.
 */
const ZA_PROTSENT: readonly Smetka[] = ['sredno', 'nay-malko', 'nay-golyamo', 'broy'];
/** за думите · текст · избор · връзка · дата · номерация */
const ZA_DUMI: readonly Smetka[] = ['broy', 'razlichni'];

function eChislova(kol: Kolona): boolean {
  return kol.vid === 'evro' || kol.vid === 'chislo' || kol.vid === 'protsent';
}

/** Кои сметки предлага колоната · по вида ѝ. */
export function smetkiteNaKolonata(kol: Kolona): readonly Smetka[] {
  if (kol.vid === 'protsent') return ZA_PROTSENT;
  return eChislova(kol) ? ZA_CHISLA : ZA_DUMI;
}

/** С коя сметка почва колоната · сбор за числата, брой за думите. */
export function smetkataPoPodrazbirane(kol: Kolona): Smetka {
  if (kol.vid === 'protsent') return 'sredno';
  return eChislova(kol) ? 'sbor' : 'broy';
}

export interface RezultatNaSmetka {
  readonly smetka: Smetka;
  /** клетка в слота на колоната (число · центове) или `{ chislo }` за броя · `null` = няма върху какво */
  readonly kletka: Kletka | null;
  /** колко клетки са участвали · празните не участват */
  readonly broy: number;
  /** сборът и крайните влизат в по-горен сбор; средното и броят — не (правило 3) */
  readonly vlizaVSbor: boolean;
}

function chisloto(k: Kletka): number | null {
  if ('stoynost_st' in k) return k.stoynost_st;
  if ('chislo' in k) return k.chislo;
  return null;
}

function vSlota(kol: Kolona, chislo: number): Kletka {
  return kol.vid === 'evro' ? { stoynost_st: chislo } : { chislo };
}

/** Сметката върху клетките на една колона · празните (`null`) не участват. */
export function smetni(
  smetka: Smetka,
  kol: Kolona,
  kletki: readonly (Kletka | null)[],
): RezultatNaSmetka {
  const palni = kletki.filter((k): k is Kletka => k !== null);
  if (smetka === 'broy') {
    return { smetka, kletka: { chislo: palni.length }, broy: palni.length, vlizaVSbor: false };
  }
  if (smetka === 'razlichni') {
    const razlichni = new Set(palni.map((k) => String(Object.values(k)[0] ?? '')));
    return { smetka, kletka: { chislo: razlichni.size }, broy: palni.length, vlizaVSbor: false };
  }
  if (!eChislova(kol)) {
    throw new Error(`„${IMENA_NA_SMETKITE[smetka]}" не се смята върху думи (${kol.ime}).`);
  }
  if (smetka === 'sbor' && kol.vid === 'protsent') {
    throw new Error(`Проценти не се сборуват („${kol.ime}") — средното е сметката им.`);
  }
  const chisla = palni.map(chisloto).filter((x): x is number => x !== null);
  if (chisla.length === 0) return { smetka, kletka: null, broy: 0, vlizaVSbor: false };
  switch (smetka) {
    case 'sbor': {
      const sbor = chisla.reduce((a, b) => a + b, 0);
      if (!Number.isSafeInteger(sbor))
        throw new Error(`Сборът в „${kol.ime}" излиза от целите числа.`);
      return { smetka, kletka: vSlota(kol, sbor), broy: chisla.length, vlizaVSbor: true };
    }
    case 'sredno': {
      const sbor = chisla.reduce((a, b) => a + b, 0);
      // към най-близкото цяло (цент · кв. см) · закръгленото не влиза в сбор
      const sredno = deliZakragleno(sbor, chisla.length);
      return { smetka, kletka: vSlota(kol, sredno), broy: chisla.length, vlizaVSbor: false };
    }
    case 'nay-malko':
      return {
        smetka,
        kletka: vSlota(kol, Math.min(...chisla)),
        broy: chisla.length,
        vlizaVSbor: true,
      };
    case 'nay-golyamo':
      return {
        smetka,
        kletka: vSlota(kol, Math.max(...chisla)),
        broy: chisla.length,
        vlizaVSbor: true,
      };
  }
}
