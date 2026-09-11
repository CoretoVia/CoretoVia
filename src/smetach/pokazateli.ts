/**
 * ПОКАЗАТЕЛИТЕ · данните, от които се смятат коефициентите.
 *
 * Негово, 11.09 (запис 194): „**Събери основните данни необходими за
 * изчисляване на коефициентите от отчети. Искам под таблицата и диаграмата да
 * дадеш всички данни които може да се съберат от Приходи и Разходи за да се
 * сметнат коефициентите.**"
 *
 * Тук НЕ се измислят коефициенти. Събира се онова, което Приходи и Разходи
 * вече знаят, и се показва с формулата до него — за да се види кое е налично и
 * кое липсва, преди да се строят Отчетите.
 *
 * ТРИ ГРАНИЦИ:
 *
 *   1. **Парите са цели центове** (правило 3). Делението дава ДЯЛ, не пари, и
 *      се пази като процент с една стотна — закръгленото никога не влиза в сбор.
 *   2. **Деление на нула не се прави тихо.** Няма приход → делът го КАЗВА, а не
 *      показва нула или безкрайност.
 *   3. **Всяко число носи формулата си с думи** (правило 28 · 31): екранът
 *      обяснява откъде идва, а не само колко е.
 */

import { pishi } from '../yadro/pari.js';
import type { Smetki } from './smetki.js';

export interface Pokazatel {
  readonly klyuch: string;
  readonly ime: string;
  /** стойността, както се пише на екрана · пари, брой или процент */
  readonly stoynost: string;
  /** формулата с думи · подсказката я показва (правило 28) */
  readonly formula: string;
  /** цели центове, когато показателят е пари · инак `null` */
  readonly st: number | null;
}

/** Процент с една стотна · дял, не пари; „—" когато знаменателят е нула. */
function dyal(chislitel: number, znamenatel: number): string {
  if (znamenatel === 0) return '—';
  return `${((chislitel / znamenatel) * 100).toFixed(1).replace('.', ',')} %`;
}

/**
 * Данните от Приходи и Разходи · всичко, което може да се събере днес.
 *
 * `mesetsi` е броят месеци, които екранът показва — средното на месец е
 * различно число за тримесечие и за година, и мълчаливото „12" би излъгало.
 */
export function pokazatelite(s: Smetki, mesetsi: number): readonly Pokazatel[] {
  const prihod = s.sborPrihod;
  // разходът се пази с отрицателен знак · за четене и за дялове се взима модулът
  const razhod = Math.abs(s.sborRazhod);
  const rezultat = s.rezultat;

  const nayGolyama = (spisak: Smetki['prihod']): { ime: string; sbor: number } => {
    let naygolyamata = { ime: '—', sbor: 0 };
    for (const sek of spisak)
      if (Math.abs(sek.sbor) > Math.abs(naygolyamata.sbor))
        naygolyamata = { ime: sek.tekst, sbor: sek.sbor };
    return naygolyamata;
  };
  const golyamPrihod = nayGolyama(s.prihod);
  const golyamRazhod = nayGolyama(s.razhod);

  return [
    {
      klyuch: 'prihod',
      ime: 'Приход общо',
      stoynost: pishi(prihod),
      formula: 'сборът на всички секции на Приход за показания период',
      st: prihod,
    },
    {
      klyuch: 'razhod',
      ime: 'Разход общо',
      stoynost: pishi(razhod),
      formula: 'сборът на всички секции на Разход, взет по модул',
      st: razhod,
    },
    {
      klyuch: 'rezultat',
      ime: 'Резултат',
      stoynost: pishi(rezultat),
      formula: 'приход минус разход · положителен е печалба, отрицателен е загуба',
      st: rezultat,
    },
    {
      klyuch: 'marzh',
      ime: 'Марж',
      stoynost: dyal(rezultat, prihod),
      formula: 'резултат ÷ приход · колко остава от всяко влязло евро',
      st: null,
    },
    {
      klyuch: 'pokritie',
      ime: 'Покритие на разхода',
      stoynost: dyal(prihod, razhod),
      formula: 'приход ÷ разход · над сто на сто значи, че приходът стига',
      st: null,
    },
    {
      klyuch: 'razhod-kam-prihod',
      ime: 'Разход към приход',
      stoynost: dyal(razhod, prihod),
      formula: 'разход ÷ приход · колко от прихода отива в разходи',
      st: null,
    },
    {
      klyuch: 'sredno-prihod',
      ime: 'Среден приход на месец',
      stoynost: mesetsi === 0 ? '—' : pishi(Math.round(prihod / mesetsi)),
      formula: 'приход ÷ броя показани месеци',
      st: mesetsi === 0 ? null : Math.round(prihod / mesetsi),
    },
    {
      klyuch: 'sredno-razhod',
      ime: 'Среден разход на месец',
      stoynost: mesetsi === 0 ? '—' : pishi(Math.round(razhod / mesetsi)),
      formula: 'разход ÷ броя показани месеци',
      st: mesetsi === 0 ? null : Math.round(razhod / mesetsi),
    },
    {
      klyuch: 'nay-goliam-prihod',
      ime: 'Най-голям приход',
      stoynost: `${golyamPrihod.ime} · ${dyal(Math.abs(golyamPrihod.sbor), prihod)}`,
      formula: 'секцията с най-голям сбор и делът ѝ от целия приход',
      st: null,
    },
    {
      klyuch: 'nay-goliam-razhod',
      ime: 'Най-голям разход',
      stoynost: `${golyamRazhod.ime} · ${dyal(Math.abs(golyamRazhod.sbor), razhod)}`,
      formula: 'секцията с най-голям сбор и делът ѝ от целия разход',
      st: null,
    },
    {
      klyuch: 'sektsii',
      ime: 'Секции с движения',
      stoynost: `${s.prihod.filter((x) => x.redove.length > 0).length} приход · ${s.razhod.filter((x) => x.redove.length > 0).length} разход`,
      formula: 'колко секции имат поне един ред в показания период',
      st: null,
    },
    {
      klyuch: 'dvizheniya',
      ime: 'Движения',
      stoynost: `${s.broyDvizheniya}${s.bezSektsiya.length === 0 ? '' : ` · без секция ${s.bezSektsiya.length}`}`,
      formula: 'броят редове с пари · и колко от тях са без секция',
      st: null,
    },
  ];
}
