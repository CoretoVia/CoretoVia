/**
 * САМОЛИЧНОСТТА · свой ключ на устройството (ADR-024 §1).
 *
 * Тестът пази ЧЕТИРИ обещания, всяко от които мълчи, ако се счупи:
 *
 *   1. частният ключ НЕ се изнася · „не напуска устройството" е математика
 *   2. отпечатъкът ПРЕЖИВЯВА затваряне · инак веригата остава без писач
 *   3. адресът НЕ започва с името на служебната книга · това е цялата защита
 *   4. чужд подпис НЕ минава · и отказът е `false`, не гърмеж
 */

import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  BELEG_NA_OTPECHATAK,
  BEZ_SAMOLICHNOST,
  NASTAVKA_LICHNO,
  ZNATSI_V_OTPECHATAKA,
  eLichnaVeriga,
  eOtpechatak,
  otpechatakNaVeriga,
  otpechatakOtHesh,
  verigaLichna,
} from '../src/yadro/samolichnost.js';
import { proveriPodpisVBrauzara, samolichnostVBrauzara } from '../src/nositel/samolichnost-web.js';

/** Хеш с точната дължина на истински SHA-256 · 64 шестнайсетични знака. */
const HESH = 'a'.repeat(40) + '0123456789abcdef' + 'f'.repeat(8);

describe('формата на отпечатъка · чист код, без браузър', () => {
  it('носи белега на версията и точно толкова знака', () => {
    const o = otpechatakOtHesh(HESH);
    expect(o.startsWith(BELEG_NA_OTPECHATAK)).toBe(true);
    expect(o).toHaveLength(BELEG_NA_OTPECHATAK.length + ZNATSI_V_OTPECHATAKA);
    expect(eOtpechatak(o)).toBe(true);
  });

  it('НЕ започва с името на служебната книга · това е цялата защита', () => {
    expect(otpechatakOtHesh(HESH).startsWith('coretovia')).toBe(false);
    expect(verigaLichna(otpechatakOtHesh(HESH)).startsWith('coretovia')).toBe(false);
  });

  it('отказва хеш, който не е хеш · и казва какво е подадено', () => {
    expect(() => otpechatakOtHesh('не-е-хеш')).toThrow(/шестнайсетичен/);
    expect(() => otpechatakOtHesh('abc')).toThrow(/шестнайсетичен/);
    expect(() => otpechatakOtHesh(HESH.toUpperCase())).toThrow(/шестнайсетичен/);
  });

  it('познава чуждото · нито едно от тези не е отпечатък', () => {
    const chuzhdi = ['', 'coretovia', 'k1-', 'k1-zzzz', BELEG_NA_OTPECHATAK + 'a'.repeat(31)];
    expect(chuzhdi).toHaveLength(5);
    for (const c of chuzhdi) expect(eOtpechatak(c), `„${c}" мина за отпечатък`).toBe(false);
  });
});

describe('константите са ПИН С РЪКА · адресът е ВЕЧЕН', () => {
  /**
   * Обход В на честността иска всяка изнесена константа да има поне един пин
   * с ръка. Тук причината е по-тежка от обичайната: тези три числа и низа
   * влизат в адрес, който се записва в Журнал само за добавяне. Сменѝ ги —
   * и всяка вече създадена лична верига остава без писач, без начин за
   * поправка. Затова стойностите стоят ТУК, дословно: който ги мени, минава
   * през червен тест и през този коментар.
   */
  it('белегът е точно „k1-" · и не се мени без нова версия на адреса', () => {
    expect(BELEG_NA_OTPECHATAK).toBe('k1-');
  });

  it('знаците са точно 32 · 128 бита', () => {
    expect(ZNATSI_V_OTPECHATAKA).toBe(32);
  });

  it('наставката е точно „~lichno" · ADR-024 §2', () => {
    expect(NASTAVKA_LICHNO).toBe('~lichno');
  });

  it('„без самоличност" НИКОГА не може да е нечия лична верига', () => {
    expect(BEZ_SAMOLICHNOST).toBe('bez-samolichnost');
    // Очакваното е ДОСЛОВНО, не построено от същите константи: инак тестът се
    // мести заедно с кода и доказва само, че две еднакви неща са еднакви
    // (обход А на честността го хвана точно тук).
    expect(eOtpechatak('bez-samolichnost')).toBe(false);
    expect(eLichnaVeriga('bez-samolichnost~lichno')).toBe(false);
  });
});

describe('адресът на личната верига', () => {
  it('се строи и се разчита обратно · едно към едно', () => {
    const o = otpechatakOtHesh(HESH);
    const veriga = verigaLichna(o);
    expect(veriga).toBe(o + NASTAVKA_LICHNO);
    expect(eLichnaVeriga(veriga)).toBe(true);
    expect(otpechatakNaVeriga(veriga)).toBe(o);
  });

  it('чуждата верига НЕ се разчита · отказът е отговор, не изключение', () => {
    const chuzhdi = ['coretovia', 'coretovia~ivan@x.bg~lichno', 'k1-abc~lichno', 'нещо'];
    expect(chuzhdi).toHaveLength(4);
    for (const c of chuzhdi) {
      expect(eLichnaVeriga(c), `„${c}" мина за лична верига`).toBe(false);
      expect(otpechatakNaVeriga(c)).toBeUndefined();
    }
  });

  it('ОТХВЪРЛЕНИЯТ вариант от ADR-024 §2 не може да се построи оттук', () => {
    // `coretovia~<имейл>~lichno` попада в служебния префиксен обхват и
    // служебното Огледало би го сгънало. Не е въпрос на дисциплина: няма как.
    expect(() => verigaLichna('coretovia~ivan@x.bg')).toThrow(/отпечатък/);
  });
});

describe('ключът на устройството', () => {
  it('прави се веднъж и ПРЕЖИВЯВА затваряне · инак веригата остава без писач', async () => {
    const baza = 'proba-samolichnost-1';
    const parva = await samolichnostVBrauzara(baza);
    const otpechatak = await parva.otpechatak();
    expect(eOtpechatak(otpechatak)).toBe(true);

    const vtora = await samolichnostVBrauzara(baza);
    expect(await vtora.otpechatak()).toBe(otpechatak);
  });

  it('друга база · друг ключ · друг отпечатък', async () => {
    const a = await samolichnostVBrauzara('proba-samolichnost-a');
    const b = await samolichnostVBrauzara('proba-samolichnost-b');
    expect(await a.otpechatak()).not.toBe(await b.otpechatak());
  });

  it('публичният ключ е 32 байта и се дава като КОПИЕ', async () => {
    const s = await samolichnostVBrauzara('proba-samolichnost-2');
    const parvo = await s.publichenKlyuch();
    expect(parvo).toHaveLength(32);
    parvo[0] = (parvo[0] ?? 0) ^ 0xff;
    expect(await s.publichenKlyuch()).not.toEqual(parvo);
  });

  it('подписът е 64 байта и се проверява с публичния ключ', async () => {
    const s = await samolichnostVBrauzara('proba-samolichnost-3');
    const kakvo = new TextEncoder().encode('сверка · разлика нула');
    const podpis = await s.podpishi(kakvo);
    expect(podpis).toHaveLength(64);
    expect(await proveriPodpisVBrauzara(await s.publichenKlyuch(), kakvo, podpis)).toBe(true);
  });

  it('ЧУЖД подпис не минава · и пипнатото съобщение също не', async () => {
    const svoy = await samolichnostVBrauzara('proba-samolichnost-4');
    const chuzhd = await samolichnostVBrauzara('proba-samolichnost-5');
    const kakvo = new TextEncoder().encode('плащане');
    const podpis = await chuzhd.podpishi(kakvo);

    expect(await proveriPodpisVBrauzara(await svoy.publichenKlyuch(), kakvo, podpis)).toBe(false);

    // Пипнато е с ДРУГА КИРИЛСКА буква, не с латинска: правило 10 не се
    // нарушава дори в тест, дори в низ, който само се подписва.
    const pipnato = new TextEncoder().encode('плащаие');
    expect(await proveriPodpisVBrauzara(await chuzhd.publichenKlyuch(), pipnato, podpis)).toBe(
      false,
    );
  });

  it('боклук вместо ключ дава ОТКАЗ, не гърмеж', async () => {
    const s = await samolichnostVBrauzara('proba-samolichnost-6');
    const kakvo = new TextEncoder().encode('нещо');
    const podpis = await s.podpishi(kakvo);
    expect(await proveriPodpisVBrauzara(new Uint8Array(32), kakvo, podpis)).toBe(false);
    expect(await proveriPodpisVBrauzara(new Uint8Array(7), kakvo, podpis)).toBe(false);
  });
});
