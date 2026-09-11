# ЧАСТ 2 · КАРТАТА НА МОДУЛИТЕ

**Дата:** 2026-09-09 · **Вид:** архитектура-част · **Състояние:** жив

> Част от ПЪЛНАТА АРХИТЕКТУРА. Сглобена НАПРЕЧНО през деветнайсетте теми, не по тема.
> Изведена от zadanie/CHISTO/ и docs/arhitektura/, сверена срещу кода.

## 2 · КАРТАТА НА МОДУЛИТЕ

Слоевете, посоката на стрелката, и КОЙ Я БРОИ.

---

### 2.1 · БРОЕНОТО · всяко число с командата до себе си

| какво | число | командата, която го дава |
| :---- | ---: | :---- |
| модули, обходени от машината | **117** | `npm run sloeve` → „no dependency violations found (117 modules, 549 dependencies cruised)" |
| зависимости, обходени | **549** | същият изход |
| **нарушения** | **0** | същият изход · праг нула, пуска се и от `tests/sloeve.test.ts` |
| забрани в конфигурацията | **14** | `node -e "console.log(require('./.dependency-cruiser.cjs').forbidden.length)"` |
| собствени файлове в `src/` + `app/` | **114** | `find src app -type f -name '*.ts' \| wc -l` → 113, плюс `app/public/sw.js` |
| чужди възли в обхода | **3** | `node_modules/exceljs/excel.js` · `vite/client` · `crypto` |
| ребра МЕЖДУ слоеве | **36 вида** | преброени от JSON-а на обхода (§2.6) |
| къса в `docs/arhitektura/` | **19** | `ls docs/arhitektura/*.md \| wc -l` |
| „НИКОЙ" в деветнайсетте къса | **260** | `grep -o "НИКОЙ" docs/arhitektura/*.md \| wc -l` |

**Находка · правило 14.** `docs/15-arhitekturata.md:105` твърди **„269-те «НИКОЙ»"**.
Броенето днес дава **260**. Числото е преписано, не броено — или е остаряло мълчаливо.
Домът му трябва да е команда, не изречение.

---

### 2.2 · СЛОЕВЕТЕ · текстова схема

Стрелката сочи НАДОЛУ. Носителят е отдолу; Книгата и агентът са отстрани.

```
        КНИГАТА (.xlsx)                ЧОВЕКЪТ                    АГЕНТЪТ (ИИ)
        src/kniga/ · 5 модула      app/ · 28 модула            днес: няма своя папка
        exceljs влиза ЕДИНСТВЕНО   app/main.ts = корен          src/model/agenti.ts (данни)
        през src/kniga/ooxml.ts    app/prozorets/ · app/reshetka  app/prozorets/ii.ts (екран)
                 │                          │                     src/porta/vnasyane.ts (превод)
                 │                          │                             │
                 └──────────────┐           │           ┌─────────────────┘
                                ▼           ▼           ▼
                    ╔═══════════════════════════════════════════════╗
                    ║  ПОРТАТА · src/porta/ · 3 модула              ║  ← К2
                    ║  Porta (чете + ПИШЕ) · PortaZaChetene (само   ║  ← К3
                    ║  чете · няма `izpalni`) · porta.ts:28 и :38   ║
                    ║  единствена реализация: porta/izpalnitel.ts   ║
                    ╚═══════════════════════╤═══════════════════════╝
                                            ▼  (7 ребра porta → komandi)
                    ┌───────────────────────────────────────────────┐
                    │  КАТАЛОГЪТ · src/komandi/ · 15 модула         │
                    │  komandi/katalog.ts · единственият вход       │
                    │  към Вратата · командата е ДАННИ             │
                    └───────────────────────┬───────────────────────┘
                                            ▼
                    СМЕТАЧЪТ · src/smetach/ 17 + src/formuli/ 2
                    смята върху Огледалото · НЕ пише
                                            ▼
                    ОГЛЕДАЛОТО · src/ogledalo/ · 8 · само ЧЕТЕ
                                            ▼
                    СЪБИТИЯТА · src/sabitiya/ · 2
                                            ▼
                    МОДЕЛЪТ · src/model/ · 14 · osnova.ts = осемте прозореца (К1)
                                            ▼
                    ╔═══════════════════════════════════════════════╗
                    ║  ЯДРОТО · src/yadro/ · 15                     ║
                    ║  vrata.ts · dnevnik.ts · pari.ts · hash.ts    ║
                    ║  kotva.ts · sverka.ts · takt.ts               ║
                    ║  + index.ts — БАРЕЛЪТ, който преизнася Вратата║
                    ╚═══════════════════════▲═══════════════════════╝
                                            │  (7 ребра nositel → yadro)
                    ┌───────────────────────┴───────────────────────┐
                    │  НОСИТЕЛЯТ · src/nositel/ · 5                 │
                    │  IndexedDB · памет · хеш · ключодържател      │
                    │  вижда САМО ядрото · сглобява се САМО в       │
                    │  app/main.ts (4 ребра, всичките от main.ts)   │
                    └───────────────────────────────────────────────┘
```

**Къде влиза Книгата.** `src/kniga/` е адаптер ОТСТРАНИ: чете и пише `.xlsx`, минава през
Портата. Днес тя внася `model` (27 ребра), `smetach` (13), `ogledalo` (6), `yadro` (5),
`sabitiya` (2) — и **нула пъти** `komandi`, `nositel`, `porta/izpalnitel`, `yadro/vrata`.
Единственият агент, който днес работи, е Сверчикът (`src/kniga/sverchik.ts`) и той не
получава Порта ИЗОБЩО — нито за четене.

**Къде влиза агентът.** Няма папка `src/agenti/` (`ls src/` дава десет папки, без нея).
Днес агентът е разпръснат: данните му в `src/model/agenti.ts`, екранът в
`app/prozorets/ii.ts`, преводът предложение → команда в `src/porta/vnasyane.ts:36`, което
приема `PortaZaChetene`. К3 се държи от ТИПА, не от слоевата машина (§2.5).

**Къде влиза носителят.** Отдолу. Четирите му ребра нагоре тръгват само от `app/main.ts`
(`dnevnik-indexeddb` · `hash-web` · `hranilishte` · `samolichnost-web`). Пази се от
`nositelyat-e-dolu` (машина) + `tests/koren.test.ts`.

---

### 2.3 · МОДУЛИТЕ ПО СЛОЙ · и кой пази слоя

| слой | папка | модули | какво носи | КОЙ ГО ПАЗИ |
| :---- | :---- | ---: | :---- | :---- |
| ядро | `src/yadro/` | 15 | Врата · Журнал · пари · хеш · такт · котва · сверка | `.dependency-cruiser.cjs:45` `yadro-e-samo` |
| модел | `src/model/` | 14 | осемте прозореца (`osnova.ts`) · клетки · колони · схема | `:46` `model-e-chist` |
| събития | `src/sabitiya/` | 2 | регистър на видовете · товари | `:52` `sabitiya-nad-modela` |
| огледало | `src/ogledalo/` | 8 | четци · стълб · сгъване · строеж на изгледа | `:58` `ogledalo-samo-chete` ⚠ (§2.5) |
| сметач | `src/smetach/` 17 + `src/formuli/` 2 | 19 | ДДС · Гант · право · сбор · калкулатор · израз | `:64` `smetach-e-chist` |
| команди | `src/komandi/` | 15 | каталогът · командата като данни · единайсет прозорци | `:70` `komandi-ne-pishat-sami` ⚠ |
| порта | `src/porta/` | 3 | `porta.ts` · `izpalnitel.ts` · `vnasyane.ts` | `:76` `portata-e-edna` |
| книга | `src/kniga/` | 5 | четене · писане · ooxml · думи · сверчик | `:82` `knigata-e-adapter` ⚠ |
| **агенти** | `src/agenti/` | **0** | **папката не съществува** · присъдена за резен 7 (`docs/registar-na-prenosa.md:248-249`) | `:88` `agentat-ne-pishe` — брои НУЛА файла |
| носител | `src/nositel/` | 5 | IndexedDB · хеш (web/node) · хранилище · самоличност | `:94` `nositelyat-e-dolu` + `tests/koren.test.ts` |
| екран | `app/` | 28 | прозорци · решетка · `main.ts` (композиционен корен) | `:100` `src-ne-znae-app` · `:101` `app-ne-drazhi-vratata` ⚠ |

---

### 2.4 · ЧЕТИРИНАЙСЕТТЕ ЗАБРАНИ · всяка с човешкото си име

Формата е една: „кой НЕ може да внася кого"; позволеното е остатъкът. Всички са със
строгост `error`.

| # | ред | име | забраната, дословно от конфигурацията | какво значи |
| ---: | ---: | :---- | :---- | :---- |
| 1 | 39 | `bez-krag` | всичко → всичко циклично | „Цикъл между модули значи, че никой от тях не може да се тества сам." |
| 2 | 45 | `yadro-e-samo` | `src/yadro/` → всичко освен `src/yadro/` | „Ядрото внася само ядро." |
| 3 | 46 | `model-e-chist` | `src/model/` → всичко освен `model` и `yadro` | „Моделът вижда само ядрото." |
| 4 | 52 | `sabitiya-nad-modela` | `src/sabitiya/` → всичко освен `sabitiya`, `model`, `yadro` | „Събитията виждат модела и ядрото, нищо отгоре." |
| 5 | 58 | `ogledalo-samo-chete` | `src/ogledalo/` → всичко освен `ogledalo`, `sabitiya`, `model`, `yadro` | „Огледалото само чете: събития, модел, ядро." |
| 6 | 64 | `smetach-e-chist` | `src/smetach\|formuli/` → всичко освен себе си, `ogledalo`, `model`, `yadro` | „Сметачът и формулите смятат върху Огледалото и нищо друго." |
| 7 | 70 | `komandi-ne-pishat-sami` | `src/komandi/` → `porta` · `kniga` · `agenti` · `nositel` · `app` | „Командата е данни; тя не държи Врата, носител, Книга или агент." |
| 8 | 76 | `portata-e-edna` | `src/porta/` → `kniga` · `agenti` · `nositel` · `app` | „Портата не знае за адаптерите си." |
| 9 | 82 | `knigata-e-adapter` | `src/kniga/` → `komandi` · `agenti` · `nositel` · `app` | „Книгата минава през Портата, не през командите и не през носителя." |
| 10 | 88 | `agentat-ne-pishe` | `src/agenti/` → `porta/izpalnitel` · `kniga` · `nositel` · `yadro/vrata` · `app` | „Агентът получава само `PortaZaChetene`; изпълнителят и Вратата са му недостъпни." |
| 11 | 94 | `nositelyat-e-dolu` | `src/nositel/` → всичко освен `nositel` и `yadro` | „Носителят вижда само ядрото." |
| 12 | 100 | `src-ne-znae-app` | `src/` → `app/` | „Домейнът не знае за екрана." |
| 13 | 101 | `app-ne-drazhi-vratata` | всеки `app/` файл ОСВЕН `app/main.ts` → `nositel/` · `yadro/vrata` · `porta/izpalnitel` · `komandi/` | „Само композиционният корен (`app/main.ts`) сглобява носител, Врата и изпълнител." |
| 14 | 108 | `chuzhdo-samo-poimenno` | всеки `src/` или `app/` файл ОСВЕН `src/kniga/ooxml.ts` → пакет от npm | „Чужд пакет влиза само от изброен файл: exceljs през `src/kniga/ooxml.ts`." |

---

### 2.5 · КОЕ СЕ ДЪРЖИ ОТ ДИСЦИПЛИНА, А НЕ ОТ МАШИНА

**ДЛ-Т6** (`docs/14-dalgat.md:108`, регистър `beleg: "Т6"`): „Четири забрани в слоевете броят
по-малко от коментарите си · `src/yadro/index.ts` изнася Вратата и всеки прозорец я взима
през барела."

Проверих го сам, с машина, а не с четене. Командата:

```bash
node -e "const c=require('./.dependency-cruiser.cjs');
for(const r of c.forbidden){ if(!r.to?.path) continue; const re=new RegExp(r.to.path);
console.log(r.name,'| vrata.ts:',re.test('src/yadro/vrata.ts'),'| index.ts:',re.test('src/yadro/index.ts')); }"
```

Изходът потвърждава: **нито една от 14-те забрани не лови `src/yadro/index.ts`**, а барелът
на ред 15 носи `export * from './vrata.js';`.

| забрана | коментарът обещава | машината брои | пропастта |
| :---- | :---- | :---- | :---- |
| `ogledalo-samo-chete` (:58) | „Огледалото само **чете**" | че огледалото не внася `komandi`, `porta`, `kniga`, `app` | целият `src/yadro/` е ПОЗВОЛЕН — включително `vrata.ts`. Огледалото може да ПИШЕ и обходът мълчи |
| `komandi-ne-pishat-sami` (:70) | „тя не държи **Врата**, носител, Книга или агент" | `porta` · `kniga` · `agenti` · `nositel` · `app` | `src/yadro/vrata.ts` НЕ е в списъка. Точно думата „Врата" от коментара е незащитената |
| `knigata-e-adapter` (:82) | „Книгата минава **през Портата**" | `komandi` · `agenti` · `nositel` · `app` | `src/kniga/` може да внесе `yadro/vrata.ts` направо и да заобиколи Портата |
| `app-ne-drazhi-vratata` (:101) | „**само** `app/main.ts` сглобява Врата" | лови `src/yadro/vrata.ts` ✔ | не лови барела `src/yadro/index.ts` — всеки прозорец взима Вратата през него |
| `agentat-ne-pishe` (:88) — **пета, добавена от мен** | „Вратата му е недостъпна" | лови `vrata.ts` ✔, но не барела | **и по-важно: `from: '^src/agenti/'` брои НУЛА файла**, защото папката не съществува. Зелен обход над празно множество |

**Днешното състояние на дисциплината — броено, не предположено:**

```bash
grep -rn "yadro/vrata\|porta/izpalnitel" src app | grep -v "^src/porta/" | grep -v "^app/main.ts"
# → един ред, и той е КОМЕНТАР в src/komandi/komanda.ts:6
grep -rln "yadro/index" src app
# → src/ogledalo/sgavane.ts (само тип `Sabitie`) · app/main.ts (корен · позволено)
```

Тоест: **днес никой не минава през дупката.** Пропастта не е нарушение — тя е *липса на
пазач*. Дисциплина, не машина. По собствения стандарт на проекта
(`tests/sloeve.test.ts:5-6`): „Обход, който само стои в config, а никой не го пуска, е дума."
ДЛ-Т6 иска същото: пробни файлове, които трябва да **ПАДНАТ**.

**Още три неща, които машината изобщо не гледа:**

| какво | доказателство | значение |
| :---- | :---- | :---- |
| **обхватът е само `src app`** | `package.json:20` → `depcruise --config .dependency-cruiser.cjs src app` | `tests/`, `stroezh/`, `proba/`, `zadanie/` са ИЗВЪН слоевата машина. Тестът може да внесе каквото си иска |
| **`chuzhdo-samo-poimenno` не лови `core`** | `src/nositel/hash-node.ts → crypto` с типове `["core","dynamic-import"]`; правилото брои само `npm`, `npm-dev`, `npm-no-pkg`, `npm-unknown` | вграденото в Node не се смята за „чужд пакет" — записано решение за това не намерих |
| **`chuzhdo-samo-poimenno` не лови `unknown`** | `app/vite-okolna-sreda.d.ts → vite/client` с тип `["unknown"]` | зависимост, която резолверът не разпознава, минава мълчаливо |

---

### 2.6 · РЕБРАТА МЕЖДУ СЛОЕВЕТЕ · накъде тежи графът

Броено от JSON-а на същия обход (`depcruise … --output-type json`), само ребра, които
пресичат слой:

| ребро | брой | ребро | брой |
| :---- | ---: | :---- | ---: |
| app → model | 50 | ogledalo → yadro | 7 |
| komandi → model | 34 | komandi → smetach | 7 |
| app → smetach | 28 | nositel → yadro | 7 |
| smetach → model | 27 | kniga → ogledalo | 6 |
| kniga → model | 27 | sabitiya → model | 5 |
| smetach → ogledalo | 21 | komandi → ogledalo | 5 |
| ogledalo → model | 13 | kniga → yadro | 5 |
| kniga → smetach | 13 | app → porta | 4 |
| app → yadro | 12 | porta → ogledalo | 4 |
| komandi → sabitiya | 11 | app → nositel | 4 |
| app → kniga | 9 | komandi → yadro | 3 |
| app → ogledalo | 9 | porta → model | 3 |
| porta → yadro | 8 | kniga → sabitiya | 2 |
| smetach → yadro | 8 | model → yadro | 1 |
| porta → komandi | 7 | app → sabitiya | 1 |
| ogledalo → sabitiya | 7 | | |

**Какво казват числата, а не схемата:**

· **`app → model` = 50 е най-тежкото ребро в проекта.** Екранът чете Модела ПОВЕЧЕ, отколкото
  Портата (`app → porta` = 4). Схемата рисува „app → порта → команди", но графът показва, че
  Портата е тесен канал за ЗАПИС, а четенето минава направо. Това не е нарушение (Моделът е
  под всичко и не пише), но е фактът, който схемата премълчава.
· **`app → nositel` = 4 и всичките са от `app/main.ts`.** Композиционният корен е чист.
· **`porta → komandi` = 7** — каталогът наистина е единственият вход надолу от Портата.
· **`kniga → ...` = 53 ребра общо, нула към `komandi`/`nositel`/`vrata`** — Книгата днес се
  държи като адаптер, макар правило `knigata-e-adapter` да не я принуждава напълно (§2.5).

---

### 2.7 · МОДУЛИ, НАЗОВАНИ В АРХИТЕКТУРАТА, НО ЛИПСВАЩИ ДНЕС

Деветнайсетте къса цитират **70** файла в `src/`. **7 от тях не съществуват** (командата:
`grep -oh "src/[a-zA-Z0-9/_.-]*\.ts" docs/arhitektura/*.md | sort -u`, после `test -f` върху
всеки):

| файл | къде е назован | състояние |
| :---- | :---- | :---- |
| `src/domein/kredit-matematika.ts` | `04-krediti:44` | пренос от замразения предшественик · **папка `src/domein/` не съществува и не е слой** |
| `src/domein/krediti.ts` | `04-krediti:45` | същото |
| `src/domein/kontragenti.ts` | `08-dostavchitsi:68` | присъда ПРЕНОС, непренесен (`docs/registar-na-prenosa.md:190`) |
| `src/iztochnik/pdf.ts` | `04-krediti:73` | **отдел ИЗТОЧНИЦИ · папка не съществува и НЕ Е СЛОЙ в конфигурацията** |
| `src/iztochnik/pogasitelen-plan.ts` | `04-krediti:73` | същото (регистър, ВП-П11) |
| `src/smetach/kredit/matematika.ts` | `04-krediti:73` | бъдещ подслой на сметача · слоят го покрива предварително |
| `src/smetach/kredit/krediti.ts` | `04-krediti:73` | същото |

Плюс **`src/agenti/`** — обявена като слой (`.dependency-cruiser.cjs:20`), с целяща я забрана,
но без нито един файл.

**Разликата между двата вида липса е важна:**

| вид | пример | какво става, когато файлът дойде |
| :---- | :---- | :---- |
| **липсва ФАЙЛЪТ, слоят е обявен** | `src/agenti/` · `src/smetach/kredit/` | забраната се задейства САМА · машината е готова |
| **липсва СЛОЯТ** | `src/domein/` · `src/iztochnik/` | **новият код влиза в сляпо петно** — няма правило кой може да го внася и кого може да внася. Днес `src-ne-znae-app` и `chuzhdo-samo-poimenno` са единствените две забрани, които биха го докоснали |

---

### 2.8 · КОЙ ГО ПАЗИ · обобщение за тази част

| твърдението | КОЙ ГО ПАЗИ |
| :---- | :---- |
| посоката на стрелката е една · нула нарушения | `.dependency-cruiser.cjs` (14 забрани) · `npm run sloeve` · `tests/sloeve.test.ts` (праг нула) · влиза в `npm run proverka` |
| обходът наистина се пуска, а не стои в config | `tests/sloeve.test.ts:14` — проверява и код за изход, и низа „no dependency violations found" |
| само `app/main.ts` сглобява носител, Врата, изпълнител | забрана `app-ne-drazhi-vratata` (⚠ барелът минава) + `tests/koren.test.ts` |
| Вратата е единственият вход за запис | забраните `komandi-ne-pishat-sami`, `knigata-e-adapter`, `ogledalo-samo-chete` — ⚠ и **трите** пропускат `src/yadro/vrata.ts` (§2.5) |
| К3 · агентът не пише | **НЕ слоевата машина** (тя брои нула файла) · пази го ТИПЪТ: `src/porta/porta.ts:28` `PortaZaChetene` без `izpalni` · `tests/porta.test.ts:32` (`@ts-expect-error`, който пада при `tsc --noEmit`) · и `src/kniga/sverchik.ts`, който не получава Порта изобщо |
| exceljs влиза само от един файл | забрана `chuzhdo-samo-poimenno` + `tests/biblioteki.test.ts` (пин с ръка) |
| в `src/agenti/` каца протоколът на резен 7 | **НИКОЙ.** `docs/registar-na-prenosa.md:248-249` го присъжда, но нищо не го ВРЪЗВА за папката |
| барелът `src/yadro/index.ts` не се ползва като заден вход | **НИКОЙ.** Днес дисциплина: два викащи, единият само тип |
| `tests/`, `stroezh/`, `proba/` спазват слоевете | **НИКОЙ.** Извън обхода на `sloeve` |
| числото „269 НИКОЙ" в `docs/15` | **НИКОЙ.** Преписано · днешното броене дава 260 |

---

### 2.9 · КРАТКОТО

Картата на модулите е **вярна и жива**: 117 модула, 549 зависимости, 14 забрани, нула
нарушения, обходът се пуска от тест и от портата. Това не е обещание — това е изход на
команда.

Слабото не е там, където графът е крив. Слабото е там, където **коментарът обещава повече от
регекса**: четири забрани говорят за „Вратата", а не я споменават в правилото си; барелът
`src/yadro/index.ts` е обиколка около всяка от тях; папката `src/agenti/` е празно множество,
над което свети зелено; и три отдела (`tests`, `stroezh`, `proba`) изобщо не се обхождат.

Нито едно от тези не е нарушено ДНЕС. Всяко от тях може да бъде нарушено УТРЕ, без червено.
Точно това е разликата между машина и дисциплина.

---

## Числата · БРОЕНИ от команда

- 117 модула · `npm run sloeve` → „no dependency violations found (117 modules, 549 dependencies cruised)"
- 549 зависимости · същата команда
- 0 нарушения · същата команда · праг нула, пуска се и от tests/sloeve.test.ts
- 14 забрани · `node -e "console.log(require('./.dependency-cruiser.cjs').forbidden.length)"`
- 113 .ts файла в src/ и app/ · `find src app -type f -name '*.ts' | wc -l` · плюс app/public/sw.js = 114 собствени модула
- 3 чужди възела в обхода · exceljs (npm) · vite/client (unknown) · crypto (core)
- 15 модула в src/yadro/ · 14 в src/model/ · 2 в src/sabitiya/ · 8 в src/ogledalo/ · 17 в src/smetach/ + 2 в src/formuli/ · 15 в src/komandi/ · 3 в src/porta/ · 5 в src/kniga/ · 0 в src/agenti/ · 5 в src/nositel/ · 28 в app/ · броено от JSON-а на depcruise
- 36 вида ребра между слоеве · най-тежкото app → model = 50 · броено от depcruise --output-type json
- app → porta = 4 · app → nositel = 4 (всичките от app/main.ts) · porta → komandi = 7
- 19 къса в docs/arhitektura/ · `ls docs/arhitektura/*.md | wc -l`
- 260 „НИКОЙ" в деветнайсетте къса · `grep -o "НИКОЙ" docs/arhitektura/*.md | wc -l` · docs/15-arhitekturata.md:105 твърди 269
- 70 файла в src/ цитирани от 19-те къса · 7 от тях НЕ СЪЩЕСТВУВАТ · `grep -oh "src/[a-zA-Z0-9/_.-]*\.ts" docs/arhitektura/*.md | sort -u` + test -f
- 0 забрани от 14 ловят src/yadro/index.ts · проверено с node върху to.path на всяка
- 0 файла минават през дупката ДНЕС · `grep -rn "yadro/vrata|porta/izpalnitel" src app` извън src/porta/ и app/main.ts дава само коментар в src/komandi/komanda.ts:6
- 2 викащи на барела · `grep -rln "yadro/index" src app` → src/ogledalo/sgavane.ts (само тип) и app/main.ts
- 58 тестови файла · `ls tests/*.test.ts | wc -l`
- 187 въпроса в регистъра · състояния: otgovoren 53 · nepoznat 65 · otkrit 32 · reshen_ot_koda 28 · otpadnal 9
