/**
 * СМЕТКИТЕ ВЛИЗАТ В УПРАВЛЕНИЕ · под своя Имот, Обект или Бизнес.
 *
 * Негово, 11.09 (запис 193), ДОСЛОВНО: „**В Управление има същия бутон който
 * обаче крие само редовете на сметки /скрий Сметки/.**" Бутон, който крие
 * редове, иска редовете първо да ги ИМА — дотук Управление показваше само
 * задачи и дървото мълчеше за парите.
 *
 * И от 11.09 (запис 163): „**в Управление и да скриеш Сметките не се променят
 * там**" — тоест скриването тук е ПОГЛЕД. Разликата със Сметки е нарочна и е
 * негова: там скритата задача излиза от сметката, тук скритото движение само
 * не се вижда.
 *
 * ТРИ ГРАНИЦИ:
 *
 *   1. Родителят е клетката `kam` на движението. Движение без родител НЕ се
 *      измисля под някого — връща се отделно и се КАЗВА (правило 12).
 *   2. Знакът е негов и не се пипа: плюс е приход, минус е разход (правило 16).
 *   3. Името на реда идва от СЕКЦИЯТА — тя е думата, която той чете. Страната
 *      се познава по знака, не по това коя колона е попълнена.
 */

import type { Ogledalo } from '../ogledalo/ogledalo.js';
import { redKato, zhiviteRedove } from '../ogledalo/tablitsa.js';
import { tekstNaIzbora, tekstNaKletka } from './kletki.js';

const TABLITSA = 'dvizheniya';

export interface DvizhenieVDarvoto {
  readonly i: number;
  readonly id: string;
  /** идентификаторът на Имота, Обекта или Бизнеса · празен е „без родител" */
  readonly roditelId: string;
  /** името на реда · кой служител, коя фирма, кой кредит · може да е празно */
  readonly ime: string;
  /** секцията с думи · „Наем Банка" · „Заплати Кеш" */
  readonly sektsiya: string;
  /** функцията и състоянието, слети с наклонена черта, както в Книгата */
  readonly funktsiya: string;
  /** `ГГГГ-ММ` · тактът на Сметки */
  readonly mesets: string;
  /** цели центове СЪС ЗНАКА · плюс приход, минус разход */
  readonly suma_st: number;
}

export interface SmetkiteVUpravlenie {
  /** движенията по идентификатор на родител · подредени по месец, после по секция */
  readonly poRoditel: ReadonlyMap<string, readonly DvizhenieVDarvoto[]>;
  /** движения без родител · заплати, кредит, банкова такса · казват се, не се крият */
  readonly bezRoditel: readonly DvizhenieVDarvoto[];
  /** колко реда изобщо са гледани · обход, който не го казва, е сляп */
  readonly ogledani: number;
}

export function smetkiteVUpravlenie(o: Ogledalo): SmetkiteVUpravlenie {
  const tv = o.tablitsi.get(TABLITSA);
  if (tv === undefined) return { poRoditel: new Map(), bezRoditel: [], ogledani: 0 };

  const po = new Map<string, DvizhenieVDarvoto[]>();
  const bezRoditel: DvizhenieVDarvoto[] = [];
  let ogledani = 0;

  for (const i of zhiviteRedove(tv)) {
    ogledani += 1;
    const r = redKato(tv, i);
    const suma = r.kletki['suma'] ?? null;
    const suma_st = suma !== null && 'stoynost_st' in suma ? suma.stoynost_st : 0;
    // страната идва от ЗНАКА · секцията само казва мястото вътре в нея
    const klyuchNaSektsiyata = suma_st < 0 ? 'sektsiyaR' : 'sektsiya';
    const sektsiya = tekstNaIzbora(
      o,
      TABLITSA,
      klyuchNaSektsiyata,
      r.kletki[klyuchNaSektsiyata] ?? null,
    );
    const funktsiya = [
      tekstNaIzbora(o, TABLITSA, 'funktsiya', r.kletki['funktsiya'] ?? null),
      tekstNaIzbora(o, TABLITSA, 'sastoyanie', r.kletki['sastoyanie'] ?? null),
    ]
      .filter((x) => x !== '')
      .join(' / ');
    const red: DvizhenieVDarvoto = {
      i,
      id: r.id,
      ime: tekstNaKletka(o, TABLITSA, i, 'ime'),
      roditelId: tekstNaKletka(o, TABLITSA, i, 'kam'),
      sektsiya,
      funktsiya,
      mesets: tekstNaKletka(o, TABLITSA, i, 'mesets'),
      suma_st,
    };
    if (red.roditelId === '') {
      bezRoditel.push(red);
      continue;
    }
    po.set(red.roditelId, [...(po.get(red.roditelId) ?? []), red]);
  }

  for (const [id, spisak] of po)
    po.set(
      id,
      [...spisak].sort((a, b) =>
        a.mesets === b.mesets
          ? a.sektsiya.localeCompare(b.sektsiya, 'bg')
          : a.mesets < b.mesets
            ? -1
            : 1,
      ),
    );

  return { poRoditel: po, bezRoditel, ogledani };
}
