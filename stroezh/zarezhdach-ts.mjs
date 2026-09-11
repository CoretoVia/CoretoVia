/**
 * ЗАРЕЖДАЧЪТ · `.js` в спецификатора → `.ts` на диска, когато `.js` няма.
 *
 * Node чете `.ts` направо (сваля типовете), но НЕ пренаписва `./kolona.js` към
 * `./kolona.ts` — така пишат вносовете в `src/` (изходът на Vite е `.js`). Дотук
 * машините в `stroezh/`, които внасят Модела, минаваха само защото файловете
 * им имаха единствено типови вносове; първият изпълним внос (`pomosht()` в
 * `osnova.ts`, ход Х) ги събори. Това е куката, не библиотека (правило 9):
 * ~15 реда, без мрежа, без пакет.
 *
 *   node --import ./stroezh/zarezhdach-ts.mjs stroezh/dumi-ot-knigata.mjs
 *
 * Пренаписва САМО относителни спецификатори с `.js`, и САМО когато Node не
 * намира `.js` файла — построеното в `dist/` и `node_modules` не се пипат.
 */

import { registerHooks } from 'node:module';

registerHooks({
  resolve(spetsifikator, kontekst, sledvasht) {
    const otnositelen = spetsifikator.startsWith('./') || spetsifikator.startsWith('../');
    if (!otnositelen || !spetsifikator.endsWith('.js')) return sledvasht(spetsifikator, kontekst);
    try {
      return sledvasht(spetsifikator, kontekst);
    } catch (greshka) {
      if (greshka?.code !== 'ERR_MODULE_NOT_FOUND') throw greshka;
      return sledvasht(`${spetsifikator.slice(0, -3)}.ts`, kontekst);
    }
  },
});
