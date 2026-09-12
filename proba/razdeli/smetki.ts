import { readFileSync } from 'node:fs';
import { prochetiKniga } from '../../src/kniga/ooxml.ts';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import {
  litseNaButona,
  natisniButon,
  natisniVMenyu,
  poletaBezIme,
  tekstNa,
  tekstoveNa,
} from '../yadro/pomoshtni.ts';
import { mesetsatNaProhoda } from '../yadro/kalendar.ts';
import { ADRES } from '../yadro/server.ts';

const SMETKI = 'Сметки';
const ZALEPENO = '[data-zalepeno="smetki"]';
/** еврото по нормата му · тясна пауза (U+202F) между хилядите и пред знака */
const EVRO_1200 = '1 200,00 €';
const EVRO_MINUS_1500 = '-1 500,00 €';
const EVRO_1500 = '1 500,00 €';
/** бюджетът на „Дело Сондаж" · тук е РАЗХОД и влиза с минус */
const EVRO_MINUS_250000 = '-250\u202F000,00\u202F€';
const EVRO_250000 = '250\u202F000,00\u202F€';
/** нулата се пише с нейния си знак · Трезорът я показва, не я крие */
const EVRO_0 = '0,00 €';
/**
 * Месецът е ТЕКУЩИЯТ, не закован.
 *
 * „2026-09" щеше да спре да работи след 01.11.2026: листът Сметки реже
 * колоните си от предишния месец нататък, тъй че старият месец излиза извън
 * прозореца и „■" не се пише никъде (ADR-015).
 */
const MESETS = mesetsatNaProhoda();

/** 4 · Сметки · трите реда залепено · движение · знакът · кешът · Книгата и вносът */
export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 4а · залепената част · ТРИ реда (негово, 05.09 т.2) ══════════════
  razdel = '4а · трите реда';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'десетте полета с цифри на Сметки · и двете за ДДС и НАП (резен 3б)',
    (await tekstoveNa(p, `${ZALEPENO} [data-pole] .ime`)).join(' · '),
    'Приход · Разходи · Резултат · Кеш дадено · Кеш изтеглено · Кеш вкарано · движения · несверени · ДДС остатък · находки НАП',
  );
  proveri(
    'вторият ред е за КЕШ · с трите му числа и сверката',
    await p.$$eval('[data-kesh-forma] input.pole', (es) => es.length),
    4,
  );
  proveri(
    'третият ред са бутоните · неговите четиринайсет плюс „Добави ред с пари"',
    await p.$$eval(`${ZALEPENO} [data-buton-ekran].malak`, (es) => es.length),
    14,
  );
  proveri(
    'двете му ленти стоят една под друга',
    (await tekstoveNa(p, '[data-blok="prihod"] .lenta, [data-blok="razhod"] .lenta')).join(' · '),
    'ПРИХОД · Разходи',
  );
  // ── Скрий ↔ Покажи · неговите два бутона, построени в резен 6к ──────
  //
  // Скриването пипа ЕКРАНА и нищо друго (правило 23: скритото ПАК се смята).
  // Затова тук се гледа блокът, а не сборът — и накрая всичко се връща, за да
  // не пренесе разделът състояние на следващия (памет на екрана е `ui.v1.`).
  await natisniButon(p, 'skriy-prihodi');
  await p.waitForFunction(() => document.querySelector('[data-blok="prihod"]') === null);
  proveri(
    'Скрий Приходи маха блока · и Разходите остават',
    await p.$$eval('[data-blok="prihod"], [data-blok="razhod"]', (es) => es.length),
    1,
  );
  proveri(
    'бутонът вече казва ПОКАЖИ · лицето му е действието, не миналото',
    await litseNaButona(p, 'skriy-prihodi'),
    'Покажи ПРИХОД',
  );
  // ПОСЛЕДНАТА видима страна не се скрива · и отказът се КАЗВА (правило 12)
  await natisniButon(p, 'skriy-razhodi');
  await p.waitForFunction(() =>
    /Последната видима страна/.test(document.querySelector('[data-greshka]')?.textContent ?? ''),
  );
  proveri(
    'последната видима страна НЕ се скрива · и отказът се казва',
    await p.$$eval('[data-blok="prihod"], [data-blok="razhod"]', (es) => es.length),
    1,
  );
  await natisniButon(p, 'skriy-prihodi');
  await p.waitForSelector('[data-blok="prihod"]');
  proveri(
    'Покажи Приходи връща блока · двете страни са пак на екрана',
    await p.$$eval('[data-blok="prihod"], [data-blok="razhod"]', (es) => es.length),
    2,
  );

  proveri(
    'секциите му са в реда на номенклатурата',
    (await tekstoveNa(p, '[data-reshetka="prihod"] tr.sektsiya td:first-child')).join(' · '),
    'Наем Банка · Наем Кеш · Бизнес · Други',
  );
  proveri('нула движения', await tekstNa(p, '[data-tsifra="dvizheniya"]'), '0');

  // ══ 4б · движение · знакът решава страната ═══════════════════════════
  razdel = '4б · движение';
  await natisniVMenyu(p, '[data-dobavi-dvizhenie]');
  await p.waitForSelector('tr.chernova[data-chernova="dvizheniya"]');
  const ch = 'tr.chernova[data-chernova="dvizheniya"]';
  // родителят · първият Имот в списъка · оттук редът се вижда и в Управление (запис 193)
  await p.selectOption(`${ch} select[data-kolona="kam"]`, { index: 1 });
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '1');
  await p.selectOption(`${ch} select[data-kolona="funktsiya"]`, '3');
  await p.fill(`${ch} input[data-kolona="mesets"]`, MESETS);
  await p.fill(`${ch} input[data-kolona="suma"]`, '1200');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForSelector('[data-reshetka="prihod"] tr.red[data-tablitsa="dvizheniya"]');
  proveri(
    'редът застава под „Наем Банка" · сборът на секцията е сумата му',
    await tekstNa(p, '[data-sbor-sektsiya="prihod·1"]'),
    EVRO_1200,
  );
  proveri('ОБЩ ПРИХОД', await tekstNa(p, '[data-sbor="prihod"]'), EVRO_1200);
  proveri('полето горе го брои', await tekstNa(p, '[data-tsifra="prihod"]'), EVRO_1200);
  proveri('движенията станаха едно', await tekstNa(p, '[data-tsifra="dvizheniya"]'), '1');
  proveri(
    'сверката на секциите затваря',
    await tekstNa(p, '[data-sverka="smetki"]'),
    'движения 1 · без секция 0 · сверката затваря',
  );

  // разход в ПРИХОДНА секция · отказът е с думи (правило 20)
  await natisniVMenyu(p, '[data-dobavi-dvizhenie]');
  await p.waitForSelector(ch);
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '1');
  await p.selectOption(`${ch} select[data-kolona="funktsiya"]`, '3');
  await p.fill(`${ch} input[data-kolona="mesets"]`, MESETS);
  await p.fill(`${ch} input[data-kolona="suma"]`, '-1500');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForFunction(
    () => (document.querySelector('[data-greshka]')?.textContent ?? '') !== '',
  );
  proveri(
    'знакът не отговаря на секцията · и то се КАЗВА',
    (await tekstNa(p, '[data-greshka]')).includes('Знакът не отговаря на секцията'),
    true,
  );
  // същият ред, но в разходна секция · минава
  await p.selectOption(`${ch} select[data-kolona="sektsiya"]`, '');
  await p.selectOption(`${ch} select[data-kolona="sektsiyaR"]`, '1');
  await p.press(`${ch} input[data-kolona="suma"]`, 'Enter');
  await p.waitForSelector('[data-reshetka="razhod"] tr.red[data-tablitsa="dvizheniya"]');
  proveri('ОБЩ Разходи', await tekstNa(p, '[data-sbor="razhod"]'), EVRO_MINUS_1500);
  proveri(
    'Резултатът е приход + разход',
    await tekstNa(p, '[data-tsifra="rezultat"]'),
    '-300,00 €',
  );
  proveri(
    'секцията „Вкарване" събира трите му секции',
    (await tekstoveNa(p, '[data-reshetka="vkarvane"] tr.sektsiya td:first-child')).join(' · '),
    'Заплати Кеш · Фактури Кеш · Фактури Карта',
  );
  proveri(
    'и редът за заплати е вътре',
    await p.$$eval('[data-reshetka="vkarvane"] tr.red', (es) => es.length),
    1,
  );

  // ══ 4в · кешът за месеца · сверката в края на месеца ═════════════════
  razdel = '4в · кешът';
  await p.fill('[data-kesh-mesets]', MESETS);
  await p.fill('[data-kesh-zaplati]', '1500');
  await p.fill('[data-kesh-izvlechenie]', '1500');
  await p.click('[data-kesh-zapishi]');
  await p.waitForFunction(
    (evro) => document.querySelector('[data-tsifra="kesh-dadeno"]')?.textContent?.trim() === evro,
    EVRO_1500,
  );
  proveri('Кеш дадено', await tekstNa(p, '[data-tsifra="kesh-dadeno"]'), EVRO_1500);
  proveri('Кеш изтеглено', await tekstNa(p, '[data-tsifra="kesh-izvlechenie"]'), EVRO_1500);
  proveri('Кеш вкарано (по редовете)', await tekstNa(p, '[data-tsifra="kesh-vkarano"]'), EVRO_1500);
  proveri('полетата на двете форми имат име', await poletaBezIme(p), 0);
  const sverki = await tekstNa(p, '[data-kesh-sverki]');
  proveri(
    'и двете сверки затварят · дадено ↔ изтеглено ↔ вкарано по редовете',
    `${sverki.split('затваря').length - 1} · ${sverki.includes('разлика')}`,
    '2 · false',
  );

  // ══ 4г · Книгата · листът Сметки ═════════════════════════════════════
  razdel = '4г · Книгата';
  const [svalyane] = await Promise.all([p.waitForEvent('download'), natisniButon(p, 'svali-fayl')]);
  const pat = (await svalyane.path()) ?? '';
  await p.waitForFunction(() =>
    (document.querySelector('[data-iznos-vest]')?.textContent ?? '').startsWith(
      'Книгата е записана',
    ),
  );
  const kniga = await prochetiKniga(readFileSync(pat));
  const list = kniga.listove.find((l) => l.ime === SMETKI);
  const k = list?.kletki ?? [];
  const red = (duma: string): number => k.findIndex((r) => String(r[0] ?? '') === duma);
  proveri('лентата ПРИХОД я има', red('ПРИХОД') > 0, true);
  proveri('лентата Разходи я има', red('Разходи') > red('ПРИХОД'), true);
  proveri(
    'секцията „Наем Банка" е групов ред с ключ',
    k[red('Наем Банка')]?.[23],
    'grupa:sektsiya:prihod·1',
  );
  const dvizhenie = k.find((r) => String(r[23] ?? '').startsWith('dvizhenie:'));
  proveri(
    'движението носи месеца и сумата си',
    `${dvizhenie?.[5]} · ${dvizhenie?.[10]}`,
    '2026-09 · 1200',
  );
  proveri(
    'и „■" в такта на месеца си',
    (dvizhenie ?? []).slice(11, 23).filter((c) => c === '■').length,
    1,
  );
  proveri('блокът „Кеш" е накрая', red('Кеш') > red('Разходи'), true);
  const kesh = k.find((r) => String(r[23] ?? '').startsWith('kesh:'));
  proveri(
    'кешът за месеца е в Книгата',
    `${kesh?.[0]} · ${kesh?.[1]} · ${kesh?.[3]}`,
    '2026-09 · 1500 · 1500',
  );

  // ══ 4д · вносът · същата Книга = нула предложения ════════════════════
  razdel = '4д · вносът';
  await p.goto(`${ADRES}#/ii`);
  await p.waitForSelector('[data-kniga-vnos]');
  await p.setInputFiles('[data-kniga-vnos]', pat);
  await p.waitForFunction(() =>
    /предложения/.test(document.querySelector('[data-otchet-vest]')?.textContent ?? ''),
  );
  proveri(
    'износ → внос = нула · и със Сметки',
    await tekstNa(p, '[data-otchet-vest]'),
    '0 предложения · 0 находки · 0 бележки',
  );

  // ══ 4з · ТРЕЗОРЪТ · Заданието M06-10 · негово, запис 195 т.5 ══════════
  razdel = '4з · Трезорът';
  // след вноса страницата стои на ИИ · Трезорът живее в Сметки
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-zalepeno="smetki"]');
  // ЧИСЛО, не праг: редът носи ТОЧНО толкова такт-клетки, колкото са главите
  proveri(
    'Гантът е ЕДНО ЦЯЛО с таблицата · всеки ред носи всички колони на такта',
    await p.$eval(
      '[data-reshetka="prihod"] tbody tr.red',
      (e) => e.querySelectorAll('td.takt').length,
    ),
    await p.$$eval('[data-reshetka="prihod"] thead th.takt', (es) => es.length),
  );
  proveri(
    'и отделна таблица за календара вече НЯМА',
    (await p.$('[data-gant-skrol]')) === null,
    true,
  );

  proveri(
    'Трезорът стои на екрана и СЕ СМЯТА · изтеглено = дадено = вкарано · двете нули',
    await tekstNa(p, '[data-trezor]'),
    `Трезор · в каса ${EVRO_0} · в ръце ${EVRO_0}`,
  );

  // ══ 4ж · ТАКТЪТ И В СМЕТКИ · негово, 11.09 (запис 195), точка 4 ═══════
  razdel = '4ж · тактът в Сметки';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector('[data-zalepeno="smetki"]');
  proveri(
    'Сметки също има избор на такт · и той започва от година',
    await p.$eval('[data-takt]', (e) => (e as HTMLSelectElement).value),
    'godina',
  );
  const koloniteNaKalendara = async (): Promise<number> =>
    p.$$eval('[data-reshetka="prihod"] thead th.takt', (es) => es.length);
  const priGodina = await koloniteNaKalendara();
  await p.selectOption('[data-takt]', 'mesets');
  await p.waitForFunction(
    (broy: number) =>
      document.querySelectorAll('[data-reshetka="prihod"] thead th.takt').length !== broy,
    priGodina,
  );
  proveri(
    'такт месец · календарът В ТАБЛИЦАТА се мени от дванайсет колони на дни',
    (await koloniteNaKalendara()) > priGodina,
    true,
  );
  await p.selectOption('[data-takt]', 'godina');
  await p.waitForFunction(
    (broy: number) =>
      document.querySelectorAll('[data-reshetka="prihod"] thead th.takt').length === broy,
    priGodina,
  );

  // ══ 4е · СМЕТКИТЕ В УПРАВЛЕНИЕ · и ЕДИН бутон, който ги крие ══════════
  // Негово, 11.09 (запис 193): „В Управление има същия бутон който обаче крие
  // само редовете на сметки /скрий Сметки/."
  razdel = '4е · сметките в Управление';
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('[data-zalepeno="upravlenie"]');
  proveri(
    'движението стои в дървото · под своя Имот',
    (await tekstoveNa(p, 'tr.red.dvizhenie td[data-kolona="suma"]')).join(' · '),
    EVRO_1200,
  );
  proveri(
    'сверката го брои и казва колко са без родител',
    await tekstNa(p, '[data-sverka="smetki"]'),
    'сметки 1 от 2 · без родител 1',
  );
  proveri(
    'бутонът казва „Скрий Сметки", не „Скрий Дела"',
    await litseNaButona(p, 'skriy-dela'),
    'Скрий Сметки',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(() => document.querySelectorAll('tr.red.dvizhenie').length === 0);
  proveri(
    'натиснат · редовете ги няма и сверката го КАЗВА',
    `${await tekstNa(p, '[data-sverka="smetki"]')} · ${await litseNaButona(p, 'skriy-dela')}`,
    'сметки 0 от 2 · без родител 1 · скрити · Покажи Сметки',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForSelector('tr.red.dvizhenie');

  // ══ 4ж · ЕДИН РЕЖИМ ЗА ДВАТА ПРОЗОРЕЦА ═══════════════════════════════
  // Негово, 12.09 (запис 202): „Календара има две нива за които говорихме. В
  // едното състочние включват редовете с бюджет и редовете от Сметки, а
  // другото включва само Задачите без да се вкарва в календара бюджета на
  // всяко от тях което има… Двата бутона сменят и двата режима в Управление
  // и в Сметки."
  razdel = '4ж · двата режима на календара';
  proveri(
    'режим ПАРИ по подразбиране · лентата носи и името, и бюджета',
    await p.$eval('tr.red.zadacha td.takt.lenta', (e) => (e as HTMLElement).innerText.trim()),
    `Дело Сондаж · ${EVRO_250000}`,
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForFunction(
    () =>
      document.querySelector('tr.red.zadacha td.takt.lenta')?.textContent?.trim() === 'Дело Сондаж',
  );
  proveri(
    'режим ЗАДАЧИ · в календара остава САМО текстът · бюджетът не влиза',
    `${await p.$eval('tr.red.zadacha td.takt.lenta', (e) => (e as HTMLElement).innerText.trim())} · сметки ${await p.$$eval('tr.red.dvizhenie', (es) => es.length)}`,
    'Дело Сондаж · сметки 0',
  );
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'СЪЩИЯТ режим е стигнал и до Сметки · секцията на задачите я няма',
    `${await litseNaButona(p, 'skriy-dela')} · секции ${await p.$$eval('[data-sbor-zadachi]', (es) => es.length)}`,
    'Покажи Задачи · секции 0',
  );
  await natisniButon(p, 'skriy-dela');
  await p.waitForSelector('[data-sbor-zadachi]');
  proveri(
    'върнат в ПАРИ от бутона на Сметки · в календара стои БЮДЖЕТЪТ, не текстът',
    await p.$eval('tr.red.zadacha td.takt.evro', (e) => (e as HTMLElement).innerText.trim()),
    EVRO_MINUS_250000,
  );
  await p.goto(`${ADRES}#/upravlenie`);
  await p.waitForSelector('tr.red.dvizhenie');
  proveri(
    'и бутонът в Управление се е върнал заедно с него · един режим, два бутона',
    await litseNaButona(p, 'skriy-dela'),
    'Скрий Сметки',
  );

  // ══ 4з · ФИЛТЪРЪТ В СМЕТКИ · падащо меню, както в Управление ═════════
  // Негово, 12.09 (запис 199), точка 5: „В сметки да е същото."
  razdel = '4з · филтърът в Сметки';
  await p.goto(`${ADRES}#/smetki`);
  await p.waitForSelector(ZALEPENO);
  proveri(
    'редът „филтър" стои под главите и в двете таблици · по едно меню на колона',
    `${await p.$$eval('tr.filtar[data-filtar-red]', (es) => es.length)} · ${await p.$$eval('[data-reshetka="prihod"] tr.filtar td select', (es) => es.length)}`,
    '2 · 6',
  );
  proveri(
    'първото меню започва с „всички" · после въведеното',
    (
      await p.$$eval('[data-reshetka="prihod"] tr.filtar [data-filtar-smetki="0"] option', (es) =>
        es.map((e) => e.textContent),
      )
    )[0],
    'всички',
  );
  const vsichkiPrihod = await tekstNa(p, '[data-sverka="filtar-prihod"]');
  proveri('без филтър сверката не се оплаква', vsichkiPrihod.includes('филтърът е включен'), false);
  // Избира се СУМАТА на реда в Приход · тя я няма в нито един ред на Разходи,
  // тъй че се вижда и че филтърът пипа ДВЕТЕ таблици с един избор.
  await p.selectOption('[data-reshetka="prihod"] [data-filtar-smetki="5"]', EVRO_1200);
  await p.waitForFunction(() =>
    document.querySelector('[data-sverka="filtar-razhod"]')?.textContent?.startsWith('видими 0'),
  );
  proveri(
    'един избор пипа ДВЕТЕ таблици · Приход остава, Разходи се изпразва',
    `${await tekstNa(p, '[data-sverka="filtar-prihod"]')} · ${(
      await tekstNa(p, '[data-sverka="filtar-razhod"]')
    ).startsWith('видими 0')}`,
    'видими 1 от 1 · филтърът е включен · true',
  );
  proveri(
    'Приход си остава със сбора на видимия ред · само видимото се смята (запис 163)',
    await tekstNa(p, '[data-sbor="prihod"]'),
    EVRO_1200,
  );
  await p.selectOption('[data-reshetka="prihod"] [data-filtar-smetki="5"]', '');
  await p.waitForFunction(() => {
    const d = document.querySelector('[data-sverka="filtar-razhod"]');
    return d !== null && !d.textContent?.startsWith('видими 0');
  });
  proveri(
    'върнат на „всички" · Разходи се връща цял и сверката спира да се оплаква',
    `${await tekstNa(p, '[data-sverka="filtar-prihod"]')} · ${await tekstNa(p, '[data-sbor="prihod"]')}`,
    `${vsichkiPrihod} · ${EVRO_1200}`,
  );
}
