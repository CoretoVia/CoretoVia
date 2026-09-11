/**
 * СТРУКТУРАТА КАТО СЪБИТИЕ · десетият тип · ход 2.
 *
 * ═══ НЕГОВАТА ДУМА ═══
 *
 * „**Веднага десетият тип събитие.**" (09.09.2026 · `docs/28` §2)
 *
 * И какво трябва да покрива, дословно от същия раздел: „Всяка промяна на
 * СТРУКТУРАТА е **събитие в Журнала**: нова колона · преименувана глава ·
 * затворена колона · нова таблица · сменен ред на колоните."
 *
 * Плюс онова, което го прави нужно СЕГА (10.09.2026): „**Състоянията могат да
 * са повече от едно едновременно и се натрупват.**" Имотът днес носи ЕДНА
 * колона „Състояние"; за да носи повече, някой трябва да може да ДОБАВИ колона.
 * Това е точно първото от петте действия.
 *
 * ═══ ЗАЩО ТОЗИ ФАЙЛ Е ЧИСТ ═══
 *
 * Тук няма Журнал, няма Врата и няма екран — само Модел вътре, Модел навън.
 * Тъй че всяка от петте промени се проверява без нито едно събитие, а онова,
 * което Вратата ще запише, е ВЕЧЕ проверено по същата функция (един дом ·
 * правило 14).
 *
 * ═══ КАКВО ПАЗИ ═══
 *
 * · **К1** · нова таблица влиза САМО в един от осемте прозореца. Нов прозорец
 *   няма команда и няма път — а таблица към несъществуващ прозорец би била
 *   точно това, само отзад.
 * · **правило 18** · затворената колона се СКРИВА, не изчезва: старите ѝ
 *   стойности остават и пак се смятат. Затова затварянето е БЕЛЕГ, не триене.
 * · **правило 12** · всяка невъзможна промяна се КАЗВА с думи, не хвърля.
 * · **правило 10** · ключът е на латиница, името — както е в Книгата.
 */

import { type Kolona, pomoshtNaKolonaPoVida, type VidKolona } from './kolona.js';
import type { KlyuchNaProzorets } from './klyuchove.js';
import { VIDOVE_STOYNOST } from './vid-stoynost.js';
import type { Model } from './model.js';
import { pomoshtNaNovaTablitsa, type Tablitsa } from './tablitsa.js';

/** Петте промени · дословно по `docs/28` §2.1. */
export type PromyanaNaStrukturata =
  | {
      readonly deystvie: 'kolonaDobavena';
      readonly tablitsa: string;
      readonly kolona: string;
      readonly ime: string;
      readonly vid: VidKolona;
      /**
       * само при `izbor` · ключът на номенклатурата.
       *
       * ПРАЗНИЯТ низ значи „няма" и е равен на липсващо: схемата на
       * командата иска всяко поле, тъй че тук идва празно, не `undefined`.
       */
      readonly nomenklatura?: string;
    }
  | {
      readonly deystvie: 'glavaPreimenuvana';
      readonly tablitsa: string;
      readonly kolona: string;
      readonly ime: string;
    }
  | { readonly deystvie: 'kolonaZatvorena'; readonly tablitsa: string; readonly kolona: string }
  | {
      readonly deystvie: 'tablitsaDobavena';
      readonly tablitsa: string;
      readonly ime: string;
      readonly prozorets: string;
      readonly sashtnost: string;
    }
  | {
      readonly deystvie: 'redNaKolonite';
      readonly tablitsa: string;
      readonly redut: readonly string[];
    };

export const DEYSTVIYA = Object.freeze([
  'kolonaDobavena',
  'glavaPreimenuvana',
  'kolonaZatvorena',
  'tablitsaDobavena',
  'redNaKolonite',
] as const);

/**
 * ВИДОВЕТЕ, които човек може да си добави сам.
 *
 * `nomeratsiya` и `vrazka` НЕ са тук, и това е решение: номерацията се строи от
 * описание, което сочи родител и номенклатури, а връзката иска списък от
 * таблици и правила за детето. И двете са структура на СКЕЛЕТА, не поле — те
 * влизат само от Настройки на кода, не от екрана.
 *
 * Обявено (правило 26): ако утре потрябва връзка от екрана, тя се добавя ТУК,
 * със своята проверка, вместо да се промъкне като частен случай другаде.
 */
export const VIDOVE_ZA_CHOVEK: readonly VidKolona[] = Object.freeze([
  ...VIDOVE_STOYNOST,
  'izbor',
] as VidKolona[]);

/** Ключът е на латиница · нито една смесена дума (правило 10). */
const KLYUCH = /^[a-z][a-zA-Z0-9]*$/;

/**
 * МОЖЕ ЛИ · връща ДУМИ, не хвърля.
 *
 * Празно значи „минава". Същата форма като проверките на товара
 * (`sabitiya/registar.ts`), защото отказът стига до човека по същия път.
 */
export function zashtoNeMozhe(m: Model, p: PromyanaNaStrukturata): readonly string[] {
  const n: string[] = [];
  const t = m.tablitsi.get(p.tablitsa);

  if (p.deystvie === 'tablitsaDobavena') {
    if (t !== undefined) n.push(`Таблица „${p.tablitsa}" вече съществува.`);
    if (!KLYUCH.test(p.tablitsa)) n.push(`Ключът „${p.tablitsa}" не е на латиница.`);
    if (p.ime.trim() === '') n.push('Таблицата иска име — то е лентата ѝ в Книгата.');
    // К1 · осемте прозореца са осем · нов няма команда и няма път
    if (!m.prozortsi.some((x) => x.klyuch === p.prozorets)) {
      n.push(`Прозорец „${p.prozorets}" не съществува. Прозорците са осем и не се добавят (К1).`);
    }
    if (p.sashtnost.trim() === '') n.push('Таблицата иска вид на същността за Журнала.');
    return n;
  }

  if (t === undefined) return [`Няма таблица „${p.tablitsa}" в Модела.`];

  if (p.deystvie === 'redNaKolonite') {
    const sega = t.koloni.map((k) => k.klyuch).sort();
    const iskan = [...p.redut].sort();
    if (sega.length !== iskan.length || sega.some((k, i) => k !== iskan[i])) {
      n.push(
        'Пренареждането трябва да носи ТОЧНО същите колони — нито една в повече или по-малко.',
      );
    }
    return n;
  }

  const k = t.koloni.find((x) => x.klyuch === p.kolona);

  if (p.deystvie === 'kolonaDobavena') {
    if (k !== undefined) n.push(`Таблица „${t.ime}" вече има колона „${p.kolona}".`);
    if (!KLYUCH.test(p.kolona)) n.push(`Ключът „${p.kolona}" не е на латиница.`);
    if (p.ime.trim() === '') n.push('Колоната иска глава — тя е името ѝ в Книгата.');
    if (!VIDOVE_ZA_CHOVEK.includes(p.vid)) {
      n.push(`Вид „${p.vid}" не се добавя от екрана · виж VIDOVE_ZA_CHOVEK.`);
    }
    const nom = (p.nomenklatura ?? '').trim();
    if (p.vid === 'izbor') {
      if (nom === '') n.push('Колона от вид „избор" иска номенклатура.');
      else if (!m.nomenklaturi.has(nom)) n.push(`Няма номенклатура „${nom}" в Модела.`);
    } else if (nom !== '') {
      n.push('Номенклатура носи само колона от вид „избор".');
    }
    return n;
  }

  if (k === undefined) return [`Таблица „${t.ime}" няма колона „${p.kolona}".`];

  if (p.deystvie === 'glavaPreimenuvana') {
    if (p.ime.trim() === '') n.push('Главата не може да е празна.');
    if (p.ime === k.ime) n.push('Новата глава е същата като старата.');
    return n;
  }

  // kolonaZatvorena
  if (k.zatvorena) n.push(`Колона „${k.ime}" вече е затворена.`);
  /*
   * КОЛОНА, КОЯТО НОСИ ИМЕТО НА РЕДА, НЕ СЕ ЗАТВАРЯ.
   *
   * Затворената се СКРИВА и пак се смята (правило 18) — но номерацията и
   * родителството не са смятане, а АДРЕС. Затвори ли се колона, участваща в
   * тях, редът губи как да бъде посочен, и то мълчаливо: номерът му става друг
   * или празен, а всяко минало позоваване увисва.
   */
  if (t.roditel?.kolona === p.kolona) {
    n.push(`Колона „${k.ime}" държи родителя на реда — затворена, редът губи мястото си.`);
  }
  const segmenti = t.nomeratsiya?.segmenti ?? [];
  if (segmenti.some((s) => s.ot === 'kolona' && s.kolona === p.kolona)) {
    n.push(`Колона „${k.ime}" участва в номерацията — затворена, редът губи номера си.`);
  }
  if (segmenti.some((s) => s.ot === 'nomenklatura' && s.kolona === p.kolona)) {
    n.push(`Колона „${k.ime}" участва в номерацията — затворена, редът губи номера си.`);
  }
  return n;
}

/**
 * ПРИЛАГАНЕ · нов Модел, старият не се пипа.
 *
 * Хвърля САМО когато промяната не е минала `zashtoNeMozhe` — тоест при грешка в
 * кода, не в данните. Пътят на човека минава първо през думите.
 */
export function prilozhi(m: Model, p: PromyanaNaStrukturata): Model {
  const zashto = zashtoNeMozhe(m, p);
  if (zashto.length > 0) {
    throw new Error(`Промяната на структурата не минава: ${zashto.join(' · ')}`);
  }

  const tablitsi = new Map(m.tablitsi);

  if (p.deystvie === 'tablitsaDobavena') {
    const nova: Tablitsa = Object.freeze({
      klyuch: p.tablitsa,
      ime: p.ime,
      // никой автор не е писал текст за нея · помощта идва от това, което е сигурно
      pomosht: pomoshtNaNovaTablitsa(p.ime),
      prozorets: p.prozorets as KlyuchNaProzorets,
      sashtnost: p.sashtnost as Tablitsa['sashtnost'],
      koloni: Object.freeze([] as Kolona[]),
      /*
       * НАША, не негова · таблица, направена от екрана, я НЯМА в неговата
       * Книга. Белегът го казва, за да не я брои Сверчикът за липсваща там
       * (правило 12: изключеното се КАЗВА).
       */
      nashaTablitsa: true,
    });
    tablitsi.set(p.tablitsa, nova);
    return { ...m, tablitsi };
  }

  const t = m.tablitsi.get(p.tablitsa)!;
  let koloni: readonly Kolona[];

  switch (p.deystvie) {
    case 'kolonaDobavena':
      koloni = [
        ...t.koloni,
        Object.freeze({
          klyuch: p.kolona,
          ime: p.ime,
          vid: p.vid,
          // текст по вида · човекът, който добавя колона, не пише обяснение за нея
          pomosht: pomoshtNaKolonaPoVida(p.vid, p.ime),
          zatvorena: false,
          ...(p.nomenklatura ? { nomenklatura: p.nomenklatura } : {}),
        } as Kolona),
      ];
      break;
    case 'glavaPreimenuvana':
      koloni = t.koloni.map((k) =>
        k.klyuch === p.kolona ? Object.freeze({ ...k, ime: p.ime }) : k,
      );
      break;
    case 'kolonaZatvorena':
      koloni = t.koloni.map((k) =>
        k.klyuch === p.kolona ? Object.freeze({ ...k, zatvorena: true }) : k,
      );
      break;
    case 'redNaKolonite':
      koloni = p.redut.map((klyuch) => t.koloni.find((k) => k.klyuch === klyuch)!);
      break;
  }

  tablitsi.set(p.tablitsa, Object.freeze({ ...t, koloni: Object.freeze(koloni) }));
  return { ...m, tablitsi };
}
