/**
 * СЛУЖИТЕЛИ · трите му бутона на този лист (ADR-008).
 *
 * „Стопани свързани с Coretovia" (A2) и „Служители свързани с Coretovia" (A6) са
 * две таблици с едни и същи колони и с НЕГОВИТЕ различни глави; „Създаване на
 * Длъжност с достъп" (B14) е трети бутон — ред в „Достъп на Длъжности за
 * Служител" с четирите оси.
 *
 * Редовете се поправят, изключват и връщат с родовите команди на реда
 * (`red.popraviKletka` · `red.izklyuchi` · `red.varni`), както навсякъде.
 */

import { pomosht } from '../../model/pomosht.js';
import { mozheDaRazdavaDlazhnosti, zashtoNeRazdava } from '../../smetach/pravo.js';
import type { Kontekst } from '../komanda.js';
import { komandaZaNovRed } from './red.js';

/**
 * НЕГОВО, 05.09: „Длъжности се раздават от управителите и помощник управители."
 *
 * И трите бутона на този лист раздават Длъжност: който добавя човек, му пише
 * и Длъжността. Затова вратата е ЕДНА, а не само пред „Създаване на Длъжност".
 */
const RAZDAVA = (k: Kontekst): string | null =>
  mozheDaRazdavaDlazhnosti(k.ogledalo, k.aktor) ? null : zashtoNeRazdava(k.ogledalo, k.aktor);

/** Двете таблици с хора имат едни и същи колони · и една дума за какво се пише. */
const KAKVO_SE_PISHE_ZA_CHOVEK = 'име · телефон · имейл · адрес · длъжност от номенклатурата';

export const sluzhiteliDobaviStopan = komandaZaNovRed(
  'stopani',
  'sluzhiteli.dobaviStopan',
  'Добави Стопанин',
  pomosht(
    'Добавя човек в списъка на стопаните с неговата длъжност. Длъжността дава правата, затова ' +
      'бутонът е отворен за Стопанина, управителя и помощник управителя.',
    KAKVO_SE_PISHE_ZA_CHOVEK,
  ),
  { koyMozhe: RAZDAVA },
);

export const sluzhiteliDobaviSluzhitel = komandaZaNovRed(
  'sluzhiteli',
  'sluzhiteli.dobaviSluzhitel',
  'Добави Служител',
  pomosht(
    'Добавя служител с длъжност. Имейлът му е ключът: с него влиза в програмата, а ' +
      'длъжността казва какво вижда и какво пише.',
    KAKVO_SE_PISHE_ZA_CHOVEK,
  ),
  { koyMozhe: RAZDAVA },
);

export const sluzhiteliDobaviDlazhnost = komandaZaNovRed(
  'dostap',
  'sluzhiteli.dobaviDlazhnost',
  'Създаване на Длъжност с достъп',
  pomosht(
    'Създава длъжност и описва правата ѝ по четирите оси: табове, хедъри, редове и Журнал. ' +
      'Правото само стеснява — първата дума на всяка ос казва Редактира или Вижда.',
    'длъжност · табове · хедъри · редове · Журнал · всяка ос започва с Редактира или Вижда',
  ),
  { koyMozhe: RAZDAVA },
);
