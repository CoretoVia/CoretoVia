/**
 * КУКИТЕ · бързото пред коммита, машинно, а не по навик.
 *
 * ═══ ЗАЩО СЪЩЕСТВУВА ═══
 *
 * Измерено на 10.09.2026: `.git/hooks/` носеше само `.sample` файлове, а
 * номерът на коммита се пишеше на ръка — три дублажа за три дни. Единственият
 * принудител беше CI, който се произнася СЛЕД push.
 *
 * ═══ КАКВО ПРАВИ ═══
 *
 * `pre-commit`  БЪРЗОТО (под десет секунди): дневникът · регистърът · протоколът ·
 *               картата · стилът. Пълната `proverka` и
 *               проходът остават за `npm run kray` и за CI — `docs/14` §4 вече е
 *               решил, че 232 × 2 стъпки не се пускат пред всеки коммит.
 * `commit-msg`  ПРОВЕРЯВА, не дава: първият ред е „N · …" и N е СЛЕДВАЩИЯТ
 *               свободен номер (max + 1 от не-merge коммитите). Не се добавя сам:
 *               уеб сесията пише заглавието на PR-а и трябва да знае номера —
 *               `npm run nachalo` ѝ го казва. Две успоредни сесии ще сметнат един
 *               и същ „следващ"; локална кука не може да го спре, хваща го
 *               `dnevnik --proveri` Д8 при merge. Честната граница: номерът е
 *               машинно ПРОВЕРЕН, не машинно ДАДЕН.
 *
 * Куките в `stroezh/kuki/` са по два реда shell и викат този файл — така
 * логиката минава през biome и knip като всичко в `stroezh/`.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [, , kuka, ...ostanali] = process.argv;

function pusni(komanda, args) {
  const r = spawnSync(komanda, args, {
    encoding: 'utf8',
    stdio: 'inherit',
    shell: process.platform === 'win32',
    timeout: 120_000,
  });
  return r.status ?? 1;
}

if (kuka === 'pre-commit') {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const stapki = [
    ['dnevnik:proveri', [npm, ['run', 'dnevnik:proveri']]],
    ['registar', [npm, ['run', 'registar']]],
    ['protokol', [npm, ['run', 'protokol']]],
    ['karta:proveri', [npm, ['run', 'karta:proveri']]],
    // цялото дърво, не само подготвеното: `biome --staged` иска VCS настройка,
    // която проектът няма, а `stil` върху 225 файла е под три секунди
    ['stil', [npm, ['run', 'stil']]],
  ];
  for (const [ime, [k, a]] of stapki) {
    if (pusni(k, a) !== 0) {
      console.log(`\nКОММИТЪТ Е СПРЯН · падна „${ime}" · поправи и пробвай пак`);
      process.exit(1);
    }
  }
  process.exit(0);
}

if (kuka === 'commit-msg') {
  const fayl = ostanali[0];
  const parvi = readFileSync(fayl, 'utf8').split('\n')[0] ?? '';
  // merge и fixup/squash съобщенията не носят номер · те са на git, не наши
  if (/^(Merge|fixup!|squash!)/.test(parvi)) process.exit(0);
  const m = /^(\d+)([а-я]?) · /u.exec(parvi);
  if (!m) {
    console.log(`КОММИТЪТ Е СПРЯН · заглавието трябва да започва с „N · " · твоето: „${parvi}"`);
    console.log(
      'следващият номер: `npm run nachalo` го казва · или `node stroezh/dnevnik.mjs --sledvasht-nomer`',
    );
    process.exit(1);
  }
  const r = spawnSync(process.execPath, ['stroezh/dnevnik.mjs', '--sledvasht-nomer'], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  const sledvasht = Number(r.stdout.trim());
  const dadeno = Number(m[1]);
  // поправка „41б" към вече съществуващ номер е позволена (както в историята)
  if (m[2] !== '' && dadeno < sledvasht) process.exit(0);
  if (!Number.isInteger(sledvasht) || dadeno !== sledvasht) {
    console.log(`КОММИТЪТ Е СПРЯН · номерът е ${dadeno}, а следващият свободен е ${sledvasht}`);
    process.exit(1);
  }
  process.exit(0);
}

console.log('употреба: node stroezh/kuka.mjs pre-commit | commit-msg <файл>');
process.exit(2);
