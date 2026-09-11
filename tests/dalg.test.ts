/**
 * ДЪЛГЪТ · петнайсетата порта · изпълнимият регистър (Етап 2.1).
 *
 * Правило 30 иска всеки ред на дълга да носи отпушващо условие и „как се познава, че е
 * затворен". До 11.09.2026 двете бяха проза и никоя машина не ги четеше: трийсет затворени
 * реда стояха в „ОТВОРЕНИ", два реда с изпълнено условие продължаваха да чакат. Тук се
 * ПУСКА `stroezh/dalg.mjs` върху живото дърво и се доказва, че ЛОВИ — върху нарочно
 * счупено дърво във временна папка (обход И): отворен ред с държащи условия · затворен ред с
 * паднало условие · остаряло генерирано md.
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const MASHINA = resolve('stroezh/dalg.mjs');
const MARKER_A =
  '<!-- ДЪЛГЪТ · §1–§3 се ГЕНЕРИРАТ от docs/registar-na-dalga.json · `node stroezh/dalg.mjs --pishi` · не се пише на ръка · НАЧАЛО -->';
const MARKER_B = '<!-- ДЪЛГЪТ · генерирано · КРАЙ -->';

/**
 * Най-малкото дърво · коренът идва ОТВЪН, от самия тест (обход И). Помощникът стои ПРЕДИ
 * първия тест във файла, защото обходът И приписва всяко писане на най-близкия `it(`.
 */
function darvo(koren: string) {
  if (!koren.startsWith(tmpdir())) throw new Error(`дървото не е във tmpdir(): ${koren}`);
  mkdirSync(join(koren, 'docs'), { recursive: true });
  mkdirSync(join(koren, 'src'), { recursive: true });
  writeFileSync(join(koren, 'src', 'a.ts'), 'export function zhiv() {\n  return 1;\n}\n', 'utf8');
  writeFileSync(
    join(koren, 'docs', '03-plan.md'),
    '# план\n\n| # | ход | какво | преди | как | състояние |\n| :--: | :-- | :-- | :-- | :-- | :-- |\n| **9** | **Хигиената** | x | — | y | наред |\n',
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', 'registar-na-vaprosite.json'),
    JSON.stringify({ vaprosi: [] }),
    'utf8',
  );
  writeFileSync(
    join(koren, 'docs', '14-dalgat.md'),
    `# 14\n\n${MARKER_A}\n${MARKER_B}\n\n## 4 · КОЕ НЕ СЕ ПРАВИ\n`,
    'utf8',
  );
  const registar = (redove: unknown[]) =>
    writeFileSync(
      join(koren, 'docs', 'registar-na-dalga.json'),
      JSON.stringify({ redove }),
      'utf8',
    );
  const pusni = (argv: string[]) =>
    spawnSync(process.execPath, [MASHINA, ...argv], {
      encoding: 'utf8',
      timeout: 120_000,
      env: { ...process.env, DALG_KOREN: koren },
    });
  return { koren, registar, pusni };
}

const otvoren = (beleg: string, uslovia: unknown[], hod = '9') => ({
  beleg,
  kakvo: 'нещо',
  kade: 'src/a.ts',
  hod,
  predi: [],
  chaka: '',
  otpushva: [],
  uslovia,
  kak: 'с думи',
  sastoyanie: 'otvoren',
});
const zatvoren = (beleg: string, uslovia: unknown[]) => ({
  ...otvoren(beleg, uslovia),
  sastoyanie: 'zatvoren',
  zatvoren_na: '2026-09-10',
  zatvoren_kak: 'направено',
});

describe('дългът · петнайсетата порта', () => {
  it('машината минава върху живото дърво · нищо затворено не се е отворило тихо · md-то е свежо', () => {
    const r = spawnSync(process.execPath, [MASHINA, '--proveri'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    // ПЪРВО обхватът (обход Й): редове има, отворени и затворени
    expect(r.stdout).toMatch(/редове: [1-9]\d* · отворени [1-9]\d* · затворени [1-9]\d*/);
    expect(r.stdout).toMatch(/без машинно условие: \d+ · пин \d+/);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · отворен ред с държащи условия → „ВЕЧЕ ЗАТВОРЕН" · затворен ред с паднало условие → „ОТВОРИЛ СЕ Е ТИХО" · остаряло md → находка', () => {
    const { registar, pusni } = darvo(mkdtempSync(join(tmpdir(), 'dalg-')));

    // чисто · отворен ред с условие, което НЕ държи · затворен ред с условие, което държи
    registar([
      otvoren('Т1', [{ vid: 'ima', ime: 'nyamaGo', v: ['src'] }]),
      zatvoren('Т2', [{ vid: 'ima', ime: 'zhiv', v: ['src'] }]),
    ]);
    expect(pusni(['--pishi']).status).toBe(0);
    const chisto = pusni(['--proveri']);
    expect(chisto.status, chisto.stdout).toBe(0);
    expect(chisto.stdout).toContain('без машинно условие: 0');

    // отвореният ред, чието условие вече държи · машината не го затваря, а вика човек
    registar([
      otvoren('Т1', [{ vid: 'ima', ime: 'zhiv', v: ['src'] }]),
      zatvoren('Т2', [{ vid: 'ima', ime: 'zhiv', v: ['src'] }]),
    ]);
    expect(pusni(['--pishi']).status).toBe(0);
    const veche = pusni(['--proveri']);
    expect(veche.status).not.toBe(0);
    expect(veche.stdout).toContain('„Т1" е ВЕЧЕ ЗАТВОРЕН, а стои отворен');

    // затвореният ред, чието условие е паднало
    registar([
      otvoren('Т1', [{ vid: 'ima', ime: 'nyamaGo', v: ['src'] }]),
      zatvoren('Т2', [{ vid: 'ima', ime: 'izcheznal', v: ['src'] }]),
    ]);
    expect(pusni(['--pishi']).status).toBe(0);
    const tiho = pusni(['--proveri']);
    expect(tiho.status).not.toBe(0);
    expect(tiho.stdout).toContain('„Т2" се е ОТВОРИЛ ТИХО');

    // остаряло md · регистърът е сменен, md-то не е прегенерирано
    registar([
      otvoren('Т1', [{ vid: 'ima', ime: 'nyamaGo', v: ['src'] }]),
      zatvoren('Т2', [{ vid: 'ima', ime: 'zhiv', v: ['src'] }]),
      otvoren('Т3', [{ vid: 'fayl', pat: 'docs/nyama.md' }]),
    ]);
    const ostaryalo = pusni(['--proveri']);
    expect(ostaryalo.status).not.toBe(0);
    expect(ostaryalo.stdout).toContain('е остарял спрямо регистъра');
    expect(pusni(['--pishi']).status).toBe(0);
    const pak = pusni(['--proveri']);
    expect(pak.status, pak.stdout).toBe(0);
  });

  it('МЯРКАТА ЛОВИ · ред без условие се брои и пинът не расте · `predi` към несъществуващ ред → находка', () => {
    const { registar, pusni } = darvo(mkdtempSync(join(tmpdir(), 'dalg-')));
    const mnogo = Array.from({ length: 40 }, (_, i) => otvoren(`Т${i + 1}`, []));
    registar(mnogo);
    expect(pusni(['--pishi']).status).toBe(0);
    const r = pusni(['--proveri']);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/отворените без машинно условие растат: 40 > пин \d+/);

    registar([{ ...otvoren('Т1', [{ vid: 'fayl', pat: 'docs/nyama.md' }]), predi: ['Т99'] }]);
    expect(pusni(['--pishi']).status).toBe(0);
    const p = pusni(['--proveri']);
    expect(p.status).not.toBe(0);
    expect(p.stdout).toContain('чака „Т99", който го няма в регистъра');
  });
});
