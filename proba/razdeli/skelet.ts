import { fileURLToPath } from 'node:url';
import type { KonteksNaProhoda } from '../yadro/kontekst.ts';
import { otvori, poletaBezIme, tekstNa, tekstoveNa } from '../yadro/pomoshtni.ts';

const MOSTRA = fileURLToPath(new URL('../../tests/mostri/Coretovia-mostra.xlsx', import.meta.url));

/** 0 · скелетът · страницата · хранилището · осемте прозореца · Книгата се чете в браузъра */
import { tishina } from '../yadro/tishina.ts';
import { ADRES } from '../yadro/server.ts';
import { IMEYLAT_NA_PROHODA } from '../yadro/pomoshtni.ts';

/** Отваря Профил след ново зареждане · котвата се чете ВЕДНЪЖ, при тръгване. */
async function otvoriProfilNanovo(p: KonteksNaProhoda['stranitsa']): Promise<void> {
  await otvori(p);
  await p.click('[data-prozorets="profil"]');
  await p.waitForSelector('[data-kotva]');
}

export async function blok1(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  let razdel = '—';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ 0а · страницата ═══════════════════════════════════════════════════
  razdel = '0а · вратата';
  // негово, 11.09 (запис 190): „Просто влизаш… Влизане с имейл." Преди имейла
  // програмата не рисува нито един прозорец — това е първото, което се проверява.
  await p.goto(ADRES);
  await p.waitForSelector('[data-vlizane]');
  proveri('заглавието', await p.title(), 'Coretovia');
  proveri(
    'без имейл няма нито един прозорец · само вратата',
    `${(await p.$('[data-prozortsi]')) === null} · ${(await p.$('[data-vlizane-imeyl]')) !== null}`,
    'true · true',
  );
  await p.fill('[data-vlizane-imeyl]', 'не-е-имейл');
  await p.click('[data-vlizane-vlez]');
  proveri(
    'грешният имейл се КАЗВА · и вратата остава',
    await tekstNa(p, '[data-vlizane-greshka]'),
    'Това не прилича на имейл.',
  );
  await otvori(p);
  proveri(
    'влязохме · и празната Книга се ОТКРИ със същия имейл',
    await tekstNa(p, '[data-vest]'),
    `1 събития в Журнала · ${IMEYLAT_NA_PROHODA}`,
  );
  await p.click('[data-prozorets="profil"]');
  await p.waitForSelector('[data-kotva]');
  proveri(
    'хранилището докладва',
    (await tekstNa(p, '[data-hranilishte]')).startsWith('постоянство:'),
    true,
  );
  proveri(
    'Вратата е отворена',
    (await tekstNa(p, '[data-hranilishte]')).endsWith('Вратата е отворена'),
    true,
  );
  proveri('полетата на формата имат име', await poletaBezIme(p), 0);
  proveri(
    'котвата се захвана при откриването',
    (await tekstNa(p, '[data-kotva]')).startsWith('Котва още няма'),
    false,
  );

  // САМОЛИЧНОСТТА · свой ключ на устройството (ADR-024 §1).
  //
  // Проверява се ФОРМАТА, не стойността: отпечатъкът е различен на всяко
  // устройство и всеки нов профил на браузъра, тъй че пин с точен низ би
  // паднал при първото пускане на друга машина. Формата обаче е обещание:
  // `k1-` плюс 32 шестнайсетични знака, и НЕ започва с името на служебната
  // книга — това е цялата защита на личната верига.
  const dumiteZaSamolichnostta = await tekstNa(p, '[data-samolichnost]');
  proveri(
    'самоличността се КАЗВА на екрана',
    /^самоличност: k1-[0-9a-f]{32}$/.test(dumiteZaSamolichnostta),
    true,
  );
  proveri(
    'и адресът ѝ НЕ започва с името на служебната книга',
    dumiteZaSamolichnostta.includes('coretovia'),
    false,
  );
  proveri('и това не е тревога', await p.$eval('[data-samolichnost]', (e) => e.className), 'vest');

  // ══ 0б · веригата ═════════════════════════════════════════════════════
  razdel = '0б · веригата';
  await p.click('[data-proveri]');
  await p.waitForFunction(() =>
    (document.querySelector('[data-veriga]')?.textContent ?? '').includes('Веригата'),
  );
  proveri(
    'веригата е цяла · с първото звено от откриването',
    await tekstNa(p, '[data-veriga]'),
    'Веригата е цяла · 1 от 1 звена.',
  );

  // ══ 0в · осемте прозореца ═════════════════════════════════════════════
  razdel = '0в · осемте прозореца';
  const prozortsi = await tekstoveNa(p, '[data-prozorets]');
  proveri('осем са', prozortsi.length, 8);
  proveri(
    'в реда на Книгата',
    prozortsi.join(' · '),
    'Профил · ИмотиОбектиБизнеси · УправлениеДелаПреписки · Сметки · Служители · Продажби · ИИ · Настройки(Стопанин)',
  );

  // ══ 0д · ВРАТАТА · Trusted Types действа ли НАИСТИНА ═════════════════
  //
  // Директивата стои в `<meta>`, а спецификацията пренебрегва там само
  // `frame-ancestors`, `report-uri` и `sandbox`. „Би трябвало да работи" не е
  // проверка (ADR-056): тук се ОПИТВА гол `innerHTML` в живата страница и се
  // иска ОТКАЗ. Мине ли, вратата е надпис и това пада ТУК, не при нападение.
  razdel = '0д · вратата';
  // НАРОЧНИЯТ шум се обявява · браузърът пише за всеки блокиран опит, а тук
  // блокирането Е очакваният резултат (същият флаг, който §16 ползва за мрежата)
  tishina.ochakvana = true;
  proveri(
    'гол innerHTML е ОТКАЗАН от браузъра · политиката е в сила',
    await p.evaluate(() => {
      try {
        document.createElement('div').innerHTML = '<b>проба</b>';
        return 'мина';
      } catch {
        return 'отказано';
      }
    }),
    'отказано',
  );
  tishina.ochakvana = false;
  proveri(
    'и през запечатаната врата МИНАВА · инак екранът щеше да е празен',
    await p.$$eval('[data-prozortsi] a', (es) => es.length),
    8,
  );

  // ══ 0г · Книгата се чете в браузъра ══════════════════════════════════
  razdel = '0г · Книгата в браузъра';
  await p.setInputFiles('[data-kniga]', MOSTRA);
  await p.waitForFunction(() =>
    (document.querySelector('[data-kniga-vest]')?.textContent ?? '').includes('листа'),
  );
  proveri(
    'осем листа · осем познати · нула непознати · сверка нула',
    await tekstNa(p, '[data-kniga-vest]'),
    '8 листа · 8 познати · 0 служебни · 0 непознати · сверка: 8 = 8 + 0 + 0 · разлика 0',
  );
  const listove = await tekstoveNa(p, '[data-listove] tbody tr td:first-child');
  proveri(
    'листовете са по име и в ред',
    listove.join(' · '),
    'Профил · ИмотиОбектиБизнеси · УправлениеДелаПреписки · Сметки · Служители · Продажби · ИИ · Настройки(Стопанин)',
  );
  const slivaniya = await tekstoveNa(p, '[data-list="ИмотиОбектиБизнеси"] td:last-child');
  proveri('слетите клетки на Имотите са четири', slivaniya[0], '4');
  proveri(
    'Журналът не е пипнат от четенето · остава при своето едно събитие',
    await tekstNa(p, '[data-vest]'),
    `1 събития в Журнала · ${IMEYLAT_NA_PROHODA}`,
  );
}

/**
 * 0е · КОТВАТА · единственото, което пази от СКЪСЯВАНЕ ОТЗАД.
 *
 * Идва НАКРАЯ на прохода по две причини: иска записан Журнал, и иска НОВО
 * зареждане — котвата се чете веднъж, при тръгване.
 *
 * Тук не се обещава; тук се СЧУПВА нарочно. Последното звено се маха от живия
 * носител и се иска приложението да го КАЖЕ. И понеже същият блок пита и
 * „Провери веригата", той показва защо котвата изобщо съществува: веригата
 * отговаря „цяла" — по-къса верига Е безупречна верига.
 */
export async function blok2(ctx: KonteksNaProhoda): Promise<void> {
  const { stranitsa: p, broyach } = ctx;
  const razdel = '0е · котвата';
  const proveri = (kakvo: string, vidyano: unknown, ochakvano: unknown): boolean =>
    broyach.proveri(razdel, kakvo, vidyano, ochakvano);

  // ══ преди счупването · СВЕРКА, не преписано число ══════════════════════
  // seq-ът, който котвата помни, трябва да е броят събития на екрана. Числото
  // се ЧЕТЕ от вестта, за да не се разминава с прохода при всеки нов резен.
  await otvoriProfilNanovo(p);
  const vest = await tekstNa(p, '[data-vest]');
  const broySabitiya = Number(vest.split(' ')[0]);
  proveri('Журналът има събития', broySabitiya > 0, true);
  proveri(
    'котвата помни върха му',
    await tekstNa(p, '[data-kotva]'),
    `Котвата съвпада с Журнала на seq ${broySabitiya} · нищо не е махано отзад.`,
  );
  proveri('и това не е тревога', await p.$eval('[data-kotva]', (e) => e.className), 'vest');

  // ══ счупването · последното звено си отива от ЖИВИЯ носител ════════════
  await p.evaluate(
    () =>
      new Promise((gotovo, provali) => {
        const zayavka = indexedDB.open('coretovia');
        zayavka.onerror = () => provali(zayavka.error);
        zayavka.onsuccess = () => {
          const db = zayavka.result;
          const t = db.transaction('sabitiya', 'readwrite');
          const kursor = t.objectStore('sabitiya').openCursor(null, 'prev');
          kursor.onsuccess = () => kursor.result?.delete();
          t.oncomplete = () => {
            db.close();
            gotovo(undefined);
          };
          t.onerror = () => provali(t.error);
        };
      }),
  );

  // ══ след счупването · находката се КАЗВА, и то в червено ═══════════════
  await otvoriProfilNanovo(p);
  proveri(
    'едно събитие по-малко',
    await tekstNa(p, '[data-vest]'),
    `${broySabitiya - 1} събития в Журнала · ${vest.split(' · ')[1]}`,
  );
  const dumite = await tekstNa(p, '[data-kotva]');
  proveri(
    'котвата брои липсващото',
    dumite.startsWith(
      `Журналът стига до seq ${broySabitiya - 1}, а котвата помни seq ${broySabitiya}`,
    ),
    true,
  );
  proveri('и го назовава', dumite.endsWith('Липсват 1 събитие — Журналът е скъсяван отзад.'), true);
  proveri('това ВЕЧЕ е тревога', await p.$eval('[data-kotva]', (e) => e.className), 'greshka');

  // ══ и ЗАЩО котвата съществува ═════════════════════════════════════════
  // Веригата няма как да види махнатото отзад: остатъкът е безупречна верига,
  // само по-къса. Ако този ред някога почне да казва „къса се", котвата вече
  // не е единственият пазач — и това е добра новина, не провалена проверка.
  await p.click('[data-proveri]');
  await p.waitForFunction(() =>
    (document.querySelector('[data-veriga]')?.textContent ?? '').includes('Веригата'),
  );
  proveri(
    'веригата пак казва „цяла" · сляпото петно',
    await tekstNa(p, '[data-veriga]'),
    `Веригата е цяла · ${broySabitiya - 1} от ${broySabitiya - 1} звена.`,
  );
}
