import { podravni, poTekst } from '../src/model/nomenklatura.js';
import type { Ogledalo } from '../src/ogledalo/ogledalo.js';
import { TIP } from '../src/sabitiya/registar.js';
import { NOMENKLATURA_NA_STRANATA, type Strana } from '../src/smetach/smetki.js';
import {
  type Dnevnik,
  type DrajkaNaKotva,
  GreshkaDnevnik,
  klyuchNaSashtnost,
  koyPishe,
  type Operatsiya,
  type Pravata,
  type Rezultat,
  type Sabitie,
  type Sashtnost,
  type Sha256,
  veriga,
  Vrata,
} from '../src/yadro/index.js';

/*
 * ═══ ДВОЙНИЦИТЕ ЗА ТЕСТ · ход 9 · присъда „test-dvoynik" · правило 30 ═══
 *
 * Дотук всеки от тях стоеше изнесен в `src/`, а го викаше САМО тестът: обход 3 на
 * чистотата броеше имената като „непостроена възможност", а обход 6б — цели файлове
 * (`hash-node.ts` · `naivno.ts`) като внасяни само от тестове. Те не са възможност —
 * те са помощници на тестовете по определение. Домът им е тук. Кодът е пренесен дословно,
 * с обясненията си; портовете (`Dnevnik` · `DrajkaNaKotva` · `Pravata` · `Sha256`)
 * остават в ядрото и тук само се реализират.
 */

/**
 * Хеш за Node — за тестовете и за носител „Б · свой сървър".
 * В браузъра стои `hash-web.ts`. Портът `Sha256` не знае разликата.
 *
 * Беше `src/nositel/hash-node.ts`. Носител „Б" още няма викащ, тъй че дотогава
 * реализацията живее при единствения си викащ — тестовете.
 */
const sha256Node: Sha256 = async (danni) => {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(danni, 'utf8').digest('hex');
};

/** Носителят за тестовете. Ядрото нарочно няма стойност по подразбиране. */
export const SHA = sha256Node;

/** Реализация в паметта. Изолацията на верига е на ниво данни. */
export class DnevnikVPametta implements Dnevnik {
  readonly #poVeriga = new Map<string, Sabitie[]>();
  readonly #poOpId = new Map<string, Sabitie>();

  async posledno(veriga: string): Promise<Sabitie | undefined> {
    const redica = this.#poVeriga.get(veriga);
    return redica?.[redica.length - 1];
  }

  async parvo(veriga: string): Promise<Sabitie | undefined> {
    return this.#poVeriga.get(veriga)?.[0];
  }

  async poOpId(veriga: string, opId: string): Promise<Sabitie | undefined> {
    return this.#poOpId.get(`${veriga} ${opId}`);
  }

  async tekushtRev(veriga: string, sashtnost: Sashtnost): Promise<number> {
    const klyuch = klyuchNaSashtnost(sashtnost);
    const redica = this.#poVeriga.get(veriga) ?? [];
    for (let i = redica.length - 1; i >= 0; i -= 1) {
      const s = redica[i]!;
      if (klyuchNaSashtnost(s.sashtnost) === klyuch) return s.seq;
    }
    return 0;
  }

  async dobavi(s: Sabitie): Promise<void> {
    const redica = this.#poVeriga.get(veriga(s)) ?? [];
    const ochakvanSeq = redica.length + 1;
    if (s.seq !== ochakvanSeq) {
      throw new GreshkaDnevnik(
        `Журналът е само за добавяне: очакван seq ${ochakvanSeq}, получен ${s.seq}`,
      );
    }
    const klyuchOp = `${veriga(s)} ${s.opId}`;
    if (this.#poOpId.has(klyuchOp)) {
      throw new GreshkaDnevnik(`opId вече съществува: ${s.opId}`);
    }
    redica.push(Object.freeze(s));
    this.#poVeriga.set(veriga(s), redica);
    this.#poOpId.set(klyuchOp, s);
  }

  async chetiVsichki(veriga: string): Promise<Sabitie[]> {
    return [...(this.#poVeriga.get(veriga) ?? [])];
  }

  async chetiZaSashtnost(veriga: string, sashtnost: Sashtnost): Promise<Sabitie[]> {
    const klyuch = klyuchNaSashtnost(sashtnost);
    const redica = this.#poVeriga.get(veriga) ?? [];
    return redica.filter((s) => klyuchNaSashtnost(s.sashtnost) === klyuch);
  }

  async verigi(prefiks: string): Promise<string[]> {
    return [...this.#poVeriga.keys()].filter((k) => k.startsWith(prefiks)).sort();
  }
}

/** Котвата не е изнесен тип на ядрото · чете се от порта, за да не се изнася само за теста. */
type Kotva = NonNullable<ReturnType<DrajkaNaKotva['cheti']>>;

/** За тестове и за среди без localStorage. */
export class KotvaVPametta implements DrajkaNaKotva {
  readonly #po = new Map<string, Kotva>();

  cheti(veriga: string): Kotva | null {
    return this.#po.get(veriga) ?? null;
  }

  zabij(veriga: string, kotva: Kotva): void {
    this.#po.set(veriga, kotva);
  }
}

/** Първи резен: един собственик, всичко негово. */
export class VsichkoRazresheno implements Pravata {
  async mozheDaPishe(): Promise<boolean> {
    return true;
  }

  async mozheDaIznasya(): Promise<boolean> {
    return true;
  }
}

/** Изрична карта actor → вериги. Ползва се в тестовете за изолация. */
export class PoSpisak implements Pravata {
  readonly #karta: ReadonlyMap<string, ReadonlySet<string>>;

  constructor(karta: Readonly<Record<string, readonly string[]>>) {
    this.#karta = new Map(Object.entries(karta).map(([actor, verigi]) => [actor, new Set(verigi)]));
  }

  async mozheDaPishe(actor: string, veriga: string): Promise<boolean> {
    return this.#karta.get(actor)?.has(veriga) ?? false;
  }

  async mozheDaIznasya(actor: string, veriga: string): Promise<boolean> {
    return this.#karta.get(actor)?.has(veriga) ?? false;
  }
}

/**
 * Номерът на секция по думата ѝ · помощник на тестовете на Сметки и ДДС.
 *
 * Беше в `src/smetach/smetki.ts` с шапка, която го обявяваше за сверката на кеша
 * и за секцията „Вкарване" — а нито кешът, нито „Вкарване" го викаха: те намират
 * секцията по `podravni(x.tekst)` сами. Викаха го само тестовете, за да запишат
 * движение в секция по номер. Домът му е тук (ход 9).
 */
export function nomerNaSektsiya(o: Ogledalo, strana: Strana, tekst: string): number | null {
  const n = o.nomenklaturi.get(NOMENKLATURA_NA_STRANATA[strana]);
  if (n === undefined) return null;
  const s = poTekst(n, podravni(tekst));
  return s === undefined ? null : s.nomer;
}

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
