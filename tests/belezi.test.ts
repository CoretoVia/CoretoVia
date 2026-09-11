/**
 * БЕЛЕЗИТЕ · четиринайсетата порта · един белег, един вид (Етап 2.0).
 *
 * Измерено на 10.09.2026: К1 значеше три неща, И75 — две, Т1 — три. Машина, която
 * проследява изискване → инвариант → дълг → тест, не може да стъпи на белег с три
 * смисъла. Тук се ПУСКА `stroezh/belezi.mjs` върху живото дърво и се доказва, че ЛОВИ —
 * върху нарочно счупено дърво във временна папка (обход И): непознат нов белег и
 * остаряло съответствие дават находка.
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const MASHINA = resolve('stroezh/belezi.mjs');

/**
 * Най-малкото дърво с четирите дома · коренът идва ОТВЪН, от самия тест, за да е
 * видимо в него, че се пише извън дървото на проекта (обход И). Помощникът стои
 * ПРЕДИ първия тест във файла, защото обходът И приписва всяко писане на най-близкия `it(`.
 */
function darvo(koren: string) {
  if (!koren.startsWith(tmpdir())) throw new Error(`дървото не е във tmpdir(): ${koren}`);
  mkdirSync(join(koren, 'docs', 'arhitektura', 'chasti'), { recursive: true });
  mkdirSync(join(koren, 'zadanie', 'CHISTO'), { recursive: true });
  writeFileSync(
    join(koren, 'docs', 'registar-na-vaprosite.json'),
    JSON.stringify({
      vaprosi: [
        {
          beleg: 'А3',
          vapros: 'x',
          sastoyanie: 'otkrit',
          negovite_dumi: '',
          adres: '',
          kakvo_sledva: '',
          otpushva: [],
          zhivee_v: [],
        },
      ],
    }),
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', '14-dalgat.md'),
    '# 14\n\n## 1 · ОТВОРЕНИ\n\n| # | какво |\n| :--: | :---- |\n| **Т45** | нещо |\n\n## 2 · НЕВИКАНО\n\n## 3 · ЗАТВОРЕНИ\n',
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', 'arhitektura', 'chasti', '5-invariantite.md'),
    '# 5\n\n| # | инвариант |\n| :-- | :---- |\n| А1 | Журналът е само за добавяне |\n',
    'utf8',
  );
  writeFileSync(
    join(koren, 'zadanie', 'CHISTO', '01-imoti.md'),
    '# M01\n\n## 1 · Таблиците\n\n1.1 Прозорецът носи три таблици. *(zadanie/02 · A4)*\n\n2.7 Формата предлага Имот и Обект заедно. *(И132)*\n',
    'utf8',
  );
  const pusni = (argv: string[]) =>
    spawnSync(process.execPath, [MASHINA, ...argv], {
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, BELEZI_KOREN: koren },
    });
  return { koren, pusni };
}

describe('белезите · четиринайсетата порта', () => {
  it('машината минава върху живото дърво · съответствието е свежо и всеки нов белег има място', () => {
    const r = spawnSync(process.execPath, [MASHINA, '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    // ПЪРВО обхватът (обход Й): съответствието трябва да брои и четирите вида
    expect(r.stdout).toMatch(
      /съответствие: \d+ реда · ИЗ [1-9]\d* · ИН [1-9]\d* · ВП [1-9]\d* · ДЛ [1-9]\d*/,
    );
    expect(r.stdout).toMatch(/стар формат в живите документи: \d+ · пин \d+/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · непознат нов белег → находка · остаряло съответствие → находка · свежо → минава', () => {
    const { koren, pusni } = darvo(mkdtempSync(join(tmpdir(), 'belezi-')));
    expect(pusni(['--sazday']).status).toBe(0);
    const chisto = pusni(['--proveri']);
    expect(chisto.status, chisto.stdout).toBe(0);
    expect(chisto.stdout).toMatch(/ИЗ 2 · ИН 1 · ВП 1 · ДЛ 1/);

    // документ сочи белег, който няма дом
    writeFileSync(
      join(koren, 'docs', 'ADR-099.md'),
      '# ADR-099\n\nСтъпва на ИЗ-01-9.9 и на ИН-А1.\n',
      'utf8',
    );
    const r = pusni(['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain('непознат нов белег „ИЗ-01-9.9"');
    expect(r.stdout).not.toContain('„ИН-А1"');

    // нов ред в дълга без освежено съответствие
    writeFileSync(join(koren, 'docs', 'ADR-099.md'), '# ADR-099\n\nСтъпва на ИН-А1.\n', 'utf8');
    writeFileSync(
      join(koren, 'docs', '14-dalgat.md'),
      '# 14\n\n## 1 · ОТВОРЕНИ\n\n| # | какво |\n| :--: | :---- |\n| **Т45** | нещо |\n| **Т46** | друго |\n\n## 2 · НЕВИКАНО\n\n## 3 · ЗАТВОРЕНИ\n',
      'utf8',
    );
    const ostaryalo = pusni(['--proveri']);
    expect(ostaryalo.status).not.toBe(0);
    expect(ostaryalo.stdout).toContain('остаряло');
    expect(pusni(['--sazday']).status).toBe(0);
    const pak = pusni(['--proveri']);
    expect(pak.status, pak.stdout).toBe(0);
  });
});
