/**
 * ЖУРНАЛЪТ — единствената истина. Само добавяне, никога презапис.
 *
 * Това е ПОРТ: интерфейсът е един и същ за трите носителя.
 * Тук е реализацията в паметта (за тестове и за първия резен).
 * Следват адаптери: IndexedDB (В), Postgres (Б), Sheets (А).
 */

import type { Sabitie, Sashtnost } from './sabitie.js';
import { klyuchNaSashtnost, veriga } from './sabitie.js';

export interface Dnevnik {
  /** Последното събитие на веригата — дава prevHash и следващия seq. */
  posledno(veriga: string): Promise<Sabitie | undefined>;

  /**
   * ПЪРВОТО събитие на веригата · симетрично на `posledno`.
   *
   * Появи се за Стопанина (ADR-043): той Е първото събитие, и трите правила на
   * Вратата се четат оттук — има ли изобщо Журнал, има ли вече Стопанин, и кой
   * е авторът, от когото се извежда Стопанинът на стар Журнал.
   */
  parvo(veriga: string): Promise<Sabitie | undefined>;

  /** Търси по opId — основата на идемпотентността. */
  poOpId(veriga: string, opId: string): Promise<Sabitie | undefined>;

  /** seq на последното събитие за същността; 0, ако още няма такова. */
  tekushtRev(veriga: string, sashtnost: Sashtnost): Promise<number>;

  /** Добавя. Реализацията НЕ трябва да позволява презапис. */
  dobavi(s: Sabitie): Promise<void>;

  /** Всички събития на веригата, подредени по seq. */
  chetiVsichki(veriga: string): Promise<Sabitie[]>;

  /** Събитията за една същност, подредени по seq — входът на Огледалото. */
  chetiZaSashtnost(veriga: string, sashtnost: Sashtnost): Promise<Sabitie[]>;

  /**
   * КОИ ВЕРИГИ ИМА ТУК · единственият нов метод на порта за ADR-055.
   *
   * ОБЯВЯВА СЕ, вместо да се вмъква тихо: досега всяко четене питаше за ЕДИН
   * верига, защото книгата имаше една верига. Станат ли писачите повече,
   * приложението трябва да разбере кои вериги съществуват — а това НЕ може да
   * бъде събитие. Събитието живее в верига; списък на веригите, живеещ в една
   * от тях, би искал точно онзи общ курсор, който правило 6 забранява: писач,
   * чиято верига не е вписана никъде, ще стане невидим за всички.
   *
   * Затова списъкът е свойство на НОСИТЕЛЯ — той знае какво държи.
   *
   * ДОГОВОРЪТ Е МЕХАНИЧЕН: „ключовете, започващи с този префикс", подредени.
   * Ядрото не знае наставки и не отсява личния Журнал — това е дума на домейна
   * (`knigata.ts`), точно както наставката на личния идва отвън.
   */
  verigi(prefiks: string): Promise<string[]>;
}

export class GreshkaDnevnik extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GreshkaDnevnik';
  }
}

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

  /** Само за тестове: кои вериги са пипани. */
  get pipnatiteVerigi(): string[] {
    return [...this.#poVeriga.keys()];
  }
}
