/**
 * ПРЕНЕСЕНОТО ЯДРО · частите, чиито стари тестове живееха при домейна.
 *
 * MasterBook пазеше котвата, правата по верига, мярката на сверката и ключа
 * на звеното през тестове, които внасят домейн (наеми, действия). Домейнът
 * не се пренася — тестовете им не могат. Обходът за чистота брои изнесено име
 * без нито един викащ като МЪРТВО (праг нула), и с право: пренесено, но
 * непазено, е пренесено на вяра. Затова тук всяка от тези части получава
 * своя проверка, къса и без домейн — до резена, който я вика в живия код.
 *
 * КОТВАТА вече е минала оттам: `kotvataKazva` се вика от корена (резен 6р), и
 * долният блок е нейният тест, не нейният заместител.
 */

import { describe, expect, it } from 'vitest';
import { sha256Node } from '../src/nositel/hash-node.js';
import {
  KotvaVPametta,
  kotvataKazva,
  LichnoESamoTvoe,
  MERKA,
  PoSvoyataVeriga,
  SUMATA_NAD_NULA,
  VsichkoRazresheno,
  ZASHTO_I_NULATA,
  klyuchNaZveno,
  izchisliHash,
  koyPishe,
  NASTAVKA_LICHNO,
  PISACH_NA_KNIGATA,
  SHEMA,
  VALUTI,
  veriga,
  proveriKotvata,
  sverka,
} from '../src/yadro/index.js';

const KOGATO = '2026-09-05T09:00:00.000Z';
const svedi = (imeyl: string): string => imeyl.trim().toLowerCase();

describe('котвата · последното звено, записано ИЗВЪН Журнала', () => {
  it('в паметта · забива се и се чете · без котва е null', () => {
    const k = new KotvaVPametta();
    expect(k.cheti('x')).toBeNull();
    k.zabij('x', { seq: 3, hash: 'abc', kogato: KOGATO });
    expect(k.cheti('x')?.seq).toBe(3);
  });

  it('скъсен отзад Журнал не минава покрай котвата', () => {
    const kotva = { seq: 5, hash: 'h5', kogato: KOGATO };
    const hashove = (seq: number): string | undefined => (seq === 5 ? 'h5' : undefined);
    expect(proveriKotvata(kotva, 5, hashove).nared).toBe(true);
    // по-къс Журнал · липсват звена
    expect(proveriKotvata(kotva, 4, hashove).nared).toBe(false);
    // същият seq, друг хеш · подменено звено
    expect(proveriKotvata(kotva, 5, () => 'drug').nared).toBe(false);
    // Без котва няма с какво да се мери · това е „наред", казано на глас.
    expect(proveriKotvata(null, 9, hashove).nared).toBe(true);
  });

  it('изречението за екрана · находката е ЕДНА от четирите състояния', () => {
    const k = new KotvaVPametta();
    const zveno = { seq: 5, hash: 'h5' };

    // 1 · нов браузър · няма с какво да се мери, и това се КАЗВА
    const bezKotva = kotvataKazva(k, 'kniga', zveno);
    expect(bezKotva.nared).toBe(true);
    expect(bezKotva.dumi).toContain('Котва още няма');

    k.zabij('kniga', { seq: 5, hash: 'h5', kogato: KOGATO });

    // 2 · съвпада
    expect(kotvataKazva(k, 'kniga', zveno)).toEqual({
      nared: true,
      dumi: 'Котвата съвпада с Журнала на seq 5 · нищо не е махано отзад.',
    });

    // 3 · НАХОДКАТА · Журналът е скъсен отзад до seq 3
    const skasen = kotvataKazva(k, 'kniga', { seq: 3, hash: 'h3' });
    expect(skasen.nared).toBe(false);
    expect(skasen.dumi).toContain('скъсяван отзад');

    // 3б · находка и когато Журналът е ИЗТРИТ докрай
    expect(kotvataKazva(k, 'kniga', undefined).nared).toBe(false);

    // 3в · същият връх, друг хеш · историята до котвата е пренаписана
    const podmenen = kotvataKazva(k, 'kniga', { seq: 5, hash: 'drug' });
    expect(podmenen.nared).toBe(false);
    expect(podmenen.dumi).toContain('пренаписана');

    // 4 · котвата ИЗОСТАВА · запис е минал, преди тя да се забие. НЕ е находка:
    // иначе всеки браузър, отказал `localStorage`, би вдигал фалшива тревога.
    const izostava = kotvataKazva(k, 'kniga', { seq: 9, hash: 'h9' });
    expect(izostava.nared).toBe(true);
    expect(izostava.dumi).toContain('не втора истина');

    // 5 · чужда верига · котвата е НА НАЕМАТЕЛ, не обща
    expect(kotvataKazva(k, 'druga', { seq: 1, hash: 'h1' }).dumi).toContain('Котва още няма');
  });
});

describe('правата по верига · всеки писач пише в СВОЯТА', () => {
  const s = { vid: 'zapis', id: 'Z-1' };

  it('PoSvoyataVeriga · чужда верига на писач се отказва, своята минава', async () => {
    const p = new PoSvoyataVeriga(
      new VsichkoRazresheno(),
      (veriga) => (veriga.includes('#pero:') ? veriga.split('#pero:')[1] : undefined),
      (veriga) => veriga.split('#')[0]!,
      () => 'stopanin@x.bg',
      svedi,
    );
    expect(await p.mozheDaPishe('ivo@x.bg', 'kniga#pero:ivo@x.bg', s)).toBe(true);
    expect(await p.mozheDaPishe('Ivo@X.bg', 'kniga#pero:ivo@x.bg', s)).toBe(true);
    expect(await p.mozheDaPishe('mira@x.bg', 'kniga#pero:ivo@x.bg', s)).toBe(false);
    // нулевата верига на книга с известен стопанин · пише само той
    expect(await p.mozheDaPishe('stopanin@x.bg', 'kniga', s)).toBe(true);
    expect(await p.mozheDaPishe('ivo@x.bg', 'kniga', s)).toBe(false);
  });

  it('LichnoESamoTvoe · личната верига е само на своя човек, служебната минава', async () => {
    const p = new LichnoESamoTvoe('#lichen', svedi);
    expect(await p.mozheDaPishe('ivo@x.bg', 'ivo@x.bg#lichen')).toBe(true);
    expect(await p.mozheDaPishe('mira@x.bg', 'ivo@x.bg#lichen')).toBe(false);
    expect(await p.mozheDaPishe('mira@x.bg', 'kniga')).toBe(true);
  });
});

describe('сверката и звеното', () => {
  it('нулата се записва с думите защо', () => {
    const sv = sverka('пренос', 224, 224, KOGATO);
    expect(sv.razlika).toBe(0);
    expect(sv.nared).toBe(true);
    expect(MERKA.pari).toBe('центове');
    expect(MERKA.broy).toBe('брой');
    expect(ZASHTO_I_NULATA.length).toBeGreaterThan(20);
  });

  it('ключът на звеното носи веригата, за да не се сблъскат еднаквите seq', () => {
    const na = (kniga: string, seq: number) =>
      klyuchNaZveno({ kniga, pisach: PISACH_NA_KNIGATA, seq });
    expect(na('A', 2)).toBe('A#2');
    expect(na('B', 2)).not.toBe(na('A', 2));
  });

  it('думите за сумата над нула са едни', () => {
    expect(SUMATA_NAD_NULA).toBe('Сумата трябва да е повече от нула.');
  });
});

/**
 * РАЗРЕЗЪТ · Т39 · едно поле с три смисъла стана три полета.
 *
 * Композицията и разлагането ѝ са ЕДНО правило (правило 14) и живеят в един
 * файл. Договорът им се ДОКАЗВА тук, а не се обещава в коментар: обиколката
 * низ → факти → низ трябва да върне същото за трите случая, инак Дневникът
 * ще търси редици под ключ, който сам не може да построи.
 */
describe('разрезът · книга · писач · устройство', () => {
  const sluchai: readonly [string, string][] = [
    ['на самата книга', 'coretovia'],
    ['на писач', 'coretovia~k1-abc'],
    ['лична', `k1-${'0'.repeat(32)}~lichno`],
  ];

  for (const [ime, niz] of sluchai) {
    it(`обиколката се затваря · ${ime}`, () => {
      expect(veriga(koyPishe(niz))).toBe(niz);
    });
  }

  it('веригата на книгата НЕ носи наставка · инак „без откриване" я гони', () => {
    expect(veriga({ kniga: 'coretovia', pisach: PISACH_NA_KNIGATA })).toBe('coretovia');
    expect(veriga({ kniga: 'coretovia', pisach: PISACH_NA_KNIGATA })).not.toContain('~');
  });

  it('личната верига е ИЗВЪН всяка книга · по конструкция, не по настройка', () => {
    // наставката се заковава С РЪКА тук: сверка на константа със себе си не
    // доказва нищо, а точно тази стойност държи границата (ADR-024 §2)
    expect(NASTAVKA_LICHNO).toBe('~lichno');
    const lichna = veriga({ kniga: NASTAVKA_LICHNO, pisach: `k1-${'a'.repeat(32)}` });
    expect(lichna.startsWith('coretovia')).toBe(false);
    expect(lichna.endsWith('~lichno')).toBe(true);
    expect(koyPishe(lichna).kniga).toBe('~lichno');
  });

  it('писачът може да носи наставки · разлага се по ПЪРВАТА тилда', () => {
    expect(koyPishe('kniga~a~b')).toEqual({ kniga: 'kniga', pisach: 'a~b' });
  });
});

/**
 * ВЕРСИЯТА И ВАЛУТАТА · двата факта, които Журналът не може да си върне после.
 *
 * Проверява се не че полетата ги ИМА, а че СЕ ПОДПИСВАТ: поле извън подписа е
 * поле, което може да се смени с текстов редактор — точно измерването, което
 * вкара `actor` в хеша.
 */
describe('версията на схемата и валутата', () => {
  const osnova = {
    seq: 1,
    shema: SHEMA,
    opId: 'op-1',
    ts: KOGATO,
    valuta: 'EUR',
    kniga: 'kniga',
    pisach: PISACH_NA_KNIGATA,
    ustroystvo: `k1-${'0'.repeat(32)}`,
    actor: 'ivo@x.bg',
    type: 'ЗаписЗаписан',
    sashtnost: { vid: 'zapis', id: 'Z-1' },
    payload: {},
    prevHash: '',
  };

  it('днешната версия е ЕДНО число и се заковава с ръка', () => {
    expect(SHEMA).toBe(1);
  });

  it('валутите са ДВЕ · трета няма и курс няма', () => {
    expect([...VALUTI]).toEqual(['EUR', 'USD']);
  });

  it('смяна на ВАЛУТАТА мени подписа · историята не се преномерира тихо', async () => {
    const a = await izchisliHash(osnova, sha256Node);
    const b = await izchisliHash({ ...osnova, valuta: 'USD' }, sha256Node);
    expect(a).not.toBe(b);
  });

  it('смяна на ВЕРСИЯТА мени подписа', async () => {
    const a = await izchisliHash(osnova, sha256Node);
    const b = await izchisliHash({ ...osnova, shema: 2 }, sha256Node);
    expect(a).not.toBe(b);
  });

  it('и трите нови полета на разреза са в подписа', async () => {
    const a = await izchisliHash(osnova, sha256Node);
    for (const smyana of [
      { kniga: 'druga' },
      { pisach: 'k1-chuzhd' },
      { ustroystvo: `k1-${'f'.repeat(32)}` },
    ]) {
      expect(await izchisliHash({ ...osnova, ...smyana }, sha256Node)).not.toBe(a);
    }
  });
});
