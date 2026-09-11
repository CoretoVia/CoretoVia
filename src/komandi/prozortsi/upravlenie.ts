/**
 * УПРАВЛЕНИЕ · задачата · негово (B1–B3 · B5 · B10): „/Добави Дело/(Дело към Имот
 * или към Обект)" … „Да може тук да се ползва десния бутон и да се дава опция за
 * Всеки Имот или Обект да се избира и добавят тези 3 функции за добавяне".
 *
 * ЕДНА родова команда „нов ред" в таблицата `zadachi`, достъпна от десния бутон
 * върху Имот, Обект или Бизнес: избраният ред става родителят (`kam`), а видът
 * (Дело · Среща · Преписка · Проект) се избира в черновата от Вид на задача.
 * Голямото дело (B4) стои в менюто сиво, с думи — идва с ход 11б.
 */

import { TABLITSI } from '../../model/osnova.js';
import { pomosht } from '../../model/pomosht.js';
import { komandaZaNovRed } from './red.js';

const RODITELI = new Set(
  TABLITSI.find((t) => t.klyuch === 'zadachi')?.koloni.find((k) => k.klyuch === 'kam')?.vrazka ??
    [],
);

export const upravlenieDobaviZadacha = komandaZaNovRed(
  'zadachi',
  'upravlenie.dobaviZadacha',
  'Добави Задача',
  pomosht(
    'От десния бутон върху имот, обект или бизнес отваря чернова за задача към него: дело, ' +
      'среща, преписка или проект. Краят не може да е преди началото.',
    'вид от номенклатурата · име · начало и край · оценка · бюджет · отговорник',
  ),
  {
    myasto: 'desen-buton',
    otIzbora: (izbran) =>
      RODITELI.has(izbran.tablitsa)
        ? {
            kletki: {
              kam: { tekst: izbran.id },
              vid: null,
              ime: null,
              ot: null,
              do: null,
              otsenka: null,
              byudzhet: null,
              otgovornik: null,
            },
          }
        : null,
  },
);
