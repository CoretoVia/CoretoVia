/**
 * ОГЛЕДАЛОТО · живата проекция на Журнала, колонна (ADR-003).
 *
 * `fold(събития) → Огледало`, чисто и детерминистично: същият поток дава
 * байт за байт същото Огледало, откъдето и да е дошъл (`sgani` подрежда
 * веригите по такт). Нищо тук не пише в Журнала.
 *
 * ═══ ДВА ПРОХОДА · СТОРНОТО Е МАСКА ═══
 *
 * Първият проход проверява товара на ВСЯКО събитие (една проверка, два входа —
 * `sabitiya/registar.ts`), събира кои звена са погасени (валидно сторно) и кое
 * е ПЪРВОТО валидно събитие на всеки ред — сторнирано ли е то, целият ред е
 * мъртъв (образецът на старото `fold`). Вторият проход прилага останалото.
 * Живо Сторно значи пълно пресгъване от Дневника: колонният склад няма
 * история по клетка и не се „връща назад".
 *
 * ═══ СВЕРКАТА (правило 7) ═══
 *
 * приложени + погасени + сторна + непрочетени = събития. Непрочетено е
 * събитие, което не минава проверката на товара, е с непознат тип, или
 * сочи ред, който го няма — брои се и се показва, не се гълта: Журналът може
 * да е пипан отвън. Невалидно сторно е непрочетено, не маска.
 */

import type { Model } from '../model/model.js';
import { prilozhi, type PromyanaNaStrukturata } from '../model/struktura.js';
import type { ZhivaNomenklatura } from '../model/nomenklatura.js';
import { proveriTovar, TIP } from '../sabitiya/registar.js';
import type {
  Kursor,
  PayloadKnigaIznesena,
  PayloadModelZapisan,
  PayloadKnigaVnesena,
  PayloadRedIzklyuchen,
  PayloadRedZapisan,
  PayloadStorno,
} from '../sabitiya/tovari.js';
import {
  klyuchNaSashtnost,
  klyuchNaZveno,
  veriga,
  zvenoNa,
  type Sabitie,
  type Sashtnost,
} from '../yadro/sabitie.js';
import { sverka, type Sverka } from '../yadro/sverka.js';
import { CHETTSI } from './chettsi.js';
import { StroezhNaOgledaloto } from './stroezh.js';
import type { TablitsaVOgledaloto } from './tablitsa.js';

export interface PogasenZapis {
  readonly veriga: string;
  readonly seq: number;
  readonly type: string;
  readonly sashtnost: Sashtnost;
  readonly prichina: string;
  /** кое сторно го гаси · веригата и seq-ът му */
  readonly storniranOt: string;
}

export interface Neprocheteno {
  readonly veriga: string;
  readonly seq: number;
  readonly type: string;
  readonly zashto: readonly string[];
}

export interface Ogledalo {
  readonly model: Model;
  /** имейлът на стопанина · празно, докато Книгата не е открита */
  readonly stopanin: string;
  readonly tablitsi: ReadonlyMap<string, TablitsaVOgledaloto>;
  readonly nomenklaturi: ReadonlyMap<string, ZhivaNomenklatura>;
  /** запазените модели на екрана · по прозорец и име (неговите Отвори/Запази) */
  readonly modeli: readonly PayloadModelZapisan[];
  readonly knigi: readonly PayloadKnigaIznesena[];
  /** разписките за внесени Книги · кога, колко предложено, колко прието */
  readonly vnasyaniya: readonly PayloadKnigaVnesena[];
  readonly pogaseni: readonly PogasenZapis[];
  readonly neprocheteni: readonly Neprocheteno[];
  /** върхът на всяка верига, както е минал през сгъването */
  readonly kursori: ReadonlyMap<string, Kursor>;
  /** rev на всяка същност по верига · същото, което Дневникът дава на Вратата · за expectedRev */
  readonly revove: ReadonlyMap<string, ReadonlyMap<string, number>>;
  readonly broySabitiya: number;
  readonly prilozheni: number;
  readonly storna: number;
  readonly sverka: Sverka;
}

const klyuchNaRed = (p: { readonly tablitsa: string; readonly id: string }): string =>
  `${p.tablitsa}#${p.id}`;

const NYAMA_RED = 'Редът не съществува — изключването няма какво да изключи.';

export function fold(sabitiya: readonly Sabitie[], model: Model, kogato: string): Ogledalo {
  /*
   * ═══ ПЪРВИ ПРОХОД · проверката, маската И СТРУКТУРАТА ═══
   *
   * Моделът вече НЕ Е замразен за целия поток. Той тръгва от подадения и се
   * мени с всяко събитие от десетия тип — а всяко следващо събитие се
   * проверява срещу Модела, който е важал В НЕГОВИЯ МИГ.
   *
   * Точно това иска негово изискване (`docs/28` §2.2): „Вчерашната истина
   * остава ЧЕТИМА. Събитие, писано по стара структура, не се изхвърля и не се
   * преправя — то се чете с онази структура, която е важала тогава."
   *
   * Дотук беше обратното: жив Модел мълчаливо изхвърляше вчерашно събитие,
   * щом днешната структура не го признае. Ход 1 направи изхвърлянето ВИДИМО;
   * този проход прави така, че да не се случва.
   */
  let tekusht = model;
  const proverki = new Map<string, readonly string[]>();
  const pogaseniZvena = new Set<string>();
  const gasiGo = new Map<string, Sabitie>();
  const parvotoNaReda = new Map<string, string>();
  let storna = 0;

  for (const s of sabitiya) {
    const zveno = klyuchNaZveno(s);
    const zashto = proveriTovar(s.type, s.payload, tekusht);
    proverki.set(zveno, zashto);
    if (zashto.length > 0) continue;
    if (s.type === TIP.strukturaPromenena) {
      // проверката вече каза, че промяната минава ВЪРХУ ТОЗИ Модел
      tekusht = prilozhi(tekusht, s.payload as unknown as PromyanaNaStrukturata);
      continue;
    }
    if (s.type === TIP.storno) {
      storna += 1;
      const p = s.payload as unknown as PayloadStorno;
      const tsel = zvenoNa(p.pogasyavaVeriga ?? veriga(s), p.pogasyavaSeq);
      pogaseniZvena.add(tsel);
      pogaseniZvena.add(zveno);
      // ПЪРВОТО сторно печели: причината, с която редът е свален, не се презаписва.
      if (!gasiGo.has(tsel)) gasiGo.set(tsel, s);
      continue;
    }
    if (s.type === TIP.redZapisan) {
      const k = klyuchNaRed(s.payload as unknown as PayloadRedZapisan);
      if (!parvotoNaReda.has(k)) parvotoNaReda.set(k, zveno);
    }
  }

  const martviRedove = new Map<string, string>();
  for (const [red, zveno] of parvotoNaReda) {
    if (pogaseniZvena.has(zveno)) martviRedove.set(red, zveno);
  }

  /*
   * ═══ ВТОРИ ПРОХОД · прилагането ═══
   *
   * Строи се с КРАЙНИЯ Модел, не с началния: екранът показва днешната
   * структура. Проверката обаче вече е минала срещу Модела на всеки миг
   * поотделно — тъй че вчерашният ред влиза, дори колоната му днес да е
   * затворена (правило 18: скритото пак се смята).
   */
  const st = new StroezhNaOgledaloto(tekusht);
  const pogaseni: PogasenZapis[] = [];
  const neprocheteni: Neprocheteno[] = [];
  const kursori = new Map<string, Kursor>();
  const revove = new Map<string, Map<string, number>>();
  let prilozheni = 0;

  const prichinaNa = (zveno: string): { prichina: string; storniranOt: string } => {
    const g = gasiGo.get(zveno);
    return g === undefined
      ? { prichina: '', storniranOt: '' }
      : {
          prichina: String((g.payload as unknown as PayloadStorno).prichina ?? ''),
          storniranOt: klyuchNaZveno(g),
        };
  };
  const pogasi = (s: Sabitie, prichina: string, storniranOt: string): void => {
    pogaseni.push(
      Object.freeze({
        veriga: veriga(s),
        seq: s.seq,
        type: s.type,
        sashtnost: s.sashtnost,
        prichina,
        storniranOt,
      }),
    );
  };
  const neprocheti = (s: Sabitie, zashto: readonly string[]): void => {
    neprocheteni.push(Object.freeze({ veriga: veriga(s), seq: s.seq, type: s.type, zashto }));
  };

  for (const s of sabitiya) {
    kursori.set(veriga(s), { veriga: veriga(s), seq: s.seq, hash: s.hash });
    let rev = revove.get(veriga(s));
    if (rev === undefined) {
      rev = new Map();
      revove.set(veriga(s), rev);
    }
    rev.set(klyuchNaSashtnost(s.sashtnost), s.seq);

    const zveno = klyuchNaZveno(s);
    const zashto = proverki.get(zveno) ?? [];
    if (zashto.length > 0) {
      neprocheti(s, zashto);
      continue;
    }
    if (s.type === TIP.storno) continue;
    if (pogaseniZvena.has(zveno)) {
      const { prichina, storniranOt } = prichinaNa(zveno);
      pogasi(s, prichina, storniranOt);
      continue;
    }
    if (s.type === TIP.redZapisan || s.type === TIP.redIzklyuchen) {
      const p = s.payload as unknown as PayloadRedZapisan | PayloadRedIzklyuchen;
      const martvo = martviRedove.get(klyuchNaRed(p));
      if (martvo !== undefined) {
        pogasi(s, `създаването на реда е сторнирано (${martvo})`, prichinaNa(martvo).storniranOt);
        continue;
      }
      // изключване на ред, който не е раждан · не ражда ред, брои се като непрочетено
      if (s.type === TIP.redIzklyuchen && !st.tablitsa(p.tablitsa).ima(p.id)) {
        neprocheti(s, [NYAMA_RED]);
        continue;
      }
    }
    // проверката вече каза, че типът е познат
    CHETTSI[s.type as keyof typeof CHETTSI](s, st);
    prilozheni += 1;
  }

  const tablitsi = new Map<string, TablitsaVOgledaloto>();
  for (const [klyuch, t] of st.tablitsi) tablitsi.set(klyuch, t.zavarshi());

  return Object.freeze({
    model: tekusht,
    stopanin: st.stopanin,
    tablitsi,
    nomenklaturi: new Map(st.nomenklaturi),
    modeli: Object.freeze([...st.modeli]),
    knigi: Object.freeze([...st.knigi]),
    vnasyaniya: Object.freeze([...st.vnasyaniya]),
    pogaseni: Object.freeze(pogaseni),
    neprocheteni: Object.freeze(neprocheteni),
    kursori,
    revove,
    broySabitiya: sabitiya.length,
    prilozheni,
    storna,
    sverka: sverka(
      'сгъване на Огледалото',
      sabitiya.length,
      prilozheni + pogaseni.length + storna + neprocheteni.length,
      kogato,
      'приложени + погасени + сторна + непрочетени',
    ),
  });
}

/** Таблицата в Огледалото по ключ · липсата ѝ е грешка в кода. */
export function tablitsaVOgledaloto(o: Ogledalo, klyuch: string): TablitsaVOgledaloto {
  const t = o.tablitsi.get(klyuch);
  if (t === undefined) throw new Error(`Огледалото няма таблица „${klyuch}".`);
  return t;
}
