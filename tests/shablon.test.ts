/**
 * ЗАПЕЧАТАНИЯТ HTML · доказателството, че вратата се затваря (резен 6м · ADR-019).
 *
 * Тук се пази ЕДНО нещо: няма път от чужд текст до изпълним код. Всичко друго в
 * този файл е следствие.
 */

import { describe, expect, it } from 'vitest';
import { h, type Zapechatan } from '../app/reshetka/shablon.js';

/**
 * Само за теста · вижда какво е сглобил шаблонът, без да минава през възел.
 *
 * Чете се през СИМВОЛА, а не по име: печатът вече е символ и нарочно НЕ се
 * изнася (Т11). Тестът стига до него по единствения път, по който изобщо може
 * да се стигне отвън — и точно това е доказателството, че отвън път няма.
 */
const kato = (z: Zapechatan): string => {
  const simvoli = Object.getOwnPropertySymbols(z);
  expect(simvoli).toHaveLength(1);
  return (z as unknown as Record<symbol, string>)[simvoli[0]!]!;
};

describe('запечатаният HTML', () => {
  it('екранира ПЕТТЕ знака · и апострофът е петият', () => {
    // `ekraniraj` пазеше четири и оставяше апострофа. Днес дупка нямаше, защото
    // нито един атрибут не се пише с единични кавички — но това го пазеше НАВИК.
    expect(kato(h`${'&'}`)).toBe('&amp;');
    expect(kato(h`${'<'}`)).toBe('&lt;');
    expect(kato(h`${'>'}`)).toBe('&gt;');
    expect(kato(h`${'"'}`)).toBe('&quot;');
    expect(kato(h`${"'"}`)).toBe('&#39;');
  });

  it('чуждото име от негов xlsx НЕ става изпълним код', () => {
    // точната форма, с която се влиза през клетка на внесена Книга
    const chuzhdo = '<img src=x onerror="fetch(\'//zle\')">';
    const iz = kato(h`<td>${chuzhdo}</td>`);
    // ТОЧНИЯТ изход, не „не съдържа" · думата `onerror=` ОСТАВА, но като ТЕКСТ,
    // а не като атрибут — и точно това е разликата, която трябва да се твърди.
    expect(iz).toBe('<td>&lt;img src=x onerror=&quot;fetch(&#39;//zle&#39;)&quot;&gt;</td>');
    // и нито един нов ъгъл · тагът не се сглобява
    expect(iz.replace(/<td>|<\/td>/g, '')).not.toContain('<');
  });

  it('и в АТРИБУТ с единични кавички · там `ekraniraj` пускаше', () => {
    const zlo = "x' onmouseover='zle()";
    const iz = kato(h`<td data-ime='${zlo}'></td>`);
    expect(iz).not.toContain("onmouseover='");
    expect(iz).toContain('&#39;');
  });

  it('вложеният шаблон влиза КАКТО СИ Е · инак разметката би се екранирала', () => {
    const red = h`<td>${'Иван'}</td>`;
    expect(kato(h`<tr>${red}</tr>`)).toBe('<tr><td>Иван</td></tr>');
  });

  it('списък от шаблони се слепва · това е формата на всяка таблица', () => {
    const redove = ['а', 'б'].map((x) => h`<td>${x}</td>`);
    expect(kato(h`<tr>${redove}</tr>`)).toBe('<tr><td>а</td><td>б</td></tr>');
  });

  it('празното е ЛИПСА, а не думата „undefined"', () => {
    // платено в MasterBook: `undefined` се показа на екрана като текст
    expect(kato(h`<td>${undefined}</td>`)).toBe('<td></td>');
    expect(kato(h`<td>${null}</td>`)).toBe('<td></td>');
    expect(kato(h`<td>${0}</td>`)).toBe('<td>0</td>');
  });

  it('числото влиза като число, не като „[object Object]"', () => {
    expect(kato(h`${1500}`)).toBe('1500');
    expect(kato(h`${true}`)).toBe('true');
  });

  /**
   * Т11 · ПЕЧАТЪТ Е СИМВОЛ · и точно това затваря дупката.
   *
   * Дотук проверката беше СТРУКТУРНА: „обект ли е и има ли низ на име
   * `__zapechatanHTML`". Тоест обект, дошъл от `JSON.parse` на ВНЕСЕН Журнал,
   * можеше да носи този ключ и да влезе в страницата НЕЕКРАНИРАН.
   *
   * Не беше теоретично: товарът на събитие е `Record<string, unknown>`, идва
   * от чужд файл и стига до екрана — това му е работата.
   */
  it('Т11 · подправен печат от ВНЕСЕН JSON се екранира, не се изпълнява', () => {
    // точно каквото би дошло от чужд Журнал · през JSON.parse, не написано тук
    const chuzhdo = JSON.parse('{"__zapechatanHTML":"<img src=x onerror=zle()>"}') as unknown;
    const iz = kato(h`<td>${chuzhdo}</td>`);

    // от подправения товар не влиза НИЩО · нито таг, нито името на печата
    expect(iz).not.toContain('<img');
    expect(iz).not.toContain('onerror');
    expect(iz).not.toContain('__zapechatanHTML');
    // чуждият обект не е низ и не е запечатан · става безобиден текст
    expect(iz).toBe('<td>[object Object]</td>');
  });

  it('Т11 · и същото, ВЛОЖЕНО в товар · не само на върха', () => {
    // истинската форма: клетка вътре в товара на събитие, дошло от чужд Журнал
    const tovar = JSON.parse(
      '{"kletki":{"ime":{"__zapechatanHTML":"<script>zle()<\\/script>"}}}',
    ) as { kletki: { ime: unknown } };
    const iz = kato(h`<td>${tovar.kletki.ime}</td>`);
    expect(iz).not.toContain('<script');
    expect(iz).toBe('<td>[object Object]</td>');
  });

  it('Т11 · печатът НЕ е име на поле · JSON не може да произведе символ', () => {
    const z = h`<b>${'а'}</b>`;
    // нула изброими имена: няма ключ, който чужд файл да повтори
    expect(Object.keys(z)).toEqual([]);
    expect(JSON.parse(JSON.stringify(z))).toEqual({});
    // и печатът е точно ЕДИН символ
    expect(Object.getOwnPropertySymbols(z)).toHaveLength(1);
  });

  it('и вмъкнато в ОБИКНОВЕН шаблон ХВЪРЛЯ · вместо да даде „[object Object]"', () => {
    /**
     * Това е единствената грешка, която типовете НЕ ловят: `${zapechatan}` в
     * обикновен низ се превръща в „[object Object]" без нито едно оплакване —
     * нито от компилатора, нито при сглобяването. Вижда се чак на екрана, ако
     * някой погледне точно там.
     *
     * Тихото се прави ШУМНО: първата такава грешка пада на място, с думи.
     */
    const z = h`<b>${'а'}</b>`;
    expect(() => `${z}`).toThrow(/Запечатан HTML/);
    expect(() => [z].join('')).toThrow(/Запечатан HTML/);
  });
});
