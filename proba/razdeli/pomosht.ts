import { pomosht, tekstNaPomoshtta } from '../../src/model/pomosht.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { podskazkataNa } from '../yadro/pomoshtni.ts';
import { ADRES } from '../yadro/server.ts';

const IME = 'h1[data-ime]';
const KUTIYATA = '[role="tooltip"]';
/** изборът в главата · и същият в Настройки, вътре в тялото на прозореца */
const STEPEN_V_GLAVATA = '.glava [data-pomosht-stepen]';
const STEPEN_V_NASTROYKI = '[data-prozorets-tyalo] [data-pomosht-stepen]';

/*
 * ДУМИТЕ НА ТРИТЕ ПРОЗОРЕЦА · пин, както всяко очакване на прохода: „всеки низ,
 * както го чете човек". `src/model/osnova.ts` не може да се внесе тук — веригата
 * му минава през `./kolona.js`, а голият node не пренаписва `.js` към `.ts`;
 * `pomosht.ts` е без внос и оттам идва САМО формулата на степента. Смени ли
 * се текстът в Модела, този ред пада и го казва — това му е работата.
 */
const IMOTI = pomosht(
  'Скелетът на всичко: Имотите, под тях Обектите и Бизнесите. Всеки ред оттук става избор в падащите менюта на другите прозорци, а номерът му се смята от мястото му в дървото.',
  'номер = Имот · Категория · Вид · № · сборове под площ и цена върху видимите редове',
);
const SMETKI = pomosht(
  'Парите по месеци: ПРИХОД и Разходи със секциите им, ДДС и кешът на месеца със сверките му. Знакът на сумата решава страната — плюс е приход, минус е разход; секцията само казва мястото вътре в страната.',
  'знакът решава страната · ОБЩ = сбор на секциите + ДДС · Резултат = приход + разход',
);
const NASTROYKI = pomosht(
  'Настройките на Стопанина: номенклатурите като една таблица с подтаблици — пише се в празния ред за нова стойност, поправя се за преименуване, изтрива се за спиране. Оттук се мени и структурата на таблиците, и степента на подсказките.',
  'номенклатури · структура на таблиците · степен на помощта · менюто расте само оттук',
);

/**
 * 0ж · ХЕЛПЪТ НА ДВЕ СТЕПЕНИ · преди откриването на Книгата.
 *
 * Условието за затваряне на хода: „задържане върху името показва Имоти → Сметки
 * при смяна". Тук е и доказателството, че СИВИЯТ бутон говори при задържане —
 * той остава `disabled`, а Chromium му праща `mouseover`. Ако този ред падне,
 * причината не е в текста, а в браузъра, и следващата стъпка е `aria-disabled`.
 */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  const razdel = '0ж · хелпът';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);
  const imoti = IMOTI;
  const smetki = SMETKI;
  const nastroyki = NASTROYKI;

  // ══ (а) името казва Имоти · подробното, защото степента по подразбиране е Начало ═
  await p.goto(`${ADRES}#/imoti`);
  await p.waitForSelector('[data-buton="imoti.sazdayImot"]');
  proveri(
    'степента по подразбиране е Начало',
    await p.$eval(STEPEN_V_GLAVATA, (e) => (e as HTMLSelectElement).value),
    'nachalo',
  );
  proveri(
    'задържане върху името показва Имоти · защо + формулата',
    await podskazkataNa(p, IME),
    tekstNaPomoshtta(imoti, 'nachalo'),
  );

  // ══ (е) СИВИЯТ бутон от каталога говори при задържане · остава disabled ═════════
  proveri(
    'бутонът е сив',
    await p.$eval('[data-buton="imoti.sazdayImot"]', (e) => (e as HTMLButtonElement).disabled),
    true,
  );
  proveri(
    'и при задържане казва защо · disabled + mouseover',
    await podskazkataNa(p, '[data-buton="imoti.sazdayImot"]'),
    'Книгата не е открита — първо Стопанинът.',
  );

  // ══ (б) смяна на таба · името казва Сметки ═══════════════════════════════════
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-zalepeno="smetki"]');
  proveri(
    'при Сметки името казва Сметки',
    await podskazkataNa(p, IME),
    tekstNaPomoshtta(smetki, 'nachalo'),
  );
  proveri(
    'и двата текста са различни',
    tekstNaPomoshtta(imoti, 'nachalo') === tekstNaPomoshtta(smetki, 'nachalo'),
    false,
  );

  // ══ (в) Escape скрива кутията ════════════════════════════════════════════════
  await p.hover(IME);
  await p.waitForSelector(`${KUTIYATA}:not([hidden])`);
  await p.keyboard.press('Escape');
  await p.waitForSelector(KUTIYATA, { state: 'hidden' });
  proveri('Escape скрива кутията', await p.$eval(KUTIYATA, (e) => (e as HTMLElement).hidden), true);
  proveri(
    'и името вече не сочи кутията',
    await p.$eval(IME, (e) => e.getAttribute('aria-describedby')),
    null,
  );
  await p.mouse.move(0, 0);

  // ══ (г) Нормален · само формулата ═══════════════════════════════════════════
  await p.selectOption(STEPEN_V_GLAVATA, 'normalno');
  await p.waitForFunction(
    (kratko) => document.querySelector('h1[data-ime]')?.getAttribute('data-podskazka') === kratko,
    smetki.kratko,
  );
  proveri('Нормален дава само формулата', await podskazkataNa(p, IME), smetki.kratko);
  proveri(
    'селектът в главата помни Нормален',
    await p.$eval(STEPEN_V_GLAVATA, (e) => (e as HTMLSelectElement).value),
    'normalno',
  );

  // ══ (д) смяна от Настройки → главата казва същото ═══════════════════════════
  await p.goto(`${ADRES}#/nastroyki`);
  await p.waitForSelector(STEPEN_V_NASTROYKI);
  proveri(
    'Настройки показва текущата степен',
    await p.$eval(STEPEN_V_NASTROYKI, (e) => (e as HTMLSelectElement).value),
    'normalno',
  );
  await p.selectOption(STEPEN_V_NASTROYKI, 'nachalo');
  await p.waitForFunction(
    () =>
      document.querySelector<HTMLSelectElement>('.glava [data-pomosht-stepen]')?.value ===
      'nachalo',
  );
  proveri(
    'смяната от Настройки стига до главата',
    await p.$eval(STEPEN_V_GLAVATA, (e) => (e as HTMLSelectElement).value),
    'nachalo',
  );
  proveri(
    'и името пак е подробно · за Настройки',
    await podskazkataNa(p, IME),
    tekstNaPomoshtta(nastroyki, 'nachalo'),
  );

  // ══ (ж) Tab до името · кутията идва от клавиатурата, веднага ════════════════
  // Тръгва се от избора в главата (първото след името) и се върви НАЗАД: така
  // редът на табулацията не зависи от това къде браузърът е оставил началната
  // си точка след прерисуването на Настройки.
  await p.focus(STEPEN_V_GLAVATA);
  await p.keyboard.press('Shift+Tab');
  await p.waitForFunction(
    (tekst) => document.querySelector('[role="tooltip"]')?.textContent === tekst,
    tekstNaPomoshtta(nastroyki, 'nachalo'),
  );
  proveri(
    'фокусът е на името',
    await p.evaluate(() => document.activeElement?.hasAttribute('data-ime') === true),
    true,
  );
  proveri(
    'Tab до името показва кутията',
    await p.$eval(KUTIYATA, (e) => e.textContent ?? ''),
    tekstNaPomoshtta(nastroyki, 'nachalo'),
  );
  proveri(
    'името сочи кутията за четците',
    await p.$eval(IME, (e) => e.getAttribute('aria-describedby')),
    'podskazkata',
  );
  await p.keyboard.press('Escape');
  await p.waitForSelector(KUTIYATA, { state: 'hidden' });
  await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}
