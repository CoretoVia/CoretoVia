import { koyPishe } from '../src/yadro/index.js';
/**
 * СМЕТКИТЕ В УПРАВЛЕНИЕ · движенията под своя Имот, Обект или Бизнес.
 *
 * Негово, 11.09 (запис 193): „**В Управление има същия бутон който обаче крие
 * само редовете на сметки /скрий Сметки/.**"
 *
 * Тук се пази онова, което може да се сбърка тихо: движение без родител да
 * увисне под някого, страната да се чете от попълнената колона вместо от знака,
 * и подредбата да зависи от реда на въвеждане.
 */

import { describe, expect, it } from 'vitest';
import { MODEL } from '../src/model/osnova.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { smetkiteVUpravlenie } from '../src/smetach/smetki-v-upravlenie.js';
import { KNIGA, knigaZaTest, nomerNaSektsiya, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const KOGATO = '2026-09-05T13:00:00.000Z';
const PRAZEN = { plosht: null, tsena: null, papka: null, adres: null };

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
    mesets: { tekst: '2026-09' },
    suma: null,
    ...oshte,
  },
});

describe('сметките в дървото на Управление', () => {
  it('движението застава под родителя си · без родител се КАЗВА, не се закача', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'imot:i1' },
        sektsiya: { nomer: nomerNaSektsiya(iz.ogledalo(), 'prihod', 'Наем Банка') },
        suma: { stoynost_st: 120_000 },
      }),
    );
    // заплата · без родител по неговата дума („заплати, кредит или банкова такса")
    await zapishi(
      'd2',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        sektsiyaR: { nomer: nomerNaSektsiya(iz.ogledalo(), 'razhod', 'Заплати Кеш') },
        suma: { stoynost_st: -50_000 },
      }),
    );
    const s = smetkiteVUpravlenie(iz.ogledalo());
    expect(s.ogledani).toBe(2);
    expect(s.bezRoditel).toHaveLength(1);
    expect(s.poRoditel.get('imot:i1')).toHaveLength(1);
    expect(s.poRoditel.get('imot:i1')?.[0]?.suma_st).toBe(120_000);
  });

  it('страната се чете от ЗНАКА · разходът показва разходната си секция', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'imot:i1' },
        sektsiyaR: { nomer: nomerNaSektsiya(iz.ogledalo(), 'razhod', 'Заплати Кеш') },
        suma: { stoynost_st: -50_000 },
      }),
    );
    const d = smetkiteVUpravlenie(iz.ogledalo()).poRoditel.get('imot:i1')?.[0];
    expect(d?.sektsiya).toBe('Заплати Кеш');
    expect(d?.suma_st).toBeLessThan(0);
  });

  it('подредбата е по МЕСЕЦ, не по реда на въвеждане', async () => {
    const { iz, zapishi } = await otvori();
    const nomer = nomerNaSektsiya(iz.ogledalo(), 'prihod', 'Наем Банка');
    await zapishi(
      'd1',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'imot:i1' },
        sektsiya: { nomer },
        mesets: { tekst: '2026-11' },
        suma: { stoynost_st: 1_000 },
      }),
    );
    await zapishi(
      'd2',
      'smetki.dobaviDvizhenie',
      dvizhenie({
        kam: { tekst: 'imot:i1' },
        sektsiya: { nomer },
        mesets: { tekst: '2026-08' },
        suma: { stoynost_st: 2_000 },
      }),
    );
    const spisak = smetkiteVUpravlenie(iz.ogledalo()).poRoditel.get('imot:i1') ?? [];
    expect(spisak.map((d) => d.mesets)).toEqual(['2026-08', '2026-11']);
  });

  it('празната Книга дава празно · без хвърляне', async () => {
    const { iz } = await otvori();
    const s = smetkiteVUpravlenie(iz.ogledalo());
    expect(s.ogledani).toBe(0);
    expect(s.poRoditel.size).toBe(0);
  });
});
