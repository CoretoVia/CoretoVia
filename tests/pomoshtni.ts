import { sha256Node } from '../src/nositel/hash-node.js';
import { TIP } from '../src/sabitiya/registar.js';
import {
  DnevnikVPametta,
  koyPishe,
  type Operatsiya,
  type Rezultat,
  type Sabitie,
  type Sashtnost,
  Vrata,
  VsichkoRazresheno,
} from '../src/yadro/index.js';

/** Носителят за тестовете. Ядрото нарочно няма стойност по подразбиране. */
export const SHA = sha256Node;

/** Детерминистичен генератор — без Math.random, за да са тестовете повторяеми. */
export function seyalka(seme = 1): () => number {
  let s = seme >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/** Ключът на книгата в тестовете · пренесен дословно с тестовете на ядрото. */
export const KNIGA = 'vintexstroy';
export const STOPANIN = 'vintexstroy@gmail.com';
/** веригата на втория писач · наставката е дума на домейна, тук е само за теста */
export const VERIGA_NA_SLUZHITEL = `${KNIGA}~sluzhitel`;
/** устройството в тестовете · един факт, за да не се разминават подписите */
export const VALUTA = 'EUR';
export const USTROYSTVO = 'k1-' + '0'.repeat(32);

/**
 * Една операция с разумни стойности по подразбиране.
 *
 * Типът на събитието е нарочно ОБЩ („ЗаписЗаписан"): ядрото не знае домейна и
 * тестовете му не бива да зависят от прозорец, който още не е построен.
 */
export function operatsiya(
  chast: Partial<Operatsiya> & { opId: string; veriga?: string },
): Operatsiya {
  const { veriga: v, ...ostanalo } = chast;
  return {
    ts: '2026-09-05T09:00:00.000Z',
    ...koyPishe(v ?? KNIGA),
    ustroystvo: USTROYSTVO,
    valuta: VALUTA,
    actor: STOPANIN,
    type: 'ЗаписЗаписан',
    sashtnost: { vid: 'zapis', id: 'Z-1' },
    payload: {},
    ...ostanalo,
  };
}

export interface KnigaZaTest {
  readonly dnevnik: DnevnikVPametta;
  readonly vrata: Vrata;
  /** записва през Вратата · opId и ts се броят сами, детерминистично */
  zapishi(
    type: string,
    sashtnost: Sashtnost,
    payload: Record<string, unknown>,
    opts?: { veriga?: string; opId?: string; expectedRev?: number; actor?: string },
  ): Promise<Rezultat>;
  /** открива Книгата със Стопанина · първото събитие */
  otkriy(): Promise<Rezultat>;
  sabitiya(veriga?: string): Promise<Sabitie[]>;
}

/**
 * КНИГА ЗА ТЕСТ · истинска Врата върху Журнал в паметта, с откриващото събитие
 * на домейна. Тестовете на Огледалото и командите минават оттук, за да четат
 * събития, които са минали през ЕДИНСТВЕНИЯ вход за запис (правило 2).
 */
export function knigaZaTest(): KnigaZaTest {
  const dnevnik = new DnevnikVPametta();
  const vrata = new Vrata({
    dnevnik,
    pravata: new VsichkoRazresheno(),
    sha: SHA,
    parvoto: TIP.stopaninZapisan,
    bezOtkrivane: (n) => n.includes('~'),
  });
  let broyach = 0;
  const nachalo = Date.parse('2026-09-05T09:00:00.000Z');
  const zapishi: KnigaZaTest['zapishi'] = (type, sashtnost, payload, opts = {}) => {
    broyach += 1;
    return vrata.dobavi({
      opId: opts.opId ?? `op-${broyach}`,
      ts: new Date(nachalo + broyach * 1000).toISOString(),
      ...koyPishe(opts.veriga ?? KNIGA),
      ustroystvo: USTROYSTVO,
      valuta: VALUTA,
      actor: opts.actor ?? STOPANIN,
      type,
      sashtnost,
      payload,
      ...(opts.expectedRev === undefined ? {} : { expectedRev: opts.expectedRev }),
    });
  };
  return {
    dnevnik,
    vrata,
    zapishi,
    otkriy: () => zapishi(TIP.stopaninZapisan, { vid: 'stopanin', id: KNIGA }, { imeyl: STOPANIN }),
    sabitiya: (veriga = KNIGA) => dnevnik.chetiVsichki(veriga),
  };
}

/** Номерата на Длъжностите · както са в номенклатурата на Модела. */
export const DLAZHNOST = Object.freeze({
  stopanin: 1,
  upravitel: 2,
  pomoshtnik: 3,
  sluzhitel: 4,
  nablyudatel: 5,
});

/**
 * Дава на един имейл Длъжност, която ПИШЕ редове · и защо е нужно.
 *
 * От 08.09.2026 Портата пита оста „редове" от Длъжността (находка Т2 на одита).
 * Дотогава тя не я питаше и всеки актьор минаваше — тоест тестове, чийто актьор
 * няма Длъжност, се пишеха, без да се забележи, че такъв човек по МОДЕЛ не пише
 * редове („човек без ред ВИЖДА, но не редактира").
 *
 * Затова настройката живее на ЕДНО място (правило 14): тест, който изследва
 * ВЕРИГИ или СВЕРКИ, не бива да носи копие от правилата за правото.
 *
 * Дава се Длъжност „Служител" с ПИСМЕНО право над редовете — базовият ѝ ред в
 * `osnova.ts` дава само „Вижда само редовете с негови задачи".
 */
export async function dayPravoNadRedove(
  iz: { izpalni: (id: string, klyuch: string, tovar: unknown) => Promise<unknown> },
  imeyl: string,
  belegZaId = 'pravo',
): Promise<void> {
  await iz.izpalni(`${belegZaId}-d`, 'sluzhiteli.dobaviDlazhnost', {
    kletki: {
      dlazhnost: { nomer: DLAZHNOST.sluzhitel },
      tabove: { tekst: 'Вижда всичко' },
      hedari: { tekst: 'Редактира всичко' },
      redove: { tekst: 'Редактира всичко' },
      zhurnal: { tekst: 'Вижда само всичко' },
    },
  });
  await iz.izpalni(`${belegZaId}-s`, 'sluzhiteli.dobaviSluzhitel', {
    kletki: {
      ime: { tekst: 'Служителят' },
      telefon: null,
      imeyl: { tekst: imeyl },
      adres: null,
      dlazhnost: { nomer: DLAZHNOST.sluzhitel },
    },
  });
}
