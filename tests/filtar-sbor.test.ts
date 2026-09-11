/**
 * ФИЛТЪРЪТ, СБОРЪТ И ОТМЕТКАТА „брой" · договорът на решетката.
 *
 * Негово, 08.09 (запис 64⑨): „най-долният ред дава сумите… отгоре е филтърът";
 * 11.09 (записи 147 · 148 · 163). Тук се пази онова, което се СМЯТА без екран:
 * кои колони получават сбор, как изглежда редът с филтрите и как се описва
 * броячът „видими N от M". Поведението в браузъра го доказва проходът.
 *
 * ЧЕТИРИ ГРАНИЦИ, всяка платена с находка по пътя:
 *
 *   1. Сбор получават САМО числовите колони. Без това адресът „ул. Пробна 1"
 *      се четеше като „.1" и под колоната се появяваше сбор „0,60".
 *   2. Белегът е `data-filtar-kolona`, не `data-filtar` — второто е на дървото
 *      в Управление и ключът там е НОМЕР на колона. Две значения под едно име
 *      скриха всички редове и Гантът получи отрицателна височина.
 *   3. Машинката работи само върху `table.reshetka.redove` — дървото има свой
 *      филтър и свой сбор.
 *   4. Парите се събират от `data-st` (цели центове), а не от екрана.
 */

import { describe, expect, it } from 'vitest';
import {
  glavaSOtmetkaHTML,
  kletkaSOtmetkaHTML,
  redSFiltriHTML,
  redSSboroveHTML,
} from '../app/reshetka/filtar-sbor.js';
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

describe('редът с филтрите', () => {
  it('дава по едно поле на всяка колона · и СВОЙ белег, не онзи на дървото', () => {
    const iz = kato(redSFiltriHTML(KOLONI));
    // ПЪРВО броят · цикъл върху празен списък минава тихо (обход Г на честността)
    expect(KOLONI).toHaveLength(4);
    for (const k of KOLONI) expect(iz).toContain(`data-filtar-kolona="${k.klyuch}"`);
    // `data-filtar` е на дървото в Управление · две значения под едно име вече
    // веднъж скриха всички редове (11.09.2026)
    expect(iz).not.toContain('data-filtar="');
    // първата клетка е за отметката · инак редът се разминава с главите
    expect(iz).toContain('broy-kolona');
  });

  it('всяко поле КАЗВА по коя колона търси · за четците на екрана', () => {
    const iz = kato(redSFiltriHTML(KOLONI));
    // кавичката се екранира от печата на HTML (`h`) · затова се гледа думата
    expect(iz).toContain('филтър по „площ');
    expect(iz).toContain('филтър по „цена');
  });
});

describe('долният ред със сборовете', () => {
  it('сбор получават САМО числовите колони · текстовата клетка стои празна', () => {
    const iz = kato(redSSboroveHTML(KOLONI));
    expect(iz).toContain('data-sbor-kolona="plosht"');
    expect(iz).toContain('data-sbor-kolona="tsena"');
    // текстовите колони пак имат клетка (инак редът се къса), но без клас за число
    expect(iz).toContain('data-sbor-kolona="adres"');
    expect(iz).not.toContain('class="tekst" data-sbor-kolona');
    expect(iz).toContain('data-vidimi');
  });

  it('паричната и числовата клетка носят вида си · стилът ги подравнява вдясно', () => {
    const iz = kato(redSSboroveHTML(KOLONI));
    expect(iz).toContain('class="evro" data-sbor-kolona="tsena"');
    expect(iz).toContain('class="chislo" data-sbor-kolona="plosht"');
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

  it('главата ѝ носи помощ на две степени · като всяко друго нещо (правило 31)', () => {
    const iz = kato(glavaSOtmetkaHTML(KOLONI));
    expect(iz).toContain('data-podskazka');
    expect(iz).toContain('брой');
    // и главите на колоните са си там, с техните подсказки · първо броят
    expect(KOLONI).toHaveLength(4);
    for (const k of KOLONI) expect(iz).toContain(`data-kolona="${k.klyuch}"`);
  });
});
