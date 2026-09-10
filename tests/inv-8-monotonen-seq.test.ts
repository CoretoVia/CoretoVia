import { veriga as verigata } from '../src/yadro/index.js';
/**
 * ИНВАРИАНТ 8 · МОНОТОНЕН SEQ В РАМКИТЕ НА НАЕМАТЕЛ
 * Плюс: изолация на верига — seq на единия не пипа seq на другия.
 */

import { describe, expect, it } from 'vitest';
import { DnevnikVPametta, proveriVerigata, Vrata, VsichkoRazresheno } from '../src/yadro/index.js';
import { operatsiya, seyalka, SHA } from './pomoshtni.js';

function novaVrata() {
  const dnevnik = new DnevnikVPametta();
  return { dnevnik, vrata: new Vrata({ dnevnik, pravata: new VsichkoRazresheno(), sha: SHA }) };
}

describe('инвариант 8 · монотонен seq', () => {
  it('seq върви 1, 2, 3 … без дупки', async () => {
    const { dnevnik, vrata } = novaVrata();
    for (let i = 1; i <= 100; i += 1) {
      await vrata.dobavi(operatsiya({ opId: `op-${i}` }));
    }

    const redicata = (await dnevnik.chetiVsichki('vintexstroy')).map((s) => s.seq);
    expect(redicata).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it('200 едновременни записа дават 200 различни seq без дупка', async () => {
    const { dnevnik, vrata } = novaVrata();

    await Promise.all(
      Array.from({ length: 200 }, (_, i) => vrata.dobavi(operatsiya({ opId: `op-${i}` }))),
    );

    const vsichki = await dnevnik.chetiVsichki('vintexstroy');
    const redicata = vsichki.map((s) => s.seq).sort((a, b) => a - b);
    expect(redicata).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
    expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
  });

  it('всеки верига има своя редица — броенето не се смесва', async () => {
    const { dnevnik, vrata } = novaVrata();
    const random = seyalka(7);
    const verigi = ['veriga-a', 'veriga-b', 'veriga-v'];
    const broi: Record<string, number> = { 'veriga-a': 0, 'veriga-b': 0, 'veriga-v': 0 };

    const raboti: Promise<unknown>[] = [];
    for (let i = 1; i <= 300; i += 1) {
      const veriga = verigi[Math.floor(random() * verigi.length)]!;
      broi[veriga] = (broi[veriga] ?? 0) + 1;
      raboti.push(vrata.dobavi(operatsiya({ opId: `op-${i}`, veriga })));
    }
    await Promise.all(raboti);

    for (const veriga of verigi) {
      const vsichki = await dnevnik.chetiVsichki(veriga);
      expect(vsichki).toHaveLength(broi[veriga]!);
      expect(vsichki.map((s) => s.seq)).toEqual(
        Array.from({ length: broi[veriga]! }, (_, i) => i + 1),
      );
      expect(vsichki.every((s) => verigata(s) === veriga)).toBe(true);
      expect((await proveriVerigata(vsichki, SHA)).tsyala).toBe(true);
    }
  });

  it('текущият rev на същност е seq на последното ѝ събитие', async () => {
    const { dnevnik, vrata } = novaVrata();
    const naem = { vid: 'naem', id: 'N-1' };
    const imot = { vid: 'imot', id: 'I-1' };

    expect(await dnevnik.tekushtRev('vintexstroy', naem)).toBe(0);

    await vrata.dobavi(operatsiya({ opId: 'op-1', sashtnost: naem }));
    await vrata.dobavi(operatsiya({ opId: 'op-2', sashtnost: imot }));
    const treto = await vrata.dobavi(operatsiya({ opId: 'op-3', sashtnost: naem }));

    expect(await dnevnik.tekushtRev('vintexstroy', naem)).toBe(treto.seq);
    expect(await dnevnik.tekushtRev('vintexstroy', imot)).toBe(2);
  });
});
