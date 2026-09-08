/**
 * САМОЛИЧНОСТТА ЗА БРАУЗЪРА · Ed25519 през `crypto.subtle`, нула байта библиотека.
 *
 * Портът е `src/yadro/samolichnost.ts`; тук е реализацията, точно както
 * `hash-web.ts` реализира `Sha256`.
 *
 * ═══ ЧАСТНИЯТ КЛЮЧ НЕ НАПУСКА УСТРОЙСТВОТО · и това го налага браузърът ═══
 *
 * Двойката се прави с `extractable: false`. Тогава `exportKey` върху частния
 * хвърля — проверено, не предположено (08.09.2026, Node 24 и Chromium 152).
 * Тоест дори наш собствен бъдещ код да поиска да го изнесе, не може; няма
 * нужда от правило, което да го забранява.
 *
 * И въпреки това ключът ОЦЕЛЯВА при затваряне: `CryptoKey` е обект, който
 * IndexedDB умее да съхранява цял, без да вижда байтовете му. Това е
 * единственият начин да имаш едновременно „не се изнася" и „не се губи".
 *
 * ═══ СВОЯ БАЗА, НЕ ЧУЖДА ═══
 *
 * Ключът НЕ влиза в базата на Журнала. Причината не е спретнатост: онази база
 * е на версия 1 и всяка нейна промяна е миграция върху единственото място, в
 * което живеят парите. Самоличността е отделен въпрос и си носи отделен съд.
 * Името се ПОДАВА — същата дисциплина като `otvoriDnevnik(ime)`: наследено
 * име от друг проект е тиха уговорка, не решение.
 *
 * ═══ ЕДИН КЛЮЧ НА УСТРОЙСТВО ═══
 *
 * Записът е един, под постоянен ключ. Втори раздел, отворен едновременно, чете
 * същия запис — а ако двата стигнат до празна база в един и същи миг, вторият
 * ще презапише първия. Това е приемливо ТУК и само тук: двамата пишат в
 * секундата на ПЪРВОТО пускане, когато още няма нито едно събитие, което да
 * осиротее. Веднъж записан, ключът повече не се пипа.
 */

import type { ProveriPodpis, Samolichnost } from '../yadro/samolichnost.js';
import { BEZ_SAMOLICHNOST, otpechatakOtHesh } from '../yadro/samolichnost.js';
import { sha256NaBaytove } from './hash-web.js';

const ALGORITAM = 'Ed25519';
const HRANILISHTE = 'samolichnost';
const KLYUCH = 'tazi';

interface Zapisana {
  readonly publichen: CryptoKey;
  readonly chasten: CryptoKey;
}

/** Отваря (и при нужда създава) базата на самоличността. */
function otvoriBazata(ime: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const zayavka = indexedDB.open(ime, 1);
    zayavka.onupgradeneeded = () => {
      const db = zayavka.result;
      if (!db.objectStoreNames.contains(HRANILISHTE)) db.createObjectStore(HRANILISHTE);
    };
    zayavka.onsuccess = () => {
      const db = zayavka.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    zayavka.onerror = () => reject(zayavka.error);
  });
}

function edna<T>(zayavka: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    zayavka.onsuccess = () => resolve(zayavka.result);
    zayavka.onerror = () => reject(zayavka.error);
  });
}

/**
 * Отказът КАЗВА какво липсва и защо (правило 12).
 *
 * `crypto.subtle` го няма извън сигурен контекст. Проверено: `https`,
 * `http://localhost`, `http://127.0.0.1` и `file://` са сигурни; обикновен
 * `http://` към чужд адрес — не. Съобщението назовава ТОЧНО това, защото
 * „нещо не е наред с криптографията" праща човека да търси наслуки.
 */
function iskaSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new Error(
      'Самоличността иска `crypto.subtle`, а него го има само в СИГУРЕН контекст ' +
        '(https, localhost, 127.0.0.1 или file://). Отвори приложението на такъв адрес.',
    );
  }
  return subtle;
}

async function napraviIliVzemi(db: IDBDatabase): Promise<Zapisana> {
  const subtle = iskaSubtle();

  const chetene = db.transaction(HRANILISHTE, 'readonly');
  const veche = await edna<Zapisana | undefined>(
    chetene.objectStore(HRANILISHTE).get(KLYUCH) as IDBRequest<Zapisana | undefined>,
  );
  if (veche !== undefined) return veche;

  const dvoyka = (await subtle.generateKey({ name: ALGORITAM }, false, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const nova: Zapisana = { publichen: dvoyka.publicKey, chasten: dvoyka.privateKey };

  const pisane = db.transaction(HRANILISHTE, 'readwrite');
  await edna(pisane.objectStore(HRANILISHTE).put(nova, KLYUCH));
  return nova;
}

/**
 * Самоличността на това устройство.
 *
 * Прави ключ при първото викане и го намира при всяко следващо. Отпечатъкът
 * се смята ВЕДНЪЖ и се помни: той е чиста функция на публичния ключ, а ключът
 * не се мени за живота на съда.
 */
export async function samolichnostVBrauzara(imeNaBazata: string): Promise<Samolichnost> {
  const db = await otvoriBazata(imeNaBazata);
  const klyuchove = await napraviIliVzemi(db);
  const subtle = iskaSubtle();

  const surov = new Uint8Array(await subtle.exportKey('raw', klyuchove.publichen));
  const otpechatak = otpechatakOtHesh(await sha256NaBaytove(surov));

  return Object.freeze({
    otpechatak: async (): Promise<string> => otpechatak,
    publichenKlyuch: async (): Promise<Uint8Array> => surov.slice(),
    podpishi: async (kakvo: Uint8Array): Promise<Uint8Array> =>
      new Uint8Array(
        await subtle.sign({ name: ALGORITAM }, klyuchove.chasten, kakvo as BufferSource),
      ),
  });
}

/**
 * Проверка на ЧУЖД подпис · не иска своя ключ.
 *
 * Внася се публичният ключ на другия и се пита математиката. Отказът НЕ е
 * изключение: невалиден ключ или подпис от друг алгоритъм дава `false`, а не
 * гърмеж — питащият иска отговор „той ли е", не разказ защо не е.
 */
export const proveriPodpisVBrauzara: ProveriPodpis = async (publichen, kakvo, podpis) => {
  const subtle = iskaSubtle();
  try {
    const klyuch = await subtle.importKey(
      'raw',
      publichen as BufferSource,
      { name: ALGORITAM },
      false,
      ['verify'],
    );
    return await subtle.verify(
      { name: ALGORITAM },
      klyuch,
      podpis as BufferSource,
      kakvo as BufferSource,
    );
  } catch {
    return false;
  }
};

/** Какво да се покаже на човека за самоличността му. */
export interface SamolichnosttaKazva {
  /** отпечатъкът, или `BEZ_SAMOLICHNOST`, ако няма как да се направи ключ */
  readonly otpechatak: string;
  readonly nared: boolean;
  readonly dumi: string;
}

/**
 * Самоличността, ИЛИ причината защо я няма · същият образец като `kotvataKazva`.
 *
 * Приложението не бива да не тръгне, защото е отворено на несигурен адрес:
 * служебната книга не иска ключ. Но лична верига тогава НЕ се пише, и това се
 * КАЗВА с думи (правило 12), вместо да се откаже мълчаливо или — по-лошо — да
 * се разреши.
 */
export async function samolichnosttaKazva(imeNaBazata: string): Promise<SamolichnosttaKazva> {
  try {
    const s = await samolichnostVBrauzara(imeNaBazata);
    const otpechatak = await s.otpechatak();
    return { otpechatak, nared: true, dumi: `самоличност: ${otpechatak}` };
  } catch (e) {
    const prichina = e instanceof Error ? e.message : String(e);
    return {
      otpechatak: BEZ_SAMOLICHNOST,
      nared: false,
      dumi: `Няма самоличност на това устройство, тъй че ЛИЧНА книга не се пише. ${prichina}`,
    };
  }
}
