/**
 * МЕНЮТО „СЪЗДАВАНЕ" · четирите неща, които се раждат отвсякъде.
 *
 * Негово, 11.09 (запис 195), точка 11: „Създаването на Имот, Обект, Задачи,
 * Срещи да става в искачащ прозорец…" и запис 193: „Създаването е отделно
 * падащо меню навсякъде."
 *
 * Тук се пази онова, което може да се разпадне тихо: Срещата да загуби вида си
 * и да стане обикновена задача, и сивият пункт да замълчи защо е сив (правило 12).
 */

import { describe, expect, it } from 'vitest';
import { tochkiteNaSazdavaneto } from '../app/reshetka/sazdavaneto.js';
import type { KonteksNaEkrana } from '../app/kontekst.js';
import { MODEL, NOMENKLATURA } from '../src/model/osnova.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { koyPishe } from '../src/yadro/index.js';
import { KNIGA, knigaZaTest, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const KOGATO = '2026-09-12T09:00:00.000Z';

async function kontekst(): Promise<KonteksNaEkrana> {
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
  await iz.izpalni('k0', 'stopanin.otkriy', { imeyl: STOPANIN });
  return { porta: iz, tyalo: null, prerisuvay: () => {} } as unknown as KonteksNaEkrana;
}

describe('менюто „Създаване"', () => {
  it('дава ПЕТТЕ негови пункта · в неговия ред', async () => {
    const t = tochkiteNaSazdavaneto(await kontekst());
    expect(t.map((x) => x.ime)).toEqual(['Имот', 'Обект', 'Задача', 'Среща', 'Кредит']);
  });

  it('Срещата НОСИ вида си · инак става обикновена задача', async () => {
    const k = await kontekst();
    const n = k.porta.ogledalo().nomenklaturi.get(NOMENKLATURA.vidNaZadacha);
    const nomer = n?.stoynosti.find((s) => s.tekst === 'Среща')?.nomer;
    expect(nomer).toBeGreaterThan(0);
    const sreshta = tochkiteNaSazdavaneto(k).find((x) => x.klyuch === 'sreshta');
    expect(sreshta?.razreshena).toBe(true);
  });

  it('Кредитът е сив и КАЗВА защо (правило 12)', async () => {
    const kredit = tochkiteNaSazdavaneto(await kontekst()).find((x) => x.klyuch === 'kredit');
    expect(kredit?.razreshena).toBe(false);
    expect(kredit?.zashto).not.toBe('');
  });
});
