/**
 * БАЛАНСЪТ НА ПАРИТЕ В СИСТЕМАТА · и светофарът над него.
 *
 * Негово, 13.09 (запис 203), точка 5, ДОСЛОВНО: „**Най първото поле с данни на
 * втори ред да е Баланс който Смята Трезора + Банковото покритие от Извлеченията
 * и Приходите и Разходите и общ сбор на всичко и текущия Баланс на парите. Да
 * има цветове които се сменят според стойността. Червена като опасност и преди
 * РАЗХОДИТЕ ЗА 6 МЕСЕЦА СПРЯМО ПРИХОДИТЕ ДОВЕДЪТ ДО ИЗЧЕРПАН БАЛАНС НА ПАРИТЕ В
 * СИСТЕМАТА. Жълто за предприемане на продажби когато сумата падне до 12 месеца
 * в които движението на приходи и разходи ще доведе до изчерпване на Баланса на
 * парите в системата. Зелено когато всичко е наред с Баланс и постоянно има
 * нарастване дори и минимално, разликата между Приход и Разход е положителна и
 * генерираме печалба. Да има всеки месец запис колко е разликата между Приход и
 * Разход и в Сметки за определения период.**"
 *
 * ═══ КАКВО СЕ СМЯТА ═══
 *
 *   **Балансът** = Общ Трезор (кешът) + банката. Банката е сборът на всички
 *   движения, които НЕ минават през касата — приходите плюс разходите (правило
 *   16: разходът вече носи минуса си).
 *
 *   **Месечният запис** е неговото последно изречение: за всеки месец от
 *   периода — приход, разход и разликата им. Оттам идва и **посоката**: средната
 *   месечна разлика през наблюдаваните месеци.
 *
 *   **Колко месеца живот** = баланс ÷ месечния недостиг. Само когато средната
 *   разлика е ОТРИЦАТЕЛНА: при положителна разлика парите не се изчерпват и
 *   въпросът „за колко време" няма отговор — това е `null`, не голямо число.
 *
 * ═══ СВЕТОФАРЪТ · неговите три прага ═══
 *
 *   · **червено** — животът е под 6 месеца, или балансът вече е под нулата.
 *   · **жълто** — животът е под 12 месеца. „За предприемане на продажби."
 *   · **зелено** — разликата е положителна и балансът расте.
 *
 * ═══ КАКВО ОЩЕ ГО НЯМА, И СЕ КАЗВА ═══
 *
 * Той иска „**Банковото покритие от Извлеченията**". Извлечения от банка още не
 * се четат — Заданието ги чака като файл-мостра (ход 11.3), и екранът на
 * Проверки го казва с думи. Дотогава банковото покритие се смята от ВЪВЕДЕНИТЕ
 * движения, не от извлечение. Това не е приблизително заради мързел: другият път
 * просто още го няма, и правило 12 иска липсата да се КАЖЕ, а не да се скрие
 * зад число. Формулата, която полето носи, го казва дословно.
 */

import { sabiri, tsentove } from '../yadro/pari.js';
import type { Smetki } from './smetki.js';

/**
 * Само това, което Балансът наистина чете от Сметки.
 *
 * Тесният вход не е педантичност: така тестът може да сглоби Сметки от четири
 * полета, вместо да преписва целия им вид с `as`, а сглобеното с `as` мълчи,
 * когато утре видът порасне.
 */
export type SmetkiZaBalansa = Pick<Smetki, 'prihod' | 'razhod' | 'sborPrihod' | 'sborRazhod'>;

/** Един месец от записа · неговото „всеки месец запис колко е разликата". */
export interface MesetsNaBalansa {
  readonly mesets: string;
  /** цели центове · положително */
  readonly prihod: number;
  /** цели центове · отрицателно, както е записано (правило 16) */
  readonly razhod: number;
  /** приход + разход · положителното е печалба */
  readonly razlika: number;
}

export type Svetofar = 'zeleno' | 'zhalto' | 'cherveno';

export interface Balansat {
  /** цели центове · всичко, което държим · кеш + банка */
  readonly balans_st: number;
  /** цели центове · частта в брой */
  readonly kesh_st: number;
  /** цели центове · частта по банка */
  readonly banka_st: number;
  /** средната разлика приход − разход на месец · отрицателното яде баланса */
  readonly nameseets_st: number;
  /**
   * За колко месеца балансът се изчерпва при тази средна разлика.
   * `null`, когато разликата не е отрицателна — тогава не се изчерпва.
   */
  readonly mesetsiZhivot: number | null;
  readonly svetofar: Svetofar;
  /** защо свети така · с думи, за подсказката */
  readonly zashto: string;
  /** записът по месеци · неговото последно изречение */
  readonly mesetsi: readonly MesetsNaBalansa[];
}

/** Под колко месеца живот е ОПАСНО · негово: „разходите за 6 месеца". */
export const MESETSI_CHERVENO = 6;
/** Под колко месеца се предприемат продажби · негово: „когато сумата падне до 12 месеца". */
export const MESETSI_ZHALTO = 12;

/**
 * Разликата приход − разход за всеки месец, който има поне едно движение.
 *
 * Месец без нито едно движение не влиза: той не е „месец с нулева разлика", а
 * месец, за който не знаем нищо — да го броим би свалило средното без причина.
 */
export function mesetsiteNaBalansa(s: SmetkiZaBalansa): readonly MesetsNaBalansa[] {
  const po = new Map<string, { prihod: number; razhod: number }>();
  const vzemi = (m: string): { prihod: number; razhod: number } => {
    const x = po.get(m) ?? { prihod: 0, razhod: 0 };
    po.set(m, x);
    return x;
  };
  for (const sek of s.prihod) for (const r of sek.redove) vzemi(r.mesets).prihod += r.suma_st;
  for (const sek of s.razhod) for (const r of sek.redove) vzemi(r.mesets).razhod += r.suma_st;
  return [...po.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mesets, x]) => ({
      mesets,
      prihod: x.prihod,
      razhod: x.razhod,
      razlika: x.prihod + x.razhod,
    }));
}

export function balansat(s: SmetkiZaBalansa, kesh_st: number): Balansat {
  const mesetsi = mesetsiteNaBalansa(s);
  const banka_st = sabiri(tsentove(s.sborPrihod), tsentove(s.sborRazhod));
  const balans_st = sabiri(tsentove(kesh_st), tsentove(banka_st));
  const sborNaRazlikite = sabiri(...mesetsi.map((m) => tsentove(m.razlika)));
  // средното се закръгля към цял цент · то е ПОКАЗАТЕЛ, не пари, и не влиза в сбор
  const nameseets_st = mesetsi.length === 0 ? 0 : Math.round(sborNaRazlikite / mesetsi.length);
  const mesetsiZhivot =
    nameseets_st >= 0 ? null : Math.max(0, Math.floor(balans_st / -nameseets_st));
  const svetofar: Svetofar =
    balans_st < 0 || (mesetsiZhivot !== null && mesetsiZhivot < MESETSI_CHERVENO)
      ? 'cherveno'
      : mesetsiZhivot !== null && mesetsiZhivot < MESETSI_ZHALTO
        ? 'zhalto'
        : 'zeleno';
  return {
    balans_st,
    kesh_st,
    banka_st,
    nameseets_st,
    mesetsiZhivot,
    svetofar,
    zashto: zashtoSveti(svetofar, mesetsiZhivot, balans_st),
    mesetsi,
  };
}

function zashtoSveti(s: Svetofar, mesetsiZhivot: number | null, balans_st: number): string {
  if (s === 'cherveno')
    return balans_st < 0
      ? 'ОПАСНО · балансът е под нулата: дължим повече, отколкото държим.'
      : `ОПАСНО · при това движение на приходите и разходите парите стигат за ${String(mesetsiZhivot)} месеца — под шестте.`;
  if (s === 'zhalto')
    return `ВНИМАНИЕ · парите стигат за ${String(mesetsiZhivot)} месеца. Под дванайсет е моментът за продажби.`;
  return 'НАРЕД · разликата между приход и разход не яде баланса.';
}
