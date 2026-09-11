/**
 * НАСТРОЙКИ · НОМЕНКЛАТУРИТЕ · четири команди, и четирите с писане в клетка.
 *
 * Негово, 05.09: „с възможност за редакция, триене, създаване, просто пишейки
 * в таблицата". Пише в празния ред → `dobaviStoynost`; поправя текст →
 * `preimenuvayStoynost`; изтрива текста → `spriStoynost`; пише отново в спрян
 * ред → `varniStoynost`. Триене НЯМА — старите редове пазят номера.
 *
 * Всяка операция носи `expectedRev` върху `nomenklatura:‹ключ›`: два раздела не
 * могат да родят един номер — вторият получава REPLAY и пресгъва.
 *
 * Стойността се сочи с (номер, белези): Видът е № 1 и под Сграда, и под
 * Паркинг, и само белегът ги различава.
 */

import { sashtnost } from '../../model/klyuchove.js';
import {
  type Belezi,
  dobavi,
  GreshkaNomenklatura,
  poNomer,
  preimenuvay,
  spri,
  type ZhivaNomenklatura,
} from '../../model/nomenklatura.js';
import { pomosht } from '../../model/pomosht.js';
import type { Predlozhenie } from '../../model/predlozhenie.js';
import { strogObekt } from '../../model/shema.js';
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

const NOMENKLATURA = { type: 'string', minLength: 1, maxLength: 80 } as const;
const NOMER = { type: 'integer', minimum: 1 } as const;
const TEKST = { type: 'string', minLength: 1, maxLength: 200 } as const;
const BELEZI = {
  type: 'object',
  description: 'белезите · например { kategoriya: 1 } за Вид на обект · {} иначе',
} as const;

function zhivata(k: Kontekst, klyuch: string): ZhivaNomenklatura | undefined {
  return k.ogledalo.nomenklaturi.get(klyuch);
}

interface SNomer {
  readonly nomenklatura: string;
  readonly nomer: number;
  readonly belezi: Belezi;
}

const imaNomenklatura = {
  ime: 'номенклатурата съществува',
  proveri: (v: { nomenklatura: string }, k: Kontekst): string | null =>
    zhivata(k, v.nomenklatura) === undefined ? `Няма номенклатура „${v.nomenklatura}".` : null,
};

const imaNomer = {
  ime: 'стойността съществува',
  proveri: (v: SNomer, k: Kontekst): string | null => {
    const n = zhivata(k, v.nomenklatura);
    if (n === undefined) return null;
    return poNomer(n, v.nomer, v.belezi) === undefined
      ? `Няма стойност № ${v.nomer} в „${n.ime}".`
      : null;
  },
};

function operatsiyaZapisana(
  k: Kontekst,
  n: ZhivaNomenklatura,
  nomer: number,
  tekst: string,
  belezi: Belezi,
): Operatsiya {
  const s = sashtnost('nomenklatura', n.klyuch);
  return {
    type: TIP.stoynostZapisana,
    sashtnost: s,
    payload: { nomenklatura: n.klyuch, nomer, tekst, belezi },
    expectedRev: revNa(k, s),
  };
}

/** Думите на отказа от чистите функции на номенклатурата · вече са неговите. */
function dumite(e: unknown): string {
  return e instanceof GreshkaNomenklatura ? e.message : String(e);
}

interface TovarDobaviStoynost {
  readonly nomenklatura: string;
  readonly tekst: string;
  readonly belezi: Belezi;
}

const dobaviStoynost: Komanda<TovarDobaviStoynost> = {
  klyuch: 'nastroyki.dobaviStoynost',
  ime: 'Нова стойност',
  pomosht: pomosht(
    'Добавя нов текст в избраната номенклатура — например ново състояние на имот. Номерът му ' +
      'се дава от програмата и не се сменя, затова редовете го помнят и след преименуване.',
    'текст · номерът е следващият свободен в номенклатурата',
  ),
  prozortsi: ['nastroyki'],
  stepen: 'pishe',
  myasto: 'kletka',
  // Т23 · Настройките раждат СЕКЦИИТЕ, а секциите се назовават в обхвата на
  // правото. Отворени Настройки са заден вход към правото (вж. pravo.ts).
  koyMozhe: (k) => zashtoNePipaNastroykite(k.ogledalo, k.aktor),
  proizvezhda: [TIP.stoynostZapisana],
  shema: strogObekt({ nomenklatura: NOMENKLATURA, tekst: TEKST, belezi: BELEZI }),
  otPredlozhenie: (p: Predlozhenie) =>
    p.vid === 'nova-stoynost'
      ? { nomenklatura: p.nomenklatura, tekst: p.tekst, belezi: p.belezi }
      : null,
  predusloviya: [
    imaNomenklatura,
    {
      ime: 'белегът сочи категория с видове',
      proveri: (v, k) => {
        const n = zhivata(k, v.nomenklatura);
        if (n?.podredbaPo === undefined) return null;
        const kategorii = zhivata(k, n.podredbaPo);
        const kat =
          kategorii === undefined ? undefined : poNomer(kategorii, Number(v.belezi[n.podredbaPo]));
        return kat?.belezi['bezVid'] === true
          ? `„${kat.tekst}" няма видове — тя е своя таблица.`
          : null;
      },
    },
    {
      ime: 'текстът е нов · и не е спрян',
      proveri: (v, k) => {
        const n = zhivata(k, v.nomenklatura);
        if (n === undefined) return null;
        try {
          dobavi(n, v.tekst, v.belezi);
          return null;
        } catch (e) {
          return dumite(e);
        }
      },
    },
  ],
  dryRun: (v, k) => {
    const n = zhivata(k, v.nomenklatura)!;
    const nova = dobavi(n, v.tekst, v.belezi);
    return predvaritelno(
      k,
      'nastroyki.dobaviStoynost',
      [operatsiyaZapisana(k, n, nova.nomer, nova.tekst, nova.belezi)],
      [razlika(n.ime, '', `${nova.tekst} (№ ${nova.nomer})`)],
      `„${nova.tekst}" влиза в „${n.ime}" като № ${nova.nomer}.`,
    );
  },
};
export const nastroykiDobaviStoynost = Object.freeze(dobaviStoynost);

interface TovarPreimenuvayStoynost extends SNomer {
  readonly tekst: string;
}

const preimenuvayStoynost: Komanda<TovarPreimenuvayStoynost> = {
  klyuch: 'nastroyki.preimenuvayStoynost',
  ime: 'Преименувай',
  pomosht: pomosht(
    'Сменя думата на стойност, без да сменя номера ѝ. Всеки ред, който я е избрал, показва ' +
      'новата дума — нищо не се преписва по редовете.',
    'нов текст под същия номер · текст, зает от друга стойност, е отказ',
  ),
  prozortsi: ['nastroyki'],
  stepen: 'pishe',
  myasto: 'kletka',
  koyMozhe: (k) => zashtoNePipaNastroykite(k.ogledalo, k.aktor),
  proizvezhda: [TIP.stoynostZapisana],
  shema: strogObekt({ nomenklatura: NOMENKLATURA, nomer: NOMER, belezi: BELEZI, tekst: TEKST }),
  otPredlozhenie: (p: Predlozhenie) =>
    p.vid === 'preimenuvana'
      ? { nomenklatura: p.nomenklatura, nomer: p.nomer, belezi: p.belezi, tekst: p.tekst }
      : null,
  predusloviya: [
    imaNomenklatura,
    imaNomer,
    {
      ime: 'новият текст не е чужд',
      proveri: (v, k) => {
        const n = zhivata(k, v.nomenklatura);
        if (n === undefined || poNomer(n, v.nomer, v.belezi) === undefined) return null;
        try {
          preimenuvay(n, v.nomer, v.tekst, v.belezi);
          return null;
        } catch (e) {
          return dumite(e);
        }
      },
    },
  ],
  dryRun: (v, k) => {
    const n = zhivata(k, v.nomenklatura)!;
    const stara = poNomer(n, v.nomer, v.belezi)!;
    const nova = preimenuvay(n, v.nomer, v.tekst, v.belezi);
    return predvaritelno(
      k,
      'nastroyki.preimenuvayStoynost',
      [operatsiyaZapisana(k, n, nova.nomer, nova.tekst, nova.belezi)],
      [razlika(`${n.ime} № ${v.nomer}`, stara.tekst, nova.tekst)],
      `„${stara.tekst}" става „${nova.tekst}" (№ ${v.nomer} остава).`,
    );
  },
};
export const nastroykiPreimenuvayStoynost = Object.freeze(preimenuvayStoynost);

function komandaZaSpirane(spryana: boolean): Komanda<SNomer> {
  const klyuch = spryana ? 'nastroyki.spriStoynost' : 'nastroyki.varniStoynost';
  const pomoshtta = spryana
    ? pomosht(
        'Изважда стойността от избора за нови редове. Редовете, които я носят, я пазят и се ' +
          'смятат както преди; триене няма, затова спряното се връща.',
        'спиране под същия номер · връща се с Върни',
      )
    : pomosht(
        'Връща спряна стойност в избора за нови редове, под същия номер. Редовете, които са я ' +
          'носили през спирането, не се променят.',
        'връщане под същия номер · само за спряна стойност',
      );
  const komanda: Komanda<SNomer> = {
    klyuch,
    ime: spryana ? 'Спри' : 'Върни',
    pomosht: pomoshtta,
    prozortsi: ['nastroyki'],
    stepen: 'pishe',
    myasto: 'kletka',
    koyMozhe: (k) => zashtoNePipaNastroykite(k.ogledalo, k.aktor),
    proizvezhda: [TIP.stoynostSpryana],
    shema: strogObekt({ nomenklatura: NOMENKLATURA, nomer: NOMER, belezi: BELEZI }),
    otPredlozhenie: (p: Predlozhenie) =>
      p.vid === (spryana ? 'spryana' : 'varnata')
        ? { nomenklatura: p.nomenklatura, nomer: p.nomer, belezi: p.belezi }
        : null,
    predusloviya: [
      imaNomenklatura,
      imaNomer,
      {
        ime: spryana ? 'стойността е жива' : 'стойността е спряна',
        proveri: (v, k) => {
          const n = zhivata(k, v.nomenklatura);
          const s = n === undefined ? undefined : poNomer(n, v.nomer, v.belezi);
          if (s === undefined) return null;
          if (s.spryana === spryana) {
            return spryana ? `„${s.tekst}" вече е спряна.` : `„${s.tekst}" не е спряна.`;
          }
          return null;
        },
      },
    ],
    dryRun: (v, k) => {
      const n = zhivata(k, v.nomenklatura)!;
      const s = spri(n, v.nomer, spryana, v.belezi);
      const sash = sashtnost('nomenklatura', n.klyuch);
      return predvaritelno(
        k,
        klyuch,
        [
          {
            type: TIP.stoynostSpryana,
            sashtnost: sash,
            payload: { nomenklatura: n.klyuch, nomer: v.nomer, spryana, belezi: s.belezi },
            expectedRev: revNa(k, sash),
          },
        ],
        [
          razlika(
            `${n.ime} № ${v.nomer}`,
            spryana ? s.tekst : `${s.tekst} · спряна`,
            spryana ? `${s.tekst} · спряна` : s.tekst,
          ),
        ],
        spryana
          ? `„${s.tekst}" се спира. Старите редове я пазят; нови не я избират.`
          : `„${s.tekst}" се връща в употреба.`,
      );
    },
  };
  return Object.freeze(komanda);
}

export const nastroykiSpriStoynost = komandaZaSpirane(true);
export const nastroykiVarniStoynost = komandaZaSpirane(false);
