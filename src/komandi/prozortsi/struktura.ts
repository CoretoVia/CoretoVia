/**
 * СТРУКТУРАТА · петте команди на десетия тип събитие · ход 2.
 *
 * ═══ НЕГОВОТО ═══
 *
 * „**Веднага десетият тип събитие.**" (09.09) и „**Може сам да си създава
 * хедъри-таблици реално и да подменя всяка таблица с редактирана своя изцяло.**"
 *
 * И онова, което го прави нужно СЕГА: „**Състоянията могат да са повече от едно
 * едновременно и се натрупват.**" (10.09) Имотът носи ЕДНА колона „Състояние";
 * втората влиза оттук.
 *
 * ═══ ЗАЩО ПЕТ КОМАНДИ, А НЕ ЕДНА С ПОЛЕ „ДЕЙСТВИЕ" ═══
 *
 * Защото бутонът е ПЪТ (правило 16), а петте пътя са различни: добавянето иска
 * вид и номенклатура, преименуването — само дума, затварянето — нищо.
 * Една команда с превключвател би искала схема, която пуска всичко и проверява
 * после; пет команди дават на всяка своята схема и свои предусловия.
 *
 * ═══ ОТ КЪДЕ СЕ ВИКАТ ═══
 *
 * Само от **Настройки** — правило 19: „Меню, върху което системата СМЯТА, расте
 * само от Настройки." Структурата е точно такова меню: върху нея се смята всеки
 * ред в Книгата.
 *
 * Правото е същото като на номенклатурите (`zashtoNePipaNastroykite`): отворени
 * Настройки са заден вход към ПРАВОТО, защото секциите се назовават в обхвата му
 * (Т23).
 */

import { sashtnost } from '../../model/klyuchove.js';
import type { Model } from '../../model/model.js';
import { pomosht } from '../../model/pomosht.js';
import { strogObekt } from '../../model/shema.js';
import {
  type PromyanaNaStrukturata,
  VIDOVE_ZA_CHOVEK,
  zashtoNeMozhe,
} from '../../model/struktura.js';
import { TIP } from '../../sabitiya/registar.js';
import { zashtoNePipaNastroykite } from '../../smetach/pravo.js';
import {
  type Komanda,
  type Kontekst,
  type Operatsiya,
  predvaritelno,
  razlika,
  revNa,
} from '../komanda.js';

const KLYUCH = { type: 'string', minLength: 1, maxLength: 60 } as const;
const IME = { type: 'string', minLength: 1, maxLength: 200 } as const;

/**
 * СЪЩНОСТТА на структурното събитие · по ТАБЛИЦАТА, не по колоната.
 *
 * `expectedRev` пази две едновременни промени върху ЕДНА таблица да не се
 * разминат: вторият раздел получава REPLAY и пресгъва, вместо да добави колона
 * върху модел, който вече не е този.
 */
const naTablitsata = (tablitsa: string) => sashtnost('struktura', tablitsa);

function operatsiyaZa(k: Kontekst, p: PromyanaNaStrukturata): Operatsiya {
  const s = naTablitsata(p.tablitsa);
  return {
    type: TIP.strukturaPromenena,
    sashtnost: s,
    payload: p as unknown as Operatsiya['payload'],
    expectedRev: revNa(k, s),
  };
}

/** Моделът, както го вижда командата · вече сгънат, тоест с миналите промени. */
const modelat = (k: Kontekst): Model => k.ogledalo.model;

/** Едно предусловие за всичките пет · чистата функция казва думите (правило 12). */
const mozheLi = {
  ime: 'промяната минава върху ТОЗИ Модел',
  proveri: (v: object, k: Kontekst): string | null => {
    const zashto = zashtoNeMozhe(modelat(k), v as PromyanaNaStrukturata);
    return zashto.length === 0 ? null : zashto.join(' · ');
  },
};

/** Името на таблицата за думите · ключът е за машината, името е за човека. */
function imeNaTablitsata(k: Kontekst, klyuch: string): string {
  return modelat(k).tablitsi.get(klyuch)?.ime ?? klyuch;
}

/**
 * ОБЩОТО ЗА ПЕТТЕ · един дом, вместо пет еднакви глави (правило 14).
 *
 * Обходът за чистота го намери сам: пет пъти по пет еднакви реда. Той е прав —
 * промени ли се правото на едно място, другите четири мълчат и се разминават.
 */
const OBSHTOTO = {
  prozortsi: ['nastroyki'] as const,
  stepen: 'pishe' as const,
  myasto: 'kletka' as const,
  koyMozhe: (k: Kontekst) => zashtoNePipaNastroykite(k.ogledalo, k.aktor),
  proizvezhda: [TIP.strukturaPromenena],
};

// ═══ 1 · НОВА КОЛОНА ═══════════════════════════════════════════════════════

interface TovarNovaKolona {
  readonly tablitsa: string;
  readonly kolona: string;
  readonly ime: string;
  readonly vid: string;
  readonly nomenklatura: string;
}

const novaKolona: Komanda<TovarNovaKolona> = {
  klyuch: 'nastroyki.novaKolona',
  ime: 'Нова колона',
  pomosht: pomosht(
    'Добавя колона към таблица без нов код: глава, вид и — за колона от вид избор — ' +
      'номенклатура. Така се натрупват състоянията: второ състояние е втора колона със своя ' +
      'номенклатура.',
    'ключ на латиница · глава · вид · номенклатура само за вид избор',
  ),
  ...OBSHTOTO,
  /*
   * ВСИЧКО Е ЗАДЪЛЖИТЕЛНО · и празната номенклатура значи „няма".
   *
   * Каталогът иска всяко поле в `required` и тестът го брои. Причината е
   * добра: избираемо поле може да се промъкне като `undefined` и схемата
   * да го пусне. Затова тук няма избираемо — има ПРАЗНО, и то е стойност
   * със смисъл: „тази колона не е избор".
   */
  shema: strogObekt({
    tablitsa: KLYUCH,
    kolona: KLYUCH,
    ime: IME,
    vid: { type: 'string', enum: [...VIDOVE_ZA_CHOVEK] },
    nomenklatura: { type: 'string', maxLength: 60 },
  }),
  predusloviya: [{ ...mozheLi, proveri: (v, k) => mozheLi.proveri(kato(v), k) }],
  dryRun: (v, k) =>
    predvaritelno(
      k,
      'nastroyki.novaKolona',
      [operatsiyaZa(k, kato(v))],
      [razlika(imeNaTablitsata(k, v.tablitsa), '', `нова колона „${v.ime}"`)],
      `„${v.ime}" влиза като колона в „${imeNaTablitsata(k, v.tablitsa)}".`,
    ),
};

/** Товарът Е промяната · само `deystvie` се слага тук, за да не се пише отвън. */
function kato(v: object): PromyanaNaStrukturata {
  return { deystvie: 'kolonaDobavena', ...v } as PromyanaNaStrukturata;
}

// ═══ 2 · ПРЕИМЕНУВАНА ГЛАВА ════════════════════════════════════════════════

interface TovarPreimenuvayGlava {
  readonly tablitsa: string;
  readonly kolona: string;
  readonly ime: string;
}

const katoPreimenuvane = (v: object): PromyanaNaStrukturata =>
  ({ deystvie: 'glavaPreimenuvana', ...v }) as PromyanaNaStrukturata;

const preimenuvayGlava: Komanda<TovarPreimenuvayGlava> = {
  klyuch: 'nastroyki.preimenuvayGlava',
  ime: 'Преименувай глава',
  pomosht: pomosht(
    'Сменя думата над колоната. Ключът ѝ и стойностите по редовете остават същите — сменя се ' +
      'само какво чете човекът.',
    'нова глава над същия ключ · нито един ред не се променя',
  ),
  ...OBSHTOTO,
  shema: strogObekt({ tablitsa: KLYUCH, kolona: KLYUCH, ime: IME }),
  predusloviya: [{ ...mozheLi, proveri: (v, k) => mozheLi.proveri(katoPreimenuvane(v), k) }],
  dryRun: (v, k) => {
    const staro =
      modelat(k)
        .tablitsi.get(v.tablitsa)
        ?.koloni.find((x) => x.klyuch === v.kolona)?.ime ?? '';
    return predvaritelno(
      k,
      'nastroyki.preimenuvayGlava',
      [operatsiyaZa(k, katoPreimenuvane(v))],
      [razlika(imeNaTablitsata(k, v.tablitsa), staro, v.ime)],
      `Главата „${staro}" става „${v.ime}".`,
    );
  },
};

// ═══ 3 · ЗАТВОРЕНА КОЛОНА ══════════════════════════════════════════════════

interface TovarZatvoriKolona {
  readonly tablitsa: string;
  readonly kolona: string;
}

const katoZatvaryane = (v: object): PromyanaNaStrukturata =>
  ({ deystvie: 'kolonaZatvorena', ...v }) as PromyanaNaStrukturata;

const zatvoriKolona: Komanda<TovarZatvoriKolona> = {
  klyuch: 'nastroyki.zatvoriKolona',
  ime: 'Затвори колона',
  pomosht: pomosht(
    'Спира писането в колона, без да я трие: записаното в нея остава и влиза в сборовете както ' +
      'преди. Колона, която държи родителя или номера на реда, не се затваря.',
    'затваряне · старите стойности остават и се смятат',
  ),
  ...OBSHTOTO,
  shema: strogObekt({ tablitsa: KLYUCH, kolona: KLYUCH }),
  predusloviya: [{ ...mozheLi, proveri: (v, k) => mozheLi.proveri(katoZatvaryane(v), k) }],
  dryRun: (v, k) => {
    const ime =
      modelat(k)
        .tablitsi.get(v.tablitsa)
        ?.koloni.find((x) => x.klyuch === v.kolona)?.ime ?? v.kolona;
    return predvaritelno(
      k,
      'nastroyki.zatvoriKolona',
      [operatsiyaZa(k, katoZatvaryane(v))],
      [razlika(imeNaTablitsata(k, v.tablitsa), ime, `${ime} · затворена`)],
      `„${ime}" се затваря · старите стойности остават и пак се смятат.`,
    );
  },
};

// ═══ 4 · НОВА ТАБЛИЦА ══════════════════════════════════════════════════════

interface TovarNovaTablitsa {
  readonly tablitsa: string;
  readonly ime: string;
  readonly prozorets: string;
  readonly sashtnost: string;
}

const katoNovaTablitsa = (v: object): PromyanaNaStrukturata =>
  ({ deystvie: 'tablitsaDobavena', ...v }) as PromyanaNaStrukturata;

const novaTablitsa: Komanda<TovarNovaTablitsa> = {
  klyuch: 'nastroyki.novaTablitsa',
  ime: 'Нова таблица',
  pomosht: pomosht(
    'Създава празна таблица в някой от осемте прозореца — нов прозорец не се създава. ' +
      'Колоните ѝ се добавят после една по една с Нова колона.',
    'ключ на латиница · име · прозорец · вид на същността за Журнала',
  ),
  ...OBSHTOTO,
  shema: strogObekt({ tablitsa: KLYUCH, ime: IME, prozorets: KLYUCH, sashtnost: KLYUCH }),
  predusloviya: [{ ...mozheLi, proveri: (v, k) => mozheLi.proveri(katoNovaTablitsa(v), k) }],
  dryRun: (v, k) =>
    predvaritelno(
      k,
      'nastroyki.novaTablitsa',
      [operatsiyaZa(k, katoNovaTablitsa(v))],
      [razlika(v.prozorets, '', `нова таблица „${v.ime}"`)],
      `„${v.ime}" влиза в прозорец „${v.prozorets}" · още без нито една колона.`,
    ),
};

// ═══ 5 · РЕДЪТ НА КОЛОНИТЕ ═════════════════════════════════════════════════

interface TovarPodredi {
  readonly tablitsa: string;
  readonly redut: readonly string[];
}

const katoPodredba = (v: object): PromyanaNaStrukturata =>
  ({ deystvie: 'redNaKolonite', ...v }) as PromyanaNaStrukturata;

const podrediKoloni: Komanda<TovarPodredi> = {
  klyuch: 'nastroyki.podrediKoloni',
  ime: 'Подреди колоните',
  pomosht: pomosht(
    'Сменя реда, в който колоните на таблица стоят на екрана и в Книгата. Списъкът трябва да ' +
      'съдържа същите колони — нито една в повече или по-малко.',
    'пълен списък от ключовете на колоните в новия ред',
  ),
  ...OBSHTOTO,
  shema: strogObekt({
    tablitsa: KLYUCH,
    redut: { type: 'array', items: KLYUCH, minItems: 1 },
  }),
  predusloviya: [{ ...mozheLi, proveri: (v, k) => mozheLi.proveri(katoPodredba(v), k) }],
  dryRun: (v, k) => {
    const t = imeNaTablitsata(k, v.tablitsa);
    const staro = (modelat(k).tablitsi.get(v.tablitsa)?.koloni ?? []).map((x) => x.klyuch);
    return predvaritelno(
      k,
      'nastroyki.podrediKoloni',
      [operatsiyaZa(k, katoPodredba(v))],
      [razlika(t, staro.join(' · '), v.redut.join(' · '))],
      `Колоните на „${t}" се подреждат наново.`,
    );
  },
};

export const nastroykiNovaKolona = Object.freeze(novaKolona);
export const nastroykiPreimenuvayGlava = Object.freeze(preimenuvayGlava);
export const nastroykiZatvoriKolona = Object.freeze(zatvoriKolona);
export const nastroykiNovaTablitsa = Object.freeze(novaTablitsa);
export const nastroykiPodrediKoloni = Object.freeze(podrediKoloni);
