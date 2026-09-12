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
/** Имейлът на прохода · същият при всяко пускане, за да е повторяем. */
export const IMEYLAT_NA_PROHODA = 'proba@example.bg';

/**
 * Отваря приложението · и минава ПРЕЗ вратата, ако тя стои.
 *
 * Негово, 11.09 (запис 190): „Просто влизаш… Влизане с имейл." Оттам нататък
 * нито един прозорец не се рисува, преди да се каже кой пише — и проходът
 * минава по същия път, по който минава и ръката.
 */
export async function otvori(p: Page): Promise<void> {
  await p.goto(ADRES);
  await p.waitForSelector('[data-vlizane], [data-vest]');
  if ((await p.$('[data-vlizane]')) !== null) {
    await p.fill('[data-vlizane-imeyl]', IMEYLAT_NA_PROHODA);
    await p.click('[data-vlizane-vlez]');
  }
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
  // спъне ли се, ИМЕТО на възела трябва да е в грешката · инак се търси наслуки
  try {
    await p.waitForSelector(`${KUTIYATA}:not([hidden])`);
  } catch (greshka) {
    throw new Error(
      `подсказката на ${izbor} не се появи · ${String(greshka).split(String.fromCharCode(10))[0]}`,
    );
  }
  const tekst = await p.$eval(KUTIYATA, (e) => e.textContent ?? '');
  await p.mouse.move(0, 0);
  await p.waitForSelector(KUTIYATA, { state: 'hidden' });
  return tekst;
}

/**
 * НАТИСКАНЕ НА БУТОН ОТ ЧЕТВЪРТИЯ РЕД · първо се отваря темата му.
 *
 * Негово, 11.09 (запис 193): „4ти ред се правят падащи менюта с бутони." Оттам
 * нататък бутон в тема НЕ се вижда, докато менюто е затворено — и това е
 * нарочно. Проходът минава по СЪЩИЯ път, по който минава и ръката: натиска
 * заглавието на менюто, изчаква го да се отвори, чак тогава натиска бутона.
 *
 * Коя тема е — пита се СТРАНИЦАТА, не Моделът. Така проходът проверява онова,
 * което човекът вижда, вместо да повтаря наум таблицата на кода; и остава
 * верен, ако бутонът смени темата си или излезе открит на реда.
 */
async function temataNa(p: Page, izbor: string): Promise<string | null> {
  return p.evaluate(
    (i: string) =>
      document.querySelector(i)?.closest('details.tema')?.getAttribute('data-tema') ?? null,
    izbor,
  );
}

/**
 * Довежда едно меню до исканото състояние и ЧАКА да е станало.
 *
 * ПЪРВО ПИТА, после натиска. Натискане „на сляпо" ОБРЪЩА менюто: при отказ
 * прозорецът не се прерисува и менюто остава отворено — тогава следващото
 * натискане го затваря, вместо да го отвори, и проходът чака вечно нещо, което
 * сам е развалил. Ръката прави същото: не отваря отворено меню.
 */
async function menyuto(p: Page, tema: string, otvoreno: boolean): Promise<void> {
  const sega = await p.evaluate(
    (t: string) =>
      (document.querySelector(`details.tema[data-tema="${t}"]`) as HTMLDetailsElement | null)
        ?.open ?? false,
    tema,
  );
  if (sega === otvoreno) return;
  await p.click(`details.tema[data-tema="${tema}"] > summary`);
  await p.waitForSelector(
    `details.tema[data-tema="${tema}"]${otvoreno ? '[open]' : ':not([open])'}`,
  );
}

/**
 * Натиска каквото и да е в четвъртия ред · първо отваря темата му, ако е в меню.
 *
 * По СЕЛЕКТОР, не по ключ: не всеки бутон там идва от каталога на Книгата —
 * „Добави ред с пари" в Сметки е негов бутон на прозореца и живее в същото
 * меню „Създаване" (запис 193: „Създаването е отделно падащо меню навсякъде").
 */
export async function natisniVMenyu(p: Page, izbor: string): Promise<void> {
  const tema = await temataNa(p, izbor);
  if (tema !== null) await menyuto(p, tema, true);
  await p.click(izbor);
}

export async function natisniButon(p: Page, klyuch: string): Promise<void> {
  await natisniVMenyu(p, `[data-buton-ekran="${klyuch}"]`);
}

/**
 * ЛИЦЕТО НА ЕДИН БУТОН · с отваряне на менюто му.
 *
 * Бутон в затворено меню НЕ се вижда, а `tekstNa` нарочно иска видимост: текст,
 * прочетен от скрит възел, доказва само че възелът съществува. Затова тук
 * менюто се отваря, лицето се чете и менюто се ЗАТВАРЯ — оставено отворено, то
 * лежи върху таблицата и следващото натискане би паднало върху него.
 */
export async function litseNaButona(p: Page, klyuch: string): Promise<string> {
  const tema = await temataNa(p, `[data-buton-ekran="${klyuch}"]`);
  if (tema === null) return tekstNa(p, `[data-buton-ekran="${klyuch}"]`);
  await menyuto(p, tema, true);
  const litse = await tekstNa(p, `[data-buton-ekran="${klyuch}"]`);
  await menyuto(p, tema, false);
  return litse;
}
