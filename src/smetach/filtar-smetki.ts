/**
 * ФИЛТЪРЪТ НА СМЕТКИ · същият ред, същото падащо меню, но върху секции.
 *
 * Негово, 12.09 (запис 199), точка 5, ДОСЛОВНО: „**В сметки да е същото.**" —
 * тоест онова, което току-що получи Управление: филтърът е ПАДАЩО МЕНЮ с избор
 * от въведеното в самата колона, а не свободно поле, в което човек трябва да
 * познае как е написано нещо.
 *
 * ДВЕ РАЗЛИКИ ОТ ДЪРВОТО, и двете идват от формата на листа:
 *
 *   1. Тук няма родител и дете. Има СЕКЦИЯ и редовете в нея, а текстът на
 *      секцията стои и в колоната на всеки неин ред — затова се филтрират само
 *      редовете, а секция, от която не остава нищо, си отива цялата. Не се
 *      налага правилото „родителят се вижда заради детето си": секция без
 *      редове не показва нищо.
 *
 *      НО САМО ДОКАТО ФИЛТЪРЪТ РАБОТИ. Без филтър листът показва ЦЯЛАТА
 *      номенклатура — и празните секции, защото те са неговите редове от
 *      Книгата и мястото им се вижда преди в тях да влезе първата сума.
 *   2. Сборът се ПРЕСМЯТА върху видимите. Негово, 11.09 (запис 163):
 *      скриването в Сметки „**ще ги изключва от изчисленията**" — обратното на
 *      Управление, където скритото пак се смята. Затова тук връщаме нова
 *      секция със свой сбор, вместо да крием редове с CSS.
 *
 * Парите минават през преградата за цели центове (правило 3): сборът пред
 * човека не е плаваща запетая, събрана в цикъл.
 */

import { sabiri, tsentove } from '../yadro/pari.js';
import { eFiltarPrazen, minavaFiltara } from './filtar.js';
import type { RedVSektsiya, Sektsiya } from './smetki.js';

export interface SmetkiSledFiltar {
  /** секциите с оцелелите редове · при работещ филтър празните ги няма */
  readonly sektsii: readonly Sektsiya[];
  /** сборът върху ВИДИМИТЕ · цели центове, със знака си */
  readonly sbor: number;
  readonly broyVidimi: number;
  readonly broyVsichki: number;
}

/**
 * Филтрира секциите и пресмята сборовете · `dumiteNa` дава думите на един ред
 * по колона, в реда на филтъра.
 *
 * Думите ги дава ЕКРАНЪТ, не тази машина: тя не знае как се пише една клетка
 * (връзка, избор, число), а екранът вече го знае — и така двете виждат едно и
 * също, вместо да се разминават при първата нова колона.
 */
export function filtriraySektsiite(
  sektsii: readonly Sektsiya[],
  filtar: readonly string[],
  dumiteNa: (sek: Sektsiya, r: RedVSektsiya) => readonly string[],
): SmetkiSledFiltar {
  const prazen = eFiltarPrazen(filtar);
  const ostanali: Sektsiya[] = [];
  let broyVidimi = 0;
  let broyVsichki = 0;
  for (const sek of sektsii) {
    broyVsichki += sek.redove.length;
    const redove = prazen
      ? sek.redove
      : sek.redove.filter((r) => minavaFiltara(dumiteNa(sek, r), filtar));
    if (redove.length === 0 && !prazen) continue;
    broyVidimi += redove.length;
    ostanali.push({ ...sek, redove, sbor: sabiri(...redove.map((r) => tsentove(r.suma_st))) });
  }
  return {
    sektsii: ostanali,
    sbor: sabiri(...ostanali.map((s) => tsentove(s.sbor))),
    broyVidimi,
    broyVsichki,
  };
}
