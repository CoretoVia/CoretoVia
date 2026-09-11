# КАРТАТА · започни оттук

**Дата:** 2026-09-09 · **Вид:** карта · **Състояние:** генериран

> **Този файл се ГЕНЕРИРА.** Не го редактирай на ръка — пиши се `npm run karta`,
> а `npm run proverka` пада, ако е остарял. Описанието на всеки документ идва от
> самия него (заглавието и първия му абзац), затова не може да лъже.

---

## 1 · КЪДЕ СИ ПОПАДНАЛ

**Coretovia** е български счетоводен и имотен продукт, роден от ЕДНА екселска
книга. Всеки лист от нея е прозорец на програмата (К1) — осем от 05.09.2026,
единайсет от 11.09.2026 по неговата дума; кодът ги догонва в ход 8.0. Данните
живеят при клиента, не при нас (правило 21). Истината е Журнал само за добавяне;
всичко останало се смята от него.

**Трите закона, които не се нарушават:**

1. Журналът е само за добавяне — поправка е ново събитие (сторно).
2. Вратата е единственият вход за запис — нищо не пише в Журнала директно.
3. Парите са цели центове — никакъв плаващ знак, никога.

Пълните правила: `CLAUDE.md` (32 правила + К1 К2 К3). Те са конституция —
менят се само срещу довод ЗА КОДА (правило 32), и промяната се записва.

---

## 2 · РЕДЪТ НА ЧЕТЕНЕ · четири стъпала, всяко ражда следващото

```
ИЗВОРИТЕ          →  ЧИСТОТО ЗАДАНИЕ  →  АРХИТЕКТУРАТА  →  КОДЪТ
неговите думи,       филтърът на          как е устроено     по номера
както са казани      думите му
docs/izvori/         zadanie/CHISTO/      docs/15            src/ app/
```

И отделно, изведено ОТ КОДА: **`zadanie/FINALNO/`** — какво ПРАВИ програмата
днес, написано така, че ИИ, който не е виждал кода, да построи същото.

**Ако си нов и имаш пет минути:** `CLAUDE.md` → тази карта → `docs/14-dalgat.md`
(какво е отворено) → `docs/registar-na-vaprosite.json` (кой въпрос има отговор).

**Всеки документ носи шапка на ред 3** — дата · вид · състояние. Видовете са
22, затворен списък в `stroezh/karta.mjs`; състоянията са четири:
жив (поддържа се) · запис (замразен, не се пренаписва) · генериран (пише го
машина) · надживян (само в `docs/arhiv/`, с „Вместо него"). Нов документ има
четири форми: ADR · ден в `izvori/dni` · ден в `dnevnik` · именуван файл в
папката на вида си. Друга форма портата не пуска.

---

## 3 · КОЛКО СМЕ · броено, не преписано

| какво | колко | къде се брои |
| :---- | ---: | :---- |
| въпроса в регистъра | **187** | `npm run registar` |
| — с негов отговор | **75** | същото |
| — решени от кода | **31** | същото |
| — още открити | **15** | същото |
| — отпаднали | **9** | същото |
| — още неустановени | **57** | същото |
| реда в дълга | **307** | `docs/14-dalgat.md` |
| реда извори (неговите думи) | **3605** | `docs/izvori/` |

| документи по състояние | колко |
| :---- | ---: |
| жив | **108** |
| запис | **72** |
| надживян | **2** |

| документи по вид | колко |
| :---- | ---: |
| решение | **27** |
| думи-огледало | **23** |
| проучване | **21** |
| архитектура-къс | **19** |
| задание-чисто | **19** |
| доклад | **12** |
| задание-книга | **12** |
| указател | **9** |
| архитектура-част | **7** |
| задание-финално | **7** |
| думи-ден | **6** |
| запис-ден | **4** |
| думи-извор | **4** |
| витрина | **2** |
| план | **2** |
| гръбнак | **2** |
| план-на-сесията | **2** |
| конституция | **1** |
| протокол | **1** |
| дълг | **1** |
| регистър | **1** |

Числата на портите (тестове, обходи, модули, лицензи) НЕ стоят тук: те се броят
от `npm run proverka` в мига, в който я пуснеш. Число в документ остарява;
число от команда — не (правило 14).

---

## 4 · ВСИЧКИТЕ ДОКУМЕНТИ · нито един извън картата · всеки с вида и състоянието си

### коренът · КОРЕНЪТ · конституцията и витрината

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`CLAUDE.md`](../CLAUDE.md) | конституция · жив | CLAUDE.md · правилата на Coretovia |
| [`README.md`](../README.md) | витрина · жив | Coretovia |
| [`SECURITY.md`](../SECURITY.md) | витрина · жив | Сигурност · как се докладва уязвимост |

### zadanie/ · ЗАДАНИЕТО · Книгата му, клетка по клетка (К1)

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-obshto.md`](../zadanie/00-obshto.md) | указател · жив | Заданието · Книгата е Заданието |
| [`01-profil.md`](../zadanie/01-profil.md) | задание-книга · жив | 1 · Профил |
| [`02-imoti-obekti-biznesi.md`](../zadanie/02-imoti-obekti-biznesi.md) | задание-книга · жив | 2 · ИмотиОбектиБизнеси |
| [`03-upravlenie-dela-prepiski.md`](../zadanie/03-upravlenie-dela-prepiski.md) | задание-книга · жив | 3 · УправлениеДелаПреписки |
| [`04-smetki.md`](../zadanie/04-smetki.md) | задание-книга · жив | 4 · Сметки |
| [`05-sluzhiteli.md`](../zadanie/05-sluzhiteli.md) | задание-книга · жив | 5 · Служители |
| [`06-prodazhbi.md`](../zadanie/06-prodazhbi.md) | задание-книга · жив | 6 · Продажби |
| [`07-ii.md`](../zadanie/07-ii.md) | задание-книга · жив | 7 · ИИ |
| [`08-nastroyki.md`](../zadanie/08-nastroyki.md) | задание-книга · жив | 8 · Настройки(Стопанин) |
| [`09-izklyucheno.md`](../zadanie/09-izklyucheno.md) | задание-книга · жив | 9 · Какво НЕ е в Книгата · и затова не се строи |
| [`10-dopalneniya-05-09.md`](../zadanie/10-dopalneniya-05-09.md) | задание-книга · жив | 10 · Допълненията от 05.09.2026 · три неща към Книгата |
| [`11-dopalneniya-05-09-b.md`](../zadanie/11-dopalneniya-05-09-b.md) | задание-книга · жив | 11 · Втората добавка от 05.09.2026 · три неща към Управление и Сметки |
| [`12-dopalneniya-08-09.md`](../zadanie/12-dopalneniya-08-09.md) | задание-книга · жив | 12 · Добавката от 08.09.2026 · двата пътя на парите и обликът |

### zadanie/CHISTO/ · ЧИСТОТО ЗАДАНИЕ · филтърът на думите му · какво ТРЯБВА да прави програмата

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-CHETI-PARVO.md`](../zadanie/CHISTO/00-CHETI-PARVO.md) | указател · жив | ЧИСТОТО ЗАДАНИЕ · какво трябва да прави програмата |
| [`01-imoti-i-portfeyl.md`](../zadanie/CHISTO/01-imoti-i-portfeyl.md) | задание-чисто · жив | M01 · Имоти и портфейл |
| [`02-naemi-i-dogovori.md`](../zadanie/CHISTO/02-naemi-i-dogovori.md) | задание-чисто · жив | M02 · Наеми и договори |
| [`03-prodazhbi-i-sdelki.md`](../zadanie/CHISTO/03-prodazhbi-i-sdelki.md) | задание-чисто · жив | M03 · Продажби и сделки |
| [`04-krediti-i-finansirane.md`](../zadanie/CHISTO/04-krediti-i-finansirane.md) | задание-чисто · жив | M04 · Кредити и финансиране |
| [`05-schetovodstvo-i-glavna-kniga.md`](../zadanie/CHISTO/05-schetovodstvo-i-glavna-kniga.md) | задание-чисто · жив | M05 · Счетоводство и главна книга |
| [`06-plashtaniya-i-vzemaniya.md`](../zadanie/CHISTO/06-plashtaniya-i-vzemaniya.md) | задание-чисто · жив | M06 · Плащания и вземания |
| [`07-proekti-dela-i-grafik.md`](../zadanie/CHISTO/07-proekti-dela-i-grafik.md) | задание-чисто · жив | M07 · Проекти, дела и график (Гант) |
| [`08-dostavchitsi-i-razhodi.md`](../zadanie/CHISTO/08-dostavchitsi-i-razhodi.md) | задание-чисто · жив | M08 · Доставчици и разходи по обект |
| [`09-dokumenti-i-dosieta.md`](../zadanie/CHISTO/09-dokumenti-i-dosieta.md) | задание-чисто · жив | M09 · Документи и досиета |
| [`10-kontakti-i-prepiski.md`](../zadanie/CHISTO/10-kontakti-i-prepiski.md) | задание-чисто · жив | M10 · Контакти и преписки |
| [`11-otcheti-tabla-i-analizi.md`](../zadanie/CHISTO/11-otcheti-tabla-i-analizi.md) | задание-чисто · жив | M11 · Отчети, табла и анализи |
| [`12-model-na-dannite.md`](../zadanie/CHISTO/12-model-na-dannite.md) | задание-чисто · жив | M12 · Модел на данните |
| [`13-dostap-roli-i-naemateli.md`](../zadanie/CHISTO/13-dostap-roli-i-naemateli.md) | задание-чисто · жив | M13 · Достъп, роли и много наематели |
| [`14-zapis-zhurnal-i-vrashtane.md`](../zadanie/CHISTO/14-zapis-zhurnal-i-vrashtane.md) | задание-чисто · жив | M14 · Запис, журнал и връщане назад |
| [`15-interfeys-i-izgledi.md`](../zadanie/CHISTO/15-interfeys-i-izgledi.md) | задание-чисто · жив | M15 · Интерфейс и изгледи |
| [`16-nastroyki-i-nomenklaturi.md`](../zadanie/CHISTO/16-nastroyki-i-nomenklaturi.md) | задание-чисто · жив | M16 · Настройки и номенклатури |
| [`17-vnos-iznos-i-vrazki.md`](../zadanie/CHISTO/17-vnos-iznos-i-vrazki.md) | задание-чисто · жив | M17 · Внос, износ и връзки |
| [`18-sigurnost-i-saotvetstvie.md`](../zadanie/CHISTO/18-sigurnost-i-saotvetstvie.md) | задание-чисто · жив | M18 · Сигурност и съответствие |
| [`19-nositel-sreda-i-razgrashtane.md`](../zadanie/CHISTO/19-nositel-sreda-i-razgrashtane.md) | задание-чисто · жив | M19 · Носител, среда и разгръщане |

### zadanie/FINALNO/ · ФИНАЛНОТО ЗАДАНИЕ · какво ПРАВИ програмата, изведено от кода

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-CHETI-PARVO.md`](../zadanie/FINALNO/00-CHETI-PARVO.md) | указател · жив | ФИНАЛНОТО ЗАДАНИЕ · какво трябва да прави програмата |
| [`02-dvigatelyat.md`](../zadanie/FINALNO/02-dvigatelyat.md) | задание-финално · жив | ДВИГАТЕЛЯТ · как се пази истината |
| [`03-modelat.md`](../zadanie/FINALNO/03-modelat.md) | задание-финално · жив | МОДЕЛЪТ · таблиците, колоните, номенклатурите, номерацията |
| [`04-smetachat.md`](../zadanie/FINALNO/04-smetachat.md) | задание-финално · жив | СМЕТАЧЪТ |
| [`05-knigata.md`](../zadanie/FINALNO/05-knigata.md) | задание-финално · жив | КНИГАТА · вход и изход, и Сверчикът |
| [`06-prozortsite.md`](../zadanie/FINALNO/06-prozortsite.md) | задание-финално · жив | ОСЕМТЕ ПРОЗОРЕЦА |
| [`07-ekranat.md`](../zadanie/FINALNO/07-ekranat.md) | задание-финално · жив | ЕКРАНЪТ · решетката, редакцията, правото, подсказките |
| [`08-proverkite.md`](../zadanie/FINALNO/08-proverkite.md) | задание-финално · жив | ПРОВЕРКИТЕ · как програмата пази себе си |

### docs/izvori/ · ИЗВОРИТЕ · неговите думи, както са казани

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-OTKADE-SA.md`](../docs/izvori/00-OTKADE-SA.md) | указател · жив | 00 · ОТКЪДЕ СА ИЗВОРИТЕ · и какво е пипнато |
| [`00-kak-rabotyat.md`](../docs/izvori/00-kak-rabotyat.md) | указател · жив | Изворите · как работят |
| [`01-chist-dopiska.md`](../docs/izvori/01-chist-dopiska.md) | думи-извор · запис | ИЗВОР-1 · ДОПИСКА · 22.08 → нататък |
| [`02-po-temi.md`](../docs/izvori/02-po-temi.md) | думи-извор · запис | ИЗВОР-2 · ПО ТЕМИ · последната дума е в сила |
| [`03-koloni-hedari-tablitsi.md`](../docs/izvori/03-koloni-hedari-tablitsi.md) | думи-извор · запис | ИЗВОР-3 · ЕДНАТА ОБЩА ТЕМА |
| [`04-prozortsite-i-vrazkite.md`](../docs/izvori/04-prozortsite-i-vrazkite.md) | думи-извор · запис | ИЗВОР-4 · ПРОЗОРЦИТЕ И ВРЪЗКИТЕ · картата на сигнала |

### docs/izvori/dni/ · ДУМИТЕ МУ ПО ДНИ · от 10.09.2026 · журнал, само добавяне · домът им

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`2026-09-06.md`](../docs/izvori/dni/2026-09-06.md) | думи-ден · запис | 2026-09-06 · неговите думи · ДОСЛОВНО |
| [`2026-09-07.md`](../docs/izvori/dni/2026-09-07.md) | думи-ден · запис | 2026-09-07 · неговите думи · ДОСЛОВНО |
| [`2026-09-08.md`](../docs/izvori/dni/2026-09-08.md) | думи-ден · запис | 2026-09-08 · неговите думи · ДОСЛОВНО |
| [`2026-09-09.md`](../docs/izvori/dni/2026-09-09.md) | думи-ден · запис | 2026-09-09 · неговите думи · ДОСЛОВНО |
| [`2026-09-10.md`](../docs/izvori/dni/2026-09-10.md) | думи-ден · запис | 2026-09-10 · неговите думи · ДОСЛОВНО |
| [`2026-09-11.md`](../docs/izvori/dni/2026-09-11.md) | думи-ден · запис | 2026-09-11 · неговите думи · ДОСЛОВНО |

### docs/izvori/temi/ · ДУМИТЕ МУ ПО ТЕМИ · огледало на изворите, по деветнайсетте теми

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`01-imoti-i-portfeyl.md`](../docs/izvori/temi/01-imoti-i-portfeyl.md) | думи-огледало · запис | M01 · довършеният му текст |
| [`02-naemi-i-dogovori.md`](../docs/izvori/temi/02-naemi-i-dogovori.md) | думи-огледало · запис | M02 · довършеният му текст |
| [`03-prodazhbi-i-sdelki.md`](../docs/izvori/temi/03-prodazhbi-i-sdelki.md) | думи-огледало · запис | M03 · довършеният му текст |
| [`04-krediti-i-finansirane.md`](../docs/izvori/temi/04-krediti-i-finansirane.md) | думи-огледало · запис | M04 · довършеният му текст |
| [`05-schetovodstvo-i-glavna-kniga.md`](../docs/izvori/temi/05-schetovodstvo-i-glavna-kniga.md) | думи-огледало · запис | M05 · довършеният му текст |
| [`06-plashtaniya-i-vzemaniya.md`](../docs/izvori/temi/06-plashtaniya-i-vzemaniya.md) | думи-огледало · запис | M06 · довършеният му текст |
| [`07-proekti-dela-i-grafik.md`](../docs/izvori/temi/07-proekti-dela-i-grafik.md) | думи-огледало · запис | M07 · довършеният му текст |
| [`08-dostavchitsi-i-razhodi.md`](../docs/izvori/temi/08-dostavchitsi-i-razhodi.md) | думи-огледало · запис | M08 · довършеният му текст |
| [`09-dokumenti-i-dosieta.md`](../docs/izvori/temi/09-dokumenti-i-dosieta.md) | думи-огледало · запис | M09 · довършеният му текст |
| [`10-kontakti-i-prepiski.md`](../docs/izvori/temi/10-kontakti-i-prepiski.md) | думи-огледало · запис | M10 · довършеният му текст |
| [`11-otcheti-tabla-i-analizi.md`](../docs/izvori/temi/11-otcheti-tabla-i-analizi.md) | думи-огледало · запис | M11 · довършеният му текст |
| [`12-model-na-dannite.md`](../docs/izvori/temi/12-model-na-dannite.md) | думи-огледало · запис | M12 · довършеният му текст |
| [`13-dostap-roli-i-naemateli.md`](../docs/izvori/temi/13-dostap-roli-i-naemateli.md) | думи-огледало · запис | M13 · довършеният му текст |
| [`14-zapis-zhurnal-i-vrashtane.md`](../docs/izvori/temi/14-zapis-zhurnal-i-vrashtane.md) | думи-огледало · запис | M14 · довършеният му текст |
| [`15-interfeys-i-izgledi.md`](../docs/izvori/temi/15-interfeys-i-izgledi.md) | думи-огледало · запис | M15 · довършеният му текст |
| [`16-nastroyki-i-nomenklaturi.md`](../docs/izvori/temi/16-nastroyki-i-nomenklaturi.md) | думи-огледало · запис | M16 · довършеният му текст |
| [`17-vnos-iznos-i-vrazki.md`](../docs/izvori/temi/17-vnos-iznos-i-vrazki.md) | думи-огледало · запис | M17 · довършеният му текст |
| [`18-sigurnost-i-saotvetstvie.md`](../docs/izvori/temi/18-sigurnost-i-saotvetstvie.md) | думи-огледало · запис | M18 · довършеният му текст |
| [`19-nositel-sreda-i-razgrashtane.md`](../docs/izvori/temi/19-nositel-sreda-i-razgrashtane.md) | думи-огледало · запис | M19 · довършеният му текст |

### docs/ · РЕШЕНИЯТА · какво е решено и защо · планът · дългът · гръбнакът

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-CHETI-PARVO.md`](../docs/00-CHETI-PARVO.md) | указател · жив | 000 · ЧЕТИ ПЪРВО · входната врата на Coretovia |
| [`00-PROTOKOL.md`](../docs/00-PROTOKOL.md) | протокол · жив | ПРОТОКОЛЪТ НА УМЕНИЯТА · какво СЕ ЧЕТЕ, преди да се пипне |
| [`03-plan.md`](../docs/03-plan.md) | план · жив | ПЛАН ЗА ИЗПЪЛНЕНИЕ · ходовете на Coretovia · и резените, на които стъпват |
| [`10-kakvo-chaka.md`](../docs/10-kakvo-chaka.md) | думи-огледало · запис | 10 · Какво чака · и докъде сме стигнали |
| [`12-doklad-za-predavane.md`](../docs/12-doklad-za-predavane.md) | доклад · запис | 12 · ДОКЛАД ЗА ПРЕДАВАНЕ · Coretovia |
| [`13-redat-predi-koda.md`](../docs/13-redat-predi-koda.md) | проучване · запис | 13 · Редът преди кода · планът за чисто кодиране |
| [`14-dalgat.md`](../docs/14-dalgat.md) | дълг · жив | 14 · ДЪЛГЪТ · единственият дом на чакащото |
| [`15-arhitekturata.md`](../docs/15-arhitekturata.md) | гръбнак · жив | 15 · АРХИТЕКТУРАТА · гръбнакът |
| [`16-dvizhenieto-i-sastoyanieto.md`](../docs/16-dvizhenieto-i-sastoyanieto.md) | проучване · запис | 16 · Движението и Състоянието · проверка на модела и въпросите към него |
| [`17-pravoto-po-sektsii.md`](../docs/17-pravoto-po-sektsii.md) | проучване · запис | 17 · Правото по СЕКЦИИ от редове · петата ос |
| [`18-otgovorite-i-nahodkite-08-09.md`](../docs/18-otgovorite-i-nahodkite-08-09.md) | думи-огледало · запис | 18 · Отговорите от 08.09 вечерта · и какво намери проверката |
| [`19-umeniyata-firmata-i-nepopitanoto.md`](../docs/19-umeniyata-firmata-i-nepopitanoto.md) | проучване · запис | 19 · Уменията · Фирмата като граница · и въпросите към тях |
| [`20-firmata-invariantat-i-dvata-vaprosa.md`](../docs/20-firmata-invariantat-i-dvata-vaprosa.md) | проучване · запис | 20 · Фирмата · новият инвариант · и двата въпроса, обяснени с пример |
| [`21-nepopitanoto.md`](../docs/21-nepopitanoto.md) | проучване · запис | 21 · НЕПОПИТАНОТО · какво стои в Книгата и никой не го е върнал |
| [`22-litseto-trezorat-i-dvata-rezhima.md`](../docs/22-litseto-trezorat-i-dvata-rezhima.md) | проучване · запис | 22 · Стопанинът е ДЛЪЖНОСТ · Трезорът · двата режима · и преносът от MasterBook |
| [`23-helpat-dvete-stepeni.md`](../docs/23-helpat-dvete-stepeni.md) | проучване · запис | 23 · ХЕЛПЪТ · двете степени · и правилото, че се обновява с кода |
| [`24-tablitsata-i-diagramata.md`](../docs/24-tablitsata-i-diagramata.md) | проучване · запис | 24 · Таблицата и Диаграмата · ЕДНО цяло |
| [`25-planat-i-vaprosite.md`](../docs/25-planat-i-vaprosite.md) | проучване · запис | 25 · ПЪЛНИЯТ ПЛАН · и въпросите с тикчета |
| [`26-zhurnalat-valutata-i-dvata-vaprosa.md`](../docs/26-zhurnalat-valutata-i-dvata-vaprosa.md) | проучване · запис | 26 · Къде живее Журналът · валутата и езиците · и двата въпроса, зададени по-добре |
| [`27-faylovete-i-valutata.md`](../docs/27-faylovete-i-valutata.md) | решение · жив | 27 · ФАЙЛОВЕТЕ И ВАЛУТАТА · двете необратими решения |
| [`28-chetirite-otgovora-09-09.md`](../docs/28-chetirite-otgovora-09-09.md) | думи-огледало · запис | 28 · ЧЕТИРИТЕ ОТГОВОРА · 09.09.2026 вечерта |
| [`29-devette-otgovora-09-09.md`](../docs/29-devette-otgovora-09-09.md) | думи-огледало · запис | 29 · ДЕВЕТТЕ ОТГОВОРА · 09.09.2026 · нощта |
| [`30-faktura-ot-telefon.md`](../docs/30-faktura-ot-telefon.md) | решение · жив | 30 · ФАКТУРАТА ОТ ТЕЛЕФОН · папката, сканирането и всеки участник |
| [`33-koefitsientite-i-orientirat.md`](../docs/33-koefitsientite-i-orientirat.md) | проучване · запис | 33 · КОЕФИЦИЕНТИТЕ · ОРИЕНТИРЪТ · и СВОЯТА ФОРМУЛА |
| [`34-desetiyat-tip-strukturata.md`](../docs/34-desetiyat-tip-strukturata.md) | решение · жив | 34 · ДЕСЕТИЯТ ТИП · структурата има история като всичко друго |
| [`35-dovarshvaneto-1893-imenno.md`](../docs/35-dovarshvaneto-1893-imenno.md) | проучване · запис | 35 · ДОВЪРШВАНЕТО · 1893 неща, отворени поименно |
| [`ADR-001-nasledstvoto-i-granitsite.md`](../docs/ADR-001-nasledstvoto-i-granitsite.md) | решение · жив | ADR-001 · Наследството от MasterBook · границите на слоевете · регистърът на преноса |
| [`ADR-002-exceljs.md`](../docs/ADR-002-exceljs.md) | решение · жив | ADR-002 · Първата библиотека · ExcelJS · Книгата се отваря в Excel като неговата |
| [`ADR-003-modelat-kato-danni.md`](../docs/ADR-003-modelat-kato-danni.md) | решение · жив | ADR-003 · Моделът като данни · номенклатурите · каталогът и Портата · колонното Огледало · Книгата на изход |
| [`ADR-004-knigata-na-vhod-i-sverchikat.md`](../docs/ADR-004-knigata-na-vhod-i-sverchikat.md) | решение · жив | ADR-004 · Книгата на вход · Сверчикът · предложението е данни · ИИ |
| [`ADR-005-upravlenie-darvoto-i-gantat.md`](../docs/ADR-005-upravlenie-darvoto-i-gantat.md) | решение · жив | ADR-005 · Управление · дървото Имот → Обект/Бизнес → Задача · филтърът и СБОРЪТ · Гантът |
| [`ADR-006-smetki-znakat-sektsiite-i-keshat.md`](../docs/ADR-006-smetki-znakat-sektsiite-i-keshat.md) | решение · жив | ADR-006 · Сметки · знакът решава страната · секциите · кешът за месеца |
| [`ADR-007-dds-i-podtab-nap.md`](../docs/ADR-007-dds-i-podtab-nap.md) | решение · жив | ADR-007 · ДДС като ред по знака · подтаб НАП · таблицата с находки |
| [`ADR-008-sluzhitelite-i-pravoto.md`](../docs/ADR-008-sluzhitelite-i-pravoto.md) | решение · жив | ADR-008 · Служителите · Длъжността с четири оси · правото само СТЕСНЯВА |
| [`ADR-009-otgovornikat-i-koy-razdava-dlazhnosti.md`](../docs/ADR-009-otgovornikat-i-koy-razdava-dlazhnosti.md) | решение · жив | ADR-009 · Отговорникът на задачата · и кой РАЗДАВА Длъжности |
| [`ADR-010-prodazhbite-proverkata-i-sastoyanieto.md`](../docs/ADR-010-prodazhbite-proverkata-i-sastoyanieto.md) | решение · жив | ADR-010 · Продажбите · проверката се СМЯТА · завършена и активна таблица |
| [`ADR-011-trite-mu-otgovora-05-09.md`](../docs/ADR-011-trite-mu-otgovora-05-09.md) | решение · жив | ADR-011 · Трите въпроса, затворени от него · Акт 16 завършва продажбата |
| [`ADR-012-kalkulatorat-nad-prodazhbite.md`](../docs/ADR-012-kalkulatorat-nad-prodazhbite.md) | решение · жив | ADR-012 · Калкулаторът над Продажбите · трите подхода и съгласуването |
| [`ADR-013-formulite-i-sverkata-sreshtu-kesha.md`](../docs/ADR-013-formulite-i-sverkata-sreshtu-kesha.md) | решение · жив | ADR-013 · Формулите · свой парсер, ТОЧЕН сметач и сверка срещу кеша на Excel |
| [`ADR-014-otvori-i-zapazi-modelite-na-ekrana.md`](../docs/ADR-014-otvori-i-zapazi-modelite-na-ekrana.md) | решение · жив | ADR-014 · Отвори и Запази · моделът е ИМЕНУВАН поглед |
| [`ADR-015-skritite-defekti-v-samite-proverki.md`](../docs/ADR-015-skritite-defekti-v-samite-proverki.md) | решение · жив | ADR-015 · Скритите дефекти в самите проверки · шест нови обхода |
| [`ADR-016-portite-veche-meryat.md`](../docs/ADR-016-portite-veche-meryat.md) | решение · жив | ADR-016 · Портите вече МЕРЯТ · и са доказани |
| [`ADR-017-dublirano-po-forma-i-edin-dom-na-zakraglyaneto.md`](../docs/ADR-017-dublirano-po-forma-i-edin-dom-na-zakraglyaneto.md) | решение · жив | ADR-017 · Дублирано по ФОРМА · и един дом на закръглянето |
| [`ADR-018-obeshtanieto-nadzhivyava-rezena-si.md`](../docs/ADR-018-obeshtanieto-nadzhivyava-rezena-si.md) | решение · жив | ADR-018 · Обещанието надживява резена си |
| [`ADR-019-zapechatanata-vrata.md`](../docs/ADR-019-zapechatanata-vrata.md) | решение · жив | ADR-019 · Запечатаната врата · и защо тя е ПРЕДИ печата |
| [`ADR-020-odityt-97-nahodki-11-otseleli.md`](../docs/ADR-020-odityt-97-nahodki-11-otseleli.md) | решение · жив | ADR-020 · Одитът · 97 находки, 11 оцелели |
| [`ADR-021-kotvata-kazva-i-portata-hape.md`](../docs/ADR-021-kotvata-kazva-i-portata-hape.md) | решение · жив | ADR-021 · Котвата КАЗВА · и портата вече хапе |
| [`ADR-022-proizhodat-edin-proekt-edin-svyat.md`](../docs/ADR-022-proizhodat-edin-proekt-edin-svyat.md) | решение · жив | ADR-022 · Произходът · един проект, един свят |
| [`ADR-023-pette-resheniya-06-09-vecherta.md`](../docs/ADR-023-pette-resheniya-06-09-vecherta.md) | решение · жив | ADR-023 · Петте му решения от 06.09 вечерта |
| [`ADR-024-chetirite-neobratimi.md`](../docs/ADR-024-chetirite-neobratimi.md) | решение · жив | ADR-024 · Четирите необратими решения |
| [`registar-na-prenosa.md`](../docs/registar-na-prenosa.md) | регистър · жив | Регистърът на преноса · всеки стар файл с ТОЧНО една присъда |

### docs/arhitektura/ · АРХИТЕКТУРАТА ПО ТЕМИ · деветнайсетте къса

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`01-imoti-i-portfeyl.md`](../docs/arhitektura/01-imoti-i-portfeyl.md) | архитектура-къс · жив | M01 · архитектурният къс |
| [`02-naemi-i-dogovori.md`](../docs/arhitektura/02-naemi-i-dogovori.md) | архитектура-къс · жив | M02 · архитектурният къс |
| [`03-prodazhbi-i-sdelki.md`](../docs/arhitektura/03-prodazhbi-i-sdelki.md) | архитектура-къс · жив | M03 · архитектурният къс |
| [`04-krediti-i-finansirane.md`](../docs/arhitektura/04-krediti-i-finansirane.md) | архитектура-къс · жив | M04 · архитектурният къс |
| [`05-schetovodstvo-i-glavna-kniga.md`](../docs/arhitektura/05-schetovodstvo-i-glavna-kniga.md) | архитектура-къс · жив | M05 · архитектурният къс |
| [`06-plashtaniya-i-vzemaniya.md`](../docs/arhitektura/06-plashtaniya-i-vzemaniya.md) | архитектура-къс · жив | M06 · архитектурният къс |
| [`07-proekti-dela-i-grafik.md`](../docs/arhitektura/07-proekti-dela-i-grafik.md) | архитектура-къс · жив | M07 · архитектурният къс |
| [`08-dostavchitsi-i-razhodi.md`](../docs/arhitektura/08-dostavchitsi-i-razhodi.md) | архитектура-къс · жив | M08 · архитектурният къс |
| [`09-dokumenti-i-dosieta.md`](../docs/arhitektura/09-dokumenti-i-dosieta.md) | архитектура-къс · жив | M09 · архитектурният къс |
| [`10-kontakti-i-prepiski.md`](../docs/arhitektura/10-kontakti-i-prepiski.md) | архитектура-къс · жив | M10 · архитектурният къс |
| [`11-otcheti-tabla-i-analizi.md`](../docs/arhitektura/11-otcheti-tabla-i-analizi.md) | архитектура-къс · жив | M11 · архитектурният къс |
| [`12-model-na-dannite.md`](../docs/arhitektura/12-model-na-dannite.md) | архитектура-къс · жив | M12 · архитектурният къс |
| [`13-dostap-roli-i-naemateli.md`](../docs/arhitektura/13-dostap-roli-i-naemateli.md) | архитектура-къс · жив | M13 · архитектурният къс |
| [`14-zapis-zhurnal-i-vrashtane.md`](../docs/arhitektura/14-zapis-zhurnal-i-vrashtane.md) | архитектура-къс · жив | M14 · архитектурният къс |
| [`15-interfeys-i-izgledi.md`](../docs/arhitektura/15-interfeys-i-izgledi.md) | архитектура-къс · жив | M15 · архитектурният къс |
| [`16-nastroyki-i-nomenklaturi.md`](../docs/arhitektura/16-nastroyki-i-nomenklaturi.md) | архитектура-къс · жив | M16 · архитектурният къс |
| [`17-vnos-iznos-i-vrazki.md`](../docs/arhitektura/17-vnos-iznos-i-vrazki.md) | архитектура-къс · жив | M17 · архитектурният къс |
| [`18-sigurnost-i-saotvetstvie.md`](../docs/arhitektura/18-sigurnost-i-saotvetstvie.md) | архитектура-къс · жив | M18 · архитектурният къс |
| [`19-nositel-sreda-i-razgrashtane.md`](../docs/arhitektura/19-nositel-sreda-i-razgrashtane.md) | архитектура-къс · жив | M19 · архитектурният къс |

### docs/arhitektura/chasti/ · АРХИТЕКТУРАТА НАПРЕЧНО · седемте части

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`1-pravilata.md`](../docs/arhitektura/chasti/1-pravilata.md) | архитектура-част · жив | ЧАСТ 1 · ПРАВИЛАТА, КОИТО НЕ СЕ НАРУШАВАТ |
| [`2-kartata-na-modulite.md`](../docs/arhitektura/chasti/2-kartata-na-modulite.md) | архитектура-част · жив | ЧАСТ 2 · КАРТАТА НА МОДУЛИТЕ |
| [`3-modelat-na-dannite.md`](../docs/arhitektura/chasti/3-modelat-na-dannite.md) | архитектура-част · жив | ЧАСТ 3 · МОДЕЛЪТ НА ДАННИТЕ · всички същности НАПРЕЧНО |
| [`4-sabitiyata.md`](../docs/arhitektura/chasti/4-sabitiyata.md) | архитектура-част · жив | ЧАСТ 4 · СЪБИТИЯТА · каталогът и схемата им |
| [`5-invariantite.md`](../docs/arhitektura/chasti/5-invariantite.md) | архитектура-част · жив | ЧАСТ 5 · ИНВАРИАНТИТЕ · и КОЙ ГО ПАЗИ |
| [`6-kak-se-chupi.md`](../docs/arhitektura/chasti/6-kak-se-chupi.md) | архитектура-част · жив | ЧАСТ 6 · ИЗВЕСТНИТЕ НАЧИНИ ДА СЕ СЧУПИ |
| [`7-redat-na-izgrazhdane.md`](../docs/arhitektura/chasti/7-redat-na-izgrazhdane.md) | архитектура-част · жив | ЧАСТ 7 · РЕДЪТ НА ИЗГРАЖДАНЕ · по номера |

### docs/dnevnik/ · ДНЕВНИКЪТ · какво стана, по дни · `npm run nachalo` го отваря, `npm run kray` го затваря

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`2026-09-05.md`](../docs/dnevnik/2026-09-05.md) | запис-ден · запис | 2026-09-05 · резени 0 → 5в · скелетът · Моделът · Книгата · Управление и Сметки · Служители · Продажби |
| [`2026-09-06.md`](../docs/dnevnik/2026-09-06.md) | запис-ден · запис | 2026-09-06 · резени 5б → 6р · формулите · моделите · доказаните обходи · вратата · одитът · котвата |
| [`2026-09-10-plan-sistemata-na-rabota.md`](../docs/dnevnik/2026-09-10-plan-sistemata-na-rabota.md) | план-на-сесията · запис | ПЛАН · 2026-09-10 · системата на работа |
| [`2026-09-10.md`](../docs/dnevnik/2026-09-10.md) | запис-ден · запис | 2026-09-10 · ход 2 затворен · 1893 неща отворени поименно · и системата на работа се роди |
| [`2026-09-11-plan-biznes-1-0.md`](../docs/dnevnik/2026-09-11-plan-biznes-1-0.md) | план-на-сесията · запис | ПЛАН · 2026-09-11 · „Семеен/Малък Бизнес 1.0" · пълният път до работеща версия за неговия бизнес · Стопанинът + 7 служители |
| [`2026-09-11.md`](../docs/dnevnik/2026-09-11.md) | запис-ден · запис | 2026-09-11 · осемте му точки за Сметки и календара · след полунощ |

### docs/dokladi/ · ДОКЛАДИТЕ · проверките, цели

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-spisak.md`](../docs/dokladi/00-spisak.md) | указател · жив | 00 · ДОКЛАДИТЕ · пълните проверки, съхранени цели |
| [`00a-sedemte-akaunta-i-protsentat.md`](../docs/dokladi/00a-sedemte-akaunta-i-protsentat.md) | доклад · запис | Доклад 0а · Седемте акаунта · процентът до алфа 1.0 · и подходът |
| [`00b-oditat-46-agenta.md`](../docs/dokladi/00b-oditat-46-agenta.md) | доклад · запис | Доклад 0б · ОДИТЪТ · 46 агента над целия проект |
| [`01-pravoto-po-sektsii.md`](../docs/dokladi/01-pravoto-po-sektsii.md) | доклад · запис | Доклад 1 · Правото по СЕКЦИИ от редове |
| [`02-umeniya-otcheti-sastoyaniya.md`](../docs/dokladi/02-umeniya-otcheti-sastoyaniya.md) | доклад · запис | Доклад 2 · Умения · Отчети · Състояния · Мрежа · Уволнение |
| [`03-firmata-i-nepopitanoto.md`](../docs/dokladi/03-firmata-i-nepopitanoto.md) | доклад · запис | Доклад 3 · Фирмата като граница · Бизнес Моделите · и НЕПОПИТАНОТО |
| [`04-finansite-i-otchetite.md`](../docs/dokladi/04-finansite-i-otchetite.md) | доклад · запис | Доклад 4 · Финансите и отчетите · истинските счетоводни величини |
| [`05-zakonat-na-ii-i-umeniyata.md`](../docs/dokladi/05-zakonat-na-ii-i-umeniyata.md) | доклад · запис | Доклад 5 · Законът на ИИ срещу Умението · документите · контрагентите |
| [`06-propuskite-ot-arhiva.md`](../docs/dokladi/06-propuskite-ot-arhiva.md) | доклад · запис | Доклад 6 · Пропуските · архивът, пазарът, регистърът, MasterBook, неговите думи, ADR-ите |
| [`07-redat-na-kodirane.md`](../docs/dokladi/07-redat-na-kodirane.md) | доклад · запис | Доклад 7 · Редът на кодиране · зависимостите, необратимото, резените и темите за комитите |
| [`08-finalnoto-zadanie.md`](../docs/dokladi/08-finalnoto-zadanie.md) | доклад · запис | Доклад 8 · ФИНАЛНОТО ЗАДАНИЕ · пълен |
| [`09-tablitsata-i-diagramata-CHASTICHEN.md`](../docs/dokladi/09-tablitsata-i-diagramata-CHASTICHEN.md) | доклад · запис | Доклад 9 · Таблицата и Диаграмата · ЧАСТИЧЕН (2 от 7 агента) |

### docs/pazar/ · ПАЗАРЪТ · проучванията за продукта и продажбата

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-otkade-e.md`](../docs/pazar/00-otkade-e.md) | указател · жив | Пазарът · откъде е и какво е надживяно |
| [`01-pazar-i-konkurentsiya.md`](../docs/pazar/01-pazar-i-konkurentsiya.md) | проучване · запис | Пазарът и конкуренцията · какво са избрали другите и какво значи за нас |
| [`02-produktov-model.md`](../docs/pazar/02-produktov-model.md) | проучване · запис | ADR-004 · Безплатен е АКАУНТЪТ, и входът е без парола |
| [`03-dvata-kriteriya.md`](../docs/pazar/03-dvata-kriteriya.md) | проучване · запис | ADR-007 · Двата критерия · матрица, не стълба |
| [`04-tridesette-dni-probvane.md`](../docs/pazar/04-tridesette-dni-probvane.md) | проучване · запис | ADR-092 · Тридесетте дни пробване · СРОК, не план |
| [`05-produktite-i-izdanieto.md`](../docs/pazar/05-produktite-i-izdanieto.md) | проучване · запис | 05 · Продуктите и изданието · пренесено от MasterBook |
| [`06-osemte-kletki-i-dvata-paketa.md`](../docs/pazar/06-osemte-kletki-i-dvata-paketa.md) | проучване · запис | 06 · Осемте клетки и ДВАТА пакета |

### docs/sigurnost/ · СИГУРНОСТТА · проучванията

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`01-sravnenieto-06-09.md`](../docs/sigurnost/01-sravnenieto-06-09.md) | проучване · запис | СИГУРНОСТТА НА ЯДРОТО · подробно сравнение |
| [`02-sertifikatite.md`](../docs/sigurnost/02-sertifikatite.md) | проучване · запис | 02 · Сертификатите и стандартите · какво трябва да покрием |

### docs/arhiv/ · АРХИВЪТ · приключеното (правило 13) · всяко казва какво идва вместо него

| файл | вид · състояние | какво е |
| :---- | :---- | :---- |
| [`00-KAKVO-IMA-TUK.md`](../docs/arhiv/00-KAKVO-IMA-TUK.md) | указател · жив | Архивът · какво има тук |
| [`2026-09-04-plan-za-nov-proekt.md`](../docs/arhiv/2026-09-04-plan-za-nov-proekt.md) | план · надживян | План · нов проект от нула · чисто Задание → чиста Архитектура → пренесен код |
| [`2026-09-08-arhitekturata-ot-koda.md`](../docs/arhiv/2026-09-08-arhitekturata-ot-koda.md) | гръбнак · надживян | 15 · АРХИТЕКТУРАТА · пълната карта, и кой пази какво |

---

## 5 · МАШИНИТЕ, КОИТО ПАЗЯТ ТОВА

| команда | какво не позволява |
| :---- | :---- |
| `npm run proverka` | всичките порти наведнъж · спира на първата червена |
| `npm run registar` | въпрос без дом · отговор без негови думи · документ, който пита нещо вече отговорено |
| `npm run karta` | тази карта да остарее · документ без шапка, с непознат вид или вид извън папката си · втори дом на еднократен вид · надживян извън архива |
| `npm run dnevnik:proveri` | ден без запис · негова дума без дом · роден белег без регистър · тресчотка в грешна посока |
| `npm run proba` | построеното да не работи в истински браузър · пуска се ДВА пъти |

**Броено при последното писане на картата:** 182 документа в 15 папки.

