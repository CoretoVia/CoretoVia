/**
 * ПУСКАЧ на `knip` · с достатъчна памет.
 *
 * На това дърво голият пускач свърши купчината на 09.09.2026 и падна с
 * „JavaScript heap out of memory" — портата почервеня, без нито една находка.
 * Проверка, която пада от собствената си памет, не пази нищо: тя се чете като
 * „има нещо счупено", а няма.
 *
 * Флагът НЕ може да стои в `package.json`: там той би се дал на самия `npm`, а
 * не на детето, което върши работата. Затова се подава през средата — тя се
 * наследява от всяко дете.
 *
 * Числото е избрано с една крачка над нужното (наблюдавано: пада под 2 GB,
 * минава с 4). Расте само срещу доказано падане, не „за всеки случай".
 */

import { spawnSync } from 'node:child_process';

const PAMET = '--max-old-space-size=4096';
const dosega = process.env['NODE_OPTIONS'] ?? '';

const r = spawnSync(process.execPath, ['node_modules/knip/bin/knip.js', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: `${dosega} ${PAMET}`.trim() },
});

if (r.error !== undefined) {
  console.error(`knip не тръгна: ${r.error.message}`);
  process.exit(1);
}
process.exit(r.status ?? 1);
