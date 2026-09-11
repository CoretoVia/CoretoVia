/**
 * СЛОЕВЕТЕ · МЯРКАТА ЛОВИ (ДЛ-Т6 · ход 9 · 11.09.2026).
 *
 * `tests/sloeve.test.ts` доказва, че живото дърво е на нула нарушения. Тук се
 * доказва, че нулата значи нещо: dependency-cruiser се пуска върху НАРОЧНО
 * счупено дърво във временна папка (обход И) — по един нарушител за всяко
 * правило от `.dependency-cruiser.cjs` → червено с името на правилото; чисто
 * дърво → зелено; и трите ЗАОБИКАЛЯНИЯ на Вратата (през барела `src/yadro/index.ts`,
 * през преизнасяне в `src/porta`, през Книгата), които до 11.09 минаваха с нула.
 *
 * Платено: ДЛ-Т6 — „четири забрани в слоевете броят по-малко от коментарите си".
 */

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const PROEKT = resolve('.');
const BIN = join(PROEKT, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruise.mjs');

/** имената ДОСЛОВНО от конфигурацията · пин с ръка */
const PRAVILA = [
  'nikoy-ne-stiga-do-vratata',
  'bez-krag',
  'yadro-e-samo',
  'model-e-chist',
  'sabitiya-nad-modela',
  'ogledalo-samo-chete',
  'smetach-e-chist',
  'komandi-ne-pishat-sami',
  'portata-e-edna',
  'knigata-e-adapter',
  'agentat-ne-pishe',
  'nositelyat-e-dolu',
  'src-ne-znae-app',
  'app-ne-drazhi-vratata',
  'chuzhdo-samo-poimenno',
] as const;

/**
 * Дървото е ВИНАГИ във временна папка (обход И) · помощникът стои ПРЕДИ първия `it(`.
 * Копират се конфигурацията и `tsconfig.json` (без него depcruise пада с TS5083),
 * `node_modules` е junction към истинския (без него голият внос на пакет е
 * `unknown`, не `npm`, и `chuzhdo-samo-poimenno` мълчи). `rmSync` маха само връзката.
 */
function darvo(koren: string) {
  if (!koren.startsWith(tmpdir())) throw new Error(`дървото не е във tmpdir(): ${koren}`);
  copyFileSync(join(PROEKT, '.dependency-cruiser.cjs'), join(koren, '.dependency-cruiser.cjs'));
  copyFileSync(join(PROEKT, 'tsconfig.json'), join(koren, 'tsconfig.json'));
  copyFileSync(join(PROEKT, 'package.json'), join(koren, 'package.json'));
  symlinkSync(join(PROEKT, 'node_modules'), join(koren, 'node_modules'), 'junction');
  const pishi = (rel: string, tekst: string): void => {
    const p = join(koren, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, tekst, 'utf8');
  };
  // най-малкият скелет, който минава: по един файл на слой, стрелките надолу
  pishi('src/yadro/vrata.ts', 'export class Vrata {\n  zatvori(): void {}\n}\n');
  pishi('src/yadro/sabitie.ts', 'export interface Sabitie {\n  readonly seq: number;\n}\n');
  pishi('src/yadro/index.ts', "export * from './vrata.js';\nexport * from './sabitie.js';\n");
  pishi('src/model/osnova.ts', "export const PROZORTSI: readonly string[] = ['a'];\n");
  pishi(
    'src/sabitiya/registar.ts',
    "import { PROZORTSI } from '../model/osnova.js';\nexport const TIP = PROZORTSI;\n",
  );
  pishi(
    'src/ogledalo/ogledalo.ts',
    "import type { Sabitie } from '../yadro/sabitie.js';\nimport { TIP } from '../sabitiya/registar.js';\nexport const fold = (s: Sabitie) => [TIP, s.seq];\n",
  );
  pishi(
    'src/smetach/sbor.ts',
    "import { fold } from '../ogledalo/ogledalo.js';\nexport const sbor = fold;\n",
  );
  pishi(
    'src/komandi/katalog.ts',
    "import { sbor } from '../smetach/sbor.js';\nexport const KATALOG = sbor;\n",
  );
  pishi(
    'src/porta/porta.ts',
    'export interface PortaZaChetene {\n  readonly y: number;\n}\nexport interface Porta extends PortaZaChetene {\n  readonly x: number;\n}\n',
  );
  pishi(
    'src/porta/izpalnitel.ts',
    "import type { Vrata } from '../yadro/vrata.js';\nimport { KATALOG } from '../komandi/katalog.js';\nimport type { Porta } from './porta.js';\nexport class Izpalnitel {\n  constructor(readonly vrata: Vrata) {}\n  porta(): Porta {\n    return { x: KATALOG.length, y: 1 };\n  }\n}\n",
  );
  pishi(
    'src/nositel/hranilishte.ts',
    "import { Vrata } from '../yadro/vrata.js';\nexport const otvori = () => new Vrata();\n",
  );
  pishi('src/kniga/ooxml.ts', "import ExcelJS from 'exceljs';\nexport const e = ExcelJS;\n");
  pishi(
    'src/kniga/pisane.ts',
    "import type { Porta } from '../porta/porta.js';\nexport type P = Porta;\n",
  );
  pishi(
    'app/kontekst.ts',
    "import type { PortaZaChetene } from '../src/porta/porta.js';\nexport interface Kontekst {\n  readonly porta: PortaZaChetene;\n}\n",
  );
  pishi(
    'app/prozorets/smetki.ts',
    "import type { Kontekst } from '../kontekst.js';\nexport function risuvay(k: Kontekst): number {\n  return k.porta.y;\n}\n",
  );
  pishi(
    'app/main.ts',
    "import { Vrata } from '../src/yadro/index.js';\nimport { Izpalnitel } from '../src/porta/izpalnitel.js';\nimport { otvori } from '../src/nositel/hranilishte.js';\nimport { risuvay } from './prozorets/smetki.js';\nexport const glavno = risuvay({ porta: new Izpalnitel(otvori() ?? new Vrata()).porta() });\n",
  );
  const pusni = () =>
    spawnSync(
      process.execPath,
      [
        BIN,
        '--config',
        join(koren, '.dependency-cruiser.cjs'),
        '--output-type',
        'err',
        'src',
        'app',
      ],
      { cwd: koren, encoding: 'utf8', timeout: 120_000 },
    );
  return { koren, pishi, pusni };
}

/** По един нарочен нарушител за всяко правило · името на файла казва правилото. */
const NARUSHITELI: Record<(typeof PRAVILA)[number], readonly (readonly [string, string])[]> = {
  // ЗАОБИКАЛЯНИЯТА · до 11.09 и трите минаваха с нула
  'nikoy-ne-stiga-do-vratata': [
    [
      'app/prozorets/zaobikolka-barel.ts',
      "import { Vrata } from '../../src/yadro/index.js';\nexport const z = new Vrata();\n",
    ],
    [
      'src/porta/preiznasya.ts',
      "export { Vrata } from '../yadro/vrata.js';\nexport { Izpalnitel } from './izpalnitel.js';\n",
    ],
    [
      'app/prozorets/zaobikolka-porta.ts',
      "import { Izpalnitel, Vrata } from '../../src/porta/preiznasya.js';\nexport const z = new Izpalnitel(new Vrata());\n",
    ],
    [
      'src/kniga/dupka-vrata.ts',
      "import { Vrata } from '../yadro/vrata.js';\nexport const k = new Vrata();\n",
    ],
  ],
  'bez-krag': [
    ['src/model/krag-a.ts', "import { b } from './krag-b.js';\nexport const a = b;\n"],
    ['src/model/krag-b.ts', "import { a } from './krag-a.js';\nexport const b = a;\n"],
  ],
  'yadro-e-samo': [
    [
      'src/yadro/losh.ts',
      "import { PROZORTSI } from '../model/osnova.js';\nexport const l = PROZORTSI;\n",
    ],
  ],
  'model-e-chist': [
    [
      'src/model/losh.ts',
      "import type { Porta } from '../porta/porta.js';\nexport type L = Porta;\n",
    ],
  ],
  'sabitiya-nad-modela': [
    [
      'src/sabitiya/losh.ts',
      "import { fold } from '../ogledalo/ogledalo.js';\nexport const l = fold;\n",
    ],
  ],
  'ogledalo-samo-chete': [
    [
      'src/ogledalo/losh.ts',
      "import { sbor } from '../smetach/sbor.js';\nexport const l = sbor;\n",
    ],
  ],
  'smetach-e-chist': [
    [
      'src/smetach/losh.ts',
      "import { KATALOG } from '../komandi/katalog.js';\nexport const l = KATALOG;\n",
    ],
  ],
  'komandi-ne-pishat-sami': [
    [
      'src/komandi/losh.ts',
      "import type { Porta } from '../porta/porta.js';\nexport type L = Porta;\n",
    ],
  ],
  'portata-e-edna': [
    ['src/porta/losh.ts', "import type { P } from '../kniga/pisane.js';\nexport type L = P;\n"],
  ],
  'knigata-e-adapter': [
    [
      'src/kniga/losh.ts',
      "import { KATALOG } from '../komandi/katalog.js';\nexport const l = KATALOG;\n",
    ],
  ],
  // `src/agenti/` НЕ съществува в живото дърво · тук се СЪЗДАВА, за да се види, че правилото би ловило
  'agentat-ne-pishe': [
    [
      'src/agenti/losh.ts',
      "import { Izpalnitel } from '../porta/izpalnitel.js';\nexport const l = Izpalnitel;\n",
    ],
  ],
  'nositelyat-e-dolu': [
    [
      'src/nositel/losh.ts',
      "import { PROZORTSI } from '../model/osnova.js';\nexport const l = PROZORTSI;\n",
    ],
  ],
  'src-ne-znae-app': [
    [
      'src/smetach/losh-app.ts',
      "import type { Kontekst } from '../../app/kontekst.js';\nexport type L = Kontekst;\n",
    ],
  ],
  'app-ne-drazhi-vratata': [
    [
      'app/prozorets/losh-tip.ts',
      "import type { Vrata } from '../../src/yadro/vrata.js';\nexport type L = Vrata;\n",
    ],
    [
      'app/reshetka/losh-komandi.ts',
      "import { KATALOG } from '../../src/komandi/katalog.js';\nexport const l = KATALOG;\n",
    ],
  ],
  'chuzhdo-samo-poimenno': [
    ['src/smetach/losh-npm.ts', "import ExcelJS from 'exceljs';\nexport const l = ExcelJS;\n"],
  ],
};

describe('слоевете · мярката лови', () => {
  it('Т6 · пробните файлове ПАДАТ · по един нарушител за всяко правило, с името му · чисто дърво минава', () => {
    // положителната контрола ПЪРВА · инак „няма нарушения" не се различава от
    // „конфигурацията не се зареди" (без tsconfig depcruise пада шумно)
    const chisto = darvo(mkdtempSync(join(tmpdir(), 'sloeve-chisto-')));
    try {
      const r = chisto.pusni();
      expect(r.stderr).toBe('');
      expect(r.status, r.stdout).toBe(0);
      expect(r.stdout).toContain('no dependency violations found');
      expect(r.stdout).toMatch(/\d+ modules/);
    } finally {
      rmSync(chisto.koren, { recursive: true, force: true });
    }

    const narusheno = darvo(mkdtempSync(join(tmpdir(), 'sloeve-narusheno-')));
    try {
      for (const faylove of Object.values(NARUSHITELI))
        for (const [rel, tekst] of faylove) narusheno.pishi(rel, tekst);
      const r = narusheno.pusni();
      // кодът на изход е БРОЯТ на грешките, не 1 · твърди се червено, не число
      expect(r.status).not.toBe(0);
      expect(r.stdout).toContain('dependency violations');
      for (const ime of PRAVILA)
        expect(r.stdout, `правило „${ime}" не лови`).toContain(`error ${ime}:`);
      // трите заобикаляния са хванати ПОИМЕННО, с пътя до Вратата
      expect(r.stdout).toContain(
        'error nikoy-ne-stiga-do-vratata: app/prozorets/zaobikolka-barel.ts',
      );
      expect(r.stdout).toContain(
        'error nikoy-ne-stiga-do-vratata: app/prozorets/zaobikolka-porta.ts',
      );
      expect(r.stdout).toContain('error nikoy-ne-stiga-do-vratata: src/kniga/dupka-vrata.ts');
    } finally {
      rmSync(narusheno.koren, { recursive: true, force: true });
    }
  }, 120_000);

  it('правилото за агента брои НУЛА файла в живото дърво · папката още не е родена (ход 11а)', () => {
    // Зелено над празно множество не е зелено · тестът го КАЗВА, вместо да го крие
    // (обход Й) · редът в дълга: ДЛ-Н13
    expect(existsSync(join(PROEKT, 'src', 'agenti'))).toBe(false);
  });
});
