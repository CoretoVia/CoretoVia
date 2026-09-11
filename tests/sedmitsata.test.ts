import { koyPishe } from '../src/yadro/index.js';
/**
 * СЕДМИЧНАТА ПРОГРАМА · и трупането на неизпълненото.
 *
 * Негово, 11.09 (запис 195), точка 7: „Да се отваря за всеки работник
 * седмичната програма, не днешната а седмичната. Ако не е изпълнена се
 * пренастройва за следващия ден и се трупа."
 *
 * Тук се пази онова, което може да се сбърка тихо: задача с минал край да
 * изчезне от екрана, седмицата да тръгне от друг ден, и задача без нито една
 * дата да бъде набутана в „днес", вместо да се КАЖЕ (правило 12).
 */

import { describe, expect, it } from 'vitest';
import { MODEL } from '../src/model/osnova.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { sedmichnataPrograma, zadachiBezOtgovornik } from '../src/smetach/sedmitsata.js';
import { KNIGA, knigaZaTest, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const KOGATO = '2026-09-12T09:00:00.000Z';
/** сряда · понеделникът на седмицата ѝ е 2026-09-07 */
const SRYADA = '2026-09-09';
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
    kletki: { ime: { tekst: 'Гара Яна' }, sastoyanie: { nomer: 2 }, ...PRAZEN },
  });
  await zapishi('s1', 'sluzhiteli.dobaviSluzhitel', {
    kletki: {
      ime: { tekst: 'Иван' },
      telefon: null,
      imeyl: { tekst: 'ivan@example.bg' },
      adres: null,
      dlazhnost: { nomer: 1 },
    },
  });
  return { iz, zapishi };
}

const zadacha = (ime: string, ot: string, doo: string, otgovornik: string | null) => ({
  kletki: {
    kam: { tekst: 'imot:i1' },
    vid: { nomer: 1 },
    ime: { tekst: ime },
    ot: ot === '' ? null : { tekst: ot },
    do: doo === '' ? null : { tekst: doo },
    otsenka: null,
    byudzhet: null,
    otgovornik: otgovornik === null ? null : { tekst: otgovornik },
  },
});

describe('седмичната програма', () => {
  it('дава СЕДЕМ дни от понеделник · и знае кой е днес', async () => {
    const { iz } = await otvori();
    const p = sedmichnataPrograma(iz.ogledalo(), 'sluzhitel:s1', SRYADA);
    expect(p.dni).toHaveLength(7);
    expect(p.dni[0]?.den).toBe('2026-09-07');
    expect(p.dni[0]?.ime).toBe('понеделник');
    expect(p.dni.filter((d) => d.dnes).map((d) => d.den)).toEqual([SRYADA]);
  });

  it('задача с МИНАЛ край се трупа на ДНЕС · не изчезва', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('z1', 'upravlenie.dobaviZadacha', {
      ...zadacha('Просрочена', '2026-09-01', '2026-09-03', 'sluzhitel:s1'),
    });
    const p = sedmichnataPrograma(iz.ogledalo(), 'sluzhitel:s1', SRYADA);
    expect(p.natrupani).toBe(1);
    const dnes = p.dni.find((d) => d.dnes);
    expect(dnes?.zadachi.map((z) => z.ime)).toEqual(['Просрочена']);
    expect(dnes?.zadachi[0]?.natrupana).toBe(true);
  });

  it('задачата стои на ВСЕКИ ден от периода си · не само на началото', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('z1', 'upravlenie.dobaviZadacha', {
      ...zadacha('Три дни', '2026-09-09', '2026-09-11', 'sluzhitel:s1'),
    });
    const p = sedmichnataPrograma(iz.ogledalo(), 'sluzhitel:s1', SRYADA);
    expect(p.dni.filter((d) => d.zadachi.length > 0).map((d) => d.den)).toEqual([
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
    ]);
    expect(p.natrupani).toBe(0);
  });

  it('задача без нито една дата се КАЗВА · не се набутва в днес', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('z1', 'upravlenie.dobaviZadacha', {
      ...zadacha('Без кога', '', '', 'sluzhitel:s1'),
    });
    const p = sedmichnataPrograma(iz.ogledalo(), 'sluzhitel:s1', SRYADA);
    expect(p.bezData).toEqual(['Без кога']);
    expect(p.dni.every((d) => d.zadachi.length === 0)).toBe(true);
  });

  it('чуждата задача не влиза · и нераздадените се изброяват', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('z1', 'upravlenie.dobaviZadacha', {
      ...zadacha('Ничия', '2026-09-09', '2026-09-09', null),
    });
    expect(
      sedmichnataPrograma(iz.ogledalo(), 'sluzhitel:s1', SRYADA).dni.every(
        (d) => d.zadachi.length === 0,
      ),
    ).toBe(true);
    expect(zadachiBezOtgovornik(iz.ogledalo()).map((z) => z.ime)).toEqual(['Ничия']);
  });
});
