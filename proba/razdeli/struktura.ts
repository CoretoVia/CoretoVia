/**
 * СТРУКТУРАТА · десетият тип събитие, натиснат в истински браузър.
 *
 * ═══ ЗАЩО СВОЙ РАЗДЕЛ, И ЗАЩО НАКРАЯ ═══
 *
 * Тук се ДОБАВЯ колона в Имоти — тоест се мени изнесената Книга. Пуснат
 * преди проверките ѝ, той ги вали с ПРАВО: те броят вчерашната форма, а тя
 * вече е друга. Това не е дефект на екрана, а ред на прохода.
 *
 * Значи стъпката стои СЛЕД всичко, което чете формата на Книгата.
 */

import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { tekstNa } from '../yadro/pomoshtni.ts';
import { ADRES } from '../yadro/server.ts';

/** Петте пътя на структурата · нова колона · глава · затваряне · подредба · таблица */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  const razdel = 'Структурата · десетият тип';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  await p.goto(`${ADRES}#/nastroyki`);

  //
  // Негово, 10.09: „Състоянията могат да са повече от едно едновременно и се
  // натрупват." Тук втората колона „Състояние" влиза НАИСТИНА, през екрана.
  const NOVA = 'tr[data-nova-kolona="imoti"]';
  await p.waitForSelector(NOVA);

  const predi = await tekstNa(p, '[data-sverka="imoti"]');

  await p.fill(`${NOVA} [data-nov-klyuch]`, 'etapNaStroezha');
  await p.fill(`${NOVA} [data-nova-glava]`, 'Състояние Строеж');
  await p.press(`${NOVA} [data-nova-glava]`, 'Enter');
  await p.waitForSelector('tr[data-tablitsa="imoti"][data-kolona="etapNaStroezha"]');
  proveri(
    'нова колона · влиза през екрана',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] [data-glava]'),
    'Състояние Строеж',
  );
  proveri(
    'и сверката пораства с ЕДНО',
    await tekstNa(p, '[data-sverka="imoti"]'),
    predi
      .replace(/живи (\d+)/, (_m, n) => `живи ${Number(n) + 1}`)
      .replace(/всички (\d+)/, (_m, n) => `всички ${Number(n) + 1}`),
  );

  // преименуване · ключът ОСТАВА
  await p.dblclick('tr[data-kolona="etapNaStroezha"] [data-glava]');
  await p.waitForSelector('tr[data-kolona="etapNaStroezha"] [data-glava] input');
  await p.fill('tr[data-kolona="etapNaStroezha"] [data-glava] input', 'Състояние Етап');
  await p.press('tr[data-kolona="etapNaStroezha"] [data-glava] input', 'Enter');
  await p.waitForFunction(
    () =>
      document
        .querySelector('tr[data-kolona="etapNaStroezha"] [data-glava]')
        ?.textContent?.trim() === 'Състояние Етап',
  );
  proveri(
    'преименувана глава · ключът е същият',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] td:nth-child(1)'),
    'etapNaStroezha',
  );

  // затваряне · СКРИВА се, не изчезва
  await p.click('tr[data-kolona="etapNaStroezha"] [data-zatvori]');
  await p.waitForSelector('tr[data-kolona="etapNaStroezha"].spryana');
  proveri(
    'затворена колона · редът е там, но сива',
    await tekstNa(p, 'tr[data-kolona="etapNaStroezha"] td:nth-child(5)'),
    'затворена',
  );

  // колона, която държи адреса на реда, НЕ се затваря · и го КАЗВА
  // менюто сменя таблицата · и това е ЕДИНСТВЕНИЯТ начин да се стигне до Обекти
  await p.selectOption('[data-izbor-tablitsa]', 'obekti');
  await p.waitForSelector('tr[data-tablitsa="obekti"][data-kolona="imot"]');
  proveri(
    'колоната с родителя не се затваря · и казва защо',
    await tekstNa(p, 'tr[data-tablitsa="obekti"][data-kolona="imot"] td:nth-child(5)'),
    'не се затваря · държи родителя на реда',
  );
}
