import type { MarketKind, OrderBook, OrderBookLevel } from '../common/types';

/** Carnet natif Aster (futures `/fapi/v3/depth` et spot `/api/v3/depth`, même forme). */
export interface OrderBookNative {
  lastUpdateId: number;
  /** Event time (ms). */
  E: number;
  /** Transaction time (ms). */
  T: number;
  bids: [string, string][];
  asks: [string, string][];
}

/**
 * Convertisseur **bijectif** carnet : `toCommon(native) → OrderBook` / `toNative(book) → native`.
 * `name`/`kind` (absents du wire Aster) sont portés par le convertisseur.
 * `time = T` (transaction time) ; `lastUpdateId`/`eventTime` vont dans `xtras` → bijection totale.
 */
export class OrderBookConverter {
  constructor(
    private readonly name: string,
    private readonly kind: MarketKind,
  ) {}

  toCommon(wire: OrderBookNative): OrderBook {
    return {
      name: this.name,
      kind: this.kind,
      bids: wire.bids.map(toLevel),
      asks: wire.asks.map(toLevel),
      time: wire.T,
      xtras: { lastUpdateId: wire.lastUpdateId, eventTime: wire.E },
    };
  }

  toNative(book: OrderBook): OrderBookNative {
    const xtras = book.xtras ?? {};
    return {
      lastUpdateId: xtras.lastUpdateId as number,
      E: xtras.eventTime as number,
      T: book.time as number,
      bids: book.bids.map(toWire),
      asks: book.asks.map(toWire),
    };
  }
}

function toLevel([price, size]: [string, string]): OrderBookLevel {
  return { price, size, n: null };
}

function toWire(level: OrderBookLevel): [string, string] {
  return [level.price, level.size];
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

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
