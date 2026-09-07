/**
 * ЗАПИСЪТ · какво програмата казва за СЕБЕ СИ, когато нещо стане.
 *
 * ═══ ЗАЩО НЕ В ЖУРНАЛА ═══
 *
 * Изкушението е логът да влезе в Журнала — там вече има ред, подпис и верига.
 * Отхвърлено, и то по правило 1: Журналът е САМО ЗА ДОБАВЯНЕ и е истината за
 * парите. Диагностиката е шумна, многобройна и се изхвърля; вкарана веднъж,
 * тя не може да се извади. Двете живеят отделно и никога не се смесват.
 *
 * Затова тук няма нито подпис, нито верига, нито `opId`. Записът не е събитие
 * и не се преструва на такова.
 *
 * ═══ ФОРМАТЪТ Е ЧУЖД, НЕ НАШ ═══
 *
 * NDJSON — по един самостоятелен JSON обект на ред. Не е измислен тук:
 *
 *   · Docker го пише по подразбиране (драйверът `json-file`)
 *   · Kubernetes го издава от версия 1.19 (`--logging-format=json`)
 *   · `npm audit --json` дава същото
 *   · Fluent Bit го чете като подразбиращ се събирач
 *
 * Нивата са по RFC 5424 и скалата е ОБЪРНАТА спрямо навика: по-малкото число
 * е по-тежко, нула е авария. Времето е по RFC 3339, в UTC, с милисекунди.
 *
 * Тоест взима се готовият МОДЕЛ, без да се взима чужд код (правило 9).
 *
 * ═══ ЛИЧНИ ДАННИ НЕ МОГАТ ДА ВЛЯЗАТ · липса на код, не обещание ═══
 *
 * Правило 21 казва, че поверителното живее при клиента. Лог, който приема
 * свободен низ, рано или късно приема име, имейл или адрес — не от злоба, а
 * защото е удобно веднъж.
 *
 * Затова `danni` приема САМО числа и истинности. Не по споразумение, а по тип
 * и по проверка при изпълнение. Трябва ли ти кой ред е паднал — пиши номера
 * му, не името му. Това е същата мисъл като К3: „агентът не пише" е липса на
 * метод, не изречение в промпт.
 *
 * ═══ ПРЪСТЕНЪТ · и защо изпуснатото се БРОИ ═══
 *
 * Записите се държат в пръстен с таван. Без таван един цикъл пълни паметта на
 * устройството, а устройството е негово.
 *
 * Изпадне ли ред, това се БРОИ и се показва (`izpusnati`). Мълчаливо изпуснат
 * ред е по-лош от липсващ лог: той кара четящия да вярва, че е видял всичко.
 *
 * ═══ ЧАСОВНИКЪТ СЕ ПОДАВА ═══
 *
 * Времето влиза отвън, както `sega` във `takt.ts`. Тест, който чака истинския
 * часовник, мери машината, не кода (обход З на честността).
 */

/**
 * ОСЕМТЕ НИВА по RFC 5424 · нула е най-тежкото.
 *
 * Имената са български, числата са на стандарта. Числото е онова, което
 * пътува в реда; името е за човека, който го чете.
 */
export const NIVA = Object.freeze({
  avariya: 0,
  trevoga: 1,
  kritichno: 2,
  greshka: 3,
  predupezhdenie: 4,
  zabelezhka: 5,
  svedenie: 6,
  otladka: 7,
} as const);

/** Името на нивото · ключ от `NIVA`. */
export type ImeNaNivo = keyof typeof NIVA;

/**
 * Данните на един запис.
 *
 * САМО числа и истинности — виж заглавния коментар. Низ тук е отказ, не
 * предупреждение.
 */
export type Danni = Readonly<Record<string, number | boolean>>;

/** Един ред от лога · това, което става JSON. */
export interface Zapis {
  /** RFC 3339 · UTC · с милисекунди */
  readonly vreme: string;
  /** RFC 5424 · 0 (авария) до 7 (отладка) */
  readonly nivo: number;
  /** името на нивото, за човека */
  readonly ime: ImeNaNivo;
  /** кой го е писал · име на модул, не път до файл */
  readonly iztochnik: string;
  /** какво е станало · кратък ключ, не изречение */
  readonly sabitie: string;
  /** числа и истинности · никога лични данни */
  readonly danni: Danni;
}

/** Записвачът · държи пръстена и издава NDJSON. */
export interface Zapisvach {
  /** Записва един ред. По-подробното от прага се пропуска мълчаливо. */
  zapishi(nivo: ImeNaNivo, iztochnik: string, sabitie: string, danni?: Danni): void;
  /** Редовете, които пръстенът държи в момента · най-старият е пръв. */
  redove(): readonly Zapis[];
  /** NDJSON · по един ред на запис, с край на реда след всеки. */
  iznesi(): string;
  /** Колко реда се държат сега. */
  broy(): number;
  /** Колко реда са ИЗПАДНАЛИ от пръстена, откакто е направен. */
  izpusnati(): number;
}

/** Настройките на записвача. */
export interface NastroykiNaZapisvach {
  /** времето в милисекунди · подава се, за да е тестът детерминиран */
  readonly chasovnik: () => number;
  /** колко реда държи пръстенът · по подразбиране 1000 */
  readonly kapacitet?: number;
  /** по-подробното от това не се записва · по подразбиране `svedenie` */
  readonly prag?: ImeNaNivo;
}

const KAPACITET_PO_PODRAZBIRANE = 1000;
const PRAZNI: Danni = Object.freeze({});

/**
 * Проверката на данните · ТУК се затваря правило 21.
 *
 * Типът пази онзи, който пише на TypeScript. Тази проверка пази и останалите:
 * внесен файл, чужд адаптер, бъдещ агент. Отказът КАЗВА кой ключ е виновен —
 * иначе човекът получава „нещо не е наред" и търси наслуки (правило 12).
 */
function proveriDanni(danni: Danni): void {
  for (const [klyuch, stoynost] of Object.entries(danni)) {
    const vid = typeof stoynost;
    if (vid === 'number') {
      if (!Number.isFinite(stoynost)) {
        throw new Error(`Записът приема само крайни числа; „${klyuch}" е ${String(stoynost)}.`);
      }
      continue;
    }
    if (vid !== 'boolean') {
      throw new Error(
        `Записът приема само числа и истинности; „${klyuch}" е ${vid}. ` +
          'Лични данни не влизат в лога (правило 21) — пиши номер, не име.',
      );
    }
  }
}

/**
 * Прави записвач.
 *
 * Пръстенът е обикновен масив с изхвърляне отпред. Изместването е O(n) при
 * препълване, но n е таванът, а таванът е избран малък нарочно: лог, който
 * иска по-хитра структура, вече е пораснал повече, отколкото трябва.
 */
export function napraviZapisvach(nastroyki: NastroykiNaZapisvach): Zapisvach {
  const kapacitet = nastroyki.kapacitet ?? KAPACITET_PO_PODRAZBIRANE;
  if (!Number.isInteger(kapacitet) || kapacitet < 1) {
    throw new Error(`Капацитетът на записвача е цяло число над нула; подаден е ${kapacitet}.`);
  }
  const prag = NIVA[nastroyki.prag ?? 'svedenie'];

  const pastran: Zapis[] = [];
  let izpusnati = 0;

  return Object.freeze({
    zapishi(ime: ImeNaNivo, iztochnik: string, sabitie: string, danni: Danni = PRAZNI): void {
      const nivo = NIVA[ime];
      if (nivo > prag) return;
      if (iztochnik === '' || sabitie === '') {
        throw new Error('Записът иска източник и събитие; празен низ не казва нищо.');
      }
      proveriDanni(danni);

      pastran.push(
        Object.freeze({
          vreme: new Date(nastroyki.chasovnik()).toISOString(),
          nivo,
          ime,
          iztochnik,
          sabitie,
          danni: Object.freeze({ ...danni }),
        }),
      );

      while (pastran.length > kapacitet) {
        pastran.shift();
        izpusnati += 1;
      }
    },

    redove: (): readonly Zapis[] => Object.freeze([...pastran]),

    /**
     * NDJSON · всеки ред завършва с `\n`, включително последният.
     *
     * Така файлът се ДОПИСВА, без да се чете какво е имало преди — точно
     * заради това свойство форматът е такъв при Docker.
     */
    iznesi(): string {
      if (pastran.length === 0) return '';
      return pastran.map((z) => JSON.stringify(z)).join('\n') + '\n';
    },

    broy: (): number => pastran.length,
    izpusnati: (): number => izpusnati,
  });
}
