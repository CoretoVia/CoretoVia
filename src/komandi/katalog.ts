/**
 * КАТАЛОГЪТ · всички команди на резена, поименно · ЕДИНСТВЕНИЯТ вход към Вратата.
 *
 * Ключът е `prozorets.glagol`. Броят е пин в тест; всеки тип събитие има
 * писач тук и четец в Огледалото (тестът ги сверява по регистрите).
 */

import { type Pomosht, tekstNaPomoshtta } from '../model/pomosht.js';
import type { Komanda, Myasto } from './komanda.js';
import { imotiDobaviBiznes, imotiDobaviObekt, imotiSazdayImot } from './prozortsi/imoti.js';
import {
  redIzklyuchi,
  redNesvarshena,
  redPopraviKletka,
  redSvarshena,
  redVarni,
} from './prozortsi/red.js';
import { smetkiDobaviDvizhenie, smetkiZapishiDds, smetkiZapishiKesh } from './prozortsi/smetki.js';
import {
  sluzhiteliDobaviDlazhnost,
  sluzhiteliDobaviSluzhitel,
  sluzhiteliDobaviStopan,
} from './prozortsi/sluzhiteli.js';
import { ekranMahniModel, ekranZapaziModel } from './prozortsi/modeli.js';
import { prodazhbiDobaviParva, prodazhbiDobaviVtora } from './prozortsi/prodazhbi.js';
import { upravlenieDobaviZadacha } from './prozortsi/upravlenie.js';
import { knigaIznesi, knigaVnesi } from './prozortsi/kniga.js';
import {
  nastroykiDobaviStoynost,
  nastroykiPreimenuvayStoynost,
  nastroykiSpriStoynost,
  nastroykiVarniStoynost,
} from './prozortsi/nastroyki.js';
import {
  nastroykiNovaKolona,
  nastroykiNovaTablitsa,
  nastroykiPodrediKoloni,
  nastroykiPreimenuvayGlava,
  nastroykiZatvoriKolona,
} from './prozortsi/struktura.js';
import { obshtoStorno } from './prozortsi/obshto.js';
import { stopaninOtkriy } from './prozortsi/stopanin.js';

/**
 * Командата без товар · каталогът е разнороден и типът на товара се проверява
 * по схемата, преди `dryRun` да го види. Единственият `any` в домейна.
 */
export type KoyaDaE = Komanda<any>;

export const KATALOG: readonly KoyaDaE[] = Object.freeze([
  stopaninOtkriy,
  nastroykiDobaviStoynost,
  nastroykiPreimenuvayStoynost,
  nastroykiSpriStoynost,
  nastroykiVarniStoynost,
  // ДЕСЕТИЯТ ТИП · структурата като събитие · петте пътя, по един на действие
  nastroykiNovaKolona,
  nastroykiPreimenuvayGlava,
  nastroykiZatvoriKolona,
  nastroykiNovaTablitsa,
  nastroykiPodrediKoloni,
  imotiSazdayImot,
  imotiDobaviObekt,
  imotiDobaviBiznes,
  upravlenieDobaviZadacha,
  smetkiDobaviDvizhenie,
  smetkiZapishiKesh,
  smetkiZapishiDds,
  sluzhiteliDobaviStopan,
  sluzhiteliDobaviSluzhitel,
  sluzhiteliDobaviDlazhnost,
  prodazhbiDobaviParva,
  prodazhbiDobaviVtora,
  ekranZapaziModel,
  ekranMahniModel,
  redPopraviKletka,
  redIzklyuchi,
  redVarni,
  redSvarshena,
  redNesvarshena,
  obshtoStorno,
  knigaIznesi,
  knigaVnesi,
]);

export function komandaPoKlyuch(klyuch: string): KoyaDaE | undefined {
  return KATALOG.find((k) => k.klyuch === klyuch);
}

/** Описанието на команда за екрана и за агента · без `dryRun` и без предусловията. */
export interface OpisNaKomanda {
  readonly klyuch: string;
  readonly ime: string;
  /** ИЗВЕДЕНО от `pomosht` на степен Начало · за агента, който чете един низ */
  readonly opisanie: string;
  /** двете части · за екрана, който показва степента, избрана от Настройки */
  readonly pomosht: Pomosht;
  readonly prozortsi: readonly string[];
  readonly stepen: 'chete' | 'pishe';
  readonly myasto: Myasto;
  readonly shema: Komanda<unknown>['shema'];
  readonly proizvezhda: readonly string[];
}

export function opisNaKataloga(): readonly OpisNaKomanda[] {
  return KATALOG.map((k) => ({
    klyuch: k.klyuch,
    ime: k.ime,
    opisanie: tekstNaPomoshtta(k.pomosht, 'nachalo'),
    pomosht: k.pomosht,
    prozortsi: k.prozortsi,
    stepen: k.stepen,
    myasto: k.myasto,
    shema: k.shema,
    proizvezhda: k.proizvezhda,
  }));
}
