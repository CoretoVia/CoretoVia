/**
 * ПАЗАЧЪТ НА ИСТОРИЯТА · ход 1 · вчерашната истина не изчезва мълчаливо.
 *
 * ═══ ЗАЩО СЕГА ═══
 *
 * Сгъването отдавна БРОИ непрочетените и знае защо. Но `neprocheteni` в `app/`
 * даваше НУЛА попадения: Журналът можеше да носи сто събития, лентата да казва
 * „сто", а данните да са от деветдесет и седем.
 *
 * Разрезът (Т39) го направи спешен: от 10.09 в един Журнал живеят записи от
 * ДВЕ схеми. А десетият тип събитие ще направи стеснението на Модела ежедневие.
 * Пазачът влиза ПРЕДИ него, не след.
 *
 * ═══ КАКВО СЕ ДОКАЗВА ТУК ═══
 *
 * Не че функцията връща низ, а че при СТЕСНЕН Модел:
 *   · нито едно събитие не изчезва тихо — всяко отпаднало е ПРЕБРОЕНО;
 *   · сверката (правило 7) продължава да затваря;
 *   · екранът получава ЧИСЛОТО и ПРИЧИНАТА, не общо „нещо не е наред".
 */

import { describe, expect, it } from 'vitest';
import { MODEL } from '../src/model/osnova.js';
import type { Kolona } from '../src/model/kolona.js';
import type { Model } from '../src/model/model.js';
import type { Tablitsa } from '../src/model/tablitsa.js';
import { NAY_MNOGO_REDA, neprochetenotoKazva } from '../src/ogledalo/neprochetenoto.js';
import { fold, type Ogledalo, tablitsaVOgledaloto } from '../src/ogledalo/ogledalo.js';
import { TIP } from '../src/sabitiya/registar.js';
import type { Sabitie } from '../src/yadro/index.js';
import { knigaZaTest } from './pomoshtni.js';

const KOGATO = '2026-09-05T13:00:00.000Z';

/**
 * СТЕСНЯВАНЕ НА МОДЕЛА · трите начина, по които вчерашното става нечетимо.
 *
 * Пише се тук, а не в `src/`: това е нарочно счупване за проверка, не
 * възможност на продукта. Стеснението в живия продукт ще идва от десетия тип
 * събитие и ще минава през Вратата.
 */
function bezKolonata(model: Model, tablitsa: string, kolona: string): Model {
  const t = model.tablitsi.get(tablitsa)!;
  const stesnena: Tablitsa = {
    ...t,
    koloni: t.koloni.filter((k: Kolona) => k.klyuch !== kolona),
  };
  return { ...model, tablitsi: new Map([...model.tablitsi, [tablitsa, stesnena]]) };
}

/** Журнал с три истински имота · после Моделът се стеснява под тях. */
async function trimaImota(): Promise<Sabitie[]> {
  const k = knigaZaTest();
  await k.otkriy();
  for (const ime of ['a', 'b', 'v']) {
    await k.zapishi(
      TIP.redZapisan,
      { vid: 'imot', id: `imot:${ime}` },
      {
        tablitsa: 'imoti',
        id: `imot:${ime}`,
        kletki: { ime: { tekst: `Имот ${ime}` }, plosht: { chislo: 100 } },
      },
    );
  }
  return k.sabitiya();
}

describe('пазачът на историята · непрочетеното се КАЗВА', () => {
  it('при ЦЯЛ Модел нищо не отпада · и редът не се рисува', async () => {
    const o = fold(await trimaImota(), MODEL, KOGATO);
    const d = neprochetenotoKazva(o);

    expect(tablitsaVOgledaloto(o, 'imoti').broy).toBe(3);
    expect(o.neprocheteni).toHaveLength(0);
    expect(d.nared).toBe(true);
    expect(d.redove).toHaveLength(0);
    // числото В ДУМИТЕ идва от Огледалото · не се преписва (правило 14)
    expect(d.dumi).toContain(String(o.broySabitiya));
  });

  it('СТЕСНЕН Модел · трите реда отпадат ПРЕБРОЕНИ, не тихо', async () => {
    const sabitiya = await trimaImota();
    const stesnen = bezKolonata(MODEL, 'imoti', 'plosht');
    const o = fold(sabitiya, stesnen, KOGATO);

    // 1 · ТОВА е дефектът, който пазачът лови: таблицата е ПРАЗНА,
    //     а Журналът си е цял и носи същите събития.
    expect(tablitsaVOgledaloto(o, 'imoti').broy).toBe(0);
    expect(o.neprocheteni).toHaveLength(3);
    expect(o.broySabitiya).toBe(sabitiya.length);

    // 2 · и всяко отпаднало казва ЗАЩО, поименно
    for (const n of o.neprocheteni) {
      expect(n.zashto.join(' ')).toContain('plosht');
      expect(n.type).toBe(TIP.redZapisan);
    }

    // 3 · сверката продължава да затваря · загубата не е в броенето
    expect(o.sverka.nared).toBe(true);
  });

  it('думите носят ЧИСЛОТО и ПРИЧИНАТА, не общо „нещо не е наред"', async () => {
    const o = fold(await trimaImota(), bezKolonata(MODEL, 'imoti', 'plosht'), KOGATO);
    const d = neprochetenotoKazva(o);

    expect(d.nared).toBe(false);
    expect(d.dumi).toContain('3 от 4');
    // казва и че Журналът е ЦЯЛ · инак числото звучи като загуба
    expect(d.dumi).toContain('Журналът е цял');
    expect(d.dumi).toContain('plosht');
    expect(d.redove).toHaveLength(3);
    expect(d.redove[0]).toContain('звено');
  });

  it('много непрочетени · списъкът се СВИВА, а причините се групират', () => {
    const mnogo = Array.from({ length: 12 }, (_, i) => ({
      veriga: 'kniga',
      seq: i + 1,
      type: TIP.redZapisan,
      zashto: [i < 9 ? 'няма колона „plosht"' : 'няма ред'],
    }));
    const d = neprochetenotoKazva({
      neprocheteni: mnogo,
      broySabitiya: 20,
    } as unknown as Ogledalo);

    expect(d.nared).toBe(false);
    // числото се заковава С РЪКА: сверка на константа със себе си не доказва
    // нищо, а точно това число решава дали редът предупреждава, или е стена
    expect(NAY_MNOGO_REDA).toBe(5);
    // пет реда плюс един „и още" · стена от дванайсет не предупреждава никого
    expect(d.redove).toHaveLength(6);
    expect(d.redove.at(-1)).toContain('още 7');
    // причините са ДВЕ, подредени по брой · 9 преди 3
    expect(d.dumi).toContain('няма колона „plosht" · 9');
    expect(d.dumi).toContain('няма ред · 3');
  });
});
