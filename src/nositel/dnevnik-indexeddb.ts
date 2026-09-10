/**
 * ЖУРНАЛЪТ върху IndexedDB — носител „В · местно-първо" (ADR-001).
 *
 * Същият порт `Dnevnik`, същият договор. Разликата е само къде лежат байтовете:
 * тук — в браузъра на собственика, без сървър и без мрежа.
 *
 * Пази същите откази като реализацията в паметта:
 *   · seq извън реда → отказ (Журналът е само за добавяне)
 *   · повторен opId → отказ (уникален индекс, не проверка в кода)
 */

import type { Dnevnik } from '../yadro/dnevnik.js';
import { GreshkaDnevnik } from '../yadro/dnevnik.js';
import type { Sabitie, Sashtnost } from '../yadro/sabitie.js';
import { koyPishe, PREDI_RAZREZA, SHEMA_PREDI_RAZREZA, veriga } from '../yadro/sabitie.js';

const HRANILISHTE = 'sabitiya';
/**
 * ВЕРСИЯТА НА БАЗАТА · беше 1, стана 2 с разреза (Т39).
 *
 * Числото не е украса: то е стъпалото, по което браузър със стара база се
 * вдига. Всяка следваща смяна на ключ или индекс иска НОВО число и НОВ клон
 * в `onupgradeneeded` — инак стара база мълчаливо остава с чужд ключ.
 */
const VERSIYA = 2;

const INDEKS_OPID = 'po-opId';
const INDEKS_SASHTNOST = 'po-sashtnost';

/** Отваря (и при нужда създава) базата. */
/**
 * Името се ПОДАВА · `app/main.ts` дава своето. Подразбиране няма нарочно:
 * наследено име от друг проект е тиха уговорка, а не решение.
 */
export function otvoriDnevnik(
  ime: string,
  priBlokirane?: (dumi: string) => void,
): Promise<DnevnikVIndexedDB> {
  return new Promise((resolve, reject) => {
    const zayavka = indexedDB.open(ime, VERSIYA);
    /** Защо стъпалото е отменено · думите за човека, не кодът на грешката. */
    let prichina: string | null = null;

    /*
     * БЛОКИРАНО · друг раздел държи базата на СТАРА версия.
     *
     * Платено на 10.09.2026: след пускането на новата версия собственикът видя
     * празен екран — „Нищо не виждам." Възпроизведено: раздел, отворен преди
     * пускането, държи базата на версия 1; `open(…, 2)` чака да се пусне, и чака
     * БЕЗКРАЙНО и МЪЛЧАЛИВО — нула грешки в конзолата, нула знака на екрана.
     * Затвори ли се старият раздел, страницата оживява сама.
     *
     * Чакането е правилно (Журналът не се пипа под чужда връзка). Мълчанието не
     * е (правило 12): казва се С ДУМИ какво чакаме и какво да направи човекът.
     * Обещанието остава висящо и се изпълнява само, щом другият раздел се пусне.
     */
    zayavka.onblocked = () => {
      priBlokirane?.(
        'Coretovia е отворена в друг раздел или прозорец (включително инсталираното приложение) със старата версия и държи Журнала. Затвори го — тази страница ще продължи сама.',
      );
    };

    zayavka.onupgradeneeded = (sabitie) => {
      const db = zayavka.result;
      const staro = (sabitie as IDBVersionChangeEvent).oldVersion;
      const transaktsiya = zayavka.transaction;

      /*
       * СТЪПАЛО 1 → 2 · РАЗРЕЗЪТ (Т39) · ПРЕНАСЯ, не трие.
       *
       * Ключът беше `['naematel', 'seq']` — по полето, което носеше ТРИ смисъла
       * наведнъж. Сега е `['kniga', 'pisach', 'seq']`. Ключ на съществуващо
       * хранилище НЕ се мени в IndexedDB, тъй че хранилището се прави наново —
       * но записите СЕ ПРЕНАСЯТ в него, до един.
       *
       * ═══ ЦЕНАТА, платена на 10.09.2026 ═══
       *
       * Дотук тук стоеше `deleteObjectStore` и оправданието беше негова дума:
       * „само проби, които може да се изтрият". Неговата поправка:
       * **„Това важи за СМЕТКИ, но не и за УПРАВЛЕНИЕ."**
       *
       * И той е прав. Сметки е пясъчникът, Управление е ИСТИНАТА (правило 20),
       * а изтриването на хранилището не прави разлика между двете — то отнася
       * целия Журнал. Тоест едно стъпало на базата щеше да изяде истината,
       * прикрито зад цитат, който не важи за нея.
       *
       * ═══ КАК СЕ ПРЕНАСЯ, без да се пипне нито един байт от подписа ═══
       *
       *   · `kniga` и `pisach` се ИЗВЕЖДАТ от стария низ (`koyPishe`) · това е
       *     обратимо и се доказва с тест
       *   · `shema: 0` казва „подписан по стария ред" — и `hash.ts` го проверява
       *     точно с онази форма, тъй че веригата остава ЦЯЛА
       *   · `ustroystvo` и `valuta` НЕ се измислят: получават `PREDI_RAZREZA`.
       *     Да сложиш „EUR" на запис, писан преди валутата да съществува, е да
       *     съчиниш факт за пари
       *   · старото поле `naematel` ПАДА · то вече се извежда (правило 14)
       *   · СВЕРКА вход↔изход (правило 7): прочетени срещу записани. Не
       *     съвпаднат ли — транзакцията се ОТМЕНЯ и старата база остава цяла.
       */
      // Нова база · или стара без хранилище (няма какво да се пренася). Второто
      // не бива да хвърля: то би зазидало приложението заради състояние, в
      // което НЯМА какво да се загуби.
      if (staro === 0 || transaktsiya === null || !db.objectStoreNames.contains(HRANILISHTE)) {
        if (!db.objectStoreNames.contains(HRANILISHTE)) napraviHranilishte(db);
        return;
      }

      const staroto = transaktsiya.objectStore(HRANILISHTE);
      const chetene = staroto.getAll();
      chetene.onsuccess = () => {
        const zapisi = chetene.result as StarZapis[];
        /*
         * ВСЯКА ПРИЧИНА ЗА ОТМЯНА СЕ КАЗВА С ДУМИ (правило 12).
         *
         * Платено на 10.09.2026, 23:02: собственикът видя „Version change
         * transaction was aborted in upgradeneeded event handler" — вярно и
         * безполезно. Причината беше, че старият запис носи полето `naematel`,
         * а пренасянето търсеше `veriga` (виж `prenesi`). Оттук нататък
         * отмяната носи и КОЙ запис, и ЗАЩО.
         */
        try {
          db.deleteObjectStore(HRANILISHTE);
          const novo = napraviHranilishte(db);
          zapisi.forEach((z, i) => {
            const dobavyane = novo.add(prenesi(z, i));
            dobavyane.onerror = (e) => {
              e.preventDefault();
              prichina ??= `записът № ${i + 1} (seq ${z.seq}) не влезе: ${dobavyane.error?.name ?? 'грешка'} · ${dobavyane.error?.message ?? ''}`;
              transaktsiya.abort();
            };
          });
          // сверката е върху ПРОЧЕТЕНОТО срещу ЗАПИСАНОТО, не върху намерението
          const broene = novo.count();
          broene.onsuccess = () => {
            if (broene.result !== zapisi.length) {
              prichina ??= `сверката не затвори: прочетени ${zapisi.length} · записани ${broene.result}`;
              transaktsiya.abort();
            }
          };
        } catch (e) {
          prichina ??= e instanceof Error ? e.message : String(e);
          transaktsiya.abort();
        }
      };
    };

    zayavka.onsuccess = () => {
      const db = zayavka.result;
      // Друг раздел иска нова версия на базата — тази връзка се пуска чисто,
      // вместо да я държи заключена завинаги.
      db.onversionchange = () => db.close();
      resolve(new DnevnikVIndexedDB(db));
    };
    zayavka.onerror = () => {
      if (prichina !== null) {
        reject(
          new GreshkaDnevnik(
            `Стъпалото на Журнала от версия ${VERSIYA - 1} към ${VERSIYA} не мина: ${prichina}. Журналът е НЕПОКЪТНАТ на старата версия — нищо не е изтрито и нищо не е записано.`,
          ),
        );
        return;
      }
      reject(zayavka.error);
    };
  });
}

/** Хранилището и двата му индекса · ЕДИН дом на формата им (правило 14). */
function napraviHranilishte(db: IDBDatabase): IDBObjectStore {
  const hranilishte = db.createObjectStore(HRANILISHTE, {
    keyPath: ['kniga', 'pisach', 'seq'],
  });
  hranilishte.createIndex(INDEKS_OPID, ['kniga', 'pisach', 'opId'], { unique: true });
  hranilishte.createIndex(INDEKS_SASHTNOST, ['kniga', 'pisach', 'sashtnost.vid', 'sashtnost.id']);
  return hranilishte;
}

/**
 * Записът, както е лежал ПРЕДИ разреза · едното поле с трите смисъла.
 *
 * ИМЕТО МУ Е `naematel` — така е стоял в базата от 05.09 до 09.09
 * (`git show 25fbe89^:src/nositel/dnevnik-indexeddb.ts` · `keyPath:
 * ['naematel', 'seq']`). Полето се преименува на `veriga` САМО в кода, вечерта
 * преди разреза, и никога не е лежало под това име в жива база. Първата версия
 * на стъпалото търсеше `veriga`, тестът ѝ беше писан срещу същата измислена
 * форма — и пренасянето падаше върху всяка ИСТИНСКА база (10.09.2026, 23:02:
 * „Version change transaction was aborted"). Приемат се и двете имена: старото,
 * защото е истината на диска, и новото, защото струва един ред.
 */
type StarZapis = Omit<Sabitie, 'kniga' | 'pisach' | 'ustroystvo' | 'valuta' | 'shema'> & {
  readonly naematel?: string;
  readonly veriga?: string;
};

/**
 * Стар запис → нов, БЕЗ да се пипа подписът му.
 *
 * Изведеното (`kniga` · `pisach`) идва от стария низ; онова, което не е
 * съществувало, се КАЗВА, а не се измисля; версията става нула, за да го
 * провери `hash.ts` със собствената му форма. Запис без стария низ не се
 * „поправя" с измислен — стъпалото се отменя с думи кой е записът.
 */
function prenesi(z: StarZapis, i: number): Sabitie {
  const { naematel, veriga: vKoda, ...ostanalo } = z;
  const star = naematel ?? vKoda;
  if (typeof star !== 'string' || star === '') {
    throw new GreshkaDnevnik(
      `записът № ${i + 1} (seq ${z.seq}) няма нито \`naematel\`, нито \`veriga\` — не може да се каже чия верига е`,
    );
  }
  return {
    ...ostanalo,
    ...koyPishe(star),
    shema: SHEMA_PREDI_RAZREZA,
    ustroystvo: PREDI_RAZREZA,
    valuta: PREDI_RAZREZA,
  };
}

export class DnevnikVIndexedDB implements Dnevnik {
  readonly #db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.#db = db;
  }

  zatvori(): void {
    this.#db.close();
  }

  /** Затворена ли е връзката — Вратата пита, за да откаже с думи, не с гниене. */
  get zatvorena(): boolean {
    try {
      this.#db.transaction(HRANILISHTE, 'readonly');
      return false;
    } catch {
      return true;
    }
  }

  async posledno(veriga: string): Promise<Sabitie | undefined> {
    const hranilishte = this.#chete();
    const kursor = await naiPurviyat(hranilishte.openCursor(obhvat(veriga), 'prev'));
    return kursor?.value as Sabitie | undefined;
  }

  /** ПЪРВОТО · същият обхват, но напред. Оттам се чете Стопанинът (ADR-043). */
  async parvo(veriga: string): Promise<Sabitie | undefined> {
    const hranilishte = this.#chete();
    const kursor = await naiPurviyat(hranilishte.openCursor(obhvat(veriga), 'next'));
    return kursor?.value as Sabitie | undefined;
  }

  async poOpId(veriga: string, opId: string): Promise<Sabitie | undefined> {
    const indeks = this.#chete().index(INDEKS_OPID);
    const { kniga, pisach } = koyPishe(veriga);
    return (await obeshtay(indeks.get([kniga, pisach, opId]))) as Sabitie | undefined;
  }

  async tekushtRev(veriga: string, sashtnost: Sashtnost): Promise<number> {
    const indeks = this.#chete().index(INDEKS_SASHTNOST);
    const { kniga, pisach } = koyPishe(veriga);
    const klyuch = [kniga, pisach, sashtnost.vid, sashtnost.id];
    const kursor = await naiPurviyat(indeks.openCursor(IDBKeyRange.only(klyuch), 'prev'));
    return kursor ? (kursor.value as Sabitie).seq : 0;
  }

  async dobavi(s: Sabitie): Promise<void> {
    // durability: 'strict' — записът се брои за станал, когато е НА ДИСКА.
    // По подразбиране браузърът може да отговори „да" преди изхвърлянето на
    // буфера — и токът да отнесе последното звено, а котвата да го помни.
    const transaktsiya = this.#db.transaction(HRANILISHTE, 'readwrite', {
      durability: 'strict',
    });
    const hranilishte = transaktsiya.objectStore(HRANILISHTE);

    // Проверката и записът са в ЕДНА транзакция — тя е единичният писач.
    const posledno = await naiPurviyat(hranilishte.openCursor(obhvat(veriga(s)), 'prev'));
    const ochakvanSeq = ((posledno?.value as Sabitie | undefined)?.seq ?? 0) + 1;
    if (s.seq !== ochakvanSeq) {
      transaktsiya.abort();
      throw new GreshkaDnevnik(
        `Журналът е само за добавяне: очакван seq ${ochakvanSeq}, получен ${s.seq}`,
      );
    }

    try {
      await obeshtay(hranilishte.add(s));
    } catch (greshka) {
      if (greshka instanceof DOMException && greshka.name === 'ConstraintError') {
        throw new GreshkaDnevnik(`opId вече съществува: ${s.opId}`);
      }
      throw greshka;
    }

    await zavursheno(transaktsiya);
  }

  async chetiVsichki(veriga: string): Promise<Sabitie[]> {
    return (await obeshtay(this.#chete().getAll(obhvat(veriga)))) as Sabitie[];
  }

  async chetiZaSashtnost(veriga: string, sashtnost: Sashtnost): Promise<Sabitie[]> {
    const indeks = this.#chete().index(INDEKS_SASHTNOST);
    const { kniga, pisach } = koyPishe(veriga);
    const klyuch = [kniga, pisach, sashtnost.vid, sashtnost.id];
    const redove = (await obeshtay(indeks.getAll(IDBKeyRange.only(klyuch)))) as Sabitie[];
    return redove.sort((a, b) => a.seq - b.seq);
  }

  /**
   * КОИ ВЕРИГИ ИМА · прескачащ обход, не четене на всичко.
   *
   * Наивното „прочети всички събития и събери имената" би вдигнало целия Журнал
   * в паметта, за да върне шепа низа — при 10 000 събития това е секунди на
   * телефон. Затова курсорът стъпва на първото събитие на всяка верига и
   * ПРЕСКАЧА до следващата с `continue([име, []])`: `[име, []]` е по-голямо от
   * всяко `[име, число]`, тъй че скокът минава цялата верига наведнъж. Броят на
   * стъпките е броят на ВЕРИГИТЕ, не на събитията.
   */
  async verigi(prefiks: string): Promise<string[]> {
    const naideni: string[] = [];
    const zayavka = this.#chete().openKeyCursor(obhvatNaPrefiks(prefiks));
    await new Promise<void>((resolve, reject) => {
      zayavka.onerror = () => reject(zayavka.error);
      zayavka.onsuccess = () => {
        const kursor = zayavka.result;
        if (!kursor) {
          resolve();
          return;
        }
        const [kniga, pisach] = kursor.key as [string, string, number];
        naideni.push(veriga({ kniga, pisach }));
        kursor.continue([kniga, pisach, []]);
      };
    });
    return naideni.sort();
  }

  #chete(): IDBObjectStore {
    return this.#db.transaction(HRANILISHTE, 'readonly').objectStore(HRANILISHTE);
  }
}

/**
 * Всички вериги, чието име започва с префикса.
 *
 * Горната граница е `префикс + '\uffff'`: всеки низ, започващ с префикса, е
 * по-малък от него, защото по-нататъшните знаци са от базовата равнина или са
 * сурогати (`\ud800`–`\udfff`), а те са ПОД `\uffff`. Тоест границата държи и
 * за емоджи в името, без да се разчита на „никой няма да сложи такова".
 */
function obhvatNaPrefiks(prefiks: string): IDBKeyRange {
  return IDBKeyRange.bound([prefiks], [`${prefiks}\uffff`, []]);
}

/**
 * Всички събития на една верига · вече по ДВЕТЕ полета.
 *
 * `[kniga, pisach]` е по-малко от `[kniga, pisach, 0]` (по-късият масив е
 * по-малък), а `[kniga, pisach, []]` е по-голямо от всяко число (числата се
 * нареждат преди масиви).
 *
 * Низът се разлага през `koyPishe` — единствения дом на композицията
 * (правило 14). Складът не реже низове сам.
 */
function obhvat(v: string): IDBKeyRange {
  const { kniga, pisach } = koyPishe(v);
  return IDBKeyRange.bound([kniga, pisach], [kniga, pisach, []]);
}

function obeshtay<T>(zayavka: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    zayavka.onsuccess = () => resolve(zayavka.result);
    zayavka.onerror = () => reject(zayavka.error);
  });
}

function naiPurviyat(
  zayavka: IDBRequest<IDBCursorWithValue | null>,
): Promise<IDBCursorWithValue | null> {
  return obeshtay(zayavka);
}

function zavursheno(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new GreshkaDnevnik('Транзакцията беше прекъсната'));
  });
}
