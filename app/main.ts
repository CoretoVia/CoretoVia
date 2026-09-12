/**
 * Coretovia · композиционният корен · резен 1.
 *
 * Единственото място, което сглобява носител, Врата и Изпълнител (K2). Всичко
 * останало получава Портата и тялото, в което рисува. Осемте прозореца са
 * лента и хеш-адреси; четирите, които още не са построени, го КАЗВАТ (правило 12).
 */

import type { KlyuchNaProzorets } from '../src/model/klyuchove.js';
import { proveriModela } from '../src/model/model.js';
import { MODEL, PROZORTSI } from '../src/model/osnova.js';
import { pomosht, tekstNaPomoshtta } from '../src/model/pomosht.js';
import { otvoriDnevnik } from '../src/nositel/dnevnik-indexeddb.js';
import { sha256NaBaytove, sha256Web } from '../src/nositel/hash-web.js';
import { samolichnosttaKazva } from '../src/nositel/samolichnost-web.js';
import {
  klyuchalkaMezhduRazdeli,
  kolkoMyasto,
  osiguriHranilishte,
} from '../src/nositel/hranilishte.js';
import { neprochetenotoKazva } from '../src/ogledalo/neprochetenoto.js';
import { Izpalnitel } from '../src/porta/izpalnitel.js';
import { TIP } from '../src/sabitiya/registar.js';
import {
  KotvaVLocalStorage,
  kotvataKazva,
  LichnoESamoTvoe,
  NASTAVKA_LICHNO,
  PISACH_NA_KNIGATA,
  proveriVerigata,
  Vrata,
} from '../src/yadro/index.js';
import { napraviZapisvach } from '../src/yadro/zapis.js';
import type { KonteksNaEkrana } from './kontekst.js';
import { narisuvayProzorets } from './prozorets/prozortsite.js';
import { zatvoriMenyuto } from './reshetka/menyu.js';
import {
  izborNaStepenHTML,
  podskazka,
  podskazkaSDumi,
  skriyPodskazkata,
  stepenNaPomoshtta,
  zakachiIzboraNaStepen,
  zakachiPodskazkite,
} from './reshetka/podskazka.js';
import { h, nashSkript, sloji } from './reshetka/shablon.js';
import { narisuvayVlizaneto } from './reshetka/vlizane.js';
import { chetiEkranno, zapomniEkranno } from './reshetka/pamet-ekran.js';

const KNIGA = 'coretovia';
/**
 * ВАЛУТАТА на тази Книга · негово, 09.09: избира се ЕДНА при регистрация.
 *
 * Стои тук като начална стойност, докато екранът за регистрация го няма.
 * Влиза в подписа на всяко събитие, тъй че смяната ѝ после не е настройка,
 * а видимо ново събитие — точно затова полето се реже СЕГА.
 */
const VALUTA_NA_KNIGATA = 'EUR';
/** имейлът на този, който пише · научава се при откриването · удобство на устройството */
/** Помощта на бутона за печат · защо съществува и какво прави (правило 31). */
const POMOSHT_NA_PECHATA = pomosht(
  'Хартията е единственото, което остава на масата след среща · екранът се печата такъв, какъвто се вижда, без лентата с прозорците и без бутоните.',
  'печата текущия прозорец · таблиците не се режат по средата на ред',
);

const PAMET_AKTOR = 'aktor';

/**
 * ЕКРАНЪТ, ДОКАТО ПРИЛОЖЕНИЕТО ОЩЕ НЕ Е ТРЪГНАЛО · и ако не тръгне.
 *
 * Дотук `main()` нямаше нито един `catch`: всяко хвърляне при отварянето на
 * Журнала, при сгъването или при самоличността оставяше `#ekran` ПРАЗЕН —
 * кремав екран без нито една дума. Негово, 10.09: „Нищо не виждам." Правило 12:
 * отказът се КАЗВА. Журналът при това не е пипнат и това също се казва.
 */
function kazhiNaEkrana(ekran: HTMLElement, zaglavie: string, dumi: string): void {
  sloji(
    ekran,
    h`
    <header class="glava"><h1>Coretovia</h1><p class="vest">${zaglavie}</p></header>
    <main class="prozorets"><div class="prozorets-tyalo"><p class="greshka" data-sastoyanie>${dumi}</p></div></main>`,
  );
}

async function main(): Promise<void> {
  const ekran = document.getElementById('ekran');
  if (!ekran) return;
  try {
    await tragni(ekran);
  } catch (e) {
    kazhiNaEkrana(
      ekran,
      'Приложението не можа да тръгне',
      `${e instanceof Error ? e.message : String(e)} · Журналът не е пипнат. Затвори другите раздели на Coretovia и презареди; ако остане така, това е дефект и се записва.`,
    );
  }
}

async function tragni(ekran: HTMLElement): Promise<void> {
  /*
   * МОДЕЛЪТ СЕ ПРОВЕРЯВА, ПРЕДИ ДА СЕ ОТВОРИ КАКВОТО И ДА Е.
   *
   * `proveriModela` стоеше построена и викана САМО от теста: счупена основа
   * (избор без номенклатура · връзка към непозната таблица) стигаше до
   * Изпълнителя и се сгъваше мълчаливо. Находка тук е грешка в КОДА, не в
   * данните — затова приложението не тръгва и го КАЗВА (правило 12), а
   * Журналът остава неотворен и непипнат.
   */
  const nahodkiVModela = proveriModela(MODEL);
  if (nahodkiVModela.length > 0) {
    kazhiNaEkrana(
      ekran,
      'Моделът е счупен · приложението не тръгва',
      `${nahodkiVModela.join(' · ')} · Това е дефект в кода, не в данните; Журналът не е отварян и не е пипнат.`,
    );
    return;
  }
  const dnevnik = await otvoriDnevnik(KNIGA, (dumi) =>
    kazhiNaEkrana(ekran, 'Журналът е зает от друг раздел · чакам', dumi),
  );
  // Ключалката между разделите я има само където браузърът дава Web Locks;
  // без нея Вратата пак върви — с опашка в рамките на този раздел.
  const klyuchalka = klyuchalkaMezhduRazdeli();
  /*
   * ЗАПИСЪТ · какво програмата казва за себе си (ДЛ-Н2 · `src/yadro/zapis.ts`).
   *
   * Прави се тук, в корена, защото часовникът се подава отвън. Първият гълтащ
   * `catch`, който пише в него, е котвата: частен прозорец или забранени данни
   * досега се преглъщаха, сега се БРОЯТ (правило 12). Пръстенът стои в паметта
   * на раздела; износът му е следваща крачка, не тази.
   */
  const zapisvach = napraviZapisvach({ chasovnik: () => Date.now() });
  const kotva = new KotvaVLocalStorage('coretovia:kotva', zapisvach);

  /**
   * САМОЛИЧНОСТТА · свой ключ на устройството (ADR-024 §1).
   *
   * Своя база, не тази на Журнала: онази е на версия 1 и всяка нейна промяна е
   * миграция върху единственото място, в което живеят парите.
   *
   * Отпечатъкът заменя „всичко разрешено" — двойника на правата от тестовете.
   * Днес това НЕ мени нищо видимо —
   * лична верига още няма, а `LichnoESamoTvoe` пуска всяка верига, която не
   * завършва на наставката. Но в мига, в който първата лична верига се роди,
   * границата вече е на място, вместо да се добавя после върху написани
   * събития (правило 1 не прощава закъснели огради).
   */
  const samolichnostta = await samolichnosttaKazva(`${KNIGA}:samolichnost`);
  const vrata = new Vrata({
    dnevnik,
    pravata: new LichnoESamoTvoe(NASTAVKA_LICHNO, () => samolichnostta.otpechatak),
    sha: sha256Web,
    kotva,
    ...(klyuchalka ? { klyuchalka } : {}),
    parvoto: TIP.stopaninZapisan,
    bezOtkrivane: (n) => n.includes('~'),
  });
  // Кой пише: авторът на първото събитие (Стопанинът), или запомненият на устройството.
  const parvo = await dnevnik.parvo(KNIGA);
  let aktor = parvo?.actor ?? chetiEkranno(PAMET_AKTOR, '');
  const porta = await Izpalnitel.otvori({
    vrata,
    dnevnik,
    model: MODEL,
    // ТРИТЕ ФАКТА вместо един низ с три смисъла (Т39 · негово: „Това даже не
    // са проекти, а втори файл"). Писачите са един, затова веригата е на
    // самата Книга; устройството обаче е СВОЙ факт и се записва отделно —
    // втората машина на същия човек вече ще личи, вместо да се слее.
    kniga: KNIGA,
    pisach: PISACH_NA_KNIGATA,
    ustroystvo: samolichnostta.otpechatak,
    valuta: VALUTA_NA_KNIGATA,
    aktor: () => aktor,
    sega: () => new Date().toISOString(),
  });
  const hranilishte = await osiguriHranilishte();
  // КОТВАТА се ЗАБИВАШЕ при всеки запис, а никой не я ЧЕТЕШЕ: единственото,
  // което пази от скъсяване отзад, беше построено и изключено на последната
  // крачка. Тук се ЧЕТЕ — и КАЗВА, вместо да дърпа крана: кранът живее в
  // ПАМЕТТА, причината му — в `localStorage`, тъй че се дърпа наново при всяко
  // зареждане, а `vazstanovi` няма нито един викащ. Едно фалшиво разминаване би
  // зазидало приложението завинаги само за четене (ADR-020 §5).
  const dumiteZaKotvata = kotvataKazva(kotva, KNIGA, await dnevnik.posledno(KNIGA));

  /**
   * ВРАТАТА · без имейл програмата не рисува нито един прозорец.
   *
   * Негово, 11.09 (запис 190): „Просто влизаш, няма роли, няма Стопанин…
   * Влизане с имейл." Дотук откриването живееше в таб Профил — тоест зад
   * екран, до който човек стига, СЛЕД като програмата вече е поискала да
   * пише. Първата крачка не бива да е в третата стая.
   *
   * Няма парола, няма акаунт, няма доставчик и няма нито един байт навън:
   * имейлът казва само КОЙ ПИШЕ в Журнала (правило 4 · подписът покрива
   * `actor`).
   */
  if (aktor.trim() === '') {
    narisuvayVlizaneto(ekran, {
      knigataEOtkrita: parvo !== undefined,
      stopaninat: parvo?.actor ?? '',
      vlez: async (imeyl) => {
        // КОЙ ПИШЕ се знае ПРЕДИ записа · командата „открий" сверява товара си
        // срещу актьора и отказва, ако не съвпадат. При отказ имейлът се връща
        // назад: човек, който не е влязъл, не бива да остане записан наполовина.
        const predi = aktor;
        aktor = imeyl;
        if (parvo === undefined) {
          const r = await porta.izpalni(crypto.randomUUID(), 'stopanin.otkriy', { imeyl });
          if ('otkaz' in r) {
            aktor = predi;
            return r.zashto.join(' ');
          }
        }
        zapomniEkranno(PAMET_AKTOR, imeyl);
        // екранът се строи наново ОТ НАЧАЛОТО · оттук нататък има кой да пише
        await tragni(ekran);
        return '';
      },
    });
    return;
  }

  sloji(
    ekran,
    h`
    <header class="glava">
      <!--
        ИМЕТО носи подробното за текущия прозорец (негово, 11.09, запис 151:
        „задържайки на името да се показва подробната информация") · сменя се с
        таба в narisuvayVednazh · с tabindex, за да идва и от клавиатурата.
      -->
      <h1 data-ime tabindex="0">Coretovia</h1>
      <p class="vest" data-vest></p>
      ${izborNaStepenHTML()}
      <!--
        ПЕЧАТЪТ · негово, лист Управление: бутонът „Свалифайл" обещава „различни
        таблици в ПДФ и в Ексел". Excel-ът го дава „Запази книгата"; ПДФ-ът го
        дава браузърът, без нито една нова библиотека (правило 9). Стилът за
        хартия е в app/stil.css под media print.
      -->
      <button type="button" class="vtorichen" data-pechat${podskazka(POMOSHT_NA_PECHATA)}>Печат</button>
      <!--
        ПАЗАЧЪТ НА ИСТОРИЯТА · стои В ГЛАВАТА, не в панел.
        Правило 31 вече отсъди веднъж: „предупреждение в панел, който човек не е
        отворил, не предупреждава никого" (ADR-136, отказан). Затова редът е
        тук, до броя на събитията, и се вижда без нито едно натискане.
      -->
      <div
        class="neprocheteno"
        data-neprocheteno
        hidden
        ${podskazkaSDumi(
          'Събития, които стоят в Журнала, но текущият Модел не може да ги приложи — например колона, която я няма. Формулата: прочетени = всички − непрочетени. Журналът е цял; щом причината отпадне, те се четат сами.',
        )}
      >
        <p data-neprocheteno-dumi></p>
        <ul data-neprocheteno-redove></ul>
      </div>
    </header>
    <nav class="lenta-prozortsi" data-prozortsi>
      ${PROZORTSI.map(
        (p) => h`<a href="#/${p.klyuch}" data-prozorets="${p.klyuch}" translate="no">${p.list}</a>`,
      )}
    </nav>
    <main class="prozorets" data-prozorets-tyalo></main>`,
  );

  const vest = ekran.querySelector<HTMLElement>('[data-vest]')!;
  const imeto = ekran.querySelector<HTMLElement>('h1[data-ime]')!;
  const izborNaStepen = ekran.querySelector<HTMLSelectElement>('.glava [data-pomosht-stepen]')!;
  const neprocheteno = ekran.querySelector<HTMLElement>('[data-neprocheteno]')!;
  const neprochetenoDumi = ekran.querySelector<HTMLElement>('[data-neprocheteno-dumi]')!;
  const neprochetenoRedove = ekran.querySelector<HTMLElement>('[data-neprocheteno-redove]')!;
  const glavnoTyalo = ekran.querySelector<HTMLElement>('[data-prozorets-tyalo]')!;
  // Всяко рисуване получава НОВ възел: слушателите, закачени на стария, си отиват с
  // него, вместо да се трупат и да отварят по две полета на един двоен клик.
  let tyalo: HTMLElement = glavnoTyalo;

  const k: KonteksNaEkrana = {
    porta,
    get tyalo() {
      return tyalo;
    },
    veriga: KNIGA,
    aktor: () => aktor,
    zadayAktor: (imeyl) => {
      aktor = imeyl;
      zapomniEkranno(PAMET_AKTOR, imeyl);
    },
    kotvata: () => dumiteZaKotvata,
    samolichnostta: () => samolichnostta,
    hranilishte: () =>
      `постоянство: ${hranilishte.postoyanstvo} · заето: ${kolkoMyasto(
        hranilishte.zaeto,
      )} от ${kolkoMyasto(hranilishte.pozvoleno)} · Вратата е ${vrata.zatvorena ? 'затворена' : 'отворена'}`,
    proveriVerigata: async () => {
      const r = await proveriVerigata(await dnevnik.chetiVsichki(KNIGA), sha256Web);
      return r.tsyala
        ? `Веригата е цяла · ${r.proverni} от ${r.proverni} звена.`
        : `Веригата се къса на seq ${r.parvoSchupeno} (${r.prichina}).`;
    },
    otpechatakNaBaytove: (baytove) => sha256NaBaytove(baytove),
    prerisuvay: () => narisuvay(),
  };

  const klyuchOtHasha = (): KlyuchNaProzorets => {
    const h = location.hash.replace(/^#\/?/, '');
    const p = PROZORTSI.find((x) => x.klyuch === h);
    if (p) return p.klyuch;
    return porta.ogledalo().stopanin === '' ? 'profil' : 'imoti';
  };

  // Рисуването НЕ се преплита: смяната на възела гони фокуса от старото поле, а
  // неговият `change` иска ново рисуване по средата на започнатото. Вложената
  // заявка се запомня и се изпълнява ВЕДНЪЖ, след като текущото свърши — иначе
  // външното рисуване довършва в откачен възел и екранът остава празен.
  let risuva = false;
  let pak = false;
  function narisuvay(): void {
    if (risuva) {
      pak = true;
      return;
    }
    risuva = true;
    try {
      narisuvayVednazh();
    } finally {
      risuva = false;
    }
    if (pak) {
      pak = false;
      narisuvay();
    }
  }

  function narisuvayVednazh(): void {
    const o = porta.ogledalo();
    vest.textContent =
      o.broySabitiya === 0
        ? 'Книгата е празна · 0 събития'
        : `${o.broySabitiya} събития в Журнала · ${o.stopanin}`;

    /*
     * ПАЗАЧЪТ НА ИСТОРИЯТА · вчерашната истина не изчезва мълчаливо.
     *
     * Дотук лентата казваше „сто събития", а данните можеха да са от
     * деветдесет и седем: сгъването знаеше кои три е пропуснало и защо, но
     * никой не го питаше. Тиха загуба е най-скъпата — няма как да се забележи.
     *
     * Думите идват от ЕДНО място (`neprochetenotoKazva`), тъй че се проверяват
     * с тест, без браузър, и не се разминават между прозорците (правило 14).
     */
    const nepr = neprochetenotoKazva(o);
    neprocheteno.hidden = nepr.nared;
    if (!nepr.nared) {
      neprochetenoDumi.textContent = nepr.dumi;
      sloji(neprochetenoRedove, h`${nepr.redove.map((r) => h`<li translate="no">${r}</li>`)}`);
    }
    const klyuch = klyuchOtHasha();
    // кутията от предишния екран увисва без котва · крие се преди новия възел
    skriyPodskazkata();
    // подробното върху името е за ТЕКУЩИЯ прозорец · `dataset` не минава през Trusted Types
    const stepen = stepenNaPomoshtta();
    imeto.dataset['podskazka'] = tekstNaPomoshtta(
      PROZORTSI.find((p) => p.klyuch === klyuch)!.pomosht,
      stepen,
    );
    // Настройки може да е сменил степента · селектът в главата казва същото
    izborNaStepen.value = stepen;
    for (const a of ekran!.querySelectorAll<HTMLElement>('[data-prozorets]')) {
      a.classList.toggle('tekusht', a.dataset['prozorets'] === klyuch);
    }
    zatvoriMenyuto();
    tyalo = document.createElement('div');
    tyalo.className = 'prozorets-tyalo';
    glavnoTyalo.replaceChildren(tyalo);
    narisuvayProzorets(klyuch, k);
  }

  window.addEventListener('hashchange', narisuvay);
  porta.abonirai(narisuvay);
  // подсказките и изборът на степен · веднъж, върху корена; тялото се сменя при всяко рисуване
  ekran.querySelector<HTMLButtonElement>('[data-pechat]')?.addEventListener('click', () => {
    window.print();
  });
  zakachiPodskazkite(ekran);
  zakachiIzboraNaStepen(ekran, narisuvay);
  narisuvay();

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(nashSkript('./sw.js')).catch(() => {
      /* без джоб · приложението пак работи, само не офлайн */
    });
  }
}

await main();
