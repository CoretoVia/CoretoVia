/**
 * СМЕТКИ · прозорецът на листа „Сметки" (ADR-006).
 *
 * Негово (B9): „Видима част която седи залепена горе и под нея започват
 * таблиците." И от 05.09 т.2: „В смевтки освен реда с полетата и информация от
 * самия таб и ред на бутоните има и ред на реда на бутоните като 2ред от трите,
 * ойто ред дава възможност за въвеждане на информация за дадени Кеш пари за
 * Заплати и Фактури Кеш и сверка на края на месеца от извлечението." Затова
 * залепената част тук е ТРИ реда: полета с цифри · редът за КЕШ · бутоните.
 *
 * Под нея — неговите две ленти: ПРИХОД и Разходи, всяка със секциите си и с ред
 * ОБЩ; после секцията „Вкарване" (негово т.3: Заплати Кеш · Фактури Кеш ·
 * Фактури Карта на едно място, за Помощник Управителя — правото му идва с
 * резен 4 и се КАЗВА); и диаграмата Гант по месеца на движенията.
 *
 * ЗНАКЪТ решава страната (правило 16): екранът пише знака сам, когато секцията е
 * разходна, за да не го смята човек наум; Портата пак го проверява.
 */

import { DUMI_OT_KNIGATA } from '../../src/model/dumi-ot-knigata.js';
import type { Kletka } from '../../src/model/kletka.js';
import { tablitsata } from '../../src/model/model.js';
import {
  BUTONI_NA_UPRAVLENIE,
  type ButonNaProzoretsa,
  MODEL,
  PROZORTSI,
} from '../../src/model/osnova.js';
import { slotNaKolonata } from '../../src/model/kolona.js';
import { kolonaNa } from '../../src/model/tablitsa.js';
import { redKato } from '../../src/ogledalo/tablitsa.js';
import { denNaMeseca, dvanaysetMeseca, kalendar } from '../../src/smetach/kalendar.js';
import { type Pokazatel, pokazatelite } from '../../src/smetach/pokazateli.js';
import { zadachiteSByudzhet } from '../../src/smetach/zadachi-v-smetki.js';
import { imeNaVrazkata } from '../../src/smetach/kletki.js';
import {
  IMENA_NA_STRANITE,
  IZVEDENITE_NA_SMETKITE,
  keshatNaMeseca,
  type Sektsiya,
  smetkite,
  type Strana,
  vkarvaneto,
} from '../../src/smetach/smetki.js';
import { ddsat, IZVEDENITE_NA_DDSA, type MesetsNaDdsa } from '../../src/smetach/dds.js';
import { pomosht } from '../../src/model/pomosht.js';
// ПРЯКО от ядрото, не през барела: изречението е текст без Врата, а барелът я преизнася
import { ZASHTO_I_NULATA } from '../../src/yadro/sverka.js';
import { nahodkiteNaNap, NIVA } from '../../src/smetach/nahodki-nap.js';
import { mozheDaRedaktira } from '../../src/smetach/pravo.js';
import {
  type KolonaNaTakta,
  koloniNaTakta,
  type SvoyPeriod,
  type Takt,
} from '../../src/smetach/vreme.js';
import { pishi, pishiVPole, sabiri, type Tsentove, tsentove } from '../../src/yadro/pari.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { otvoriChernova } from '../reshetka/chernova.js';
import { kalendarHTML } from '../reshetka/kalendar-tablitsa.js';
import { podskazka, podskazkaSDumi } from '../reshetka/podskazka.js';
import { h, sloji, type Zapechatan } from '../reshetka/shablon.js';
import { chetiEkranno, zapomniEkranno } from '../reshetka/pamet-ekran.js';
import {
  obshtotoNaButona,
  lentaNaDeystviyata,
  zakachiTakta,
  zakachiTemite,
} from '../reshetka/lenta-deystviya.js';
import { podtaboveHTML, tekushtPodtab, zakachiPodtabove } from '../reshetka/podtabove.js';
import { pokazhiGreshka } from '../reshetka/redaktsiya.js';
import { kletkaHTML, zakachiReshetkata } from '../reshetka/reshetka.js';
import {
  gantIDumiHTML,
  izpalniOtMenyuto,
  zakachiDyasnoMenyu,
  zapaziKnigata,
  zapishiOtForma,
} from './deystviya.js';

const TABLITSA = 'dvizheniya';
const PAMET = Object.freeze({
  mesets: 'smetki.mesets',
  samoMeseca: 'smetki.samoMeseca',
  podtab: 'smetki.podtab',
  /** кои страни са скрити · ПОГЛЕД, не данни: нула събития, нула Журнал */
  skriti: 'smetki.skriti',
  /** един бутон крие задачите · негово, запис 193 */
  skriyZadachi: 'smetki.skriyZadachi',
  /** тактът и периодът · негово, запис 195 т.4 — тактът да го има и тук */
  takt: 'smetki.takt',
  period: 'smetki.period',
});
/** Кой бутон коя страна крие · неговите две клетки от лист Сметки (ред 12–13). */
const STRANATA_NA_BUTONA: Readonly<Record<string, Strana | undefined>> = Object.freeze({
  'skriy-prihodi': 'prihod',
  'skriy-razhodi': 'razhod',
});

/** прозорецът · името му живее САМО в `osnova.ts` (К1 · `tests/osemte.test.ts` обхожда и `app/`) */
const PROZORETSAT = PROZORTSI.find((x) => x.klyuch === 'smetki')!;
/** неговият „таб НАП" е ПОДТАБ на Сметки (05.09 т.2) · осемте прозореца остават осем */
const PODTABOVE = [
  { klyuch: 'smetki', ime: PROZORETSAT.list },
  { klyuch: 'nap', ime: 'НАП' },
] as const;
/** колоните на ДДС на екрана · месецът и неговите числа */
const KOLONI_NA_DDSA = [
  'mesets',
  'nachislen',
  'kredit',
  'deklarirano',
  'plateno',
  'izdadeni',
  'plateni',
] as const;
/** колоните на движението на екрана · неговите глави са дълги, тук стоят кратките */
const KOLONI = ['kam', 'ime', 'funktsiya', 'sastoyanie', 'mesets', 'suma'] as const;

/** помощта на изведените по ключ · домът им е `src/smetach` · тук само се търси */
const POMOSHT_NA_IZVEDENITE = new Map(IZVEDENITE_NA_SMETKITE.map((x) => [x.klyuch, x.pomosht]));
const POMOSHT_NA_DDSA = new Map(IZVEDENITE_NA_DDSA.map((x) => [x.klyuch, x.pomosht]));
/** белегът на изведена колона · липсва ли ключът, няма подсказка, не се измисля */
function izvedena(klyuch: string, karta = POMOSHT_NA_IZVEDENITE): Zapechatan {
  const p = karta.get(klyuch);
  return p === undefined ? podskazkaSDumi('') : podskazka(p);
}
/**
 * СВЕРКАТА под таблиците · защо се записва и нулата (правило 7).
 *
 * Изречението е на ядрото (`ZASHTO_I_NULATA`) и стои тук като „защо", а
 * формулата — като „кратко": Начало казва двете, Нормален само формулата.
 */
const POMOSHT_NA_SVERKATA = pomosht(
  ZASHTO_I_NULATA,
  'вход ↔ изход · разликата е нула, когато сверката затваря, и се записва и тогава',
);

function mesetsatSega(): string {
  return new Date().toISOString().slice(0, 7);
}

/** лицето на бутона · до първата скоба · неговата дума */
function litse(b: ButonNaProzoretsa): string {
  return b.ime.split('(')[0]!.trim();
}

interface RedNaEkrana {
  readonly id: string;
  readonly i: number;
  readonly mesets: string;
  readonly suma: number;
  readonly ime: string;
}

/**
 * ДАННИТЕ ЗА КОЕФИЦИЕНТИТЕ · под таблицата и диаграмата.
 *
 * Негово, 11.09 (запис 194): „Събери основните данни необходими за
 * изчисляване на коефициентите от отчети. Искам под таблицата и диаграмата да
 * дадеш всички данни които може да се съберат от Приходи и Разходи."
 *
 * Всяко число стои с ФОРМУЛАТА си (правило 28): екранът казва откъде идва, а
 * не само колко е. Оттук нататък Отчетите стъпват върху видяно, не върху
 * обещано.
 */
function blokatNaPokazatelite(spisak: readonly Pokazatel[]): Zapechatan {
  return h`<section class="sektsiya" data-sektsiya="pokazateli">
      <h2 class="lenta">Данни за коефициентите</h2>
      <p class="pod-tablitsata">Събрано от Приход и Разход за показания период · всяко число носи формулата си при задържане.</p>
      <div class="poleta-s-tsifri" data-pokazateli>${spisak.map(
        (x) =>
          h`<div class="pole-s-tsifra" data-pokazatel="${x.klyuch}"${podskazka(
            pomosht(
              `Данните за коефициентите идват от Приход и Разход, не се въвеждат на ръка · „${x.ime}" се смята при всяко рисуване.`,
              x.formula,
            ),
          )}><span class="tsifra" translate="no">${x.stoynost}</span><span class="ime">${x.ime}</span><span class="formula">${x.formula}</span></div>`,
      )}</div>
    </section>`;
}

/**
 * КОЛОНИТЕ НА КАЛЕНДАРА В СМЕТКИ · по такта, не заковани.
 *
 * Негово, 11.09 (запис 195), точка 4: тактът да го има и в Сметки. Дотук тук
 * стояха дванайсет месеца, закована в кода — не можеше да се свие до един
 * месец, нито да се разпъне.
 *
 * Котвата остава ПОКАЗАНИЯТ МЕСЕЦ, не днешният ден: по него се сверяват кешът
 * и ДДС, и ако календарът тръгне от друго място, горната лента и долният ред
 * биха говорили за различни периоди.
 */
function koloniteNaSmetkite(
  takt: Takt,
  mesets: string,
  period: SvoyPeriod | null,
): readonly KolonaNaTakta[] {
  if (takt === 'svoy' && period !== null) return koloniNaTakta('svoy', `${mesets}-01`, period);
  if (takt === 'godina' || takt === 'svoy')
    return koloniNaTakta('svoy', `${mesets}-01`, dvanaysetMeseca(mesets));
  return koloniNaTakta(takt, `${mesets}-01`);
}
export function narisuvaySmetki(k: KonteksNaEkrana): void {
  const o = k.porta.ogledalo();
  const p = PROZORTSI.find((x) => x.klyuch === 'smetki')!;
  const t = tablitsata(MODEL, TABLITSA);
  const tv = o.tablitsi.get(TABLITSA);
  const kogato = new Date().toISOString();
  const mesets = chetiEkranno<string>(PAMET.mesets, mesetsatSega());
  const samoMeseca = chetiEkranno<boolean>(PAMET.samoMeseca, false);
  const s = smetkite(o, kogato, samoMeseca ? (m) => m === mesets : undefined);
  const kesh = keshatNaMeseca(o, mesets, kogato);
  const v = vkarvaneto(o, kogato, samoMeseca ? (m) => m === mesets : undefined);
  const podtab = tekushtPodtab(PAMET.podtab, PODTABOVE);
  /**
   * СКРИТИТЕ СТРАНИ · поглед, не данни (правило 23: скритото ПАК се смята).
   * Скриването пипа екрана и нищо друго — нито сбор, нито Журнал, нито износ.
   */
  const skritite = chetiEkranno<readonly Strana[]>(PAMET.skriti, []);
  /** един бутон крие задачите с бюджет · негово, запис 193 */
  const skritiZadachi = chetiEkranno<boolean>(PAMET.skriyZadachi, false);
  const takt = chetiEkranno<Takt>(PAMET.takt, 'godina');
  const period = chetiEkranno<SvoyPeriod | null>(PAMET.period, null);
  /** колко месеца стоят на екрана · средното на месец се дели точно на тях */
  const koloniNaMesetsite = koloniteNaSmetkite(takt, mesets, period).length;
  // ДДС · редът на всеки месец влиза в СМЕТКИ по знака си (негово, 05.09 т.2)
  const dds = ddsat(o, kogato);
  const ddsMesetsi = dds.mesetsi.filter((m) => !samoMeseca || m.mesets === mesets);
  const ddsNa = (strana: Strana): readonly MesetsNaDdsa[] =>
    ddsMesetsi.filter((m) => m.strana === strana);
  // правило 3 · сборовете ПРЕД ЧОВЕКА минават през преградата за цели центове (ДЛ-Н4 · ход 9)
  const ddsSbor = (strana: Strana): Tsentove =>
    sabiri(...ddsNa(strana).map((m) => tsentove(m.suma)));
  const sborPrihod = sabiri(tsentove(s.sborPrihod), ddsSbor('prihod'));
  const sborRazhod = sabiri(tsentove(s.sborRazhod), ddsSbor('razhod'));
  const nap = nahodkiteNaNap(o, `${mesets}-01`, kogato);
  const nesvereni = [...s.prihod, ...s.razhod]
    .flatMap((x) => x.redove)
    .filter((r) => {
      const kl = tv === undefined ? null : redKato(tv, r.i).kletki['sastoyanie'];
      return kl === undefined || kl === null;
    }).length;

  // помощта на парите идва от изведените в `src/smetach` (един дом); броячите я казват тук
  const poleta: readonly { klyuch: string; ime: string; dumi: string; kak: Zapechatan }[] = [
    { klyuch: 'prihod', ime: 'Приход', dumi: pishi(sborPrihod), kak: izvedena('prihod') },
    { klyuch: 'razhod', ime: 'Разходи', dumi: pishi(sborRazhod), kak: izvedena('razhod') },
    {
      klyuch: 'rezultat',
      ime: 'Резултат',
      dumi: pishi(sabiri(sborPrihod, sborRazhod)),
      kak: izvedena('rezultat'),
    },
    {
      klyuch: 'kesh-dadeno',
      ime: 'Кеш дадено',
      dumi: pishi(kesh.dadeno),
      kak: izvedena('kesh-dadeno'),
    },
    {
      klyuch: 'kesh-izvlechenie',
      ime: 'Кеш изтеглено',
      dumi: pishi(kesh.izvlechenie),
      kak: izvedena('kesh-izvlechenie'),
    },
    {
      klyuch: 'kesh-vkarano',
      ime: 'Кеш вкарано',
      dumi: pishi(Math.abs(kesh.vkarano)),
      kak: izvedena('kesh-vkarano'),
    },
    {
      klyuch: 'dvizheniya',
      ime: 'движения',
      dumi: String(s.broyDvizheniya),
      kak: podskazkaSDumi(
        'брой живи редове с пари за периода на екрана · редовете на ДДС не са движения',
      ),
    },
    {
      klyuch: 'nesvereni',
      ime: 'несверени',
      dumi: String(nesvereni),
      kak: podskazkaSDumi('брой движения без Състояние · сверено е движение с попълнено Състояние'),
    },
    {
      klyuch: 'dds-ostatak',
      ime: 'ДДС остатък',
      dumi: pishi(dds.ostatak),
      kak: izvedena('ostatak', POMOSHT_NA_DDSA),
    },
    {
      klyuch: 'nap-nahodki',
      ime: 'находки НАП',
      dumi: String(nap.nahodki.length),
      kak: podskazkaSDumi('брой находки от сверките на трите нива за месеца на екрана'),
    },
  ];

  // ПРАВОТО стеснява „Вкарване": неговото D19 дава на Помощник Управителя точно
  // трите секции; който няма правото, ГЛЕДА (правило 23 · ADR-008)
  //
  // Т29 · ПРАЗНИЯТ СПИСЪК ОТКАЗВА, НЕ РАЗРЕШАВА. Дотук тук стоеше само
  // `v.sektsii.every(...)`, а `[].every(...)` е `true`. Преименува ли се
  // някоя от трите секции от Настройки, тя изпадаше мълчаливо; изпаднеха ли и
  // трите, гардът се ОТВАРЯШЕ за всички. Сега липсата затваря и се КАЗВА.
  const mozhePriVkarvane =
    v.lipsvashti.length === 0 &&
    v.sektsii.length > 0 &&
    v.sektsii.every((sek) => mozheDaRedaktira(o, k.aktor(), sek.tekst));

  /** Един ред с пари · клетките са редактируеми на място, както в дървото. */
  const redHTML = (r: RedNaEkrana, samoGledane = false): Zapechatan => {
    const red = redKato(tv!, r.i);
    const tds = KOLONI.map((klyuch) => {
      const kol = kolonaNa(t, klyuch);
      if (kol === undefined) return h`<td class="kletka prazna"></td>`;
      if (klyuch === 'kam') {
        const kl = red.kletki['kam'] ?? null;
        const dumi = kl !== null && 'tekst' in kl ? imeNaVrazkata(o, kol, kl.tekst) : '';
        // Т33 · и тази клетка се затваря, когато редът е само за гледане.
        // Тя се пише на ръка (връзката иска свое меню), но правото важи и за
        // ръчно написаното: клетка без белег за редакция и без табулация не се
        // отваря от никого. Дотук „кам" беше единствената, която го заобикаляше.
        if (samoGledane) {
          return h`<td class="kletka vrazka" data-kolona="kam" translate="no">${dumi}</td>`;
        }
        return h`<td class="kletka vrazka" data-kolona="kam" data-redakt="${TABLITSA}·${r.id}·kam" tabindex="0" translate="no">${dumi}</td>`;
      }
      return kletkaHTML(o, TABLITSA, kol, red, samoGledane);
    });
    return h`<tr class="red" data-id="${r.id}" data-tablitsa="${TABLITSA}" data-seq="${red.seq}">${tds}</tr>`;
  };

  const sektsiyaHTML = (sek: Sektsiya, samoGledane = false): Zapechatan =>
    h`<tr class="grupata sektsiya" data-sektsiya="${sek.strana}·${sek.nomer}">
        <td colspan="${KOLONI.length - 1}" translate="no">${sek.tekst}</td>
        <td class="evro" data-sbor-sektsiya="${sek.strana}·${sek.nomer}"${izvedena('sektsiya')} translate="no">${pishi(sek.sbor)}</td>
      </tr>${sek.redove.map((r) =>
        redHTML(
          {
            id: r.id,
            i: r.i,
            mesets: r.mesets,
            suma: r.suma_st,
            ime: sek.tekst,
          },
          samoGledane,
        ),
      )}`;

  const vsichkiKoloni = t.koloni.filter((kol) => slotNaKolonata(kol) !== undefined);
  const glaviHTML = KOLONI.map((klyuch) => {
    const kol = kolonaNa(t, klyuch);
    if (kol === undefined) return h`<th data-kolona="${klyuch}"></th>`;
    return h`<th data-kolona="${klyuch}" class="${kol.vid}"${podskazka(kol.pomosht)}>${kol.kratko ?? kol.ime}</th>`;
  });

  /** Редът на ДДС в лентата · СМЯТА се от таблицата, не е движение (една истина). */
  const ddsHTML = (strana: Strana): Zapechatan => {
    const redove = ddsNa(strana);
    if (redove.length === 0) return h``;
    return h`<tr class="grupata sektsiya dds" data-sektsiya="${strana}·ддс">
        <td colspan="${KOLONI.length - 1}" translate="no">ДДС</td>
        <td class="evro" data-sbor-dds="${strana}" translate="no">${pishi(ddsSbor(strana))}</td>
      </tr>${redove.map(
        (m) =>
          h`<tr class="red dds" data-dds="${m.mesets}"><td class="kletka" colspan="${KOLONI.length - 2}" translate="no">ДДС ${m.mesets} · ${m.strana === 'razhod' ? 'за внасяне' : 'за възстановяване'}</td><td class="kletka tekst" translate="no">${m.mesets}</td><td class="kletka evro" translate="no">${pishi(m.suma)}</td></tr>`,
      )}`;
  };

  const stranaHTML = (strana: Strana, sektsii: readonly Sektsiya[], sbor: number): Zapechatan => h`
    <section class="tablitsa-blok" data-blok="${strana}">
      <h2 class="lenta" translate="no">${IMENA_NA_STRANITE[strana]}</h2>
      <table class="reshetka smetki" data-reshetka="${strana}">
        <thead><tr>${glaviHTML}</tr></thead>
        <tbody class="tablitsa">${sektsii.map((sek) => sektsiyaHTML(sek))}${ddsHTML(strana)}</tbody>
        <tfoot><tr class="sbor"><td colspan="${KOLONI.length - 1}"${izvedena(strana)}>ОБЩ ${IMENA_NA_STRANITE[strana]}</td><td class="evro" data-sbor="${strana}" translate="no">${pishi(sbor)}</td></tr></tfoot>
      </table>
    </section>`;

  const butonHTML = (b: ButonNaProzoretsa): Zapechatan => {
    const obshto = obshtotoNaButona(b, takt, period);
    if (obshto !== null) return obshto;
    // СКРИЙ ↔ ПОКАЖИ · бутонът казва какво ще СТАНЕ, не какво е било. Неговата
    // дума остава в `ime`; на лицето стои действието, при задържане — помощта.
    const strana = STRANATA_NA_BUTONA[b.klyuch];
    const duma =
      b.klyuch === 'skriy-dela'
        ? skritiZadachi
          ? 'Покажи Задачи'
          : 'Скрий Задачи'
        : strana !== undefined && skritite.includes(strana)
          ? `Покажи ${IMENA_NA_STRANITE[strana]}`
          : litse(b);
    return h`<button type="button" class="malak" data-buton-ekran="${b.klyuch}"${podskazka(b.pomosht)}>${duma}</button>`;
  };

  /** Подтабът НАП · ДДС по месеци и таблицата с находки (негово, 05.09 т.2). */
  const napHTML = (): Zapechatan => {
    const tDds = tablitsata(MODEL, 'dds');
    const tvDds = o.tablitsi.get('dds');
    // полетата НОСЯТ числата на месеца · иначе вторият запис би изтрил останалите
    // (командата пише целия ред: празно поле значи празна клетка)
    const zaMeseca = dds.mesetsi.find((m) => m.mesets === mesets);
    const vPoleto = (chislo: number | undefined): string =>
      chislo === undefined || chislo === 0 ? '' : pishiVPole(chislo);
    const glavi = KOLONI_NA_DDSA.map((klyuch) => {
      const kol = kolonaNa(tDds, klyuch);
      if (kol === undefined) return h`<th data-kolona="${klyuch}"></th>`;
      return h`<th data-kolona="${klyuch}" class="${kol.vid}"${podskazka(kol.pomosht)}>${kol.ime}</th>`;
    });
    const redove = dds.mesetsi.map((m) => {
      const red = redKato(tvDds!, m.i);
      const tds = KOLONI_NA_DDSA.map((klyuch) => {
        const kol = kolonaNa(tDds, klyuch);
        return kol === undefined ? h`<td></td>` : kletkaHTML(o, 'dds', kol, red);
      });
      return h`<tr class="red" data-id="${m.id}" data-tablitsa="dds" data-seq="${red.seq}">${tds}<td class="kletka evro" data-dalzhimo="${m.mesets}" translate="no">${pishi(m.dalzhimo)}</td><td class="kletka evro" data-ostatak="${m.mesets}" translate="no">${pishi(m.ostatak)}</td></tr>`;
    });
    return h`<section class="tablitsa-blok" data-blok="nap">
      <h2 class="lenta" translate="no">ДДС по месеци</h2>
      <form class="red-kesh" data-dds-forma>
        <label class="malak">месец <input class="pole malak" name="dds-mesets" data-dds-mesets value="${mesets}" size="7"></label>
        <label class="malak">начислен <input class="pole malak" name="dds-nachislen" data-dds-nachislen value="${vPoleto(zaMeseca?.nachislen)}" inputmode="decimal"></label>
        <label class="malak">данъчен кредит <input class="pole malak" name="dds-kredit" data-dds-kredit value="${vPoleto(zaMeseca?.kredit)}" inputmode="decimal"></label>
        <label class="malak">декларирано <input class="pole malak" name="dds-deklarirano" data-dds-deklarirano value="${vPoleto(zaMeseca?.deklarirano)}" inputmode="decimal"></label>
        <label class="malak">платено <input class="pole malak" name="dds-plateno" data-dds-plateno value="${vPoleto(zaMeseca?.plateno)}" inputmode="decimal"></label>
        <button type="submit" class="malak" data-dds-zapishi>Запиши ДДС</button>
        <span class="vest" translate="no">дължимо = начислен − кредит · остатък = дължимо − платено</span>
      </form>
      <table class="reshetka smetki" data-reshetka="dds">
        <thead><tr>${glavi}${IZVEDENITE_NA_DDSA.map(
          (x) => h`<th class="evro"${podskazka(x.pomosht)}>${x.ime}</th>`,
        )}</tr></thead>
        <tbody class="tablitsa">${redove}</tbody>
        <tfoot><tr class="sbor"><td colspan="${KOLONI_NA_DDSA.length}">натрупване</td><td class="evro" data-dds-dalzhimo translate="no"${izvedena('dalzhimo', POMOSHT_NA_DDSA)}>${pishi(dds.dalzhimo)}</td><td class="evro" data-dds-ostatak translate="no"${izvedena('ostatak', POMOSHT_NA_DDSA)}>${pishi(dds.ostatak)}</td></tr></tfoot>
      </table>
      <h2 class="lenta" translate="no">Находки от сверките</h2>
      <p class="pod-tablitsata" data-nap-obobshtenie>${nap.nahodki.length} находки от ${nap.proverki} проверки на три нива: ${NIVA.join(' · ')}. Няма връзка с НАП (негово) — това е инструмент за счетоводителя. Износът за Микроинвест чака файл-мостра от него.</p>
      ${
        nap.nahodki.length === 0
          ? h`<p class="vest" data-nap-nyama>няма находки · всички сверки затварят</p>`
          : h`<table class="tablitsa" data-nap-nahodki>
        <thead><tr><th>ниво</th><th>проверка</th><th>адрес</th><th>какво</th></tr></thead>
        <tbody>${nap.nahodki.map(
          (n) =>
            h`<tr class="red" data-nahodka="${n.proverka}"><td>${n.nivo}</td><td translate="no">${n.proverka}</td><td translate="no">${n.adres}</td><td translate="no">${n.kakvo}</td></tr>`,
        )}</tbody>
      </table>`
      }
    </section>`;
  };

  sloji(
    k.tyalo,
    h`
    <div class="zalepeno" data-zalepeno="smetki">
      <div class="poleta-s-tsifri" data-poleta>
        ${poleta.map(
          (pl) =>
            h`<div class="pole-s-tsifra" data-pole="${pl.klyuch}"${pl.kak}><span class="tsifra" data-tsifra="${pl.klyuch}" translate="no">${pl.dumi}</span><span class="ime">${pl.ime}</span></div>`,
        )}
      </div>
      <form class="red-kesh" data-kesh-forma>
        <label class="malak">месец <input class="pole malak" name="kesh-mesets" data-kesh-mesets value="${mesets}" size="7"></label>
        <label class="malak">дадени за Заплати Кеш <input class="pole malak" name="kesh-zaplati" data-kesh-zaplati value="${kesh.zaplati === 0 ? '' : pishiVPole(kesh.zaplati)}" inputmode="decimal"></label>
        <label class="malak">дадени за Фактури Кеш <input class="pole malak" name="kesh-fakturi" data-kesh-fakturi value="${kesh.fakturi === 0 ? '' : pishiVPole(kesh.fakturi)}" inputmode="decimal"></label>
        <label class="malak">изтеглено по извлечение <input class="pole malak" name="kesh-izvlechenie" data-kesh-izvlechenie value="${kesh.izvlechenie === 0 ? '' : pishiVPole(kesh.izvlechenie)}" inputmode="decimal"></label>
        <button type="submit" class="malak" data-kesh-zapishi>Запиши кеша</button>
        <label class="otmetka malak"><input type="checkbox" name="samo-meseca" data-samo-meseca ${samoMeseca ? 'checked' : ''}> само този месец</label>
        <span class="vest" data-kesh-sverki${podskazka(POMOSHT_NA_SVERKATA)} translate="no">${kesh.sverki
          .map((sv) => `${sv.kakvo}: ${sv.nared ? 'затваря' : `разлика ${pishi(sv.razlika)}`}`)
          .join(' · ')}</span>
      </form>
      ${lentaNaDeystviyata(
        BUTONI_NA_UPRAVLENIE,
        butonHTML,
        h`<button type="button" class="malak" data-dobavi-dvizhenie${podskazkaSDumi('отваря чернова под главата · Enter записва реда през Портата · знакът решава страната')}>Добави ред с пари</button>`,
      )}
    </div>
    ${podtaboveHTML(PODTABOVE, podtab)}
    <p class="greshka" data-greshka></p>
    ${
      podtab === 'nap'
        ? napHTML()
        : h`<section class="tablitsa-blok" data-blok="nov">
      <h2 class="lenta" translate="no">Нов ред с пари</h2>
      <table class="reshetka smetki nov" data-reshetka="dvizheniya">
        <thead><tr>${vsichkiKoloni.map(
          (kol) =>
            h`<th data-kolona="${kol.klyuch}" class="${kol.vid}"${podskazka(kol.pomosht)}>${kol.kratko ?? kol.ime}</th>`,
        )}</tr></thead>
        <tbody class="tablitsa"><tr class="prazen-red"><td colspan="${String(vsichkiKoloni.length)}">Тук се отваря черновата. Натисни „Добави ред с пари" горе и редът се пише в тази таблица; записаният ред застава в секцията си долу.</td></tr></tbody>
      </table>
      <p class="pod-tablitsata">Знакът решава страната: приходът е +, разходът е − (правило 16).</p>
    </section>
    <section class="upravlenie-tyalo" data-smetki>
      <div class="smetki-blokove">
        ${skritite.includes('prihod') ? '' : stranaHTML('prihod', s.prihod, sborPrihod)}
        ${skritite.includes('razhod') ? '' : stranaHTML('razhod', s.razhod, sborRazhod)}
        <section class="tablitsa-blok" data-blok="vkarvane">
          <h2 class="lenta" translate="no">Вкарване</h2>
          <p class="pod-tablitsata">Заплати Кеш · Фактури Кеш · Фактури Карта на едно място (негово, 05.09).</p>
          <p class="pod-tablitsata" data-vkarvane-pravo>${
            v.lipsvashti.length > 0
              ? `Вкарването е затворено: липсва${v.lipsvashti.length === 1 ? '' : 'т'} секция${v.lipsvashti.length === 1 ? '' : 'и'} „${v.lipsvashti.join('" · „')}". Върни име${v.lipsvashti.length === 1 ? 'то' : 'ната'} от Настройки → Номенклатури.`
              : mozhePriVkarvane
                ? 'Имаш право да вкарваш тук.'
                : 'Ти само гледаш тук · правото за вкарване е на Помощник Управителя (лист Служители).'
          }</p>
          <table class="reshetka smetki" data-reshetka="vkarvane">
            <thead><tr>${glaviHTML}</tr></thead>
            <tbody class="tablitsa">${v.sektsii.map((sek) => sektsiyaHTML(sek, !mozhePriVkarvane))}</tbody>
            <tfoot><tr class="sbor"><td colspan="${KOLONI.length - 1}"${izvedena('vkarvane')}>ОБЩ Вкарване</td><td class="evro" data-sbor="vkarvane" translate="no">${pishi(v.sbor)}</td></tr></tfoot>
          </table>
        </section>
        <p class="pod-tablitsata" data-sverka="smetki"${podskazka(POMOSHT_NA_SVERKATA)}>движения ${s.broyDvizheniya} · без секция ${s.bezSektsiya.length} · сверката ${s.sverka.nared ? 'затваря' : `не затваря (${s.sverka.razlika})`}${samoMeseca ? ` · само ${mesets}` : ''}</p>
      </div>
      ${gantIDumiHTML(p.lenti[2] ?? '', DUMI_OT_KNIGATA.smetki)}
    ${blokatNaPokazatelite(pokazatelite(s, koloniNaMesetsite))}`
    }`,
  );

  zakachiReshetkata(k);
  zakachiTemite(k.tyalo);
  zakachiTakta(
    k.tyalo,
    { takt: PAMET.takt, period: PAMET.period },
    zapomniEkranno,
    k.prerisuvay,
    (dumi) => pokazhiGreshka(k.tyalo, dumi),
  );
  zakachiPodtabove(k.tyalo, PAMET.podtab, k.prerisuvay);
  if (podtab === 'smetki')
    narisuvayKalendara(k, [...s.prihod, ...s.razhod], mesets, skritiZadachi, takt, period);
  k.tyalo.querySelector<HTMLFormElement>('[data-dds-forma]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    void zapishiDdsa(k);
  });

  // ═══ редът за кеш · един запис на месец ═══
  const pole = (beleg: string): HTMLInputElement | null =>
    k.tyalo.querySelector<HTMLInputElement>(`[data-kesh-${beleg}]`);
  pole('mesets')?.addEventListener('change', (e) => {
    zapomniEkranno(PAMET.mesets, (e.target as HTMLInputElement).value.trim());
    k.prerisuvay();
  });
  k.tyalo.querySelector<HTMLInputElement>('[data-samo-meseca]')?.addEventListener('change', (e) => {
    zapomniEkranno(PAMET.samoMeseca, (e.target as HTMLInputElement).checked);
    k.prerisuvay();
  });
  k.tyalo.querySelector<HTMLFormElement>('[data-kesh-forma]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    void zapishiKesha(k);
  });

  // ═══ бутоните ═══
  for (const b of k.tyalo.querySelectorAll<HTMLButtonElement>('button[data-buton-ekran]')) {
    const opis = BUTONI_NA_UPRAVLENIE.find((x) => x.klyuch === b.dataset['butonEkran']);
    if (opis === undefined) continue;
    b.addEventListener('click', () => deystvieNaButona(k, opis));
  }
  k.tyalo
    .querySelector<HTMLButtonElement>('[data-dobavi-dvizhenie]')
    ?.addEventListener('click', () => {
      // черновата се пише в СВОЯТА таблица · с ВСИЧКИТЕ си колони (вкл. двете
      // секции); записаният ред застава в секцията си при следващото рисуване
      otvoriChernova(k.tyalo, k, TABLITSA, 'smetki.dobaviDvizhenie');
    });

  zakachiDyasnoMenyu(k, 'smetki', (b) => void izpalniOtMenyuto(k, b.klyuch, b.tovar));
}

/** Гантът на Сметки · всяко движение е една колона — месецът му. */
/**
 * КАЛЕНДАРЪТ на Сметки · ТАБЛИЦА с цифри, не картина.
 *
 * Негово, 11.09 (записи 145 · 147 · 149): цифрата със знака в клетката · общ
 * сбор под колоните · сбор на реда за периода. Редовете са СЕКЦИИТЕ, както в
 * Книгата му; числата им се събират по месец в колоната на такта.
 */
function narisuvayKalendara(
  k: KonteksNaEkrana,
  sektsii: readonly Sektsiya[],
  mesets: string,
  skritiZadachi: boolean,
  takt: Takt,
  period: SvoyPeriod | null,
): void {
  const skrol = k.tyalo.querySelector<HTMLElement>('[data-gant-skrol]');
  if (!skrol) return;
  const koloni = koloniteNaSmetkite(takt, mesets, period);
  /**
   * ЗАДАЧИТЕ С БЮДЖЕТ влизат в календара на Сметки · и само те.
   *
   * Негово, 11.09 (запис 163): „Скриването на Задачите с Бюджет(само те се
   * пренасят от Управление в Сметки, това е важно) от Управление в Сметки ще ги
   * изключва от изчисленията". Бюджетът е планиран РАЗХОД, затова влиза с минус
   * (правило 16 · знакът се смята, не се записва).
   */
  const zadachite = zadachiteSByudzhet(k.porta.ogledalo());
  const redoveNaKalendara = [
    ...sektsii.map((s) => ({
      id: `${s.strana}-${s.nomer}`,
      ime: s.spryana ? `${s.tekst} · спряна` : s.tekst,
      // датата решава деня; без нея — първият ден на месеца (запис 195 т.3)
      chisla: s.redove.map((r) => ({
        data: r.data === '' ? denNaMeseca(r.mesets) : r.data,
        chislo: r.suma_st,
      })),
    })),
    ...(skritiZadachi
      ? []
      : zadachite.redove.map((z) => ({
          id: `zadacha-${z.id}`,
          ime: `Задача · ${z.ime}`,
          chisla: [{ data: z.data, chislo: -z.byudzhet_st }],
        }))),
  ];
  const kal = kalendar(redoveNaKalendara, koloni);
  sloji(skrol, kalendarHTML(kal));
  const sverka = k.tyalo.querySelector('[data-sverka="gant"]');
  if (sverka)
    sverka.textContent =
      `редове ${kal.redove.length} · колони ${koloni.length} · период ${pishi(kal.vsichko)}` +
      ` · задачи с бюджет ${skritiZadachi ? 'скрити' : String(zadachite.redove.length)}` +
      (zadachite.bezData.length === 0
        ? ''
        : ` · бюджет без дата не влиза: ${zadachite.bezData.join(' · ')}`);
}

function zapishiKesha(k: KonteksNaEkrana): Promise<void> {
  return zapishiOtForma(k, 'kesh', 'smetki.zapishiKesh', (pole, suma) => ({
    mesets: pole('mesets'),
    zaplati: suma(pole('zaplati')),
    fakturi: suma(pole('fakturi')),
    izvlechenie: suma(pole('izvlechenie')),
  }));
}

/** Редът на ДДС за месеца на екрана · за да не се трият чужди числа при запис. */
function zaMesetsa(k: KonteksNaEkrana): { izdadeni: Kletka | null; plateni: Kletka | null } | null {
  const mesets = chetiEkranno<string>(PAMET.mesets, mesetsatSega());
  const m = ddsat(k.porta.ogledalo(), new Date().toISOString()).mesetsi.find(
    (x) => x.mesets === mesets,
  );
  if (m === undefined) return null;
  return {
    izdadeni: m.izdadeni === 0 ? null : { stoynost_st: m.izdadeni },
    plateni: m.plateni === 0 ? null : { stoynost_st: m.plateni },
  };
}

function zapishiDdsa(k: KonteksNaEkrana): Promise<void> {
  return zapishiOtForma(k, 'dds', 'smetki.zapishiDds', (pole, suma) => ({
    mesets: pole('mesets'),
    nachislen: suma(pole('nachislen')),
    kredit: suma(pole('kredit')),
    deklarirano: suma(pole('deklarirano')),
    plateno: suma(pole('plateno')),
    // числата от счетоводството не са в тази форма · пазят се такива, каквито са
    izdadeni: zaMesetsa(k)?.izdadeni ?? null,
    plateni: zaMesetsa(k)?.plateni ?? null,
  }));
}

/**
 * СКРИЙ ↔ ПОКАЖИ една страна · и ПОСЛЕДНАТА видима не се скрива.
 *
 * Отказът се КАЗВА (правило 12), вместо екранът да остане празен и човекът да
 * гадае кой бутон го е изпразнил. Същото решение като при реда на менюто в
 * MasterBook (ADR-066): последният видим изглед не се скрива.
 */
function prevklyuchiStranata(k: KonteksNaEkrana, strana: Strana): void {
  const sega = chetiEkranno<readonly Strana[]>(PAMET.skriti, []);
  if (sega.includes(strana)) {
    zapomniEkranno(
      PAMET.skriti,
      sega.filter((x) => x !== strana),
    );
    k.prerisuvay();
    return;
  }
  if (sega.length >= 1) {
    pokazhiGreshka(
      k.tyalo,
      `Последната видима страна не се скрива · „${IMENA_NA_STRANITE[strana]}" остава, докато не покажеш другата.`,
    );
    return;
  }
  zapomniEkranno(PAMET.skriti, [...sega, strana]);
  k.prerisuvay();
}

function deystvieNaButona(k: KonteksNaEkrana, b: ButonNaProzoretsa): void {
  const d = b.deystvie;
  switch (d.vid) {
    case 'kniga':
      void zapaziKnigata(k);
      return;
    case 'nastroyki':
      location.hash = '#/nastroyki';
      return;
    case 'komanda':
      void izpalniOtMenyuto(k, d.klyuch, {});
      return;
    case 'idva':
      return;
    case 'ekran':
      break;
  }
  switch (d.klyuch) {
    case 'obnovi':
      k.prerisuvay();
      return;
    case 'skriy-dela':
      // ЕДИН бутон · крие задачите с бюджет от календара и от сбора (запис 193)
      zapomniEkranno(PAMET.skriyZadachi, !chetiEkranno<boolean>(PAMET.skriyZadachi, false));
      k.prerisuvay();
      return;
    case 'dobavyane':
      location.hash = '#/upravlenie';
      return;
    case 'skriy-prihodi':
    case 'skriy-razhodi':
      prevklyuchiStranata(k, STRANATA_NA_BUTONA[d.klyuch]!);
      return;
    default:
      pokazhiGreshka(
        k.tyalo,
        `Бутонът „${b.ime.split('(')[0]!.trim()}" на Сметки още няма действие · казва се, вместо да мълчи.`,
      );
  }
}
