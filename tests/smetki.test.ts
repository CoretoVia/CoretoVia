import { koyPishe } from '../src/yadro/index.js';
/**
 * СМЕТКИТЕ · знакът · секциите · сборовете · кешът (ADR-006).
 *
 * Правило 20: знакът решава страната. Правило 3: цели центове. Правило 7:
 * сверката се записва и когато е нула.
 */

import { describe, expect, it } from 'vitest';
import { eOtkaz, type Otkaz } from '../src/komandi/izpalnenie.js';
import { MODEL, NOMENKLATURA } from '../src/model/osnova.js';
import type { Ogledalo } from '../src/ogledalo/ogledalo.js';
import { redKato, zhiviteRedove } from '../src/ogledalo/tablitsa.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { ddsat } from '../src/smetach/dds.js';
import { GreshkaPari } from '../src/yadro/pari.js';
import {
  IZVEDENITE_NA_SMETKITE,
  keshatNaMeseca,
  OBRAZETS_NA_MESETSA,
  SEKTSIYA_FAKTURI_KESH,
  SEKTSIYA_ZAPLATI_KESH,
  smetkite,
  stranaNaSuma,
  vkarvaneto,
} from '../src/smetach/smetki.js';
import { KNIGA, knigaZaTest, nomerNaSektsiya, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const KOGATO = '2026-09-05T13:00:00.000Z';
const MESETS = '2026-09';
const PRAZEN = { plosht: null, tsena: null, papka: null, adres: null };

describe('изведените на Сметки · сборовете и кешът с помощта им', () => {
  it('осем глави · ключовете са тези на полетата на екрана · формулите са на този файл', () => {
    expect(IZVEDENITE_NA_SMETKITE.map((k) => k.klyuch)).toEqual([
      'prihod',
      'razhod',
      'rezultat',
      'sektsiya',
      'vkarvane',
      'kesh-dadeno',
      'kesh-izvlechenie',
      'kesh-vkarano',
    ]);
    const kratko = (klyuch: string): string =>
      IZVEDENITE_NA_SMETKITE.find((k) => k.klyuch === klyuch)!.pomosht.kratko;
    // резултатът СЪБИРА, защото разходът е с минус (правило 16)
    expect(kratko('rezultat')).toBe('приход + разход · разходът е с минус');
    // вкарването е точно трите секции на `vkarvaneto`
    expect(kratko('vkarvane')).toContain(SEKTSIYA_ZAPLATI_KESH);
    expect(kratko('vkarvane')).toContain(SEKTSIYA_FAKTURI_KESH);
    // даденото е заплати + фактури · както `keshatNaMeseca` го смята
    expect(kratko('kesh-dadeno')).toMatch(/^заплати \+ фактури/);
    for (const k of IZVEDENITE_NA_SMETKITE) expect(k.ime.length).toBeGreaterThan(0);
  });
});

function otkazat(r: unknown): Otkaz {
  if (!eOtkaz(r)) throw new Error(`очаквах отказ, а мина: ${JSON.stringify(r)}`);
  return r;
}

async function otvori() {
  const k = knigaZaTest();
  let takt = 0;
  const iz = await Izpalnitel.otvori({
    vrata: k.vrata,
    dnevnik: k.dnevnik,
    model: MODEL,
    ...koyPishe(KNIGA),
    ustroystvo: USTROYSTVO,
    valuta: VALUTA,
    aktor: () => STOPANIN,
    sega: () => {
      takt += 1;
      return new Date(Date.parse(KOGATO) + takt * 1000).toISOString();
    },
  });
  const zapishi = async (id: string, klyuch: string, tovar: unknown) => {
    const r = await iz.izpalni(id, klyuch, tovar);
    if ('otkaz' in r) throw new Error(r.zashto.join(' | '));
    return r;
  };
  await zapishi('k0', 'stopanin.otkriy', { imeyl: STOPANIN });
  await zapishi('i1', 'imoti.sazdayImot', {
    kletki: { ime: { tekst: 'Гара Яна' }, sastoyanie: { nomer: 2 }, nomer: null, ...PRAZEN },
  });
  await zapishi('o1', 'imoti.dobaviObekt', {
    kletki: {
      imot: { tekst: 'imot:i1' },
      kategoriya: { nomer: 1 },
      vid: { nomer: 4 },
      nomer: { chislo: 1 },
      ...PRAZEN,
    },
  });
  return { iz, zapishi };
}

/** Едно движение · сумата е в центове СЪС знака си. */
const dvizhenie = (oshte: Record<string, unknown>) => ({
  kletki: {
    kam: null,
    ime: null,
    sektsiya: null,
    sektsiyaR: null,
    funktsiya: { nomer: 3 },
    sastoyanie: null,
    mesets: { tekst: MESETS },
    suma: null,
    ...oshte,
  },
});

describe('знакът решава страната (правило 20)', () => {
  it('положителното е приход · отрицателното е разход · нулата не е движение', () => {
    expect(stranaNaSuma(1)).toBe('prihod');
    expect(stranaNaSuma(-1)).toBe('razhod');
    expect(stranaNaSuma(0)).toBe(null);
    expect(OBRAZETS_NA_MESETSA.test('2026-09')).toBe(true);
    expect(OBRAZETS_NA_MESETSA.test('2026-13')).toBe(false);
    expect(OBRAZETS_NA_MESETSA.test('2026-9')).toBe(false);
  });

  it('приход в приходна секция минава · в разходна се отказва с думи', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'obekt:o1' },
        sektsiya: { nomer: 1 },
        suma: { stoynost_st: 120000 },
      }),
    );
    expect(zhiviteRedove(iz.ogledalo().tablitsi.get('dvizheniya')!)).toHaveLength(1);
    const otkaz = (t: unknown) =>
      otkazat(iz.probvay('x', 'smetki.dobaviDvizhenie', t)).zashto.join(' ');
    expect(otkaz(dvizhenie({ sektsiyaR: { nomer: 1 }, suma: { stoynost_st: 120000 } }))).toMatch(
      /Знакът не отговаря на секцията: „секция в Разходи" е разход \(−\), а сумата е положителна/,
    );
    expect(otkaz(dvizhenie({ sektsiya: { nomer: 1 }, suma: { stoynost_st: -120000 } }))).toMatch(
      /„секция в ПРИХОД" е приход \(\+\)/,
    );
    expect(otkaz(dvizhenie({ sektsiya: { nomer: 1 }, suma: { stoynost_st: 0 } }))).toMatch(
      /Нула не е движение/,
    );
    expect(
      otkaz(
        dvizhenie({
          sektsiya: { nomer: 1 },
          sektsiyaR: { nomer: 1 },
          suma: { stoynost_st: 100 },
        }),
      ),
    ).toMatch(/Редът е в две секции/);
    expect(otkaz(dvizhenie({ suma: { stoynost_st: 100 } }))).toMatch(/Редът с пари не е в секция/);
    expect(
      otkaz(
        dvizhenie({
          sektsiya: { nomer: 1 },
          suma: { stoynost_st: 100 },
          mesets: { tekst: '09.2026' },
        }),
      ),
    ).toMatch(/не е месец ГГГГ-ММ/);
  });

  it('поправката в клетка също минава през знака · разход не става приход с една клетка', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        sektsiyaR: { nomer: 1 },
        ime: { tekst: '[служител 1]' },
        suma: { stoynost_st: -150000 },
      }),
    );
    const id = iz.ogledalo().tablitsi.get('dvizheniya')!.id[0]!;
    expect(
      otkazat(
        iz.probvay('x', 'red.popraviKletka', {
          tablitsa: 'dvizheniya',
          id,
          kletki: { suma: { stoynost_st: 150000 } },
        }),
      ).zashto[0],
    ).toMatch(/Знакът не отговаря на секцията/);
    await zapishi('p1', 'red.popraviKletka', {
      tablitsa: 'dvizheniya',
      id,
      kletki: { suma: { stoynost_st: -160000 } },
    });
    const tv = iz.ogledalo().tablitsi.get('dvizheniya')!;
    expect(redKato(tv, 0).kletki['suma']).toEqual({ stoynost_st: -160000 });
  });
});

describe('секциите и сборовете', () => {
  async function sDvizheniya() {
    const { iz, zapishi } = await otvori();
    const naem = nomerNaSektsiya(iz.ogledalo(), 'prihod', 'Наем Банка')!;
    const zaplati = nomerNaSektsiya(iz.ogledalo(), 'razhod', SEKTSIYA_ZAPLATI_KESH)!;
    const fakturi = nomerNaSektsiya(iz.ogledalo(), 'razhod', SEKTSIYA_FAKTURI_KESH)!;
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'obekt:o1' },
        sektsiya: { nomer: naem },
        suma: { stoynost_st: 120000 },
      }),
    );
    await zapishi(
      'd2',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'obekt:o1' },
        sektsiya: { nomer: naem },
        suma: { stoynost_st: 80000 },
      }),
    );
    await zapishi(
      'd3',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        ime: { tekst: '[служител 1]' },
        sektsiyaR: { nomer: zaplati },
        suma: { stoynost_st: -150000 },
      }),
    );
    await zapishi(
      'd4',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        ime: { tekst: 'ток' },
        sektsiyaR: { nomer: fakturi },
        suma: { stoynost_st: -25000 },
      }),
    );
    return { iz, zapishi, naem, zaplati, fakturi };
  }

  it('всяка секция носи редовете и сбора си · резултатът е приход + разход', async () => {
    const { iz } = await sDvizheniya();
    const s = smetkite(iz.ogledalo(), KOGATO);
    expect(s.prihod.map((x) => [x.tekst, x.redove.length, x.sbor])).toEqual([
      ['Наем Банка', 2, 200000],
      ['Наем Кеш', 0, 0],
      ['Бизнес', 0, 0],
      ['Други', 0, 0],
    ]);
    expect(s.razhod.filter((x) => x.redove.length > 0).map((x) => [x.tekst, x.sbor])).toEqual([
      ['Заплати Кеш', -150000],
      ['Фактури Кеш', -25000],
    ]);
    expect([s.sborPrihod, s.sborRazhod, s.rezultat]).toEqual([200000, -175000, 25000]);
    expect(s.bezSektsiya).toEqual([]);
    expect(s.broyDvizheniya).toBe(4);
    expect(s.sverka.nared).toBe(true);
  });

  /**
   * СПРЯНА СЕКЦИЯ · находка Т1 от одита на 08.09.2026.
   *
   * Дотук `sektsiiteNa` вървеше по `zhivite(n)`. Спряна секция изобщо не се
   * раждаше, а редовете ѝ вече носеха `namerena = true` и затова не падаха и в
   * `bezSektsiya`. Резултатът: парите ИЗЧЕЗВАХА от сбора и от изнесената Книга,
   * мълчаливо. Правило 18 казва обратното: „скритото пак се смята".
   */
  it('СПРЯНА секция пак се смята · парите не изчезват (правило 18)', async () => {
    const { iz, zapishi, naem } = await sDvizheniya();
    const predi = smetkite(iz.ogledalo(), KOGATO);
    expect(predi.sborPrihod).toBe(200000);

    await zapishi('sp1', 'nastroyki.spriStoynost', {
      nomenklatura: NOMENKLATURA.sektsiiPrihod,
      nomer: naem,
      belezi: {},
    });

    const sled = smetkite(iz.ogledalo(), KOGATO);
    // ЕДИНСТВЕНОТО, което има значение: числото за подпис не мърда.
    expect(sled.sborPrihod).toBe(200000);
    expect(sled.rezultat).toBe(predi.rezultat);
    // и редовете не са се разпилели никъде другаде
    expect(sled.bezSektsiya).toEqual([]);
    expect(sled.broyDvizheniya).toBe(4);
    expect(sled.sverka.nared).toBe(true);

    const spryanata = sled.prihod.find((s) => s.nomer === naem);
    expect(spryanata, 'спряната секция изчезна от изгледа').toBeDefined();
    expect(spryanata?.spryana).toBe(true);
    expect(spryanata?.redove).toHaveLength(2);
    expect(spryanata?.sbor).toBe(200000);
  });

  it('спряна секция БЕЗ редове не се рисува · тя е шум, не история', async () => {
    const { iz, zapishi } = await sDvizheniya();
    const praznata = nomerNaSektsiya(iz.ogledalo(), 'prihod', 'Бизнес')!;
    expect(smetkite(iz.ogledalo(), KOGATO).prihod.some((s) => s.nomer === praznata)).toBe(true);

    await zapishi('sp2', 'nastroyki.spriStoynost', {
      nomenklatura: NOMENKLATURA.sektsiiPrihod,
      nomer: praznata,
      belezi: {},
    });

    const sled = smetkite(iz.ogledalo(), KOGATO);
    expect(sled.prihod.some((s) => s.nomer === praznata)).toBe(false);
    expect(sled.sborPrihod).toBe(200000);
  });

  it('периодът пресява по месец · сверката пак затваря', async () => {
    const { iz, zapishi, naem } = await sDvizheniya();
    await zapishi(
      'd5',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'obekt:o1' },
        sektsiya: { nomer: naem },
        mesets: { tekst: '2026-10' },
        suma: { stoynost_st: 90000 },
      }),
    );
    const vsichki = smetkite(iz.ogledalo(), KOGATO);
    expect(vsichki.sborPrihod).toBe(290000);
    const septemvri = smetkite(iz.ogledalo(), KOGATO, (m) => m === MESETS);
    expect(septemvri.sborPrihod).toBe(200000);
    expect(septemvri.broyDvizheniya).toBe(4);
    expect(septemvri.sverka.nared).toBe(true);
  });

  it('секцията „Вкарване" събира трите му секции на едно място (негово, 05.09 т.3)', async () => {
    const { iz } = await sDvizheniya();
    const v = vkarvaneto(iz.ogledalo(), KOGATO);
    expect(v.sektsii.map((s) => s.tekst)).toEqual(['Заплати Кеш', 'Фактури Кеш', 'Фактури Карта']);
    expect(v.redove).toHaveLength(2);
    expect(v.sbor).toBe(-175000);
    // и трите са налице · липсващи няма
    expect(v.lipsvashti).toEqual([]);
  });

  /**
   * Т29 · ПРЕИМЕНУВАНА СЕКЦИЯ ИЗПАДАШЕ МЪЛЧАЛИВО · и това ОТВАРЯШЕ гарда.
   *
   * Трите секции се познават по ТЕКСТ. Преименува ли се някоя от Настройки,
   * `.filter(x !== undefined)` я махаше и никой не научаваше. А екранът питаше
   * `v.sektsii.every(...)` — а `[].every(...)` е `true`. Тоест преименуването
   * на трите ОТВАРЯШЕ „Вкарване" за всеки.
   *
   * Сега липсата се НОСИ (`lipsvashti`) и екранът я КАЗВА (правило 12).
   */
  it('Т29 · преименувана секция се БРОИ като липсваща, не изпада мълчаливо', async () => {
    const { iz, zapishi } = await sDvizheniya();
    // „Заплати Кеш" е разходна секция №1 · преименува се от Настройки
    await zapishi('p1', 'nastroyki.preimenuvayStoynost', {
      nomenklatura: 'sektsii-razhodi',
      nomer: 1,
      tekst: 'Кеш',
      belezi: {},
    });
    const v = vkarvaneto(iz.ogledalo(), KOGATO);
    expect(v.lipsvashti).toEqual(['Заплати Кеш']);
    // и списъкът вече НЕ е пълен · гардът на екрана стъпва точно на това
    expect(v.sektsii).toHaveLength(2);
  });
});

describe('кешът за месеца (негово, 05.09 т.2)', () => {
  it('един ред на месец · вторият запис поправя същия ред, не ражда втори', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('kesh1', 'smetki.zapishiKesh', {
      mesets: MESETS,
      zaplati: { stoynost_st: 150000 },
      fakturi: { stoynost_st: 25000 },
      izvlechenie: null,
    });
    const tv = () => iz.ogledalo().tablitsi.get('kesh')!;
    expect(zhiviteRedove(tv())).toHaveLength(1);
    expect(tv().id[0]).toBe('kesh:2026-09');
    await zapishi('kesh2', 'smetki.zapishiKesh', {
      mesets: MESETS,
      zaplati: { stoynost_st: 150000 },
      fakturi: { stoynost_st: 25000 },
      izvlechenie: { stoynost_st: 170000 },
    });
    expect(zhiviteRedove(tv())).toHaveLength(1);
    expect(redKato(tv(), 0).kletki['izvlechenie']).toEqual({ stoynost_st: 170000 });
  });

  it('сверката · дадено ↔ изтеглено ↔ вкараното по редовете · и нулата се записва', async () => {
    const { iz, zapishi } = await otvori();
    const k0 = keshatNaMeseca(iz.ogledalo(), MESETS, KOGATO);
    expect([k0.dadeno, k0.izvlechenie, k0.vkarano]).toEqual([0, 0, 0]);
    for (const s of k0.sverki) expect(s.nared, s.kakvo).toBe(true);
    await zapishi('kesh1', 'smetki.zapishiKesh', {
      mesets: MESETS,
      zaplati: { stoynost_st: 150000 },
      fakturi: { stoynost_st: 25000 },
      izvlechenie: { stoynost_st: 175000 },
    });
    const zaplati = nomerNaSektsiya(iz.ogledalo(), 'razhod', SEKTSIYA_ZAPLATI_KESH)!;
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        ime: { tekst: '[служител 1]' },
        sektsiyaR: { nomer: zaplati },
        suma: { stoynost_st: -150000 },
      }),
    );
    const k1 = keshatNaMeseca(iz.ogledalo(), MESETS, KOGATO);
    expect([k1.zaplati, k1.fakturi, k1.dadeno, k1.izvlechenie, k1.vkarano]).toEqual([
      150000, 25000, 175000, 175000, -150000,
    ]);
    expect(k1.sverki[0]?.nared).toBe(true);
    // вкараното е 150 000 от дадени 175 000 → 25 000 още не са вкарани, и разликата се КАЗВА
    expect(k1.sverki[1]?.nared).toBe(false);
    expect(k1.sverki[1]?.razlika).toBe(-25000);
  });

  it('месец, който не е ГГГГ-ММ, се отказва · и празният запис също', async () => {
    const { iz } = await otvori();
    expect(
      otkazat(
        iz.probvay('x', 'smetki.zapishiKesh', {
          mesets: '2026-9',
          zaplati: { stoynost_st: 1 },
          fakturi: null,
          izvlechenie: null,
        }),
      ).zashto[0],
    ).toMatch(/не е месец ГГГГ-ММ/);
    expect(
      otkazat(
        iz.probvay('x', 'smetki.zapishiKesh', {
          mesets: MESETS,
          zaplati: null,
          fakturi: null,
          izvlechenie: null,
        }),
      ).zashto[0],
    ).toMatch(/всички полета са празни/);
  });
});

describe('номенклатурите на секциите са неговите', () => {
  it('четири приходни и осем разходни · с думите му', async () => {
    const { iz } = await otvori();
    const o = iz.ogledalo();
    expect(o.nomenklaturi.get(NOMENKLATURA.sektsiiPrihod)!.stoynosti.map((s) => s.tekst)).toEqual([
      'Наем Банка',
      'Наем Кеш',
      'Бизнес',
      'Други',
    ]);
    expect(o.nomenklaturi.get(NOMENKLATURA.sektsiiRazhodi)!.stoynosti.map((s) => s.tekst)).toEqual([
      'Заплати Кеш',
      'Фактури Кеш',
      'Фактури Карта',
      'Фактури Бнка',
      'Кредити',
      'Банкови такси',
      'Заплати Банка',
      'Бизнес',
    ]);
  });
});

/**
 * ПРЕГРАДАТА ЗА ЦЕЛИ ЧИСЛА (правило 3) · сборовете минават през `sabiri`.
 *
 * През Вратата дробна сума не минава, затова тук се подменя САМИЯТ стълб на
 * Огледалото: така се доказва, че сборът ОТКАЗВА число извън целите, вместо да
 * го събере мълчаливо — дотук `reduce((a, r) => a + r, 0)` събираше всичко.
 */
describe('преградата за цели центове · сборовете отказват дробното', () => {
  /** Огледало, в което първата клетка на колоната е дробна. */
  function sDrobnaKletka(o: Ogledalo, tablitsa: string, kolona: string): Ogledalo {
    const tv = o.tablitsi.get(tablitsa)!;
    const danni = Float64Array.from(tv.koloni.get(kolona)!.danni);
    danni[0] = 1050.5;
    const koloni = new Map(tv.koloni);
    koloni.set(kolona, { slot: 'stoynost_st', danni });
    return { ...o, tablitsi: new Map([...o.tablitsi, [tablitsa, { ...tv, koloni }]]) };
  }

  it('Сметки · секцията, страната и резултатът', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'obekt:o1' },
        sektsiya: { nomer: 1 },
        suma: { stoynost_st: 120000 },
      }),
    );
    const o = iz.ogledalo();
    expect(smetkite(o, KOGATO).sborPrihod).toBe(120000);
    expect(() => smetkite(sDrobnaKletka(o, 'dvizheniya', 'suma'), KOGATO)).toThrow(GreshkaPari);
  });

  it('ДДС · натрупването', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('d1', 'smetki.zapishiDds', {
      mesets: MESETS,
      nachislen: { stoynost_st: 60000 },
      kredit: null,
      deklarirano: null,
      plateno: null,
      izdadeni: null,
      plateni: null,
    });
    const o = iz.ogledalo();
    expect(ddsat(o, KOGATO).dalzhimo).toBe(60000);
    expect(() => ddsat(sDrobnaKletka(o, 'dds', 'nachislen'), KOGATO)).toThrow(GreshkaPari);
  });
});
