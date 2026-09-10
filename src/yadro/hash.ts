/**
 * Хеш-веригата: hash[n] зависи от prevHash = hash[n-1].
 * Прави всяко скрито редактиране откриваемо (System design §3.1).
 */

import type { Sabitie, ZaHeshirane } from './sabitie.js';
import { SHEMA, SHEMA_PREDI_RAZREZA, veriga } from './sabitie.js';

/**
 * Портът: асинхронен, за да върви и на Web Crypto в браузъра.
 * Реализациите живеят при носителите — `src/nositel/hash-node.ts` и `hash-web.ts`.
 * Тук нарочно няма стойност по подразбиране: носителят се избира явно.
 */
export type Sha256 = (danni: string) => Promise<string>;

/**
 * Канонично представяне за хеширане.
 *
 * Ключовете на payload се подреждат, за да не зависи хешът от реда им.
 *
 * ═══ ЗАЩО `actor` Е ВЪТРЕ · и защо дотук не беше ═══
 *
 * Дотук тук пишеше: „`actor` НЕ влиза в хеша: самоличността се записва, но не
 * заключва веригата." Това беше вярно като намерение и **невярно като защита**,
 * а разликата се плаща от онзи, чийто Журнал е пипнат.
 *
 * Измерено, не предположено: износ със сменен САМО `actor` — без нито един
 * пипнат хеш — минаваше `proveriVerigata` като ЦЯЛА и влизаше през
 * `vazstanovi`. Тоест кой какво е записал беше **редактируемо без следа**, в
 * книга, чието първо правило е „само добавяне".
 *
 * Оттогава `actor` порасна и стана НОСЕЩ: ADR-043 извежда стопанина на започнат
 * Журнал именно от `actor` на първото събитие („стопанинът не се избира —
 * ИЗВЕЖДА се от самата верига"). С неподписан `actor` тази защита се заобикаля
 * с текстов редактор: сменяш автора на събитие №1 в чужд износ, връщаш го — и
 * се вписваш за стопанин на чужда история. Точно това ADR-043 иска да спре.
 *
 * Затова `actor` влиза. Веригата вече заключва и „кой", не само „какво".
 *
 * ═══ ЦЕНАТА, казана честно ═══
 *
 * Това е СМЯНА НА ПОДПИСА: журнали, писани преди нея, не се проверяват с този
 * ред. Не се преписват (правило 1) и не се приемат мълчаливо — те получават
 * СВОЯ диагноза (`star-podpis`), за да знае човекът какво точно държи в ръцете
 * си, вместо да гадае пред „веригата е счупена".
 */
function kanonichno(s: ZaHeshirane): string {
  return JSON.stringify([
    s.seq,
    s.shema,
    s.opId,
    s.ts,
    s.valuta,
    s.kniga,
    s.pisach,
    s.ustroystvo,
    s.actor,
    s.type,
    s.sashtnost.vid,
    s.sashtnost.id,
    podredi(s.payload),
    s.prevHash,
  ]);
}

/**
 * СТАРИТЕ подписи · само за да се РАЗПОЗНАЯТ, никога за да се приемат.
 *
 * Файл отпреди смяна се къса на първото си звено. Без тези редове отказът щеше
 * да казва „хешът не съвпада" — вярно и безполезно: човекът не може да различи
 * пипнат файл от файл, писан по стария ред. Тук се различават.
 *
 * Смените са ДВЕ и всяка има своя дума:
 *
 *   `star-podpis`     · отпреди `actor` да влезе в хеша
 *   `predi-razreza`   · отпреди едното поле `veriga` да стане ТРИ
 *                       (`kniga` · `pisach` · `ustroystvo` · Т39)
 *
 * И двете четат композитния низ през `veriga(s)` — единственият дом на
 * композицията (правило 14). Тоест старият подпис се възпроизвежда точно,
 * без низът да се пази втори път като поле.
 */
function kanonichnoPrediActor(s: ZaHeshirane): string {
  return JSON.stringify([
    s.seq,
    s.opId,
    s.ts,
    veriga(s),
    s.type,
    s.sashtnost.vid,
    s.sashtnost.id,
    podredi(s.payload),
    s.prevHash,
  ]);
}

function kanonichnoPrediRazreza(s: ZaHeshirane): string {
  return JSON.stringify([
    s.seq,
    s.opId,
    s.ts,
    veriga(s),
    s.actor,
    s.type,
    s.sashtnost.vid,
    s.sashtnost.id,
    podredi(s.payload),
    s.prevHash,
  ]);
}

function podredi(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(podredi);
  if (v !== null && typeof v === 'object') {
    const izhod: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      izhod[k] = podredi((v as Record<string, unknown>)[k]);
    }
    return izhod;
  }
  return v;
}

/**
 * КОЯ канонична форма важи за ТОЗИ запис · пита се самият запис.
 *
 * Дотук проверката пробваше новата форма и при разминаване обявяваше стария
 * запис за СЧУПЕН — с добра дума, но счупен. Това беше вярно само докато
 * Журналът е празен. Той не е: **„само проби, които може да се изтрият"
 * важи за СМЕТКИ, не за УПРАВЛЕНИЕ** (негово, 10.09.2026), а Управление е
 * истината (правило 20).
 *
 * Затова версията решава, вместо да се гадае: липсваща версия е нула и се
 * проверява с формата отпреди разреза. Стар запис минава като ЦЯЛ, без нито
 * един байт от него да се пипа (правило 1).
 */
function kanonichnoZa(s: ZaHeshirane): string {
  return (s.shema ?? SHEMA_PREDI_RAZREZA) >= SHEMA ? kanonichno(s) : kanonichnoPrediRazreza(s);
}

export async function izchisliHash(s: ZaHeshirane, sha: Sha256): Promise<string> {
  return sha(kanonichnoZa(s));
}

interface RezultatOtProverka {
  readonly tsyala: boolean;
  /** seq на първото счупено звено; липсва, ако веригата е цяла */
  readonly parvoSchupeno?: number;
  /**
   * ЗАЩО се е счупило.
   *
   * `star-podpis` и `predi-razreza` НЕ са повреда, а ДИАГНОЗА: звеното се
   * проверява с подписа отпреди `actor` да влезе в хеша, съответно отпреди
   * едното поле да стане три. Веригата пак не е цяла — тези файлове не се
   * приемат — но човекът научава КАКВО държи, вместо да гадае.
   */
  readonly prichina?: 'hash' | 'prevHash' | 'seq' | 'star-podpis' | 'predi-razreza';
  /** колко звена са минали проверката преди счупването */
  readonly proverni: number;
}

/**
 * Проверка на веригата за една верига.
 * Събитията трябва да са подредени по seq, възходящо.
 */
export async function proveriVerigata(
  sabitiya: readonly Sabitie[],
  sha: Sha256,
): Promise<RezultatOtProverka> {
  let ochakvanPrevHash = '';
  let ochakvanSeq = 1;

  for (const s of sabitiya) {
    if (s.seq !== ochakvanSeq) {
      return { tsyala: false, parvoSchupeno: s.seq, prichina: 'seq', proverni: ochakvanSeq - 1 };
    }
    if (s.prevHash !== ochakvanPrevHash) {
      return {
        tsyala: false,
        parvoSchupeno: s.seq,
        prichina: 'prevHash',
        proverni: ochakvanSeq - 1,
      };
    }
    const presmetnat = await izchisliHash(bezHash(s), sha);
    if (presmetnat !== s.hash) {
      /*
       * Записът вече е проверен с ФОРМАТА, която сам обявява (`kanonichnoZa`),
       * тъй че стар запис не стига дотук — той минава като цял. Оттук нататък
       * се различава КАКВО е сбъркано, вместо всичко да се слее в „не съвпада":
       *
       *   `predi-razreza` · записът твърди днешна версия, а е подписан по
       *                     СТАРАТА · тоест лъже за версията си
       *   `star-podpis`   · подписан е още преди `actor` да влезе в хеша
       *   `hash`          · нищо не съвпада · пипнат файл
       */
      const zaHesh = bezHash(s);
      const kato0 = await sha(kanonichnoPrediRazreza(zaHesh));
      const naystaro = kato0 === s.hash ? undefined : await sha(kanonichnoPrediActor(zaHesh));
      return {
        tsyala: false,
        parvoSchupeno: s.seq,
        prichina: kato0 === s.hash ? 'predi-razreza' : naystaro === s.hash ? 'star-podpis' : 'hash',
        proverni: ochakvanSeq - 1,
      };
    }
    ochakvanPrevHash = s.hash;
    ochakvanSeq += 1;
  }

  return { tsyala: true, proverni: sabitiya.length };
}

function bezHash(s: Sabitie): ZaHeshirane {
  return {
    seq: s.seq,
    shema: s.shema,
    opId: s.opId,
    ts: s.ts,
    valuta: s.valuta,
    kniga: s.kniga,
    pisach: s.pisach,
    ustroystvo: s.ustroystvo,
    actor: s.actor,
    type: s.type,
    sashtnost: s.sashtnost,
    payload: s.payload,
    prevHash: s.prevHash,
  };
}
