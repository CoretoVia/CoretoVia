/**
 * ВРАТАТА · спирателен кран (П1.4), право, валидност.
 */

import { describe, expect, it } from 'vitest';
import {
  DnevnikVPametta,
  GreshkaVrata,
  PoSpisak,
  Vrata,
  VsichkoRazresheno,
  type Pravata,
} from '../src/yadro/index.js';
import { KNIGA, operatsiya, SHA, VERIGA_NA_SLUZHITEL } from './pomoshtni.js';

function novaVrata(pravata: Pravata = new VsichkoRazresheno()) {
  const dnevnik = new DnevnikVPametta();
  return { dnevnik, vrata: new Vrata({ dnevnik, pravata, sha: SHA }) };
}

describe('спирателен кран', () => {
  it('спира записа, но не събаря четенето', async () => {
    const { dnevnik, vrata } = novaVrata();
    await vrata.dobavi(operatsiya({ opId: 'op-1' }));

    vrata.zatvori('съмнение за счупена верига');
    expect(vrata.zatvorena).toBe(true);

    await expect(vrata.dobavi(operatsiya({ opId: 'op-2' }))).rejects.toMatchObject({
      kod: 'SPRYAN',
    });

    // Четенето работи.
    expect(await dnevnik.chetiVsichki('vintexstroy')).toHaveLength(1);

    vrata.otvori();
    await vrata.dobavi(operatsiya({ opId: 'op-2' }));
    expect(await dnevnik.chetiVsichki('vintexstroy')).toHaveLength(2);
  });

  it('носи причината за спирането', () => {
    const { vrata } = novaVrata();
    vrata.zatvori('миграция в ход');
    expect(vrata.prichinaZaZatvaryane).toBe('миграция в ход');
  });
});

describe('право', () => {
  it('отказва писане при чужд верига', async () => {
    const { dnevnik, vrata } = novaVrata(new PoSpisak({ 'ivo@example.com': ['veriga-a'] }));

    await vrata.dobavi(operatsiya({ opId: 'op-1', actor: 'ivo@example.com', veriga: 'veriga-a' }));

    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-2', actor: 'ivo@example.com', veriga: 'veriga-b' })),
    ).rejects.toMatchObject({ kod: 'BEZ_PRAVO' });

    expect(await dnevnik.chetiVsichki('veriga-b')).toHaveLength(0);
  });
});

describe('валидност', () => {
  it('отказва пари, които не са цели центове', async () => {
    const { vrata } = novaVrata();

    for (const losha of [12.5, NaN, Infinity, '100', null]) {
      await expect(
        vrata.dobavi(operatsiya({ opId: `op-${String(losha)}`, payload: { naem_st: losha } })),
      ).rejects.toMatchObject({ kod: 'NEVALIDNO' });
    }
  });

  it('проверява парите и във вложен обект', async () => {
    const { vrata } = novaVrata();

    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-1', payload: { razbivka: { dds_st: 20.5 } } })),
    ).rejects.toMatchObject({ kod: 'NEVALIDNO' });

    const dobar = await vrata.dobavi(
      operatsiya({ opId: 'op-2', payload: { razbivka: { dds_st: 20_50 } } }),
    );
    expect(dobar.seq).toBe(1);
  });

  /**
   * СЛЯПОТО ПЕТНО НА ПАЗАЧА · намерено при проектирането на разделения ред.
   *
   * Проверката слизаше във вложен ОБЕКТ, но нарочно прескачаше МАСИВ — от
   * първия коммит на ядрото. Дефект не е имало, защото нито едно събитие не
   * носеше пари в масив. Но „един ред от картата, разделен на две теми" носи
   * точно това, и дробният цент щеше да мине като валиден запис.
   */
  it('проверява парите и в МАСИВ — там, където дотук не влизаше', async () => {
    const { vrata } = novaVrata();

    // масив от ОБЕКТИ, всеки със своя сума
    await expect(
      vrata.dobavi(
        operatsiya({ opId: 'op-1', payload: { chasti: [{ suma_st: 10_00 }, { suma_st: 5.5 }] } }),
      ),
    ).rejects.toMatchObject({ kod: 'NEVALIDNO' });

    // и отказът КАЗВА коя част е сгрешена, не само че някоя е
    await expect(
      vrata.dobavi(
        operatsiya({ opId: 'op-2', payload: { chasti: [{ suma_st: 10_00 }, { suma_st: 5.5 }] } }),
      ),
    ).rejects.toThrow(/chasti\[1\]\.suma_st/);

    // масив ОТ СУМИ · ключът се носи надолу, наставката важи за всеки член
    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-3', payload: { vnoski_st: [100, 200.5] } })),
    ).rejects.toThrow(/vnoski_st\[1\]/);

    // а верните минават — и двата вида масив
    const dobar = await vrata.dobavi(
      operatsiya({
        opId: 'op-4',
        payload: { chasti: [{ suma_st: 10_00 }, { suma_st: 5_50 }], vnoski_st: [100, 200] },
      }),
    );
    expect(dobar.seq).toBe(1);
  });

  /**
   * СЪЩОТО СЛЯПО ПЕТНО, ВТОРАТА МУ ФОРМА · намерено при редовете на таблица.
   *
   * Пари ПО КОЛОНА се пазят в карта: `pari_st: { '2': 12000 }`. Дотук ключът с
   * наставка + стойност обект падаше като „не е цели центове" — вярно за
   * картата, безсмислено за човека, и оставяше един-единствен изход: име БЕЗ
   * наставка, тоест заобикаляне на самата проверка.
   */
  it('проверява парите и в КАРТА — колона по колона', async () => {
    const { vrata } = novaVrata();

    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-1', payload: { pari_st: { 2: 120_00, 5: 12.34 } } })),
    ).rejects.toMatchObject({ kod: 'NEVALIDNO' });

    // и отказът КАЗВА КОЯ колона е сгрешена
    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-2', payload: { pari_st: { 2: 120_00, 5: 12.34 } } })),
    ).rejects.toThrow(/pari_st\.5/);

    // празната карта минава — ред без нито една сума е ред, не грешка
    const prazna = await vrata.dobavi(operatsiya({ opId: 'op-3', payload: { pari_st: {} } }));
    expect(prazna.seq).toBe(1);

    const dobar = await vrata.dobavi(
      operatsiya({ opId: 'op-4', payload: { pari_st: { 2: 120_00, 5: 80_67 } } }),
    );
    expect(dobar.seq).toBe(2);
  });

  it('масив от текст не се бърка с пари', async () => {
    const { vrata } = novaVrata();
    const r = await vrata.dobavi(
      operatsiya({ opId: 'op-1', payload: { izvori: ['файл-а', 'файл-б'], suma_st: 1_00 } }),
    );
    expect(r.seq).toBe(1);
  });

  it('пропуска полета без наставката за пари', async () => {
    const { vrata } = novaVrata();
    const r = await vrata.dobavi(
      operatsiya({ opId: 'op-1', payload: { ploshtad: 72.5, adres: 'Лозенец' } }),
    );
    expect(r.seq).toBe(1);
  });

  it('отказва празни задължителни полета и невалидно време', async () => {
    const { vrata } = novaVrata();

    await expect(vrata.dobavi(operatsiya({ opId: '' }))).rejects.toBeInstanceOf(GreshkaVrata);
    await expect(vrata.dobavi(operatsiya({ opId: 'op-1', actor: '' }))).rejects.toMatchObject({
      kod: 'NEVALIDNO',
    });
    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-2', ts: 'вчера следобед' })),
    ).rejects.toMatchObject({ kod: 'NEVALIDNO' });
    await expect(
      vrata.dobavi(operatsiya({ opId: 'op-3', sashtnost: { vid: 'naem', id: '' } })),
    ).rejects.toMatchObject({ kod: 'NEVALIDNO' });
  });
});

/**
 * Т10 · ЧАСОВНИКЪТ НЕ ТРЪГВА НАЗАД · и пазачът е НА ВРАТАТА.
 *
 * `ts` е първата тежест в такта (правило 6) и е В ПОДПИСА. Тръгне ли назад,
 * сгънатото Огледало подрежда вчерашното СЛЕД днешното — тихо, защото всяко
 * звено поотделно си е наред.
 *
 * Пазачът съществуваше, но живееше в ИЗПЪЛНИТЕЛЯ — в един викащ. А правило 2
 * казва, че Вратата е ЕДИНСТВЕНИЯТ вход, и адаптерите са ТРИ (екран · Книга ·
 * агенти). Тестът пише ПРЯКО на Вратата, тъй че доказва точно това: пътят
 * покрай пазача го няма.
 */
describe('часовникът · Т10', () => {
  it('назад тръгнало време се ПОПРАВЯ, не се записва', async () => {
    const { vrata, dnevnik } = novaVrata();
    await vrata.dobavi(operatsiya({ opId: 'op-1', ts: '2026-09-05T10:00:00.000Z' }));
    // втори запис с ПО-РАННО време · точно каквото дава поправен часовник
    await vrata.dobavi(operatsiya({ opId: 'op-2', ts: '2026-09-05T09:00:00.000Z' }));

    const vsichki = await dnevnik.chetiVsichki(KNIGA);
    expect(vsichki.map((s) => s.seq)).toEqual([1, 2]);
    // редът се пази: второто е СЛЕД първото, с една милисекунда
    expect(Date.parse(vsichki[1]!.ts)).toBeGreaterThan(Date.parse(vsichki[0]!.ts));
    expect(vsichki[1]!.ts).toBe('2026-09-05T10:00:00.001Z');
  });

  it('и поправката се БРОИ · тихата поправка е същият клас като тихата загуба', async () => {
    const { vrata } = novaVrata();
    expect(vrata.vrateniChasovnitsi).toBe(0);
    await vrata.dobavi(operatsiya({ opId: 'op-1', ts: '2026-09-05T10:00:00.000Z' }));
    // напред · нищо не се поправя
    await vrata.dobavi(operatsiya({ opId: 'op-2', ts: '2026-09-05T11:00:00.000Z' }));
    expect(vrata.vrateniChasovnitsi).toBe(0);
    // назад · брои се
    await vrata.dobavi(operatsiya({ opId: 'op-3', ts: '2026-09-05T08:00:00.000Z' }));
    expect(vrata.vrateniChasovnitsi).toBe(1);
  });

  it('всяка верига си има СВОЙ часовник · чуждият не я дърпа напред', async () => {
    const { vrata, dnevnik } = novaVrata();
    await vrata.dobavi(operatsiya({ opId: 'op-1', ts: '2026-09-05T20:00:00.000Z' }));
    // друга верига · нейното време е по-ранно и това е НОРМАЛНО
    await vrata.dobavi(
      operatsiya({ opId: 'op-2', veriga: VERIGA_NA_SLUZHITEL, ts: '2026-09-05T09:00:00.000Z' }),
    );
    const chuzhda = await dnevnik.chetiVsichki(VERIGA_NA_SLUZHITEL);
    expect(chuzhda[0]!.ts).toBe('2026-09-05T09:00:00.000Z');
    expect(vrata.vrateniChasovnitsi).toBe(0);
  });
});
