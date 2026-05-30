import type { MarketKind, OrderBook, OrderBookLevel } from '../../common/types';

/**
 * Payload WS depth Aster (format Binance) — `{e, E, T, s, U, u, pu, b, a}`.
 * `b`/`a` = niveaux `[prix, taille]`. Utilisé pour le snapshot partiel (`partialDepth`).
 */
export interface DepthWsNative {
  e?: string;
  E?: number;
  T?: number;
  s: string;
  U?: number;
  u?: number;
  pu?: number;
  b: [string, string][];
  a: [string, string][];
}

/**
 * Convertisseur WS **unidirectionnel** carnet → {@link OrderBook}.
 * Aster ne fournit pas le nb d'ordres (`n = null`). `time` = `T`. Le hors-cœur
 * (`e, E, U, u, pu`) va dans `xtras` — rien jeté.
 */
export class OrderBookWsConverter {
  constructor(private readonly kind: MarketKind) {}

  toCommon(wire: DepthWsNative): OrderBook {
    return {
      name: wire.s,
      kind: this.kind,
      bids: wire.b.map(toLevel),
      asks: wire.a.map(toLevel),
      time: wire.T ?? null,
      xtras: { e: wire.e, E: wire.E, U: wire.U, u: wire.u, pu: wire.pu },
    };
  }
}

function toLevel([price, size]: [string, string]): OrderBookLevel {
  return { price, size, n: null };
}
