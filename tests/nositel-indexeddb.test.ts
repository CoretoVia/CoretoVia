import { veriga as verigata } from '../src/yadro/index.js';
/**
 * СЪЩИТЕ инварианти, друг носител.
 *
 * Договорът е един за трите носителя (System design §3), значи и тестът е един.
 * Ако IndexedDB реализацията мине същите проверки като тази в паметта,
 * Вратата може да стои върху която и да е от двете, без да знае разликата.
 */

import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  GreshkaReplay,
  proveriVerigata,
  Vrata,
  VsichkoRazresheno,
  type Dnevnik,
} from '../src/yadro/index.js';
import { otvoriDnevnik, type DnevnikVIndexedDB } from '../src/nositel/dnevnik-indexeddb.js';
import { operatsiya, SHA } from './pomoshtni.js';

const NAEMATEL = 'vintexstroy';
let broyach = 0;

/** Всеки тест получава своя база — иначе съседите си пречат. */
async function stend(): Promise<{ dnevnik: DnevnikVIndexedDB; vrata: Vrata }> {
  broyach += 1;
  const dnevnik = await otvoriDnevnik(`masterbook-test-${broyach}`);
  return { dnevnik, vrata: new Vrata({ dnevnik, pravata: new VsichkoRazresheno(), sha: SHA }) };
}

describe('Журналът върху IndexedDB · същият договор', () => {
  it('приема записи и веригата остава цяла', async () => {
    const { dnevnik, vrata } = await stend();

    for (let i = 1; i <= 50; i += 1) {
      await vrata.dobavi(operatsiya({ opId: `op-${i}`, payload: { suma_st: i * 100 } }));
    }

    const vsichki = await dnevnik.chetiVsichki(NAEMATEL);
    expect(vsichki).toHaveLength(50);
    expect(vsichki.map((s) => s.seq)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
  });

  it('повторен opId не създава втори запис', async () => {
    const { dnevnik, vrata } = await stend();
    const op = operatsiya({ opId: 'op-edno', payload: { suma_st: 250_00 } });

    const parvo = await vrata.dobavi(op);
    const vtoro = await vrata.dobavi(op);

    expect(vtoro.povtoreno).toBe(true);
    expect(vtoro.seq).toBe(parvo.seq);
    expect(await dnevnik.chetiVsichki(NAEMATEL)).toHaveLength(1);
  });

  it('едновременни записи дават редица без дупка', async () => {
    const { dnevnik, vrata } = await stend();

    await Promise.all(
      Array.from({ length: 40 }, (_, i) => vrata.dobavi(operatsiya({ opId: `op-${i}` }))),
    );

    const vsichki = await dnevnik.chetiVsichki(NAEMATEL);
    expect(vsichki.map((s) => s.seq).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 40 }, (_, i) => i + 1),
    );
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
  });

  it('всеки верига има своя редица — данните не се смесват', async () => {
    const { dnevnik, vrata } = await stend();

    await vrata.dobavi(operatsiya({ opId: 'a-1', veriga: 'veriga-a' }));
    await vrata.dobavi(operatsiya({ opId: 'b-1', veriga: 'veriga-b' }));
    await vrata.dobavi(operatsiya({ opId: 'a-2', veriga: 'veriga-a' }));

    const a = await dnevnik.chetiVsichki('veriga-a');
    const b = await dnevnik.chetiVsichki('veriga-b');

    expect(a.map((s) => s.seq)).toEqual([1, 2]);
    expect(b.map((s) => s.seq)).toEqual([1]);
    expect(a.every((s) => verigata(s) === 'veriga-a')).toBe(true);
  });

  it('един и същ opId при различни вериги са различни операции', async () => {
    const { dnevnik, vrata } = await stend();

    await vrata.dobavi(operatsiya({ opId: 'op-1', veriga: 'veriga-a' }));
    await vrata.dobavi(operatsiya({ opId: 'op-1', veriga: 'veriga-b' }));

    expect(await dnevnik.chetiVsichki('veriga-a')).toHaveLength(1);
    expect(await dnevnik.chetiVsichki('veriga-b')).toHaveLength(1);
  });

  it('текущият rev на същност е seq на последното ѝ събитие', async () => {
    const { dnevnik, vrata } = await stend();
    const naem = { vid: 'naem', id: 'N-1' };
    const imot = { vid: 'imot', id: 'I-1' };

    expect(await dnevnik.tekushtRev(NAEMATEL, naem)).toBe(0);

    await vrata.dobavi(operatsiya({ opId: 'op-1', sashtnost: naem }));
    await vrata.dobavi(operatsiya({ opId: 'op-2', sashtnost: imot }));
    const treto = await vrata.dobavi(operatsiya({ opId: 'op-3', sashtnost: naem }));

    expect(await dnevnik.tekushtRev(NAEMATEL, naem)).toBe(treto.seq);
    expect(await dnevnik.tekushtRev(NAEMATEL, imot)).toBe(2);
  });

  it('rev-предпазителят отказва с REPLAY и следващият запис минава', async () => {
    const { dnevnik, vrata } = await stend();
    const sashtnost = { vid: 'naem', id: 'N-7' };

    await vrata.dobavi(operatsiya({ opId: 'ok-1', sashtnost }));
    await expect(
      vrata.dobavi(operatsiya({ opId: 'losh-2', sashtnost, expectedRev: 999 })),
    ).rejects.toBeInstanceOf(GreshkaReplay);
    await vrata.dobavi(operatsiya({ opId: 'ok-3', sashtnost }));

    const vsichki = await dnevnik.chetiVsichki(NAEMATEL);
    expect(vsichki.map((s) => s.opId)).toEqual(['ok-1', 'ok-3']);
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
  });

  it('чете събитията за една същност, подредени по seq', async () => {
    const { dnevnik, vrata } = await stend();
    const naem = { vid: 'naem', id: 'N-1' };

    await vrata.dobavi(operatsiya({ opId: 'op-1', sashtnost: naem }));
    await vrata.dobavi(operatsiya({ opId: 'op-2', sashtnost: { vid: 'imot', id: 'I-1' } }));
    await vrata.dobavi(operatsiya({ opId: 'op-3', sashtnost: naem }));

    const zaNaema = await dnevnik.chetiZaSashtnost(NAEMATEL, naem);
    expect(zaNaema.map((s) => s.opId)).toEqual(['op-1', 'op-3']);
  });

  it('преживява затваряне и отваряне наново — данните са там', async () => {
    broyach += 1;
    const ime = `coretovia-test-traynost-${broyach}`;

    const parvi = await otvoriDnevnik(ime);
    const vrata = new Vrata({ dnevnik: parvi, pravata: new VsichkoRazresheno(), sha: SHA });
    await vrata.dobavi(operatsiya({ opId: 'op-1', payload: { naem_st: 1150_00 } }));
    await vrata.dobavi(operatsiya({ opId: 'op-2', payload: { naem_st: 640_00 } }));
    parvi.zatvori();

    const vtori = await otvoriDnevnik(ime);
    const vsichki = await vtori.chetiVsichki(NAEMATEL);

    expect(vsichki).toHaveLength(2);
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
    expect(vsichki[0]!.payload['naem_st']).toBe(1150_00);
    vtori.zatvori();
  });

  it('Вратата не знае кой носител стои под нея', async () => {
    const { dnevnik } = await stend();
    // Типова проверка: реализацията се събира в порта без изключения.
    const kato: Dnevnik = dnevnik;
    expect(await kato.chetiVsichki(NAEMATEL)).toEqual([]);
  });
});

/**
 * СТЪПАЛОТО 1 → 2 · РАЗРЕЗЪТ · и защо този тест е задължителен.
 *
 * Стъпалото беше написано да ТРИЕ хранилището, с оправдание неговата дума
 * „само проби, които може да се изтрият". Неговата поправка на 10.09.2026:
 * **„Това важи за Сметки, но не и за Управление."** Управление е истината
 * (правило 20) — тоест стъпалото щеше да изяде истински данни.
 *
 * Затова тук се строи ИСТИНСКА база на версия 1, със стария ключ и стария
 * подпис, и се проверява не че кодът „минава", а че: записите ги ИМА,
 * веригата е ЦЯЛА, и нищо не е измислено на мястото на липсващото.
 */
describe('стъпалото 1 → 2 · пренася, не трие', () => {
  /** Базата, както е изглеждала преди разреза · ключ `['veriga', 'seq']`. */
  function bazaNaVersiya1(ime: string, zapisi: readonly unknown[]): Promise<void> {
    return new Promise((gotovo, provali) => {
      const z = indexedDB.open(ime, 1);
      z.onupgradeneeded = () => {
        const h = z.result.createObjectStore('sabitiya', { keyPath: ['veriga', 'seq'] });
        h.createIndex('po-opId', ['veriga', 'opId'], { unique: true });
        h.createIndex('po-sashtnost', ['veriga', 'sashtnost.vid', 'sashtnost.id']);
      };
      z.onsuccess = () => {
        const db = z.result;
        const tr = db.transaction('sabitiya', 'readwrite');
        for (const r of zapisi) tr.objectStore('sabitiya').add(r);
        tr.oncomplete = () => {
          db.close();
          gotovo();
        };
        tr.onerror = () => provali(tr.error);
      };
      z.onerror = () => provali(z.error);
    });
  }

  /** Едно звено по СТАРАТА форма · подписът се смята с нея, не с днешната. */
  async function staroZveno(seq: number, prevHash: string): Promise<Record<string, unknown>> {
    const bez = {
      seq,
      opId: `op-${seq}`,
      ts: `2026-09-0${seq}T09:00:00.000Z`,
      veriga: NAEMATEL,
      actor: 'stopanin@x.bg',
      type: 'ЗаписЗаписан',
      sashtnost: { vid: 'zapis', id: `Z-${seq}` },
      payload: { naem_st: seq * 100_00 },
      prevHash,
    };
    // старата канонична форма, дословно както е стояла: без версия, без
    // валута, с ЕДНИЯ композитен низ
    const hash = await SHA(
      JSON.stringify([
        bez.seq,
        bez.opId,
        bez.ts,
        bez.veriga,
        bez.actor,
        bez.type,
        bez.sashtnost.vid,
        bez.sashtnost.id,
        bez.payload,
        bez.prevHash,
      ]),
    );
    return { ...bez, hash };
  }

  it('стар Журнал оцелява · записите са там и веригата е ЦЯЛА', async () => {
    const ime = 'stapalo-1-2';
    const a = await staroZveno(1, '');
    const b = await staroZveno(2, a['hash'] as string);
    await bazaNaVersiya1(ime, [a, b]);

    const nov = await otvoriDnevnik(ime);
    const vsichki = await nov.chetiVsichki(NAEMATEL);

    // 1 · НИЩО НЕ Е ИЗЯДЕНО
    expect(vsichki).toHaveLength(2);
    expect(vsichki.map((s) => s.seq)).toEqual([1, 2]);
    expect(vsichki[1]!.payload['naem_st']).toBe(2 * 100_00);

    // 2 · веригата е ЦЯЛА · старият подпис се проверява със СВОЯТА форма
    expect(await proveriVerigata(vsichki, SHA)).toEqual({ tsyala: true, proverni: 2 });

    // 3 · изведеното е вярно, а несъществувалото се КАЗВА, не се измисля
    expect(verigata(vsichki[0]!)).toBe(NAEMATEL);
    expect(vsichki[0]!.shema).toBe(0);
    expect(vsichki[0]!.valuta).toBe('predi-razreza');
    expect(vsichki[0]!.ustroystvo).toBe('predi-razreza');

    // 4 · старото поле го няма · веригата се ИЗВЕЖДА (правило 14)
    expect('veriga' in vsichki[0]!).toBe(false);

    nov.zatvori();
  });

  it('пренесеният Журнал продължава да приема НОВИ записи · seq не се обърква', async () => {
    const ime = 'stapalo-1-2-dopisvane';
    const a = await staroZveno(1, '');
    await bazaNaVersiya1(ime, [a]);

    const dnevnik = await otvoriDnevnik(ime);
    const vrata = new Vrata({ dnevnik, pravata: new VsichkoRazresheno(), sha: SHA });
    await vrata.dobavi(operatsiya({ opId: 'nov-1', payload: { naem_st: 999_00 } }));

    const vsichki = await dnevnik.chetiVsichki(NAEMATEL);
    expect(vsichki.map((s) => s.seq)).toEqual([1, 2]);
    // старото е версия 0, новото е днешната · и двете в ЕДНА цяла верига
    expect(vsichki.map((s) => s.shema)).toEqual([0, 1]);
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
    dnevnik.zatvori();
  });

  /**
   * БЛОКИРАНО · друг раздел държи базата на СТАРА версия.
   *
   * Платено на 10.09.2026: след пускането собственикът видя празен екран —
   * „Нищо не виждам." Възпроизведено в истински Chromium: раздел, отворен преди
   * пускането, държи версия 1; `open(…, 2)` чака безкрайно и МЪЛЧАЛИВО. Чакането е
   * правилно, мълчанието — не (правило 12). Тук се доказва и двете: думите идват,
   * и щом държачът се пусне, отварянето продължава САМО, без нищо изгубено.
   */
  it('друг раздел държи версия 1 → казва се С ДУМИ · пусне ли се, отварянето продължава само', async () => {
    const ime = 'stapalo-1-2-blokirano';
    await bazaNaVersiya1(ime, [await staroZveno(1, '')]);
    // „старият раздел" · връзка на версия 1, която НЕ се затваря при versionchange
    const darzhach = await new Promise<IDBDatabase>((gotovo, provali) => {
      const z = indexedDB.open(ime, 1);
      z.onsuccess = () => gotovo(z.result);
      z.onerror = () => provali(z.error);
    });

    let kazhi: (d: string) => void = () => {};
    const dumite = new Promise<string>((r) => {
      kazhi = r;
    });
    const otvaryane = otvoriDnevnik(ime, (d) => kazhi(d));

    // първо думите · без нито един изминал тик „на око"
    expect(await dumite).toMatch(/друг раздел/);

    darzhach.close();
    const dnevnik = await otvaryane;
    expect((await dnevnik.chetiVsichki(NAEMATEL)).map((s) => s.seq)).toEqual([1]);
    dnevnik.zatvori();
  });
});
