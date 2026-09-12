/**
 * Месец (`YYYY-MM`) става дата · първото число.
 *
 * Движенията в Сметки носят МЕСЕЦ, не ден (неговата Книга е по месеци), а
 * решетката работи с дати. Първото число на месеца пада в колоната на този
 * месец при всеки такт от месец нагоре; при по-ситен такт — в първата му
 * колона, което е същият месец.
 */
export function denNaMeseca(mesets: string): string {
  return /^\d{4}-\d{2}$/.test(mesets) ? `${mesets}-01` : mesets;
}

/**
 * ДВАНАЙСЕТТЕ МЕСЕЦА на календара · периодът, който Книгата му показва.
 *
 * В листа Сметки тактовете са ТОЧНО дванайсет колони (в новата му Книга M…X), а
 * пред тях стои сборът за периода. Затова тук не се ползва тактът „година" — той
 * рисува шест години напред за скрол — а свой период от дванайсет месеца,
 * завършващ с показания месец.
 */
export function dvanaysetMeseca(mesets: string): { readonly ot: string; readonly do: string } {
  const [g, m] = mesets.split('-');
  const krayG = Number(g);
  const krayM = Number(m);
  const obshto = krayG * 12 + (krayM - 1) - 11;
  const nachaloG = Math.floor(obshto / 12);
  const nachaloM = obshto - nachaloG * 12 + 1;
  // последният ден на показания месец · нулевият ден на следващия
  const sledvashtG = krayM === 12 ? krayG + 1 : krayG;
  const sledvashtM = krayM === 12 ? 1 : krayM + 1;
  const posleden = new Date(Date.UTC(sledvashtG, sledvashtM - 1, 0)).getUTCDate();
  return {
    ot: `${nachaloG}-${String(nachaloM).padStart(2, '0')}-01`,
    do: `${g}-${m}-${String(posleden).padStart(2, '0')}`,
  };
}
