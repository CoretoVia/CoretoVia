/**
 * ПОДРЕДБАТА, СБОРЪТ И ОТМЕТКАТА „брой" · договорът на решетката.
 *
 * Негово, 11.09 (запис 192), ДОСЛОВНО: „**Филтър значи да ги сортираш бе
 * профан. Сортираш по име по цифри.**" Дотук тук стоеше търсене по текст —
 * поправено на ПОДРЕДБА, и тестът пази поправката, за да не се върне.
 *
 * И от 08.09: „най-долният ред дава сумите" (64⑨) · „и за подредба най-отгоре"
 * (64б) · отметката, която изключва реда от сметката (163).
 *
 * ЧЕТИРИ ГРАНИЦИ, всяка платена с находка:
 *
 *   1. Сбор получават САМО числовите колони. Без това адресът „ул. Пробна 1"
 *      се четеше като „.1" и под колоната се появяваше сбор „0,60".
 *   2. Главата е БУТОН · подредбата се вика от натискане, не от поле за писане.
 *   3. Машинката работи само върху `table.reshetka.redove` — дървото на
 *      Управление има свой филтър и свой сбор, и сблъсъкът на белега
 *      `data-filtar` вече веднъж скри всички редове (11.09).
 *   4. Парите се събират от `data-st` (цели центове), а не от екрана.
 */

import { describe, expect, it } from 'vitest';
import {
  glavaSPodredbaHTML,
  kletkaSOtmetkaHTML,
  redSSboroveHTML,
} from '../app/reshetka/podredba-sbor.js';
import type { Zapechatan } from '../app/reshetka/shablon.js';
import type { Kolona } from '../src/model/kolona.js';
import { pomosht } from '../src/model/pomosht.js';

/** Само за теста · чете запечатания низ през символа, както `tests/shablon.test.ts`. */
const kato = (z: Zapechatan): string => {
  const simvoli = Object.getOwnPropertySymbols(z);
  expect(simvoli).toHaveLength(1);
  return (z as unknown as Record<symbol, string>)[simvoli[0]!]!;
};

const kolona = (klyuch: string, ime: string, vid: Kolona['vid']): Kolona =>
  Object.freeze({
    klyuch,
    ime,
    vid,
    pomosht: pomosht(`Защо съществува „${ime}".`, 'как се смята'),
    zadalzhitelna: false,
    zatvorena: false,
  }) as Kolona;

const KOLONI: readonly Kolona[] = [
  kolona('ime', 'име', 'tekst'),
  kolona('plosht', 'площ', 'chislo'),
  kolona('tsena', 'цена', 'evro'),
  kolona('adres', 'адрес', 'tekst'),
];

describe('главата подрежда', () => {
  it('всяка колона е БУТОН за подредба · не поле за търсене', () => {
    const iz = kato(glavaSPodredbaHTML(KOLONI));
    // ПЪРВО броят · цикъл върху празен списък минава тихо (обход Г на честността)
    expect(KOLONI).toHaveLength(4);
    for (const k of KOLONI) expect(iz).toContain(`data-podredi="${k.klyuch}"`);
    expect(iz).toContain('<button type="button"');
    // поправката от 11.09 · тук НЯМА поле за писане
    expect(iz).not.toContain('<input');
    expect(iz).not.toContain('data-filtar');
  });

  it('всяка глава има място за стрелката · посоката се вижда', () => {
    const iz = kato(glavaSPodredbaHTML(KOLONI));
    expect(KOLONI).toHaveLength(4);
    for (const k of KOLONI) expect(iz).toContain(`data-strelka="${k.klyuch}"`);
  });

  it('първата клетка е за отметката · инак главата се разминава с редовете', () => {
    const iz = kato(glavaSPodredbaHTML(KOLONI));
    expect(iz).toContain('broy-kolona');
    expect(iz).toContain('data-podskazka');
  });
});

describe('долният ред със сборовете', () => {
  it('сбор получават САМО числовите колони', () => {
    const iz = kato(redSSboroveHTML(KOLONI));
    expect(iz).toContain('class="chislo" data-sbor-kolona="plosht"');
    expect(iz).toContain('class="evro" data-sbor-kolona="tsena"');
    // текстовите пак имат клетка (инак редът се къса), но без клас за число
    expect(iz).toContain('data-sbor-kolona="adres"');
    expect(iz).not.toContain('class="tekst" data-sbor-kolona');
    expect(iz).toContain('data-vidimi');
  });
});

describe('отметката „брой"', () => {
  it('стои на всеки ред, отметната по подразбиране · и казва какво прави', () => {
    const iz = kato(kletkaSOtmetkaHTML('r-1'));
    expect(iz).toContain('type="checkbox"');
    expect(iz).toContain('data-broy="r-1"');
    expect(iz).toContain('checked');
    expect(iz).toContain('брой този ред в сбора');
  });
});
