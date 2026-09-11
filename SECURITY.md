# Сигурност · как се докладва уязвимост

**Дата:** 2026-09-08 · **Вид:** витрина · **Състояние:** жив

*English summary at the bottom.*

## Как се докладва

**Не отваряй публичен issue за уязвимост.** Публичният issue казва на всички къде е
дупката, преди да е запушена.

Използвай **Security → Report a vulnerability** в това хранилище
(`github.com/CoretoVia/Coretovia/security/advisories/new`). Каналът е частен: вижда се
само от поддържащия и от теб, докато не бъде затворен.

Ако този канал е недостъпен, отвори публичен issue със **заглавие само**
„заявка за частен канал" и нищо повече — без подробности.

## Какво да съдържа докладът

| какво | защо |
| :---- | :---- |
| версия или коммит (`git rev-parse HEAD`) | без него не се знае кое е поправено |
| стъпките дотам | ако не се възпроизвежда, не се поправя |
| какво постига нападателят | решава колко бързо се работи |
| твоята оценка за тежестта | сверява се с нашата |

**Не изпращай истински лични или фирмени данни.** Приложението работи с чужди
счетоводни книги; за доказателство е достатъчна измислена стойност.

## Какво обещаваме

| срок | какво |
| :---- | :---- |
| **3 работни дни** | потвърждение, че докладът е получен и прочетен |
| **10 работни дни** | оценка: приема се, отхвърля се, или още се проучва — с причината |
| **90 дни** | краен срок за поправка преди публично оповестяване · при активна експлоатация — по-кратък |

Съобщаваме публично СЛЕД поправката, и назоваваме докладвалия, освен ако той не иска
друго.

## Какво се поддържа

| какво | състояние |
| :---- | :---- |
| клон `main` | ✔ поддържа се |
| таг `alfa-07-09-2026` и по-стари | ✘ не се поправят · надгради се |
| `CoretoVia/MasterBook` | ✘ **архивиран и замразен** · не приема промени |

Продуктът е в АЛФА и още няма издания с номера. Когато се появят, тази таблица ще
казва кои се поддържат и докога.

## Какво Е в обхвата

- кодът в `src/`, `app/`, `stroezh/`, `proba/`
- потокът на пускане (`.github/workflows/`)
- публикуваното на `coretovia.github.io/Coretovia/`

**Извън обхвата:** самият GitHub · браузърът на потребителя · съдържанието на неговите
собствени файлове.

## Как е устроена защитата · за да се знае къде да се търси

| мярка | къде |
| :---- | :---- |
| **Журналът е само за добавяне**; поправка = ново събитие | `src/yadro/dnevnik.ts` |
| **Един вход за запис** — Вратата; нищо не пише директно | `src/yadro/vrata.ts` |
| **Верига от хешове** над всяко поле, включително `actor` | `src/yadro/hash.ts` · `kotva.ts` |
| **Кранът** — при инцидент Вратата се затваря, Журналът не се пипа | `vrata.zatvori` |
| **Запечатан HTML** · XSS е затворен по конструкция | ADR-019 |
| **Нищо не телефонира** — тест твърди, че в `src/` няма `fetch`, `XMLHttpRequest`, `WebSocket` | `tests/biblioteki.test.ts` |
| **Поверителните данни остават при клиента** — не влизат в хранилището | `.gitignore` · `tests/poveritelnost.test.ts` |
| **Зависимостите са пин с ръка** · днес една: `exceljs` | `tests/biblioteki.test.ts` |
| **Лицензите се броят** при всеки строеж | `npm run litsenzi` |

## Съответствие

Работим към **Регламент (ЕС) 2024/2847 (Cyber Resilience Act)**, чиито основни
задължения влизат в сила на **11.12.2027**. Този файл покрива изискването за процес по
обработка на уязвимости. Списъкът на съставките (**SBOM**, CycloneDX) се издава при
всяко пускане и се сервира на живия адрес: `coretovia.github.io/Coretovia/sbom.json`.

Подробният преглед на стандартите е в
[`docs/sigurnost/02-sertifikatite.md`](docs/sigurnost/02-sertifikatite.md).

---

## English summary

**Do not open a public issue for a vulnerability.** Use **Security → Report a
vulnerability** on this repository, which opens a private channel.

Include the commit hash, reproduction steps, and impact. Do not send real personal or
company data — this application handles third-party accounting books.

We acknowledge within **3 working days**, give an assessment within **10 working days**,
and aim to fix within **90 days** before public disclosure. Only the `main` branch is
supported; the archived `CoretoVia/MasterBook` repository is frozen and receives no fixes.

An SBOM in CycloneDX format is published with every release at
`coretovia.github.io/Coretovia/sbom.json`.
