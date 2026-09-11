/**
 * БЕЛЕЗИТЕ · четиринайсетата порта · един белег, един вид (Етап 2.0).
 *
 * Измерено на 10.09.2026: К1 значеше три неща, И75 — две, Т1 — три. Машина, която
 * проследява изискване → инвариант → дълг → тест, не може да стъпи на белег с три
 * смисъла. Тук се ПУСКА `stroezh/belezi.mjs` върху живото дърво и се доказва, че ЛОВИ —
 * върху нарочно счупено дърво във временна папка (обход И): непознат нов белег,
 * остаряло съответствие и гол стар белег в жив документ дават находка; записът и
 * обвивката без въпрос не дават.
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const MASHINA = resolve('stroezh/belezi.mjs');
const SHAPKA = (sast: string) => `**Дата:** 2026-09-11 · **Вид:** решение · **Състояние:** ${sast}`;

/**
 * Най-малкото дърво с четирите дома · коренът идва ОТВЪН, от самия тест, за да е
 * видимо в него, че се пише извън дървото на проекта (обход И). Помощникът стои
 * ПРЕДИ първия тест във файла, защото обходът И приписва всяко писане на най-близкия `it(`.
 * Домовете носят вида отпред (`| ИН-А1 |` · `| **ДЛ-Т45** |`), както живото дърво след 2.0б.
 */
function darvo(koren: string) {
  if (!koren.startsWith(tmpdir())) throw new Error(`дървото не е във tmpdir(): ${koren}`);
  mkdirSync(join(koren, 'docs', 'arhitektura', 'chasti'), { recursive: true });
  mkdirSync(join(koren, 'zadanie', 'CHISTO'), { recursive: true });
  const vapros = (beleg: string, vapros: string) => ({
    beleg,
    vapros,
    sastoyanie: 'otkrit',
    negovite_dumi: '',
    adres: '',
    kakvo_sledva: '',
    otpushva: [],
    zhivee_v: [],
  });
  writeFileSync(
    join(koren, 'docs', 'registar-na-vaprosite.json'),
    // В5 е ОБВИВКА · белег без въпрос, роден от евристиките · не е ВП
    JSON.stringify({ vaprosi: [vapros('А3', 'x'), vapros('В5', '')] }),
    'utf8',
  );
  // домът на дълга е регистърът (2.1) · md-то е генериран изглед и тук не е нужно
  const dalg = (belezi: string[]) =>
    writeFileSync(
      join(koren, 'docs', 'registar-na-dalga.json'),
      JSON.stringify({
        redove: belezi.map((beleg) => ({ beleg, sastoyanie: 'otvoren', uslovia: [] })),
      }),
      'utf8',
    );
  dalg(['Т45', 'Т2']);
  writeFileSync(
    join(koren, 'docs', 'arhitektura', 'chasti', '5-invariantite.md'),
    '# 5\n\n| # | инвариант |\n| :-- | :---- |\n| ИН-А1 | Журналът е само за добавяне |\n',
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
  return { koren, pusni, dalg };
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
    // 2.0б · 11.09.2026 · старият формат в живите документи е НУЛА и стои на нула
    expect(r.stdout).toMatch(/стар формат в живите документи: 0 · пин 0/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · непознат нов белег → находка · остаряло съответствие → находка · свежо → минава', () => {
    const { koren, pusni, dalg } = darvo(mkdtempSync(join(tmpdir(), 'belezi-')));
    expect(pusni(['--sazday']).status).toBe(0);
    const chisto = pusni(['--proveri']);
    expect(chisto.status, chisto.stdout).toBe(0);
    // ВП 1, не 2: обвивката В5 (без въпрос) не е въпрос · ДЛ 2: двата реда на регистъра на дълга
    expect(chisto.stdout).toMatch(/ИЗ 2 · ИН 1 · ВП 1 · ДЛ 2/);

    // документ сочи белег, който няма дом
    writeFileSync(
      join(koren, 'docs', 'ADR-099.md'),
      `# ADR-099\n\n${SHAPKA('жив')}\n\nСтъпва на ИЗ-01-9.9 и на ИН-А1.\n`,
      'utf8',
    );
    const r = pusni(['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain('непознат нов белег „ИЗ-01-9.9"');
    expect(r.stdout).not.toContain('„ИН-А1"');

    // нов ред в дълга без освежено съответствие
    writeFileSync(
      join(koren, 'docs', 'ADR-099.md'),
      `# ADR-099\n\n${SHAPKA('жив')}\n\nСтъпва на ИН-А1.\n`,
      'utf8',
    );
    dalg(['Т45', 'Т2', 'Т46']);
    const ostaryalo = pusni(['--proveri']);
    expect(ostaryalo.status).not.toBe(0);
    expect(ostaryalo.stdout).toContain('остаряло');
    expect(pusni(['--sazday']).status).toBe(0);
    const pak = pusni(['--proveri']);
    expect(pak.status, pak.stdout).toBe(0);
  });

  it('ТРЕСЧОТКАТА · гол стар белег в ЖИВ документ → находка · в ЗАПИС не · К1–К3 са правила, не белези', () => {
    const { koren, pusni } = darvo(mkdtempSync(join(tmpdir(), 'belezi-')));
    expect(pusni(['--sazday']).status).toBe(0);

    // запис по шапка · старият формат и непознат нов белег там не се съдят
    writeFileSync(
      join(koren, 'docs', 'ADR-098.md'),
      `# ADR-098\n\n${SHAPKA('запис')}\n\nТогава Т45 и А1 бяха голи, а ИЗ-01-9.9 нямаше дом.\n`,
      'utf8',
    );
    // жив документ с правилата К1 · К2 · К3 и с новата граматика · нищо за ловене
    writeFileSync(
      join(koren, 'docs', 'ADR-099.md'),
      `# ADR-099\n\n${SHAPKA('жив')}\n\nК1 · К2 · К3 държат ИН-А1 и ДЛ-Т45; цитатът „Т45 е отворен" не се брои.\n`,
      'utf8',
    );
    const chisto = pusni(['--proveri']);
    expect(chisto.status, chisto.stdout).toBe(0);
    expect(chisto.stdout).toMatch(/стар формат в живите документи: 0 · пин 0/);

    // гол белег в жив документ · тресчотката пада
    writeFileSync(
      join(koren, 'docs', 'ADR-099.md'),
      `# ADR-099\n\n${SHAPKA('жив')}\n\nСтъпва на А1 и на Т45.\n`,
      'utf8',
    );
    const r = pusni(['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain('старият формат в живите документи расте: 2 > пин 0');
  });
});
