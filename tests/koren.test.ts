/**
 * КОРЕНЪТ НА ХРАНИЛИЩЕТО · какво има право да стои там (резен 6ж · ADR-016).
 *
 * Платено с находка: празен файл на име `0` влезе в коммит `6b1f4ba` — почти
 * сигурно от пренасочване (`>0` вместо `2>&1`) в терминала. Стоя проследен от
 * git цял резен и **нито един обход не можеше да го види**: деветте на чистотата
 * четат само `.ts` в `src` и `app`, единайсетте на честността — само `tests` и
 * `proba`, а `.gitignore` пази от нежелано, не от неочаквано.
 *
 * Коренът е и мястото, където се появяват най-скъпите изненади: чужд `.xlsx`
 * (правило 29), забравен ключ, лог от падане. Затова тук стои СПИСЪК, и всичко
 * извън него е ЧЕРВЕНО, докато някой не го впише — тоест решение, не случайност.
 */

import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Какво има право да стои в корена · всяко ново име влиза ТУК, съзнателно. */
const POZVOLENI = Object.freeze([
  '.dependency-cruiser.cjs',
  '.gitattributes',
  '.gitignore',
  'CLAUDE.md',
  'README.md',
  'SECURITY.md',
  'biome.json',
  'knip.json',
  'package-lock.json',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'vitest.config.ts',
]);

describe('коренът на хранилището', () => {
  // подпроцес · времето е ОБЯВЕНО, за да не пада тестът под товар (обход Д)
  it('няма НИТО ЕДИН проследен файл извън списъка', () => {
    const izhod = execFileSync('git', ['ls-files', '--full-name'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
      timeout: 55_000,
    });
    const vsichki = izhod.split('\n').filter((r) => r !== '');
    // ПЪРВО броят: празен изход би направил всяко следващо твърдение празно и
    // тестът щеше да е зелен, без да е погледнал нищо (обход Г · обход Й)
    expect(vsichki.length).toBeGreaterThan(200);

    const vKorena = vsichki.filter((r) => !r.includes('/')).sort();
    expect(vKorena).toEqual([...POZVOLENI].sort());
  }, 60_000);

  it('и списъкът е точно ТРИНАЙСЕТ имена · пин с ръка', () => {
    // Пинът е за да не расте списъкът мълчаливо: ново име в корена се вижда
    // тук в диф, заедно с причината си (обход В на честността).
    // 08.09.2026: 12 → 13 · влезе SECURITY.md (CRA · процес по уязвимости).
    expect(POZVOLENI).toHaveLength(13);
    expect(new Set(POZVOLENI).size).toBe(POZVOLENI.length);
  });
});

/**
 * ═══ РЕГИСТЪРЪТ НА ВЪПРОСИТЕ · машината се ПУСКА, не се уповава ═══
 *
 * Негово, 09.09.2026: „Не мога да говоря едни и същи неща всеки път."
 *
 * Правило, което стои в настройка, а никой не го пуска, е дума (обход К на
 * честността). Затова тук се ПУСКА самата команда и се иска нулев изход — и се
 * доказва, че тя ЛОВИ: подаден ѝ регистър с отговорен въпрос, който документ
 * още пита, трябва да падне.
 */
describe('регистърът на въпросите · десетата порта', () => {
  it('машината минава · нула въпроса без дом и нула отговорени, които още се питат', () => {
    const r = spawnSync(process.execPath, ['stroezh/registar.mjs', '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    expect(r.stdout).toMatch(/видени: \d+ документа/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · белег, който го няма в регистъра, дава находка', () => {
    // дървото се вдига ВЪВ ВРЕМЕННА ПАПКА · проверка не пише в дървото на
    // проекта (обход И · и точно това улови първата версия на този тест)
    const koren = mkdtempSync(join(tmpdir(), 'registar-'));
    mkdirSync(join(koren, 'docs'), { recursive: true });
    writeFileSync(join(koren, 'docs', 'proba.md'), 'Тук се говори за Т1 и за С4.\n', 'utf8');
    writeFileSync(
      join(koren, 'docs', 'registar-na-vaprosite.json'),
      JSON.stringify({ vaprosi: [] }),
      'utf8',
    );
    const r = spawnSync(process.execPath, [resolve('stroezh/registar.mjs'), '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, REGISTAR_KOREN: koren },
    });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/непознат белег/);
    expect(r.stdout).toContain('Т1');
  });
});

/**
 * ═══ КАРТАТА · входът за всеки, който идва след нас ═══
 *
 * Негово, 09.09.2026: „Как ще гарантираш, че всеки трети колега след теб веднага
 * ще се ориентира и ще разбира къде е попаднал и какво прави."
 *
 * Гаранцията не е документ, а МАШИНА: картата се генерира от дървото, и портата
 * пада, ако е остаряла. Тук се доказва и че ЛОВИ — нов документ, който картата
 * не описва, дава находка.
 */
describe('картата · единайсетата порта', () => {
  it('картата е сверена с дървото', () => {
    const r = spawnSync(process.execPath, ['stroezh/karta.mjs', '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    expect(r.stdout).toMatch(/описани документи: \d+/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · документ, който картата не описва, дава находка', () => {
    const koren = mkdtempSync(join(tmpdir(), 'karta-'));
    mkdirSync(join(koren, 'docs'), { recursive: true });
    const pusni = (argv: string[]) =>
      spawnSync(process.execPath, [resolve('stroezh/karta.mjs'), ...argv], {
        encoding: 'utf8',
        timeout: 120_000,
        env: { ...process.env, KARTA_KOREN: koren },
      });

    writeFileSync(join(koren, 'docs', 'edno.md'), '# Едно\n\nПървият абзац.\n', 'utf8');
    expect(pusni(['--pishi']).status).toBe(0);
    expect(pusni(['--proveri']).status).toBe(0);

    // появява се ВТОРИ документ · картата вече не го знае
    writeFileSync(join(koren, 'docs', 'dve.md'), '# Две\n\nВтори абзац.\n', 'utf8');
    const r = pusni(['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/ОСТАРЯЛА/);
  });
});
