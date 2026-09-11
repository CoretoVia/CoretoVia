/**
 * ОСТАНАЛИЯТ ПРОЗОРЕЦ · името, „идва с ход N" и думите му (правило 12:
 * липсващото се казва, не се крие). Редът на ходовете има един дом —
 * `docs/03-plan.md` §1; числата тук са преписани оттам и `tests/rezenite.test.ts` ги сверява.
 */

import { DUMI_OT_KNIGATA } from '../../src/model/dumi-ot-knigata.js';
import type { KlyuchNaProzorets } from '../../src/model/klyuchove.js';
import { PROZORTSI } from '../../src/model/osnova.js';
import type { KonteksNaEkrana } from '../kontekst.js';
import { h, sloji } from '../reshetka/shablon.js';
import { dumiteHTML } from './profil.js';

/** С кой ход идва прозорецът · по `docs/03-plan.md` §1. */
export const HOD_NA_PROZORETSA: Readonly<Partial<Record<KlyuchNaProzorets, number | string>>> =
  Object.freeze({});

export function narisuvayOstanalite(k: KonteksNaEkrana, klyuch: KlyuchNaProzorets): void {
  const p = PROZORTSI.find((x) => x.klyuch === klyuch);
  if (!p) return;
  const hod = HOD_NA_PROZORETSA[klyuch];
  sloji(
    k.tyalo,
    h`
    <section class="sektsiya" data-sektsiya="${klyuch}">
      <h2 translate="no">${p.list}</h2>
      <p class="vest" data-idva>${hod === undefined ? 'още не е построен' : `идва с ход ${hod}`}</p>
      ${p.lenti.length > 0 ? h`<p class="vest">ленти: ${p.lenti.join(' · ')}</p>` : ''}
      ${dumiteHTML(DUMI_OT_KNIGATA[klyuch])}
    </section>`,
  );
}
