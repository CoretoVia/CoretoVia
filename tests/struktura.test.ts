/**
 * ДЕСЕТИЯТ ТИП СЪБИТИЕ · ход 2 · структурата има история като всичко друго.
 *
 * ═══ КАКВО СЕ ДОКАЗВА ═══
 *
 * Не че функциите връщат нещо, а че СЕДЕМТЕ изисквания от документите са
 * изпълнени. Всяко има свой тест и свой адрес:
 *
 *   `docs/28` §2.1 · петте промени влизат като събитие
 *   `docs/28` §2.2 · вчерашната истина остава ЧЕТИМА
 *   `docs/28` §2.3 · жив Модел вече не изхвърля вчерашно събитие
 *   `docs/28` §2.4 · човек може сам да си създава хедъри и таблици
 *   `docs/10` 104  · състоянията се НАТРУПВАТ (втора колона „Състояние")
 *   К1             · нова таблица влиза само в СЪЩЕСТВУВАЩ прозорец
 *   правило 18     · затворената колона се СКРИВА, старото остава и се смята
 */

import { describe, expect, it } from 'vitest';
import { MODEL, NOMENKLATURA } from '../src/model/osnova.js';
import { DEYSTVIYA, prilozhi, zashtoNeMozhe } from '../src/model/struktura.js';
import { fold, tablitsaVOgledaloto } from '../src/ogledalo/ogledalo.js';
import { kletkaNa, zhiviteRedove } from '../src/ogledalo/tablitsa.js';
import { TIP } from '../src/sabitiya/registar.js';
import { knigaZaTest } from './pomoshtni.js';

const KOGATO = '2026-09-05T13:00:00.000Z';

const kolonite = (m: typeof MODEL, t: string) =>
  (m.tablitsi.get(t)?.koloni ?? []).map((k) => k.klyuch);

describe('петте промени · docs/28 §2.1', () => {
  it('действията са ПЕТ и точно тези · броят е пин с ръка', () => {
    expect([...DEYSTVIYA]).toEqual([
      'kolonaDobavena',
      'glavaPreimenuvana',
      'kolonaZatvorena',
      'tablitsaDobavena',
      'redNaKolonite',
    ]);
  });

  it('нова колона · и това е НАТРУПВАНЕТО на състояния (docs/10 · 104)', () => {
    // негово: „Състоянията могат да са повече от едно едновременно и се натрупват."
    // Имотът носи ЕДНА колона „Състояние"; втората влиза оттук.
    const predi = MODEL.tablitsi.get('imoti')!.koloni.filter((k) => k.ime.includes('Състояние'));
    expect(predi).toHaveLength(1);

    const sled = prilozhi(MODEL, {
      deystvie: 'kolonaDobavena',
      tablitsa: 'imoti',
      kolona: 'vtoroSastoyanie',
      ime: 'Състояние Строеж',
      vid: 'izbor',
      nomenklatura: NOMENKLATURA.sastoyanieNaImot,
    });

    const sega = sled.tablitsi.get('imoti')!.koloni.filter((k) => k.ime.includes('Състояние'));
    expect(sega).toHaveLength(2);
    // и СТАРИЯТ Модел не е пипнат · промяната ражда нов, не мени миналото
    expect(
      MODEL.tablitsi.get('imoti')!.koloni.filter((k) => k.ime.includes('Състояние')),
    ).toHaveLength(1);
    // колона без автор на текст пак носи помощ · по вида си и с главата си в нея (правило 31)
    const nova = sega.find((k) => k.klyuch === 'vtoroSastoyanie')!;
    expect(nova.pomosht.zashto).toContain('Състояние Строеж');
    expect(nova.pomosht.kratko).toMatch(/избор от номенклатурата/);
  });

  it('преименувана глава · ключът ОСТАВА, тоест нито един ред не мърда', () => {
    const sled = prilozhi(MODEL, {
      deystvie: 'glavaPreimenuvana',
      tablitsa: 'imoti',
      kolona: 'ime',
      ime: 'Име на обекта',
    });
    expect(kolonite(sled, 'imoti')).toEqual(kolonite(MODEL, 'imoti'));
    expect(sled.tablitsi.get('imoti')!.koloni.find((k) => k.klyuch === 'ime')!.ime).toBe(
      'Име на обекта',
    );
  });

  it('затворена колона · СКРИВА се, не изчезва (правило 18)', () => {
    const sled = prilozhi(MODEL, {
      deystvie: 'kolonaZatvorena',
      tablitsa: 'imoti',
      kolona: 'plosht',
    });
    const k = sled.tablitsi.get('imoti')!.koloni.find((x) => x.klyuch === 'plosht')!;
    // колоната Е ТАМ · само е затворена
    expect(k.zatvorena).toBe(true);
    expect(kolonite(sled, 'imoti')).toContain('plosht');
  });

  it('нова таблица · и К1 я пуска САМО в съществуващ прозорец', () => {
    const dobra = {
      deystvie: 'tablitsaDobavena',
      tablitsa: 'belezhkite',
      ime: 'Мои бележки',
      prozorets: 'nastroyki',
      sashtnost: 'zadacha',
    } as const;
    expect(zashtoNeMozhe(MODEL, dobra)).toEqual([]);
    expect(prilozhi(MODEL, dobra).tablitsi.get('belezhkite')!.ime).toBe('Мои бележки');
    // и тя носи помощ, макар никой да не е писал текст за нея · казва, че е наша
    const p = prilozhi(MODEL, dobra).tablitsi.get('belezhkite')!.pomosht;
    expect(p.zashto).toContain('Мои бележки');
    expect(p.kratko).toMatch(/наша таблица/);

    // К1 · прозорците са ОСЕМ и не се добавят
    const zla = { ...dobra, tablitsa: 'druga', prozorets: 'devetiyat' };
    expect(zashtoNeMozhe(MODEL, zla).join(' ')).toContain('К1');
  });

  it('ред на колоните · същите колони, друг ред', () => {
    const sega = kolonite(MODEL, 'imoti');
    const obarnat = [...sega].reverse();
    expect(
      prilozhi(MODEL, { deystvie: 'redNaKolonite', tablitsa: 'imoti', redut: obarnat }),
    ).toBeDefined();
    // липсваща колона в подредбата се ОТКАЗВА · инак тя изчезва мълчаливо
    expect(
      zashtoNeMozhe(MODEL, {
        deystvie: 'redNaKolonite',
        tablitsa: 'imoti',
        redut: sega.slice(1),
      }).join(' '),
    ).toContain('ТОЧНО същите');
  });
});

describe('отказите се КАЗВАТ с думи · правило 12', () => {
  it('колона, която държи родителя или номера, НЕ се затваря', () => {
    // Обектът сочи Имота с колона `imot` · затворена, редът губи мястото си
    expect(
      zashtoNeMozhe(MODEL, {
        deystvie: 'kolonaZatvorena',
        tablitsa: 'obekti',
        kolona: 'imot',
      }).join(' '),
    ).toContain('родителя');
  });

  it('втора колона със същия ключ се отказва', () => {
    expect(
      zashtoNeMozhe(MODEL, {
        deystvie: 'kolonaDobavena',
        tablitsa: 'imoti',
        kolona: 'ime',
        ime: 'Пак име',
        vid: 'tekst',
      }).join(' '),
    ).toContain('вече има колона');
  });

  it('колона от вид „избор" без номенклатура се отказва · и обратното', () => {
    const osnova = { deystvie: 'kolonaDobavena', tablitsa: 'imoti', kolona: 'novo' } as const;
    expect(
      zashtoNeMozhe(MODEL, { ...osnova, ime: 'Ново', vid: 'izbor', nomenklatura: '' }).join(' '),
    ).toContain('иска номенклатура');
    expect(
      zashtoNeMozhe(MODEL, {
        ...osnova,
        ime: 'Ново',
        vid: 'tekst',
        nomenklatura: NOMENKLATURA.sastoyanieNaImot,
      }).join(' '),
    ).toContain('само колона от вид');
  });

  it('ключ на кирилица се отказва · правило 10', () => {
    expect(
      zashtoNeMozhe(MODEL, {
        deystvie: 'kolonaDobavena',
        tablitsa: 'imoti',
        kolona: 'състояние',
        ime: 'Състояние 2',
        vid: 'tekst',
      }).join(' '),
    ).toContain('не е на латиница');
  });
});

/**
 * ═══ СЪРЦЕВИНАТА · docs/28 §2.2 и §2.3 ═══
 *
 * „Вчерашната истина остава ЧЕТИМА. Събитие, писано по стара структура, не се
 * изхвърля и не се преправя — то се чете с онази структура, която е важала
 * тогава." И: „Това затваря дефекта, при който жив Модел мълчаливо изхвърляше
 * вчерашно събитие, щом днешната структура не го признае."
 */
describe('вчерашната истина остава четима · docs/28 §2.2 · §2.3', () => {
  /** Журнал: имот → нова колона → имот, който я ползва. */
  async function istoriya() {
    const k = knigaZaTest();
    await k.otkriy();
    await k.zapishi(
      TIP.redZapisan,
      { vid: 'imot', id: 'imot:a' },
      { tablitsa: 'imoti', id: 'imot:a', kletki: { ime: { tekst: 'Малинова' } } },
    );
    await k.zapishi(
      TIP.strukturaPromenena,
      { vid: 'struktura', id: 'imoti' },
      {
        deystvie: 'kolonaDobavena',
        tablitsa: 'imoti',
        kolona: 'etap',
        ime: 'Състояние Етап',
        vid: 'tekst',
        nomenklatura: '',
      },
    );
    await k.zapishi(
      TIP.redZapisan,
      { vid: 'imot', id: 'imot:b' },
      {
        tablitsa: 'imoti',
        id: 'imot:b',
        kletki: { ime: { tekst: 'Витоша' }, etap: { tekst: 'Проектиране' } },
      },
    );
    return k.sabitiya();
  }

  it('колоната се РАЖДА в потока · и следващият ред вече я ползва', async () => {
    const o = fold(await istoriya(), MODEL, KOGATO);

    // Моделът на Огледалото носи новата колона · базовият НЕ е пипнат
    expect(o.model.tablitsi.get('imoti')!.koloni.map((k) => k.klyuch)).toContain('etap');
    expect(MODEL.tablitsi.get('imoti')!.koloni.map((k) => k.klyuch)).not.toContain('etap');

    const t = tablitsaVOgledaloto(o, 'imoti');
    expect(t.broy).toBe(2);
    const redove = [...zhiviteRedove(t)];
    expect(kletkaNa(t, redove[1]!, 'etap')).toEqual({ tekst: 'Проектиране' });
  });

  it('НИТО ЕДНО събитие не отпада · и сверката затваря', async () => {
    const s = await istoriya();
    const o = fold(s, MODEL, KOGATO);
    expect(o.neprocheteni).toHaveLength(0);
    expect(o.broySabitiya).toBe(s.length);
    expect(o.sverka.nared).toBe(true);
  });

  it('ВЧЕРАШНИЯТ ред оцелява и след като колоната му се ЗАТВОРИ', async () => {
    const k = knigaZaTest();
    await k.otkriy();
    await k.zapishi(
      TIP.redZapisan,
      { vid: 'imot', id: 'imot:a' },
      {
        tablitsa: 'imoti',
        id: 'imot:a',
        kletki: { ime: { tekst: 'Малинова' }, plosht: { chislo: 120 } },
      },
    );
    // ДНЕС колоната се затваря · вчерашният ред е писан ПРЕДИ това
    await k.zapishi(
      TIP.strukturaPromenena,
      { vid: 'struktura', id: 'imoti' },
      { deystvie: 'kolonaZatvorena', tablitsa: 'imoti', kolona: 'plosht' },
    );

    const o = fold(await k.sabitiya(), MODEL, KOGATO);
    const t = tablitsaVOgledaloto(o, 'imoti');

    // редът НЕ е изчезнал · и стойността му е там (правило 18: скритото пак се смята)
    expect(t.broy).toBe(1);
    expect(kletkaNa(t, [...zhiviteRedove(t)][0]!, 'plosht')).toEqual({ chislo: 120 });
    expect(o.neprocheteni).toHaveLength(0);
    // а колоната ВЕЧЕ е затворена за писане
    expect(
      o.model.tablitsi.get('imoti')!.koloni.find((x) => x.klyuch === 'plosht')!.zatvorena,
    ).toBe(true);
  });

  it('събитие ПРЕДИ раждането на колоната · то не я знае и не я ползва', async () => {
    const k = knigaZaTest();
    await k.otkriy();
    // ред, писан по СТАРАТА структура · с колона, която още не съществува
    await k.zapishi(
      TIP.redZapisan,
      { vid: 'imot', id: 'imot:a' },
      {
        tablitsa: 'imoti',
        id: 'imot:a',
        kletki: { ime: { tekst: 'Малинова' }, etap: { tekst: 'рано' } },
      },
    );
    const o = fold(await k.sabitiya(), MODEL, KOGATO);

    // не се приема мълчаливо · КАЗВА се, че колоната я няма (ход 1 · правило 12)
    expect(o.neprocheteni).toHaveLength(1);
    expect(o.neprocheteni[0]!.zashto.join(' ')).toContain('etap');
  });
});
