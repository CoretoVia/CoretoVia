# КАРТАТА · започни оттук

> **Този файл се ГЕНЕРИРА.** Не го редактирай на ръка — пиши се `npm run karta`,
> а `npm run proverka` пада, ако е остарял. Описанието на всеки документ идва от
> самия него (заглавието и първия му абзац), затова не може да лъже.

---

## 1 · КЪДЕ СИ ПОПАДНАЛ

**Coretovia** е български счетоводен и имотен продукт, роден от ЕДНА екселска
книга с ОСЕМ листа. Всеки лист е прозорец на програмата — осем са, „само това и
нищо повече или по-малко" (К1). Данните живеят при клиента, не при нас
(правило 21). Истината е Журнал само за добавяне; всичко останало се смята от него.

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

---

## 3 · КОЛКО СМЕ · броено, не преписано

| какво | колко | къде се брои |
| :---- | ---: | :---- |
| въпроса в регистъра | **187** | `npm run registar` |
| — с негов отговор | **76** | същото |
| — решени от кода | **29** | същото |
| — още открити | **10** | същото |
| — отпаднали | **9** | същото |
| — още неустановени | **63** | същото |
| реда в дълга | **287** | `docs/14-dalgat.md` |
| реда извори (неговите думи) | **3602** | `docs/izvori/` |

Числата на портите (тестове, обходи, модули, лицензи) НЕ стоят тук: те се броят
от `npm run proverka` в мига, в който я пуснеш. Число в документ остарява;
число от команда — не (правило 14).

---

## 4 · ВСИЧКИТЕ ДОКУМЕНТИ · нито един извън картата

### zadanie/ · ЗАДАНИЕТО · Книгата му, клетка по клетка (К1)

| файл | какво е |
| :---- | :---- |
| [`00-obshto.md`](../zadanie/00-obshto.md) | Заданието · Книгата е Заданието |
| [`01-profil.md`](../zadanie/01-profil.md) | 1 · Профил |
| [`02-imoti-obekti-biznesi.md`](../zadanie/02-imoti-obekti-biznesi.md) | 2 · ИмотиОбектиБизнеси |
| [`03-upravlenie-dela-prepiski.md`](../zadanie/03-upravlenie-dela-prepiski.md) | 3 · УправлениеДелаПреписки |
| [`04-smetki.md`](../zadanie/04-smetki.md) | 4 · Сметки |
| [`05-sluzhiteli.md`](../zadanie/05-sluzhiteli.md) | 5 · Служители |
| [`06-prodazhbi.md`](../zadanie/06-prodazhbi.md) | 6 · Продажби |
| [`07-ii.md`](../zadanie/07-ii.md) | 7 · ИИ |
| [`08-nastroyki.md`](../zadanie/08-nastroyki.md) | 8 · Настройки(Стопанин) |
| [`09-izklyucheno.md`](../zadanie/09-izklyucheno.md) | 9 · Какво НЕ е в Книгата · и затова не се строи |
| [`10-dopalneniya-05-09.md`](../zadanie/10-dopalneniya-05-09.md) | 10 · Допълненията от 05.09.2026 · три неща към Книгата |
| [`11-dopalneniya-05-09-b.md`](../zadanie/11-dopalneniya-05-09-b.md) | 11 · Втората добавка от 05.09.2026 · три неща към Управление и Сметки |
| [`12-dopalneniya-08-09.md`](../zadanie/12-dopalneniya-08-09.md) | 12 · Добавката от 08.09.2026 · двата пътя на парите и обликът |

### zadanie/FINALNO/ · ФИНАЛНОТО ЗАДАНИЕ · какво ПРАВИ програмата, изведено от кода

| файл | какво е |
| :---- | :---- |
| [`00-CHETI-PARVO.md`](../zadanie/FINALNO/00-CHETI-PARVO.md) | ФИНАЛНОТО ЗАДАНИЕ · какво трябва да прави програмата |
| [`02-dvigatelyat.md`](../zadanie/FINALNO/02-dvigatelyat.md) | ДВИГАТЕЛЯТ · как се пази истината |
| [`03-modelat.md`](../zadanie/FINALNO/03-modelat.md) | МОДЕЛЪТ · таблиците, колоните, номенклатурите, номерацията |
| [`04-smetachat.md`](../zadanie/FINALNO/04-smetachat.md) | СМЕТАЧЪТ |
| [`05-knigata.md`](../zadanie/FINALNO/05-knigata.md) | КНИГАТА · вход и изход, и Сверчикът |
| [`06-prozortsite.md`](../zadanie/FINALNO/06-prozortsite.md) | ОСЕМТЕ ПРОЗОРЕЦА |
| [`07-ekranat.md`](../zadanie/FINALNO/07-ekranat.md) | ЕКРАНЪТ · решетката, редакцията, правото, подсказките |
| [`08-proverkite.md`](../zadanie/FINALNO/08-proverkite.md) | ПРОВЕРКИТЕ · как програмата пази себе си |

### docs/izvori/ · ИЗВОРИТЕ · неговите думи, както са казани

| файл | какво е |
| :---- | :---- |
| [`00-OTKADE-SA.md`](../docs/izvori/00-OTKADE-SA.md) | 00 · ОТКЪДЕ СА ИЗВОРИТЕ · и какво е пипнато |
| [`00-kak-rabotyat.md`](../docs/izvori/00-kak-rabotyat.md) | Изворите · как работят |
| [`01-chist-dopiska.md`](../docs/izvori/01-chist-dopiska.md) | ИЗВОР-1 · ДОПИСКА · 22.08 → нататък |
| [`02-po-temi.md`](../docs/izvori/02-po-temi.md) | ИЗВОР-2 · ПО ТЕМИ · последната дума е в сила |
| [`03-koloni-hedari-tablitsi.md`](../docs/izvori/03-koloni-hedari-tablitsi.md) | ИЗВОР-3 · ЕДНАТА ОБЩА ТЕМА |
| [`04-prozortsite-i-vrazkite.md`](../docs/izvori/04-prozortsite-i-vrazkite.md) | ИЗВОР-4 · ПРОЗОРЦИТЕ И ВРЪЗКИТЕ · картата на сигнала |

### docs/izvori/dni/ · ДУМИТЕ МУ ПО ДНИ · от 10.09.2026 · журнал, само добавяне · домът им

| файл | какво е |
| :---- | :---- |
| [`2026-09-10.md`](../docs/izvori/dni/2026-09-10.md) | 2026-09-10 · неговите думи · ДОСЛОВНО |
| [`2026-09-11.md`](../docs/izvori/dni/2026-09-11.md) | 2026-09-11 · неговите думи · ДОСЛОВНО |

### docs/ · РЕШЕНИЯТА · какво е решено и защо

| файл | какво е |
| :---- | :---- |
| [`00-CHETI-PARVO.md`](../docs/00-CHETI-PARVO.md) | 000 · ЧЕТИ ПЪРВО · входната врата на Coretovia |
| [`00-PROTOKOL.md`](../docs/00-PROTOKOL.md) | ПРОТОКОЛЪТ НА УМЕНИЯТА · какво СЕ ЧЕТЕ, преди да се пипне |
| [`03-plan.md`](../docs/03-plan.md) | ПЛАН ЗА ИЗПЪЛНЕНИЕ · резените на Coretovia |
| [`10-kakvo-chaka.md`](../docs/10-kakvo-chaka.md) | 10 · Какво чака · и докъде сме стигнали |
| [`12-doklad-za-predavane.md`](../docs/12-doklad-za-predavane.md) | 12 · ДОКЛАД ЗА ПРЕДАВАНЕ · Coretovia |
| [`13-redat-predi-koda.md`](../docs/13-redat-predi-koda.md) | 13 · Редът преди кода · планът за чисто кодиране |
| [`14-dalgat.md`](../docs/14-dalgat.md) | 14 · ДЪЛГЪТ · единственият дом на чакащото |
| [`15-arhitekturata.md`](../docs/15-arhitekturata.md) | 15 · АРХИТЕКТУРАТА · гръбнакът |
| [`16-dvizhenieto-i-sastoyanieto.md`](../docs/16-dvizhenieto-i-sastoyanieto.md) | 16 · Движението и Състоянието · проверка на модела и въпросите към него |
| [`17-pravoto-po-sektsii.md`](../docs/17-pravoto-po-sektsii.md) | 17 · Правото по СЕКЦИИ от редове · петата ос |
| [`18-otgovorite-i-nahodkite-08-09.md`](../docs/18-otgovorite-i-nahodkite-08-09.md) | 18 · Отговорите от 08.09 вечерта · и какво намери проверката |
| [`19-umeniyata-firmata-i-nepopitanoto.md`](../docs/19-umeniyata-firmata-i-nepopitanoto.md) | 19 · Уменията · Фирмата като граница · и въпросите към тях |
| [`20-firmata-invariantat-i-dvata-vaprosa.md`](../docs/20-firmata-invariantat-i-dvata-vaprosa.md) | 20 · Фирмата · новият инвариант · и двата въпроса, обяснени с пример |
| [`21-nepopitanoto.md`](../docs/21-nepopitanoto.md) | 21 · НЕПОПИТАНОТО · какво стои в Книгата и никой не го е върнал |
| [`22-litseto-trezorat-i-dvata-rezhima.md`](../docs/22-litseto-trezorat-i-dvata-rezhima.md) | 22 · Стопанинът е ДЛЪЖНОСТ · Трезорът · двата режима · и преносът от MasterBook |
| [`23-helpat-dvete-stepeni.md`](../docs/23-helpat-dvete-stepeni.md) | 23 · ХЕЛПЪТ · двете степени · и правилото, че се обновява с кода |
| [`24-tablitsata-i-diagramata.md`](../docs/24-tablitsata-i-diagramata.md) | 24 · Таблицата и Диаграмата · ЕДНО цяло |
| [`25-planat-i-vaprosite.md`](../docs/25-planat-i-vaprosite.md) | 25 · ПЪЛНИЯТ ПЛАН · и въпросите с тикчета |
| [`26-zhurnalat-valutata-i-dvata-vaprosa.md`](../docs/26-zhurnalat-valutata-i-dvata-vaprosa.md) | 26 · Къде живее Журналът · валутата и езиците · и двата въпроса, зададени по-добре |
| [`27-faylovete-i-valutata.md`](../docs/27-faylovete-i-valutata.md) | 27 · ФАЙЛОВЕТЕ И ВАЛУТАТА · двете необратими решения |
| [`28-chetirite-otgovora-09-09.md`](../docs/28-chetirite-otgovora-09-09.md) | 28 · ЧЕТИРИТЕ ОТГОВОРА · 09.09.2026 вечерта |
| [`29-devette-otgovora-09-09.md`](../docs/29-devette-otgovora-09-09.md) | 29 · ДЕВЕТТЕ ОТГОВОРА · 09.09.2026 · нощта |
| [`30-faktura-ot-telefon.md`](../docs/30-faktura-ot-telefon.md) | 30 · ФАКТУРАТА ОТ ТЕЛЕФОН · папката, сканирането и всеки участник |
| [`33-koefitsientite-i-orientirat.md`](../docs/33-koefitsientite-i-orientirat.md) | 33 · КОЕФИЦИЕНТИТЕ · ОРИЕНТИРЪТ · и СВОЯТА ФОРМУЛА |
| [`34-desetiyat-tip-strukturata.md`](../docs/34-desetiyat-tip-strukturata.md) | 34 · ДЕСЕТИЯТ ТИП · структурата има история като всичко друго |
| [`35-dovarshvaneto-1893-imenno.md`](../docs/35-dovarshvaneto-1893-imenno.md) | 35 · ДОВЪРШВАНЕТО · 1893 неща, отворени поименно |
| [`ADR-001-nasledstvoto-i-granitsite.md`](../docs/ADR-001-nasledstvoto-i-granitsite.md) | ADR-001 · Наследството от MasterBook · границите на слоевете · регистърът на преноса |
| [`ADR-002-exceljs.md`](../docs/ADR-002-exceljs.md) | ADR-002 · Първата библиотека · ExcelJS · Книгата се отваря в Excel като неговата |
| [`ADR-003-modelat-kato-danni.md`](../docs/ADR-003-modelat-kato-danni.md) | ADR-003 · Моделът като данни · номенклатурите · каталогът и Портата · колонното Огледало · Книгата на изход |
| [`ADR-004-knigata-na-vhod-i-sverchikat.md`](../docs/ADR-004-knigata-na-vhod-i-sverchikat.md) | ADR-004 · Книгата на вход · Сверчикът · предложението е данни · ИИ |
| [`ADR-005-upravlenie-darvoto-i-gantat.md`](../docs/ADR-005-upravlenie-darvoto-i-gantat.md) | ADR-005 · Управление · дървото Имот → Обект/Бизнес → Задача · филтърът и СБОРЪТ · Гантът |
| [`ADR-006-smetki-znakat-sektsiite-i-keshat.md`](../docs/ADR-006-smetki-znakat-sektsiite-i-keshat.md) | ADR-006 · Сметки · знакът решава страната · секциите · кешът за месеца |
| [`ADR-007-dds-i-podtab-nap.md`](../docs/ADR-007-dds-i-podtab-nap.md) | ADR-007 · ДДС като ред по знака · подтаб НАП · таблицата с находки |
| [`ADR-008-sluzhitelite-i-pravoto.md`](../docs/ADR-008-sluzhitelite-i-pravoto.md) | ADR-008 · Служителите · Длъжността с четири оси · правото само СТЕСНЯВА |
| [`ADR-009-otgovornikat-i-koy-razdava-dlazhnosti.md`](../docs/ADR-009-otgovornikat-i-koy-razdava-dlazhnosti.md) | ADR-009 · Отговорникът на задачата · и кой РАЗДАВА Длъжности |
| [`ADR-010-prodazhbite-proverkata-i-sastoyanieto.md`](../docs/ADR-010-prodazhbite-proverkata-i-sastoyanieto.md) | ADR-010 · Продажбите · проверката се СМЯТА · завършена и активна таблица |
| [`ADR-011-trite-mu-otgovora-05-09.md`](../docs/ADR-011-trite-mu-otgovora-05-09.md) | ADR-011 · Трите въпроса, затворени от него · Акт 16 завършва продажбата |
| [`ADR-012-kalkulatorat-nad-prodazhbite.md`](../docs/ADR-012-kalkulatorat-nad-prodazhbite.md) | ADR-012 · Калкулаторът над Продажбите · трите подхода и съгласуването |
| [`ADR-013-formulite-i-sverkata-sreshtu-kesha.md`](../docs/ADR-013-formulite-i-sverkata-sreshtu-kesha.md) | ADR-013 · Формулите · свой парсер, ТОЧЕН сметач и сверка срещу кеша на Excel |
| [`ADR-014-otvori-i-zapazi-modelite-na-ekrana.md`](../docs/ADR-014-otvori-i-zapazi-modelite-na-ekrana.md) | ADR-014 · Отвори и Запази · моделът е ИМЕНУВАН поглед |
| [`ADR-015-skritite-defekti-v-samite-proverki.md`](../docs/ADR-015-skritite-defekti-v-samite-proverki.md) | ADR-015 · Скритите дефекти в самите проверки · шест нови обхода |
| [`ADR-016-portite-veche-meryat.md`](../docs/ADR-016-portite-veche-meryat.md) | ADR-016 · Портите вече МЕРЯТ · и са доказани |
| [`ADR-017-dublirano-po-forma-i-edin-dom-na-zakraglyaneto.md`](../docs/ADR-017-dublirano-po-forma-i-edin-dom-na-zakraglyaneto.md) | ADR-017 · Дублирано по ФОРМА · и един дом на закръглянето |
| [`ADR-018-obeshtanieto-nadzhivyava-rezena-si.md`](../docs/ADR-018-obeshtanieto-nadzhivyava-rezena-si.md) | ADR-018 · Обещанието надживява резена си |
| [`ADR-019-zapechatanata-vrata.md`](../docs/ADR-019-zapechatanata-vrata.md) | ADR-019 · Запечатаната врата · и защо тя е ПРЕДИ печата |
| [`ADR-020-odityt-97-nahodki-11-otseleli.md`](../docs/ADR-020-odityt-97-nahodki-11-otseleli.md) | ADR-020 · Одитът · 97 находки, 11 оцелели |
| [`ADR-021-kotvata-kazva-i-portata-hape.md`](../docs/ADR-021-kotvata-kazva-i-portata-hape.md) | ADR-021 · Котвата КАЗВА · и портата вече хапе |
| [`ADR-022-proizhodat-edin-proekt-edin-svyat.md`](../docs/ADR-022-proizhodat-edin-proekt-edin-svyat.md) | ADR-022 · Произходът · един проект, един свят |
| [`ADR-023-pette-resheniya-06-09-vecherta.md`](../docs/ADR-023-pette-resheniya-06-09-vecherta.md) | ADR-023 · Петте му решения от 06.09 вечерта |
| [`ADR-024-chetirite-neobratimi.md`](../docs/ADR-024-chetirite-neobratimi.md) | ADR-024 · Четирите необратими решения |
| [`registar-na-prenosa.md`](../docs/registar-na-prenosa.md) | Регистърът на преноса · всеки стар файл с ТОЧНО една присъда |

### docs/dnevnik/ · ДНЕВНИКЪТ · какво стана, по дни · `npm run nachalo` го отваря, `npm run kray` го затваря

| файл | какво е |
| :---- | :---- |
| [`2026-09-10-plan-sistemata-na-rabota.md`](../docs/dnevnik/2026-09-10-plan-sistemata-na-rabota.md) | ПЛАН · 2026-09-10 · системата на работа |
| [`2026-09-10.md`](../docs/dnevnik/2026-09-10.md) | 2026-09-10 · ход 2 затворен · 1893 неща отворени поименно · и системата на работа се роди |
| [`2026-09-11-plan-biznes-1-0.md`](../docs/dnevnik/2026-09-11-plan-biznes-1-0.md) | ПЛАН · 2026-09-11 · „Семеен/Малък Бизнес 1.0" · пълният път до работеща версия за неговия бизнес · Стопанинът + 7 служители |
| [`2026-09-11.md`](../docs/dnevnik/2026-09-11.md) | 2026-09-11 · осемте му точки за Сметки и календара · след полунощ |

### docs/dokladi/ · ДОКЛАДИТЕ · проверките, цели

| файл | какво е |
| :---- | :---- |
| [`00-spisak.md`](../docs/dokladi/00-spisak.md) | 00 · ДОКЛАДИТЕ · пълните проверки, съхранени цели |
| [`00a-sedemte-akaunta-i-protsentat.md`](../docs/dokladi/00a-sedemte-akaunta-i-protsentat.md) | Доклад 0а · Седемте акаунта · процентът до алфа 1.0 · и подходът |
| [`00b-oditat-46-agenta.md`](../docs/dokladi/00b-oditat-46-agenta.md) | Доклад 0б · ОДИТЪТ · 46 агента над целия проект |
| [`01-pravoto-po-sektsii.md`](../docs/dokladi/01-pravoto-po-sektsii.md) | Доклад 1 · Правото по СЕКЦИИ от редове |
| [`02-umeniya-otcheti-sastoyaniya.md`](../docs/dokladi/02-umeniya-otcheti-sastoyaniya.md) | Доклад 2 · Умения · Отчети · Състояния · Мрежа · Уволнение |
| [`03-firmata-i-nepopitanoto.md`](../docs/dokladi/03-firmata-i-nepopitanoto.md) | Доклад 3 · Фирмата като граница · Бизнес Моделите · и НЕПОПИТАНОТО |
| [`04-finansite-i-otchetite.md`](../docs/dokladi/04-finansite-i-otchetite.md) | Доклад 4 · Финансите и отчетите · истинските счетоводни величини |
| [`05-zakonat-na-ii-i-umeniyata.md`](../docs/dokladi/05-zakonat-na-ii-i-umeniyata.md) | Доклад 5 · Законът на ИИ срещу Умението · документите · контрагентите |
| [`06-propuskite-ot-arhiva.md`](../docs/dokladi/06-propuskite-ot-arhiva.md) | Доклад 6 · Пропуските · архивът, пазарът, регистърът, MasterBook, неговите думи, ADR-ите |
| [`07-redat-na-kodirane.md`](../docs/dokladi/07-redat-na-kodirane.md) | Доклад 7 · Редът на кодиране · зависимостите, необратимото, резените и темите за комитите |
| [`08-finalnoto-zadanie.md`](../docs/dokladi/08-finalnoto-zadanie.md) | Доклад 8 · ФИНАЛНОТО ЗАДАНИЕ · пълен |
| [`09-tablitsata-i-diagramata-CHASTICHEN.md`](../docs/dokladi/09-tablitsata-i-diagramata-CHASTICHEN.md) | Доклад 9 · Таблицата и Диаграмата · ЧАСТИЧЕН (2 от 7 агента) |

### docs/arhiv/ · АРХИВЪТ · приключеното (правило 13)

| файл | какво е |
| :---- | :---- |
| [`00-KAKVO-IMA-TUK.md`](../docs/arhiv/00-KAKVO-IMA-TUK.md) | Архивът · какво има тук |
| [`2026-09-04-plan-za-nov-proekt.md`](../docs/arhiv/2026-09-04-plan-za-nov-proekt.md) | План · нов проект от нула · чисто Задание → чиста Архитектура → пренесен код |
| [`2026-09-08-arhitekturata-ot-koda.md`](../docs/arhiv/2026-09-08-arhitekturata-ot-koda.md) | 15 · АРХИТЕКТУРАТА · пълната карта, и кой пази какво |

---

## 5 · МАШИНИТЕ, КОИТО ПАЗЯТ ТОВА

| команда | какво не позволява |
| :---- | :---- |
| `npm run proverka` | всичките порти наведнъж · спира на първата червена |
| `npm run registar` | въпрос без дом · отговор без негови думи · документ, който пита нещо вече отговорено |
| `npm run karta` | тази карта да остарее · нов или изтрит документ, който не се вижда тук |
| `npm run proba` | построеното да не работи в истински браузър · пуска се ДВА пъти |

**Броено при последното писане на картата:** 99 документа в 8 папки.

