/**
 * ДВЕТЕ ТАБЛИЦИ НА НАП · текущото и грешките.
 *
 * Негово, 11.09 (запис 195), точка 5, ДОСЛОВНО: „**да има и сумата която не
 * излиза от НАП за миналия месец ако има. Смята се с 1 месец назад, а тези
 * които се събират текущия са в таблица където платените се сортират най отдолу
 * с затъмнен цвят а тези които не са излезли светят, когато не са платени
 * повече от месец отиват в друга таблица където са грешки в декларирани фактури
 * и неплатени или надплатени плащания.**"
 *
 * Оттам четири правила, всяко проверимо:
 *
 *   1. СУМАТА, КОЯТО НЕ ИЗЛИЗА, е остатъкът за МИНАЛИЯ месец — не за текущия.
 *      Числата от счетоводството идват с месец назад (негово, 05.09 т.3),
 *      затова текущият месец още няма какво да дължи.
 *   2. В ТЕКУЩАТА таблица платените падат НАЙ-ОТДОЛУ. Подредбата е част от
 *      искането му, не украса: горе стои онова, което чака.
 *   3. НЕПЛАТЕНО ПОВЕЧЕ ОТ МЕСЕЦ излиза от текущата и влиза в ГРЕШКИТЕ. Дотам
 *      то е нормален живот; оттам нататък е проблем.
 *   4. В грешките влизат още ДВЕ неща, назовани от него: декларирано, което не
 *      е дължимото („грешки в декларирани фактури"), и НАДПЛАТЕНОТО.
 *
 * Нищо тук не се записва: чисто смятане върху вече сметнатия ДДС.
 */

import type { Ddsat, MesetsNaDdsa } from './dds.js';

export type VidNaReda = 'chaka' | 'platen' | 'zakasnyal' | 'nadplaten' | 'razminava';

export interface RedNaNap {
  readonly mesets: string;
  readonly dalzhimo: number;
  readonly deklarirano: number;
  readonly plateno: number;
  readonly ostatak: number;
  readonly vid: VidNaReda;
  /** колко ЦЕЛИ месеца стои неплатен · 0 за платените и за текущия */
  readonly mesetsiNazad: number;
  /** какво е това с думи · екранът го показва, не го гадае */
  readonly kakvo: string;
}

export interface NapTablitsite {
  /** ТЕКУЩАТА · чакащите горе, платените най-отдолу */
  readonly tekushti: readonly RedNaNap[];
  /** ГРЕШКИТЕ · закъснели над месец · надплатени · декларирано ≠ дължимо */
  readonly greshki: readonly RedNaNap[];
  /** миналият месец · `ГГГГ-ММ` */
  readonly minaliyatMesets: string;
  /** цели центове · остатъкът за МИНАЛИЯ месец · нула, когато няма такъв ред */
  readonly neizlyazlo_st: number;
  /** колко месеца изобщо са гледани · обход, който не го казва, е сляп */
  readonly ogledani: number;
}

/** Месец плюс N месеца · `ГГГГ-ММ`. */
function mesetsPlyus(mesets: string, n: number): string {
  const [g, m] = mesets.split('-');
  const obshto = Number(g) * 12 + (Number(m) - 1) + n;
  const godina = Math.floor(obshto / 12);
  const mesetsa = obshto - godina * 12 + 1;
  return `${godina}-${String(mesetsa).padStart(2, '0')}`;
}

/** Разликата в цели месеци · отрицателна, ако вторият е преди първия. */
function mesetsiMezhdu(ot: string, doo: string): number {
  const [g1, m1] = ot.split('-');
  const [g2, m2] = doo.split('-');
  return Number(g2) * 12 + Number(m2) - (Number(g1) * 12 + Number(m1));
}

function redNa(m: MesetsNaDdsa, nazad: number): RedNaNap {
  const razminava = m.deklarirano !== 0 && m.deklarirano !== m.dalzhimo;
  const nadplaten = m.ostatak < 0;
  const platen = m.ostatak === 0;
  const vid: VidNaReda = nadplaten
    ? 'nadplaten'
    : razminava
      ? 'razminava'
      : platen
        ? 'platen'
        : nazad > 1
          ? 'zakasnyal'
          : 'chaka';
  const kakvo =
    vid === 'nadplaten'
      ? 'платено е повече от декларираното'
      : vid === 'razminava'
        ? 'декларираното пред НАП не е дължимото по сметките'
        : vid === 'platen'
          ? 'платено · няма остатък'
          : vid === 'zakasnyal'
            ? `неплатено вече ${String(nazad)} месеца`
            : 'чака плащане';
  return {
    mesets: m.mesets,
    dalzhimo: m.dalzhimo,
    deklarirano: m.deklarirano,
    plateno: m.plateno,
    ostatak: m.ostatak,
    vid,
    mesetsiNazad: platen ? 0 : Math.max(0, nazad),
    kakvo,
  };
}

/**
 * Двете таблици · `dnes` дава кой е текущият месец.
 *
 * Подредбата в текущата е НЕГОВА: чакащите (и разминаващите се) горе, по месец;
 * платените най-отдолу, пак по месец. Тя се прави ТУК, а не в екрана — екран,
 * който подрежда сам, се разминава с печата и с износа.
 */
export function napTablitsite(dds: Ddsat, dnes: string): NapTablitsite {
  const tekushtiyatMesets = dnes.slice(0, 7);
  const minaliyatMesets = mesetsPlyus(tekushtiyatMesets, -1);

  const vsichki = dds.mesetsi.map((m) => redNa(m, mesetsiMezhdu(m.mesets, tekushtiyatMesets)));
  const vGreshkite = (r: RedNaNap): boolean =>
    r.vid === 'zakasnyal' || r.vid === 'nadplaten' || r.vid === 'razminava';

  const tekushti = vsichki.filter((r) => !vGreshkite(r));
  // платените НАЙ-ОТДОЛУ · негова дума, не подредба по вкус
  tekushti.sort((a, b) => {
    const pa = a.vid === 'platen' ? 1 : 0;
    const pb = b.vid === 'platen' ? 1 : 0;
    return pa === pb ? a.mesets.localeCompare(b.mesets) : pa - pb;
  });

  const greshki = vsichki.filter(vGreshkite).sort((a, b) => a.mesets.localeCompare(b.mesets));

  const minaliyat = vsichki.find((r) => r.mesets === minaliyatMesets);
  return {
    tekushti,
    greshki,
    minaliyatMesets,
    neizlyazlo_st: minaliyat === undefined ? 0 : minaliyat.ostatak,
    ogledani: vsichki.length,
  };
}
