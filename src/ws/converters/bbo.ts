import type { MarketKind, OrderBook } from '../../common/types';

/**
 * Payload WS `bookTicker` Aster (format Binance) — `{e, u, E, T, s, b, B, a, A}`
 * (b/B = bid px/qty, a/A = ask px/qty).
 */
export interface BookTickerWsNative {
  e?: string;
  u: number;
  E?: number;
  T?: number;
  s: string;
  b: string;
  B: string;
  a: string;
  A: string;
}

/**
 * Convertisseur WS **unidirectionnel** BBO → {@link OrderBook} (1 niveau bid + 1 ask).
 * Aster ne fournit pas le nb d'ordres (`n = null`). `time` = `T` (transaction time) si présent.
 * Le hors-cœur (`e, u, E`) va dans `xtras`.
 */
export class BboWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: BookTickerWsNative): OrderBook {
    return {
      name: wire.s,
      kind: this.kind,
      bids: [{ price: wire.b, size: wire.B, n: null }],
      asks: [{ price: wire.a, size: wire.A, n: null }],
      time: wire.T ?? null,
      xtras: { e: wire.e, u: wire.u, E: wire.E },
    };
  }
}
