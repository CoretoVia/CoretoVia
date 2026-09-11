/**
 * Вратарят на датите. Журналът е само за добавяне — сгрешена дата влиза
 * завинаги, затова се спира на входа, както при парите. Живият викащ е
 * Вратата на редовете (`src/komandi/prozortsi/red.ts`) — от 11.09.2026 (ход 9).
 */

import { describe, expect, it } from 'vitest';
import { eData } from '../src/yadro/data.js';

describe('датите на входа', () => {
  it('приема истински ден', () => {
    expect(eData('2026-02-28')).toBe(true);
    expect(eData('2024-02-29')).toBe(true);
    expect(eData('2026-08-22')).toBe(true);
  });

  it('отказва ден, който не съществува', () => {
    for (const d of [
      '2026-02-31',
      '2026-02-30',
      '2026-04-31',
      '2026-13-01',
      '2026-00-10',
      '2026-01-00',
    ]) {
      expect(eData(d), d).toBe(false);
    }
  });

  it('невисокосната година няма 29 февруари', () => {
    expect(eData('2026-02-29')).toBe(false);
    expect(eData('2024-02-29')).toBe(true);
    expect(eData('2000-02-29')).toBe(true);
    expect(eData('1900-02-29')).toBe(false);
  });

  it('отказва празно и чужд вид · и не подрязва — подрязването е работа на входа', () => {
    for (const d of ['', '   ', '28.02.2026', '2026-2-8', '2026-02-28T10:00:00Z', ' 2026-08-22 ']) {
      expect(eData(d), d).toBe(false);
    }
  });

  it('не пука от нещо, което не е низ', () => {
    expect(eData(undefined)).toBe(false);
    expect(eData(20260228)).toBe(false);
    expect(eData(null)).toBe(false);
  });
});
