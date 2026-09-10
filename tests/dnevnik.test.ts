/**
 * ДНЕВНИКЪТ · тринайсетата порта · следата от сесията е НЕИЗБЕЖНА.
 *
 * Негово, 10.09.2026: „Начина на работа не остава следи. Няма правилна система
 * на работа между сесиите и нище не остава трайно на правилното място."
 *
 * Измерено същия ден: дванайсет машини пазеха кода, нула — слоя „какво стана
 * днес". `npm run kray` е помощникът, който прави деня зелен; ТОЗИ тест е
 * онова, което не може да се прескочи: без дневник за деня на коммита `npm test`
 * пада — локално и в CI.
 *
 * Както при регистъра и картата: машината се ПУСКА, не се уповава, и се доказва,
 * че ЛОВИ — върху нарочно счупено дърво във временна папка (обход И), с ден,
 * подаден отвън (обход К: проверка, която зависи от деня на пускане, мига).
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const MASHINA = resolve('stroezh/dnevnik.mjs');
const DEN = '2026-09-11';

function pusni(koren: string, argv: string[]) {
  return spawnSync(process.execPath, [MASHINA, ...argv], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, DNEVNIK_KOREN: koren, DNEVNIK_DEN: DEN },
  });
}

/**
 * Минимално дърво · дълг без зачеркнати редове · празен регистър · протокол с У1.
 * Коренът идва отвън — всеки тест го прави сам с `tmpdir()`, за да е видимо в
 * самия тест, че се пише ИЗВЪН дървото на проекта (обход И).
 */
function darvo(koren: string): string {
  mkdirSync(join(koren, 'docs'), { recursive: true });
  writeFileSync(
    join(koren, 'docs', '14-dalgat.md'),
    '# 14\n\n## 1 · ОТВОРЕНИ\n\n| # | какво |\n| :--: | :---- |\n| **Т99** | нещо |\n\n## 2 · НЕВИКАНО\n\n## 3 · ЗАТВОРЕНИ\n',
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', 'registar-na-vaprosite.json'),
    JSON.stringify({ vaprosi: [] }),
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', '00-PROTOKOL.md'),
    '# П\n\n## 1 · ВИДОВЕ\n\n### У1 · НЕЩО\n\n**Задължително:**\n- x\n\n**Платената цена:** y\n\n**Как се познава, че е спазено:** z\n',
    'utf8',
  );
  writeFileSync(
    join(koren, 'README.md'),
    '# R\n\n<!-- izdanie -->\nx\n<!-- /izdanie -->\n',
    'utf8',
  );
  return koren;
}

describe('дневникът · тринайсетата порта', () => {
  it('машината минава върху живото дърво · денят има запис, думите му имат дом', () => {
    const r = spawnSync(process.execPath, [MASHINA, '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    // ПЪРВО обхватът: нула находки при нула проверки значи „не съм гледал" (обход Й)
    expect(r.stdout).toMatch(/проверки: 9 · пуснати: \d+/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · без дневник за деня → Д1 · без думите му → Д2', () => {
    const koren = darvo(mkdtempSync(join(tmpdir(), 'dnevnik-')));
    const r = pusni(koren, ['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain('Д1');
    expect(r.stdout).toContain('Д2');
    // без git три проверки се пропускат и това се КАЗВА, не се крие
    expect(r.stdout).toMatch(/пропуснати: 3/);
  });

  it('МЯРКАТА ЛОВИ · заготовката не минава за запис → Д3 · зачеркнат ред в „ОТВОРЕНИ" → Д4', () => {
    const koren = darvo(mkdtempSync(join(tmpdir(), 'dnevnik-')));
    expect(pusni(koren, ['--nachalo']).status).toBe(0);
    // `nachalo` е създал двата файла за деня · но те са ЗАГОТОВКИ
    expect(readFileSync(join(koren, 'docs/dnevnik', `${DEN}.md`), 'utf8')).toContain('## 5 ·');
    writeFileSync(
      join(koren, 'docs', '14-dalgat.md'),
      '# 14\n\n## 1 · ОТВОРЕНИ\n\n| # | какво |\n| :--: | :---- |\n| ~~**Т99**~~ | ✔ ЗАТВОРЕН |\n\n## 2 · НЕВИКАНО\n\n## 3 · ЗАТВОРЕНИ\n',
      'utf8',
    );
    const r = pusni(koren, ['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain('Д3');
    expect(r.stdout).toMatch(/Д4 · 1 затворени реда/);
  });

  it('и МИНАВА, когато денят е записан докрай · доказателството трябва да СЪДЪРЖА белега', () => {
    const koren = darvo(mkdtempSync(join(tmpdir(), 'dnevnik-')));
    expect(pusni(koren, ['--nachalo']).status).toBe(0);
    writeFileSync(
      join(koren, 'docs/izvori/dni', `${DEN}.md`),
      '# д\n\n| # | час | негово, дословно | какво тръгна |\n| ---: | :---- | :---- | :---- |\n| 1 | 10:00 | „нещо" | нищо |\n',
      'utf8',
    );
    mkdirSync(join(koren, 'tests'), { recursive: true });
    writeFileSync(join(koren, 'tests', 'x.test.ts'), "it('Т99 · пази', () => {});\n", 'utf8');
    const den = [
      `# ${DEN} · пробен ден`,
      '',
      'Едно изречение.',
      '',
      '## 1 · НЕГОВО',
      'виж dni',
      '## 2 · КАКВО СТАНА',
      'вид работа У1 · умения: а · б · в',
      '- 10:00 · нещо',
      '## 3 · ЗАТВОРЕНО',
      '| белег | как | доказателство |',
      '| :---- | :---- | :---- |',
      '| Т99 | тест | `tests/x.test.ts` |',
      '| Т98 | без път | никъде |',
      '## 4 · РОДЕНО',
      '| белег | какво | къде |',
      '| :---- | :---- | :---- |',
      '## 5 · ПОРТИТЕ',
      'чака CI',
      '## 6 · СЛЕДВАЩОТО',
      '- утре',
      '',
    ].join('\n');
    writeFileSync(join(koren, 'docs/dnevnik', `${DEN}.md`), den, 'utf8');
    writeFileSync(
      join(koren, 'README.md'),
      `# R\n\n<!-- izdanie -->\n**Издание:** ден ${DEN} · [дневникът](docs/dnevnik/${DEN}.md) · започни от [картата](docs/00-KARTA.md)\n<!-- /izdanie -->\n`,
      'utf8',
    );

    // Т98 е „затворен" без път → Д4б пада · това е единствената находка
    const s = pusni(koren, ['--proveri']);
    expect(s.status).not.toBe(0);
    expect(s.stdout).toContain('Д4б · Т98');
    expect(s.stdout).not.toContain('Д4б · Т99');

    writeFileSync(
      join(koren, 'docs/dnevnik', `${DEN}.md`),
      den.replace('| Т98 | без път | никъде |\n', ''),
      'utf8',
    );
    const z = pusni(koren, ['--proveri']);
    expect(z.status, z.stdout).toBe(0);
    expect(z.stdout).toContain('Дневникът е цял');
  });

  it('заданието на сесията е в CLAUDE.md, ≤ 30 реда, и `--za-agenta` го печата дословно', () => {
    // пин с ръка: задание от триста реда никой не чете · агентите го получават
    // в началото на промпта си и трябва да се побере там
    const r = spawnSync(process.execPath, [MASHINA, '--za-agenta'], {
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(r.status, r.stdout).toBe(0);
    const redove = r.stdout.trimEnd().split('\n');
    expect(redove.length).toBeLessThanOrEqual(30);
    expect(redove.length).toBeGreaterThan(10);
    expect(r.stdout).toContain('ПРЕДИ ПЪРВИЯ РЕД');
    expect(r.stdout).toContain('ПРЕДИ ДА СПРЕШ');
    expect(readFileSync('CLAUDE.md', 'utf8')).toContain(r.stdout.trim());
  });

  it('следващият номер на коммит се СМЯТА от историята · max + 1 от не-merge заглавията', () => {
    const r = spawnSync(process.execPath, [MASHINA, '--sledvasht-nomer'], {
      encoding: 'utf8',
      timeout: 30_000,
    });
    expect(r.status).toBe(0);
    // 48 е коммитът на 10.09 (2a59f14) · оттам нататък само нагоре
    expect(Number(r.stdout.trim())).toBeGreaterThanOrEqual(49);
  });
});
