/**
 * ПОМОЩНИЦИТЕ НА ПРОХОДА · думите на екрана, както човек ги чете.
 *
 * Всеки помощник ЧАКА, преди да чете: четене без изчакване след действие е
 * дефект, който честността брои (обход Е). Селекторите са по белег
 * (`data-…`), не по клас, защото класът е стил, а белегът е договор.
 */

import type { Page } from 'playwright-core';
import { ADRES } from './server.ts';

/** Отваря страницата и чака екранът да се нарисува. */
export async function otvori(p: Page): Promise<void> {
  await p.goto(ADRES);
  await p.waitForSelector('[data-vest]');
}

/** Текстът на първия елемент по белег · след като се е появил. */
export async function tekstNa(p: Page, izbor: string): Promise<string> {
  await p.waitForSelector(izbor);
  return (await p.$eval(izbor, (e) => (e as HTMLElement).innerText)).trim();
}

/**
 * КОЛКО ПОЛЕТА ВЪВ ФОРМА НЯМАТ ИМЕ · на ТОЗИ екран.
 *
 * Браузърът го съобщава сам („A form field element should have an id or name
 * attribute"), но в раздела Issues, който никой обход не чете. Тук числото
 * става проверка: поле без име не може да бъде попълнено от запомненото.
 */
export async function poletaBezIme(p: Page): Promise<number> {
  return p.$$eval(
    'form input, form select, form textarea',
    (es) => es.filter((e) => !e.getAttribute('name') && !e.getAttribute('id')).length,
  );
}

/** Текстовете на всички елементи по белег. */
export async function tekstoveNa(p: Page, izbor: string): Promise<string[]> {
  await p.waitForSelector(izbor);
  return p.$$eval(izbor, (es) => es.map((e) => (e as HTMLElement).innerText.trim()));
}

const KUTIYATA = '[role="tooltip"]';

/**
 * ПОДСКАЗКАТА НА нещо · задържа мишката върху него, чака кутията, чете текста ѝ,
 * дърпа мишката настрана и чака кутията да се скрие. Никакво фиксирано чакане:
 * кутията идва след задържане и си отива с толеранс, и двете се ЧАКАТ по белег.
 */
export async function podskazkataNa(p: Page, izbor: string): Promise<string> {
  await p.hover(izbor);
  await p.waitForSelector(`${KUTIYATA}:not([hidden])`);
  const tekst = await p.$eval(KUTIYATA, (e) => e.textContent ?? '');
  await p.mouse.move(0, 0);
  await p.waitForSelector(KUTIYATA, { state: 'hidden' });
  return tekst;
}
