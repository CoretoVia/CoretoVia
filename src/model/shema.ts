/**
 * СХЕМАТА · подмножеството на JSON Schema, което командите ползват, и как се
 * ИЗВЕЖДА схемата на един ред от Модела (ADR-003).
 *
 * Схемата не се пише на ръка по таблица: колоните са данни, значи и схемата е
 * данни. Всяка е СТРОГА (`additionalProperties: false`, всички ключове в
 * `required`; незадължителните са `nullable`) — това е формата, която агентът
 * получава с `strict: true` (резен 7), и валидаторът я проверява преди Вратата.
 */

import { slotNaKolonata, type Kolona } from './kolona.js';
import type { Tablitsa } from './tablitsa.js';

export interface ShemaJSON {
  readonly type:
    | 'object'
    | 'string'
    | 'integer'
    | 'number'
    | 'boolean'
    | 'array'
    | readonly string[];
  readonly properties?: Readonly<Record<string, ShemaJSON>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: false;
  readonly enum?: readonly (string | number)[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly items?: ShemaJSON;
  readonly minItems?: number;
  readonly description?: string;
}

/** Строг обект · всички ключове задължителни · нищо непознато. */
/**
 * СТРОГ ОБЕКТ · всички полета са задължителни, освен ако не се каже друго.
 *
 * Вторият вход (`zadalzhitelni`) е за случая, в който едно поле има смисъл
 * САМО при определена стойност на друго — колона от вид „избор" иска
 * номенклатура, а колона от вид „текст" не бива да носи такава. Списъкът се
 * пише ЯВНО, вместо да се извежда: избираемо поле, промъкнало се по
 * невнимание, е дупка в схемата, а явният списък се вижда в диф.
 */
export function strogObekt(
  properties: Readonly<Record<string, ShemaJSON>>,
  zadalzhitelni?: readonly string[],
): ShemaJSON {
  return {
    type: 'object',
    properties,
    required: [...(zadalzhitelni ?? Object.keys(properties))],
    additionalProperties: false,
  };
}

/** Незадължително поле · `type: [T, 'null']`. */
export function poIzbor(sh: ShemaJSON): ShemaJSON {
  const t = typeof sh.type === 'string' ? [sh.type, 'null'] : [...sh.type, 'null'];
  return { ...sh, type: t };
}

/** Схемата на ЕДНА клетка · точно един слот, по вида на колоната. */
function shemaNaKletka(k: Kolona): ShemaJSON | undefined {
  const slot = slotNaKolonata(k);
  if (slot === undefined) return undefined;
  const opis = `${k.ime} · ${k.vid}${k.merka === 'kvsm' ? ' · цели кв. см' : ''}`;
  switch (slot) {
    case 'stoynost_st':
      return strogObekt({
        stoynost_st: { type: 'integer', description: `${opis} · ЦЕЛИ центове` },
      });
    case 'chislo':
      return strogObekt({ chislo: { type: 'integer', description: opis } });
    case 'nomer':
      return strogObekt({
        nomer: {
          type: 'integer',
          minimum: 1,
          description: `${opis} · номер в „${k.nomenklatura}"`,
        },
      });
    case 'tekst':
      return strogObekt({ tekst: { type: 'string', maxLength: 500, description: opis } });
  }
}

/**
 * Схемата на реда · `kletki` по ключ на колона.
 *
 * При създаване задължителните колони са `required`; при поправка всяка е по
 * избор (частичен `kletki` = поправка на посочените клетки). Затворените
 * колони изобщо не са в схемата — никой не ги пише.
 */
export function shemaNaReda(t: Tablitsa, rezhim: 'sazdavane' | 'popravka'): ShemaJSON {
  const properties: Record<string, ShemaJSON> = {};
  const required: string[] = [];
  for (const k of t.koloni) {
    const sh = shemaNaKletka(k);
    if (sh === undefined) continue;
    const zadalzhitelna = rezhim === 'sazdavane' && k.zadalzhitelna;
    properties[k.klyuch] = zadalzhitelna ? sh : poIzbor(sh);
    required.push(k.klyuch);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}
