/**
 * ЗАПИСЪТ · NDJSON · RFC 5424 · RFC 3339.
 *
 * Тестът пази ТРИ обещания, всяко от които мълчи, ако се счупи:
 *
 *   1. лични данни не могат да влязат (правило 21) — низ в `danni` е ОТКАЗ
 *   2. изпуснатото от пръстена се БРОИ · мълчаливо изпуснат ред лъже четящия
 *   3. форматът е чуждият, не наш · един самостоятелен JSON обект на ред
 */

import { describe, expect, it } from 'vitest';
import { NIVA, napraviZapisvach } from '../src/yadro/index.js';
import type { ImeNaNivo, Zapis } from '../src/yadro/zapis.js';

/** Часовник, който БРОИ · всяко викане е с милисекунда напред от предишното. */
function chasovnikOt(nachalo: number): () => number {
  let sega = nachalo;
  return () => {
    const tozi = sega;
    sega += 1;
    return tozi;
  };
}

const NULA = Date.parse('2026-09-08T00:00:00.000Z');

describe('нивата · RFC 5424', () => {
  it('са ОСЕМ и скалата е обърната · нула е най-тежкото', () => {
    const imena = Object.keys(NIVA);
    expect(imena).toHaveLength(8);
    expect(NIVA.avariya).toBe(0);
    expect(NIVA.otladka).toBe(7);
  });

  it('числата са точно 0…7, без дупка и без повторение', () => {
    const chisla = Object.values(NIVA).sort((a, b) => a - b);
    expect(chisla).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('прагът', () => {
  it('пропуска по-подробното от себе си, без да гърми', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA), prag: 'predupezhdenie' });
    z.zapishi('greshka', 'vrata', 'otkaz');
    z.zapishi('otladka', 'vrata', 'podrobnost');
    z.zapishi('svedenie', 'vrata', 'svedenie');

    expect(z.broy()).toBe(1);
    expect(z.redove()[0]?.sabitie).toBe('otkaz');
  });

  it('по подразбиране отладката е изключена, а сведението — не', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('svedenie', 'vrata', 'vliza');
    z.zapishi('otladka', 'vrata', 'ne_vliza');

    expect(z.broy()).toBe(1);
  });
});

describe('пръстенът', () => {
  it('държи тавана и БРОИ изпадналото', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA), kapacitet: 3 });
    const kolko = 10;
    for (let i = 0; i < kolko; i++) z.zapishi('svedenie', 'obhod', 'red', { nomer: i });

    expect(z.broy()).toBe(3);
    expect(z.izpusnati()).toBe(kolko - 3);
    // най-старият е пръв · останали са последните три
    expect(z.redove().map((r: Zapis) => r.danni['nomer'])).toEqual([7, 8, 9]);
  });

  it('без препълване не изпуска нищо', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA), kapacitet: 5 });
    z.zapishi('svedenie', 'obhod', 'red');
    expect(z.izpusnati()).toBe(0);
  });

  it('отказва таван, който не е цяло число над нула', () => {
    const chasovnik = chasovnikOt(NULA);
    expect(() => napraviZapisvach({ chasovnik, kapacitet: 0 })).toThrow(/цяло число/);
    expect(() => napraviZapisvach({ chasovnik, kapacitet: 2.5 })).toThrow(/цяло число/);
  });
});

describe('личните данни НЕ МОГАТ да влязат · правило 21', () => {
  it('низ в данните е ОТКАЗ, а не предупреждение', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    expect(() => z.zapishi('greshka', 'vrata', 'otkaz', { ime: 'Иван Петров' } as never)).toThrow(
      /само числа и истинности/,
    );
    expect(z.broy()).toBe(0);
  });

  it('отказът КАЗВА кой ключ е виновен · правило 12', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    expect(() => z.zapishi('greshka', 'v', 's', { imeyl: 'x@y.z' } as never)).toThrow(
      /имейл|imeyl/,
    );
  });

  it('числа и истинности минават', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('svedenie', 'sverka', 'zatvorena', { red: 42, razlika: 0, nared: true });
    expect(z.broy()).toBe(1);
  });

  it('нечисло се отказва · NaN и безкрайност не са число за лога', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    expect(() => z.zapishi('svedenie', 'v', 's', { x: NaN })).toThrow(/крайни числа/);
    expect(() => z.zapishi('svedenie', 'v', 's', { x: Infinity })).toThrow(/крайни числа/);
  });
});

describe('редът казва кой и какво', () => {
  it('празен източник или празно събитие е отказ', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    expect(() => z.zapishi('svedenie', '', 'sabitie')).toThrow(/източник и събитие/);
    expect(() => z.zapishi('svedenie', 'iztochnik', '')).toThrow(/източник и събитие/);
  });

  it('времето е RFC 3339 в UTC · с милисекунди и с Z накрая', () => {
    const z = napraviZapisvach({ chasovnik: () => NULA });
    z.zapishi('svedenie', 'vrata', 'otvorena');
    expect(z.redove()[0]?.vreme).toBe('2026-09-08T00:00:00.000Z');
  });

  it('носи и числото, и името на нивото', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('kritichno', 'kotva', 'razminavane');
    const red = z.redove()[0];
    expect(red?.nivo).toBe(2);
    expect(red?.ime).toBe('kritichno');
  });
});

describe('износът е NDJSON · както го пише Docker', () => {
  it('всеки ред е самостоятелен JSON обект', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    const kolko = 3;
    for (let i = 0; i < kolko; i++) z.zapishi('svedenie', 'obhod', 'red', { nomer: i });

    const redove = z
      .iznesi()
      .split('\n')
      .filter((r) => r !== '');
    expect(redove).toHaveLength(kolko);
    for (const red of redove) {
      const obekt = JSON.parse(red) as Zapis;
      expect(typeof obekt.vreme).toBe('string');
      expect(typeof obekt.nivo).toBe('number');
    }
  });

  it('всеки ред завършва с край на реда · за да се ДОПИСВА файлът', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('svedenie', 'obhod', 'red');
    expect(z.iznesi().endsWith('\n')).toBe(true);
  });

  it('празният записвач дава празен низ, не самотен край на ред', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    expect(z.iznesi()).toBe('');
  });

  it('в нито един ред няма край на ред ВЪТРЕ в стойност', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('greshka', 'vrata', 'red\nvtori');
    const redove = z
      .iznesi()
      .split('\n')
      .filter((r) => r !== '');
    expect(redove).toHaveLength(1);
    expect((JSON.parse(redove[0] ?? '') as Zapis).sabitie).toBe('red\nvtori');
  });
});

describe('записаното не се пипа отвън', () => {
  it('редовете са замразени и списъкът е копие', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA) });
    z.zapishi('svedenie', 'vrata', 'otvorena');
    const vzeti = z.redove();
    expect(Object.isFrozen(vzeti)).toBe(true);
    expect(Object.isFrozen(vzeti[0])).toBe(true);

    z.zapishi('svedenie', 'vrata', 'zatvorena');
    expect(vzeti).toHaveLength(1);
    expect(z.broy()).toBe(2);
  });
});

describe('всяко ниво стига до реда си', () => {
  it('и осемте се записват, когато прагът е най-подробният', () => {
    const z = napraviZapisvach({ chasovnik: chasovnikOt(NULA), prag: 'otladka' });
    const imena = Object.keys(NIVA) as ImeNaNivo[];
    for (const ime of imena) z.zapishi(ime, 'obhod', ime);

    expect(imena).toHaveLength(8);
    expect(z.broy()).toBe(8);
    expect(z.redove().map((r: Zapis) => r.nivo)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
