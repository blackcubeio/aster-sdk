import type { MarketKind, Price } from '../../common/types';

/**
 * Élément du payload WS `!markPrice@arr` Aster (format Binance) —
 * `{e, E, s, p, i, P, r, T}` (p = mark, i = index/oracle, r = funding).
 */
export interface MarkPriceWsNative {
  e?: string;
  E: number;
  s: string;
  p: string;
  i: string;
  P: string;
  r: string;
  T: number;
}

/**
 * Convertisseur WS **unidirectionnel** prix → `Price[]` (snapshot multi-symboles).
 * Aster `allMarkPrices` fournit mark/oracle/funding ; mid/bid/ask/last/oi/vol = `null`.
 * Le hors-cœur (`P`, `T`, `e`) va dans `xtras` — rien jeté.
 */
export class PricesWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: MarkPriceWsNative[]): Price[] {
    return wire.map((entry) => ({
      name: entry.s,
      kind: this.kind,
      mark: entry.p,
      oracle: entry.i,
      mid: null,
      bid: null,
      ask: null,
      last: null,
      funding: entry.r,
      openInterest: null,
      volume24h: null,
      prevDayPrice: null,
      time: entry.E,
      xtras: { P: entry.P, T: entry.T, e: entry.e },
    }));
  }
}
