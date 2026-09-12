import { PISACH_NA_KNIGATA } from '../src/yadro/index.js';
/**
 * ПРАВОТО на Длъжността · четирите оси на неговия лист „Служители" (ADR-008).
 *
 * Правило 23: правото има ТРИ стойности и само СТЕСНЯВА. Тук се пази точно
 * това — че „Редактира" значи „не съм стеснил нищо", че записаният ред бие
 * базовия, и че когато един човек носи ДВЕ Длъжности, важи най-тясната.
 *
 * Изреченията са НЕГОВИ (A17:F21), дословно; кодът чете от тях две неща —
 * правото по първата дума и обхвата: останалото.
 */

import { describe, expect, it } from 'vitest';
import { MODEL, OSI_NA_DOSTAPA } from '../src/model/osnova.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { eOtkaz } from '../src/komandi/izpalnenie.js';
import {
  dlazhnosttaNaImeyla,
  dostapaMi,
  dostapaNaDlazhnostta,
  DLAZHNOSTI_S_RAZDAVANE,
  DUMI_NA_PRAVOTO,
  mozheDaRazdavaDlazhnosti,
  mozheDaRedaktira,
  obhvatatPokriva,
  obhvatOtDumite,
  poTyasnoto,
  PRAVA,
  pravoOtDumite,
  pravotoNaImeyla,
  razdavaDostap,
} from '../src/smetach/pravo.js';
import { kletkaNa, zhiviteRedove } from '../src/ogledalo/tablitsa.js';
import { KNIGA, knigaZaTest, STOPANIN, USTROYSTVO, VALUTA } from './pomoshtni.js';

const KOGATO = '2026-09-05T13:00:00.000Z';

/** Номерата на Длъжностите · базовите му стойности, в неговия ред. */
const DLAZHNOST = {
  stopanin: 1,
  upravitel: 2,
  pomoshtnik: 3,
  sluzhitel: 4,
  nablyudatel: 5,
} as const;

const chovek = (ime: string, imeyl: string, nomer: number) => ({
  kletki: {
    ime: { tekst: ime },
    telefon: null,
    imeyl: { tekst: imeyl },
    adres: null,
    dlazhnost: { nomer },
  },
});

async function otvori() {
  const k = knigaZaTest();
  let takt = 0;
  // кой пише · сменя се, за да се провери правото на ДРУГ човек, не на Стопанина
  let koyPishe = STOPANIN;
  const stani = (imeyl: string) => {
    koyPishe = imeyl;
  };
  const iz = await Izpalnitel.otvori({
    vrata: k.vrata,
    dnevnik: k.dnevnik,
    model: MODEL,
    kniga: KNIGA,
    pisach: PISACH_NA_KNIGATA,
    ustroystvo: USTROYSTVO,
    valuta: VALUTA,
    aktor: () => koyPishe,
    sega: () => {
      takt += 1;
      return new Date(Date.parse(KOGATO) + takt * 1000).toISOString();
    },
  });
  const zapishi = async (id: string, klyuch: string, tovar: unknown) => {
    const r = await iz.izpalni(id, klyuch, tovar);
    if ('otkaz' in r) throw new Error(r.zashto.join(' | '));
    return r;
  };
  await zapishi('k0', 'stopanin.otkriy', { imeyl: STOPANIN });
  return { iz, zapishi, stani };
}

describe('правото се чете от НЕГОВОТО изречение', () => {
  it('първата дума дава правото · останалото е обхватът · празното е скрито', () => {
    expect(pravoOtDumite('Редактира всичко')).toBe('redaktira');
    expect(pravoOtDumite('Вижда само всичко')).toBe('vizhda');
    expect(pravoOtDumite('Вижда само таб Служители')).toBe('vizhda');
    expect(pravoOtDumite('')).toBe('skrito');
    expect(pravoOtDumite('   ')).toBe('skrito');
    // дословно неговото D19, с двата интервала
    expect(obhvatOtDumite('Редактира  хедъри: Заплати, Фактури Кеш, Фактури Карта')).toBe(
      'хедъри: Заплати, Фактури Кеш, Фактури Карта',
    );
    expect(obhvatOtDumite('Редактира всичко')).toBe('всичко');
  });

  it('трите стойности са в реда на стесняването · и по-тясното печели', () => {
    expect(PRAVA).toEqual(['redaktira', 'vizhda', 'skrito']);
    expect(Object.values(DUMI_NA_PRAVOTO)).toEqual(['Редактира', 'Вижда', 'Скрито']);
    expect(poTyasnoto('redaktira', 'vizhda')).toBe('vizhda');
    expect(poTyasnoto('vizhda', 'redaktira')).toBe('vizhda');
    expect(poTyasnoto('vizhda', 'skrito')).toBe('skrito');
    expect(poTyasnoto('redaktira', 'redaktira')).toBe('redaktira');
  });
});

describe('достъпът на Длъжността', () => {
  it('без записан ред важи БАЗОВИЯТ от Книгата му · и си казва, че не е записан', async () => {
    const { iz } = await otvori();
    const d = dostapaNaDlazhnostta(iz.ogledalo(), 'Помощник Управител');
    expect(d.zapisan).toBe(false);
    expect(d.dumi.hedari).toBe('Редактира  хедъри: Заплати, Фактури Кеш, Фактури Карта');
    expect(d.pravo).toEqual({
      tabove: 'vizhda',
      hedari: 'redaktira',
      redove: 'vizhda',
      zhurnal: 'vizhda',
    });
  });

  it('непозната Длъжност не отваря врати · всичките ѝ оси са скрити', async () => {
    const { iz } = await otvori();
    const d = dostapaNaDlazhnostta(iz.ogledalo(), 'Градинар');
    expect(d.zapisan).toBe(false);
    expect(Object.values(d.pravo)).toEqual(['skrito', 'skrito', 'skrito', 'skrito']);
  });

  it('ЗАПИСАНИЯТ ред бие базовия · стеснението е решение на човек', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi('d1', 'sluzhiteli.dobaviDlazhnost', {
      kletki: {
        dlazhnost: { nomer: DLAZHNOST.pomoshtnik },
        tabove: { tekst: 'Вижда всичко' },
        hedari: { tekst: 'Вижда само всичко' },
        redove: { tekst: 'Вижда само всичко' },
        zhurnal: { tekst: 'Вижда само всичко' },
      },
    });
    const d = dostapaNaDlazhnostta(iz.ogledalo(), 'Помощник Управител');
    expect(d.zapisan).toBe(true);
    expect(d.pravo.hedari).toBe('vizhda');
  });
});

describe('правото на един ЧОВЕК', () => {
  it('Длъжността идва от реда му · Стопани и Служители се четат в този ред', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Помощникът', 'pomoshtnik@example.bg', DLAZHNOST.pomoshtnik),
    );
    const o = iz.ogledalo();
    expect(dlazhnosttaNaImeyla(o, 'pomoshtnik@example.bg')).toBe('Помощник Управител');
    expect(dlazhnosttaNaImeyla(o, 'POMOSHTNIK@example.bg')).toBe('Помощник Управител');
    expect(dlazhnosttaNaImeyla(o, 'nikoy@example.bg')).toBe('');
    expect(dlazhnosttaNaImeyla(o, '')).toBe('');
  });

  it('Стопанинът на Книгата редактира ВИНАГИ · дори без ред в таблиците', async () => {
    const { iz } = await otvori();
    const o = iz.ogledalo();
    expect(dlazhnosttaNaImeyla(o, STOPANIN)).toBe('');
    expect(pravotoNaImeyla(o, STOPANIN, 'zhurnal')).toBe('redaktira');
    expect(mozheDaRedaktira(o, STOPANIN, 'Заплати Кеш')).toBe(true);
  });

  /**
   * Т41 · Т34 · ТОЗИ ТЕСТ ПАЗЕШЕ ДУПКАТА.
   *
   * Дотук той твърдеше „човек без ред ВИЖДА · най-тясното, което върши работа"
   * и искаше `'vizhda'`. И двете бяха неверни:
   *
   *  · по СОБСТВЕНАТА константа `PRAVA` най-тясното е `'skrito'`, не `'vizhda'`
   *    (правило 23 — „най-тясното печели");
   *  · заради него УВОЛНЕНИЕТО работеше наопаки: изключиш ли реда на служителя,
   *    правото му по ВСИЧКИТЕ четири оси СТАВАШЕ „Вижда".
   *
   * Негово, 08.09.2026: „Лицата са ЗАПЛАХА, ако не са поканени с длъжност."
   */
  it('човек без Длъжност е СКРИТ по четирите оси · подразбирането е ОТКАЗ', async () => {
    const { iz } = await otvori();
    const o = iz.ogledalo();
    for (const os of OSI_NA_DOSTAPA) {
      expect(pravotoNaImeyla(o, 'nikoy@example.bg', os)).toBe('skrito');
    }
    expect(mozheDaRedaktira(o, 'nikoy@example.bg', 'Заплати Кеш')).toBe(false);
  });

  /**
   * Т28 · ПРЕИМЕНУВАНЕТО РАЗДАВАШЕ ПРАВО · доказано с изпълнение на 08.09.
   *
   * Сравнението беше `obhvat.includes(duma)` — СЪДЪРЖАНЕ НА ПОДНИЗ. Обхватът на
   * Помощника е „хедъри: Заплати, Фактури Кеш, Фактури Карта", тъй че секция на
   * име „Кеш" даваше `true`, защото „кеш" се съдържа във „фактури кеш".
   * А секции се раждат от Настройки.
   */
  it('Т28 · секция „Кеш" НЕ отваря право · подниз не е дума', async () => {
    const obhvat = 'хедъри: заплати, фактури кеш, фактури карта';
    // неговият стенопис ОЦЕЛЯВА · „Заплати" отваря „Заплати Кеш"
    expect(obhvatatPokriva(obhvat, 'Заплати Кеш')).toBe(true);
    expect(obhvatatPokriva(obhvat, 'Фактури Кеш')).toBe(true);
    expect(obhvatatPokriva(obhvat, 'Фактури Карта')).toBe(true);
    // а ескалацията пада · нито едно име от списъка не се побира в тези
    expect(obhvatatPokriva(obhvat, 'Кеш')).toBe(false);
    expect(obhvatatPokriva(obhvat, 'Фактури')).toBe(false);
    expect(obhvatatPokriva(obhvat, 'Хедъри')).toBe(false);
    expect(obhvatatPokriva(obhvat, 'Кредити')).toBe(false);
  });

  /** Т30 · `[].every(...)` е `true` · празната истина отваряше право. */
  it('Т30 · празният хедър НЕ отваря · празната истина е отказ', async () => {
    const obhvat = 'хедъри: заплати, фактури кеш, фактури карта';
    expect(obhvatatPokriva(obhvat, '')).toBe(false);
    expect(obhvatatPokriva(obhvat, '   ')).toBe(false);
    expect(obhvatatPokriva(obhvat, ',,')).toBe(false);
  });

  it('ДВЕ Длъжности на един човек · важи НАЙ-ТЯСНАТА (правило 23)', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Двулик', 'dvulik@example.bg', DLAZHNOST.pomoshtnik),
    );
    await zapishi(
      's2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Двулик · втори ред', 'dvulik@example.bg', DLAZHNOST.nablyudatel),
    );
    const o = iz.ogledalo();
    // Помощникът редактира хедъри, Наблюдателят само вижда → вижда
    expect(pravotoNaImeyla(o, 'dvulik@example.bg', 'hedari')).toBe('vizhda');
    expect(mozheDaRedaktira(o, 'dvulik@example.bg', 'Заплати Кеш')).toBe(false);
  });
});

describe('кой редактира кой хедър · неговото D19', () => {
  it('Помощник Управителят редактира ТРИТЕ секции от изречението му и нищо друго', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Помощникът', 'pomoshtnik@example.bg', DLAZHNOST.pomoshtnik),
    );
    const o = iz.ogledalo();
    const mozhe = (hedar: string) => mozheDaRedaktira(o, 'pomoshtnik@example.bg', hedar);
    expect(mozhe('Заплати Кеш')).toBe(true);
    expect(mozhe('Фактури Кеш')).toBe(true);
    expect(mozhe('Фактури Карта')).toBe(true);
    expect(mozhe('Наем Банка')).toBe(false);
    expect(mozhe('Кредити')).toBe(false);
    expect(mozhe('Фактури Бнка')).toBe(false);
  });

  it('Управителят редактира ВСИЧКО · Наблюдателят нищо', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Управителят', 'upravitel@example.bg', DLAZHNOST.upravitel),
    );
    await zapishi(
      's2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel),
    );
    const o = iz.ogledalo();
    expect(mozheDaRedaktira(o, 'upravitel@example.bg', 'Кредити')).toBe(true);
    expect(mozheDaRedaktira(o, 'nablyudatel@example.bg', 'Заплати Кеш')).toBe(false);
    // Журналът е разликата между Стопанина и Управителя (неговите C17 · C18)
    expect(pravotoNaImeyla(o, 'upravitel@example.bg', 'zhurnal')).toBe('vizhda');
    expect(pravotoNaImeyla(o, 'upravitel@example.bg', 'redove')).toBe('redaktira');
  });
});

describe('личният достъп · за Профила', () => {
  it('четирите оси носят НЕГОВИТЕ глави, думата на правото и изречението дословно', async () => {
    const { iz, zapishi } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Помощникът', 'pomoshtnik@example.bg', DLAZHNOST.pomoshtnik),
    );
    const d = dostapaMi(iz.ogledalo(), 'pomoshtnik@example.bg');
    expect(d.dlazhnost).toBe('Помощник Управител');
    expect(d.osi.map((x) => x.pravo)).toEqual(['Вижда', 'Редактира', 'Вижда', 'Вижда']);
    expect(d.osi[1]?.dumi).toBe('Редактира  хедъри: Заплати, Фактури Кеш, Фактури Карта');
  });

  it('човек без ред · Длъжността е празна и всяка ос е празна (липсващото се КАЗВА)', async () => {
    const { iz } = await otvori();
    const d = dostapaMi(iz.ogledalo(), 'nikoy@example.bg');
    expect(d.dlazhnost).toBe('');
    expect(d.osi.map((x) => x.dumi)).toEqual(['', '', '', '']);
    expect(d.osi.map((x) => x.pravo)).toEqual(['Скрито', 'Скрито', 'Скрито', 'Скрито']);
  });
});

describe('кой РАЗДАВА Длъжности · негово, 05.09', () => {
  const dumiteNaOtkaza = (r: unknown): string =>
    eOtkaz(r) ? r.zashto.join(' ') : 'мина, а не биваше';

  it('Управителят и Помощник Управителят раздават · Наблюдателят и Служителят — не', async () => {
    const { iz, zapishi } = await otvori();
    for (const [ime, imeyl, nomer] of [
      ['Управителят', 'upravitel@example.bg', DLAZHNOST.upravitel],
      ['Помощникът', 'pomoshtnik@example.bg', DLAZHNOST.pomoshtnik],
      ['Служителят', 'sluzhitel@example.bg', DLAZHNOST.sluzhitel],
      ['Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel],
    ] as const) {
      await zapishi(`s-${imeyl}`, 'sluzhiteli.dobaviSluzhitel', chovek(ime, imeyl, nomer));
    }
    const o = iz.ogledalo();
    expect(mozheDaRazdavaDlazhnosti(o, 'upravitel@example.bg')).toBe(true);
    expect(mozheDaRazdavaDlazhnosti(o, 'pomoshtnik@example.bg')).toBe(true);
    expect(mozheDaRazdavaDlazhnosti(o, 'sluzhitel@example.bg')).toBe(false);
    expect(mozheDaRazdavaDlazhnosti(o, 'nablyudatel@example.bg')).toBe(false);
    expect(mozheDaRazdavaDlazhnosti(o, 'nikoy@example.bg')).toBe(false);
    // Стопанинът на Книгата е над двамата · иначе първият вход не назначава никого
    expect(mozheDaRazdavaDlazhnosti(o, STOPANIN)).toBe(true);
    expect(DLAZHNOSTI_S_RAZDAVANE).toEqual(['Стопанин', 'Управител', 'Помощник Управител']);
  });

  it('Портата ОТКАЗВА с думи · и бутонът го казва предварително (правило 12)', async () => {
    const { iz, zapishi, stani } = await otvori();
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel),
    );
    stani('nablyudatel@example.bg');
    const otkazat = iz.probvay('x1', 'sluzhiteli.dobaviDlazhnost', {
      kletki: {
        dlazhnost: { nomer: DLAZHNOST.upravitel },
        tabove: { tekst: 'Редактира всичко' },
        hedari: { tekst: 'Редактира всичко' },
        redove: { tekst: 'Редактира всичко' },
        zhurnal: { tekst: 'Редактира всичко' },
      },
    });
    expect(dumiteNaOtkaza(otkazat)).toMatch(
      /Длъжности се раздават от Управител и Помощник Управител .* Ти си Наблюдател\./,
    );
    const buton = iz.butoniZa('sluzhiteli').find((b) => b.klyuch === 'sluzhiteli.dobaviDlazhnost')!;
    expect(buton.razreshena).toBe(false);
    expect(buton.zashto).toMatch(/Ти си Наблюдател/);
  });

  /**
   * ЗАДНАТА ВРАТА · и ЕДНА ПОПРАВКА НА САМИЯ ТЕСТ (08.09.2026).
   *
   * Дотук тук стоеше Наблюдател и се твърдеше, че той МОЖЕ да поправи телефон
   * („него го поправя всеки, който пише редове"). Но Наблюдателят има
   * `redove: „Вижда само всичко"` — той НЕ пише редове. Твърдението минаваше
   * само защото Портата изобщо не питаше оста „редове" (находка Т2 от одита).
   * Тоест тестът пазеше ДУПКАТА като очаквано поведение.
   *
   * Сега актьорът е Служител с ПИСМЕНО дадено право над редовете — той минава
   * оста и стига до истинския въпрос: раздава ли Длъжности. Задната врата се
   * проверява там, където изобщо може да бъде отворена.
   */
  it('ЗАДНАТА врата е затворена · Длъжност не се пише и през клетката', async () => {
    const { iz, zapishi, stani } = await otvori();
    // Длъжност „Служител", на която Стопанинът ПИСМЕНО дава редовете
    await zapishi('d1', 'sluzhiteli.dobaviDlazhnost', {
      kletki: {
        dlazhnost: { nomer: DLAZHNOST.sluzhitel },
        tabove: { tekst: 'Вижда всичко' },
        hedari: { tekst: 'Редактира всичко' },
        redove: { tekst: 'Редактира всичко' },
        zhurnal: { tekst: 'Вижда само всичко' },
      },
    });
    await zapishi(
      's1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Редакторът', 'redaktor@example.bg', DLAZHNOST.sluzhitel),
    );
    const id = iz.ogledalo().tablitsi.get('sluzhiteli')!.id[0]!;
    stani('redaktor@example.bg');
    const popravka = (kletki: Record<string, unknown>) =>
      iz.probvay('x1', 'red.popraviKletka', { tablitsa: 'sluzhiteli', id, kletki });

    // минава оста „редове" · телефонът НЕ е раздаване
    expect(eOtkaz(popravka({ telefon: { tekst: '0888 000 001' } }))).toBe(false);
    // но Длъжност не се пише и през клетката
    expect(dumiteNaOtkaza(popravka({ dlazhnost: { nomer: DLAZHNOST.upravitel } }))).toMatch(
      /Длъжности се раздават/,
    );
    // махането на човек също раздава достъп (маха го)
    expect(
      dumiteNaOtkaza(iz.probvay('x2', 'red.izklyuchi', { tablitsa: 'sluzhiteli', id })),
    ).toMatch(/Длъжности се раздават/);
  });

  it('НАБЛЮДАТЕЛЯТ не пише НИЩО · оста „редове" го спира преди всичко', async () => {
    const { iz, zapishi, stani } = await otvori();
    await zapishi(
      's2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel),
    );
    const id = iz.ogledalo().tablitsi.get('sluzhiteli')!.id[0]!;
    stani('nablyudatel@example.bg');
    // дори телефон · неговото право е „Вижда само всичко"
    expect(
      dumiteNaOtkaza(
        iz.probvay('x3', 'red.popraviKletka', {
          tablitsa: 'sluzhiteli',
          id,
          kletki: { telefon: { tekst: '0888 000 002' } },
        }),
      ),
    ).toMatch(/само гледаш редовете/);
  });

  it('раздаването се ПОЗНАВА по таблицата и по колоните', () => {
    expect(razdavaDostap('dostap', [])).toBe(true);
    expect(razdavaDostap('sluzhiteli', ['dlazhnost'])).toBe(true);
    expect(razdavaDostap('stopani', ['ime', 'dlazhnost'])).toBe(true);
    expect(razdavaDostap('sluzhiteli', ['telefon', 'adres'])).toBe(false);
    expect(razdavaDostap('zadachi', ['dlazhnost'])).toBe(false);
  });
});

/**
 * ВРАТАТА НА РЕДОВЕТЕ · находка Т2 от одита на 08.09.2026.
 *
 * До днес оста „редове" се питаше САМО от `app/reshetka/redaktsiya.ts`. Портата
 * не я питаше изобщо — тоест служител „Вижда само", който извика командата ПРЕЗ
 * Портата вместо през клетката, ЗАПИСВАШЕ.
 *
 * К2 казва „Портата е една". Беше вярно за ПЪТЯ и невярно за ПРАВОТО.
 */
describe('ВРАТАТА НА РЕДОВЕТЕ · Портата пита правото, не само екранът', () => {
  const NIKOY = 'nikoy@example.bg';
  const DUMITE = /само гледаш редовете/;
  const dumiteNaOtkaza = (r: unknown): string =>
    eOtkaz(r) ? r.zashto.join(' ') : 'мина, а не биваше';

  it('човек без Длъжност НЕ поправя клетка през Портата', async () => {
    const { iz, stani } = await otvori();
    stani(NIKOY);
    const r = iz.probvay('x1', 'red.popraviKletka', {
      tablitsa: 'obekti',
      id: 'obekt:k3',
      kletki: { tsena: { stoynost_st: 1 } },
    });
    expect(eOtkaz(r)).toBe(true);
    expect(dumiteNaOtkaza(r)).toMatch(DUMITE);
  });

  it('и НЕ добавя ред · вратата е на ФАБРИКАТА, не на една команда', async () => {
    const { iz, stani } = await otvori();
    stani(NIKOY);
    const r = iz.probvay('x2', 'imoti.sazdayImot', { kletki: {} });
    expect(eOtkaz(r)).toBe(true);
    expect(dumiteNaOtkaza(r)).toMatch(DUMITE);
  });

  it('и НЕ изключва ред', async () => {
    const { iz, stani } = await otvori();
    stani(NIKOY);
    const r = iz.probvay('x3', 'red.izklyuchi', { tablitsa: 'obekti', id: 'obekt:k3' });
    expect(eOtkaz(r)).toBe(true);
    expect(dumiteNaOtkaza(r)).toMatch(DUMITE);
  });

  /**
   * Т27 · НАБЛЮДАТЕЛ ПИШЕШЕ ПАРИ · доказано с ИЗПЪЛНЕНИЕ на 08.09.
   *
   * Наблюдателят е Длъжност с ВСИЧКИТЕ четири оси „Вижда" — и въпреки това
   * `smetki.zapishiKesh` (5 000,00) и `smetki.zapishiDds` (123,45) се ЗАПИСАХА
   * в Журнала. Командите нямаха `koyMozhe`, а полето е по избор — тъй че
   * липсата му не вдигаше нищо.
   */
  it('Т27 · НАБЛЮДАТЕЛ не пише пари · нито кеш, нито ДДС', async () => {
    const { iz, zapishi, stani } = await otvori();
    await zapishi(
      'n1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel),
    );
    stani('nablyudatel@example.bg');

    const kesh = iz.probvay('k1', 'smetki.zapishiKesh', {
      mesets: '2026-09',
      zaplati: { stoynost_st: 500000 },
      fakturi: { stoynost_st: 0 },
      izvlechenie: { stoynost_st: 0 },
    });
    expect(eOtkaz(kesh)).toBe(true);
    expect(dumiteNaOtkaza(kesh)).toMatch(DUMITE);

    const dds = iz.probvay('d1', 'smetki.zapishiDds', {
      mesets: '2026-09',
      nachislen: { stoynost_st: 12345 },
    });
    expect(eOtkaz(dds)).toBe(true);
    expect(dumiteNaOtkaza(dds)).toMatch(DUMITE);
  });

  /**
   * Т23 · и коренът на Т28 · НАСТРОЙКИТЕ БЯХА ОТВОРЕНИ ЗА ВСЕКИ.
   *
   * Наблюдател преименува разходна секция „Кредити" на „Кеш" — и с това
   * РАЗДАДЕ право върху нея, защото обхватът се четеше по подниз. Номенклатурите
   * раждат секциите, значи отворените Настройки са заден вход към правото.
   *
   * Негово (`zadanie/02:16`): номенклатурите се пипат „от секция Номенклатура
   * при **Настройки на Стопанина**".
   */
  it('Т23 · НАБЛЮДАТЕЛ не пипа номенклатурите · нито създава, нито преименува, нито спира', async () => {
    const { iz, zapishi, stani } = await otvori();
    await zapishi(
      'n2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Наблюдателят', 'nablyudatel@example.bg', DLAZHNOST.nablyudatel),
    );
    stani('nablyudatel@example.bg');
    const SAMO_STOPANINAT = /само от Стопанина/;

    for (const [opId, klyuch, tovar] of [
      [
        's1',
        'nastroyki.dobaviStoynost',
        { nomenklatura: 'sektsii-razhodi', tekst: 'Ново', belezi: {} },
      ],
      [
        's2',
        'nastroyki.preimenuvayStoynost',
        { nomenklatura: 'sektsii-razhodi', nomer: 5, tekst: 'Кеш', belezi: {} },
      ],
      ['s3', 'nastroyki.spriStoynost', { nomenklatura: 'sektsii-razhodi', nomer: 5, belezi: {} }],
    ] as const) {
      const r = iz.probvay(opId, klyuch, tovar);
      expect(eOtkaz(r), `${klyuch} трябваше да откаже`).toBe(true);
      expect(dumiteNaOtkaza(r)).toMatch(SAMO_STOPANINAT);
    }
  });

  /**
   * Т42 · ДЛЪЖНОСТТА НА ПЪРВИЯ СТОПАНИН Е НЕПРИКОСНОВЕНА.
   *
   * Негово, 08.09: „Длъжността на първия стопанин не се променя никога от
   * никого." · „Неприкосновена е."
   *
   * Дотук `mozheDaRazdavaDlazhnosti` пускаше Управител И Помощник Управител да
   * пипат колоната „Длъжност", БЕЗ нито една проверка кой е ЦЕЛТА. Пази се и
   * ИЗКЛЮЧВАНЕТО: изключен ред не е жив, тоест Длъжността изчезва по друг път
   * за същия резултат.
   */
  it('Т42 · дори УПРАВИТЕЛ не пипа Длъжността на Стопанина · нито я мени, нито го изключва', async () => {
    const { iz, zapishi, stani } = await otvori();
    // Стопанинът получава СВОЙ ред в Служители — иначе няма какво да се пипа
    await zapishi(
      'c1',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Стопанинът', STOPANIN, DLAZHNOST.stopanin),
    );
    const tv = iz.ogledalo().tablitsi.get('sluzhiteli')!;
    const red = zhiviteRedove(tv).find((j) => {
      const k = kletkaNa(tv, j, 'imeyl');
      return k !== null && 'tekst' in k && k.tekst === STOPANIN;
    })!;
    const idNaStopanina = tv.id[red]!;
    await zapishi(
      'c2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Управителят', 'upravitel@example.bg', DLAZHNOST.upravitel),
    );
    stani('upravitel@example.bg');
    const NEPRIKOSNOVENA = /НЕПРИКОСНОВЕНА/;

    // (1) не му мени Длъжността
    const smyana = iz.probvay('c3', 'red.popraviKletka', {
      tablitsa: 'sluzhiteli',
      id: idNaStopanina,
      kletki: { dlazhnost: { nomer: DLAZHNOST.nablyudatel } },
    });
    expect(eOtkaz(smyana)).toBe(true);
    expect(dumiteNaOtkaza(smyana)).toMatch(NEPRIKOSNOVENA);

    // (2) и не го изключва · същият резултат по друг път
    const izklyuchi = iz.probvay('c4', 'red.izklyuchi', {
      tablitsa: 'sluzhiteli',
      id: idNaStopanina,
    });
    expect(eOtkaz(izklyuchi)).toBe(true);
    expect(dumiteNaOtkaza(izklyuchi)).toMatch(NEPRIKOSNOVENA);
  });

  it('правото се пита ПРЕДИ товара · отказът не издава дали редът съществува', async () => {
    // Портата пита `koyMozhe` преди схемата и преди предусловията
    // (`izpalnenie.ts:34`). Значи „Вижда само" получава ЕДИН отговор — своя —
    // а не разказ за това какви редове има в чужда книга.
    const { iz, stani } = await otvori();
    stani(NIKOY);
    const r = iz.probvay('x4', 'red.popraviKletka', {
      tablitsa: 'obekti',
      id: 'нямаго',
      kletki: {},
    });
    // ЕДИН отговор, не разказ: правото се пита ПРЕДИ схемата и предусловията
    expect(dumiteNaOtkaza(r).split(' · ')).toHaveLength(2);
    expect(dumiteNaOtkaza(r)).toMatch(DUMITE);
  });

  it('СТОПАНИНЪТ минава · инак тестът щеше да доказва само, че всички падат', async () => {
    const { iz } = await otvori();
    const r = iz.probvay('x5', 'imoti.sazdayImot', {
      kletki: {
        ime: { tekst: 'Проба' },
        sastoyanie: { nomer: 2 },
        plosht: null,
        tsena: null,
        papka: null,
        adres: null,
      },
    });
    expect(eOtkaz(r)).toBe(false);
  });
});

/**
 * ═══ ТРИТЕ ДУПКИ, ЗАТВОРЕНИ НА 09.09.2026 · Т31 · Т32 · Т25 ═══
 *
 * И трите са от един клас: правото се СМЯТА на две места и двете места не
 * казваха едно и също. Вратата пита `pravotoNaImeyla`, Профилът питаше
 * `dostapaMi`, а таблицата на Достъпа връщаше първия намерен ред.
 */
describe('поправката бие стария ред · и Профилът казва ДЕЙСТВАЩОТО (Т31 · Т32 · Т25)', () => {
  const dlazhnostSDostap = (nomer: number, redove: string) => ({
    kletki: {
      dlazhnost: { nomer },
      tabove: { tekst: 'Вижда всичко' },
      hedari: { tekst: 'Вижда само всичко' },
      redove: { tekst: redove },
      zhurnal: { tekst: 'Вижда само всичко' },
    },
  });

  it('Т31 · ДВА живи реда за една Длъжност → печели ПОСЛЕДНИЯТ, не най-старият', async () => {
    const { iz, zapishi } = await otvori();

    // първият ред отваря редовете за Наблюдателя …
    await zapishi(
      'd1',
      'sluzhiteli.dobaviDlazhnost',
      dlazhnostSDostap(DLAZHNOST.nablyudatel, 'Редактира всичко'),
    );
    expect(dostapaNaDlazhnostta(iz.ogledalo(), 'Наблюдател').pravo.redove).toBe('redaktira');

    // … а вторият (поправката, правило 1: ново събитие) ги СТЕСНЯВА
    await zapishi(
      'd2',
      'sluzhiteli.dobaviDlazhnost',
      dlazhnostSDostap(DLAZHNOST.nablyudatel, 'Вижда само всичко'),
    );

    const o = iz.ogledalo();
    expect(dostapaNaDlazhnostta(o, 'Наблюдател').pravo.redove).toBe('vizhda');
    expect(dostapaNaDlazhnostta(o, 'Наблюдател').dumi.redove).toBe('Вижда само всичко');
  });

  it('Т32 · СТОПАНИНЪТ без ред в Достъп вижда в Профила „Редактира", не „Скрито"', async () => {
    const { iz } = await otvori();
    const o = iz.ogledalo();

    // вратата вече му дава всичко · Профилът трябва да казва СЪЩОТО
    for (const os of OSI_NA_DOSTAPA) expect(pravotoNaImeyla(o, STOPANIN, os)).toBe('redaktira');

    const d = dostapaMi(o, STOPANIN);
    expect(d.osi.map((x) => x.pravo)).toEqual(['Редактира', 'Редактира', 'Редактира', 'Редактира']);
    expect(d.osi[0]?.dumi).toBe('Стопанин на Книгата · над Длъжностите');
  });

  it('Т25 · ДВЕ Длъжности → Профилът показва НАЙ-ТЯСНОТО, както го пази вратата', async () => {
    const { iz, zapishi } = await otvori();
    const IMEYL = 'dvete@example.bg';

    // един и същ човек в ДВЕТЕ таблици · Управител в едната, Наблюдател в другата
    await zapishi('s1', 'sluzhiteli.dobaviStopan', chovek('Двойният', IMEYL, DLAZHNOST.upravitel));
    await zapishi(
      's2',
      'sluzhiteli.dobaviSluzhitel',
      chovek('Двойният', IMEYL, DLAZHNOST.nablyudatel),
    );

    const o = iz.ogledalo();
    const d = dostapaMi(o, IMEYL);

    // вратата и Профилът дават ЕДНО И СЪЩО по всяка ос
    for (const [i, os] of OSI_NA_DOSTAPA.entries()) {
      expect(d.osi[i]?.pravo).toBe(DUMI_NA_PRAVOTO[pravotoNaImeyla(o, IMEYL, os)]);
    }
    // и това не е „и двете са Редактира" · Наблюдателят стеснява редовете
    expect(pravotoNaImeyla(o, IMEYL, 'redove')).toBe('vizhda');
  });
});

/**
 * ═══ Т33 · БЕЛЕГЪТ ЗА РЕДАКЦИЯ НЕ СЕ ПИША БЕЗ ПАЗАЧ ═══
 *
 * Клетката „кам" в Сметки получаваше `data-redakt` БЕЗУСЛОВНО: човек без право
 * по оста „хедъри" виждаше секцията „Вкарване" като само за гледане, но точно
 * тази клетка се отваряше. Дупка, която Заданието описваше като затворена.
 *
 * Поправянето на единия случай не пази от следващия. Затова тук се брои
 * СТРУКТУРНО: всяко място в екрана, което ПИШЕ белега, стои до пазача си.
 * Обходът обявява колко е видял (правило 14) и доказва, че лови (правило 2 на
 * проверките) — върху нарочно счупен откъс.
 */
describe('Т33 · нито един белег за редакция без пазач · обход по екрана', () => {
  const PAZACHI = /bezRedaktsiya|samoGledane/;

  /**
   * Редовете, които ПИШАТ белега.
   *
   * Не се броят: четенето (`querySelector`) и КОМЕНТАРИТЕ — шапката на решетката
   * обяснява белега с думи и това не е място, което го издава.
   */
  const pishatBelega = (kod: string): number[] =>
    kod
      .split('\n')
      .map((red, i) => ({ red, n: i + 1 }))
      .filter(({ red }) => {
        const gol = red.trim();
        if (gol.startsWith('*') || gol.startsWith('//') || gol.startsWith('/*')) return false;
        return red.includes('data-redakt="') && !red.includes('querySelector');
      })
      .map(({ n }) => n);

  const bezPazach = (kod: string): string[] => {
    const redove = kod.split('\n');
    const nahodki: string[] = [];
    for (const n of pishatBelega(kod)) {
      // пазачът стои НАД мястото · шест реда стигат за `if` и за тройното условие
      const okolo = redove.slice(Math.max(0, n - 7), n).join('\n');
      if (!PAZACHI.test(okolo)) nahodki.push(`ред ${n}`);
    }
    return nahodki;
  };

  it('обходът е ВИДЯЛ екрана · иначе нулата долу не значи нищо', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const faylove: string[] = [];
    const obhodi = (p: string): void => {
      for (const ime of readdirSync(p)) {
        const pat = join(p, ime);
        if (statSync(pat).isDirectory()) obhodi(pat);
        else if (ime.endsWith('.ts')) faylove.push(pat);
      }
    };
    obhodi('app');
    expect(faylove.length).toBeGreaterThan(20);
    const pishat = faylove.filter((f) => pishatBelega(readFileSync(f, 'utf8')).length > 0);
    // днес са ДВЕ: общата решетка и клетката „кам" в Сметки
    // ТРИ са от 13.09 (запис 204): към общата решетка и клетката „кам" се добави
    // клетката на КАЛЕНДАРА — там се пресели редакцията на времето, когато
    // колоната с датата излезе от реда.
    expect(pishat.length).toBe(3);
  });

  it('нито едно място не пише белега без пазач наблизо', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of [
      'app/reshetka/reshetka.ts',
      'app/prozorets/smetki.ts',
      'app/prozorets/upravlenie.ts',
    ]) {
      expect(bezPazach(readFileSync(f, 'utf8')), f).toEqual([]);
    }
  });

  it('МЯРКАТА ЛОВИ · нарочно счупен откъс дава находка', () => {
    // адресът се сглобява, за да не изглежда като заместител в ТОЗИ файл
    const adres = `$\{TABLITSA}·$\{r.id}·kam`;
    const schupen = [
      'const tds = KOLONI.map((klyuch) => {',
      '  const kol = kolonaNa(t, klyuch);',
      `  return h\`<td data-redakt="${adres}" tabindex="0"></td>\`;`,
      '});',
    ].join('\n');
    expect(bezPazach(schupen)).toEqual(['ред 3']);
  });
});
