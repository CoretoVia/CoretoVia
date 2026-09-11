/**
 * РЕЗЕНИТЕ ПО ПРОЗОРЕЦ · екранът казва „идва с резен N" (правило 12), а N има
 * един дом — `docs/03-plan.md`. Тестът чете плана и сверява картата на екрана.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOD_NA_PROZORETSA } from '../app/prozorets/ostanalite.js';
import { HOD_NA_AGENTITE } from '../src/model/agenti.js';
import { BUTONI_NA_UPRAVLENIE, PROZORTSI } from '../src/model/osnova.js';

describe('резените по прозорец', () => {
  const plan = readFileSync('docs/03-plan.md', 'utf8');
  /**
   * редовете на двете таблици · `| N | заглавие | …` → N → заглавие · N е ход
   * (§1: `0` · `4` · `10а` · `11б` · `Х`) или резен от основата (§2: `3б` · `6р`)
   */
  const redove = new Map<string, string>();
  for (const m of plan.matchAll(/^\| \*{0,2}(\d+[а-я]?|Х)\*{0,2} \| ([^|]+) \|/gmu)) {
    redove.set(m[1]!, m[2]!);
  }

  it('планът се ЧЕТЕ · има ходове и има основа', () => {
    // обход, който не казва колко е видял, е зелен и когато не е гледал (обход Й)
    expect(redove.size).toBeGreaterThan(20);
    expect(redove.has('11а')).toBe(true);
    expect(redove.has('6р')).toBe(true);
  });

  it('всеки прозорец без екран сочи ред от плана, в който стои листът му', () => {
    for (const [klyuch, hod] of Object.entries(HOD_NA_PROZORETSA)) {
      const list = PROZORTSI.find((p) => p.klyuch === klyuch)?.list ?? '';
      const zaglavie = redove.get(String(hod)) ?? '';
      expect(zaglavie, `${klyuch} → ход ${hod}`).toContain(list);
    }
  });

  it('ОСЕМТЕ прозореца са построени · нито един не казва „идва с ход"', () => {
    for (const p of PROZORTSI) expect(HOD_NA_PROZORETSA).not.toHaveProperty(p.klyuch);
    expect(Object.keys(HOD_NA_PROZORETSA)).toHaveLength(0);
  });

  /**
   * НИТО ЕДИН БУТОН ВЕЧЕ НЕ ОБЕЩАВА · и това е ТВЪРДЕНИЕ, не празен цикъл.
   *
   * Дотук два бутона („Скрий Разходи" · „Скрий Приходи") стояха сиви и сочеха
   * трети резен, който отдавна беше затворен — обещание, надживяло резена си.
   * В резен 6к те са ПОСТРОЕНИ и списъкът стана празен.
   *
   * Празен списък прави всеки цикъл под себе си БЕЗСМИСЛЕН (ADR-015 · обход Г):
   * очакванията вътре не се смятат, а тестът е зелен. Затова тук първо се
   * твърди БРОЯТ, а цикълът остава за деня, в който се появи нов „идва с резен".
   */
  it('нито един бутон вече не казва „идва с ход" · а появи ли се, сочи ред от плана', () => {
    const idvat = BUTONI_NA_UPRAVLENIE.filter((b) => b.deystvie.vid === 'idva');
    expect(idvat.map((b) => b.klyuch)).toEqual([]);
    for (const b of idvat) {
      const hod = b.deystvie.vid === 'idva' ? b.deystvie.hod : 0;
      const zaglavie = redove.get(String(hod)) ?? '';
      expect(zaglavie, `${b.klyuch} → ход ${hod}`).not.toBe('');
    }
  });

  it('четиримата агенти без модел сочат реда „ИИ" на плана', () => {
    expect(redove.get(String(HOD_NA_AGENTITE))).toContain('ИИ');
  });
});
