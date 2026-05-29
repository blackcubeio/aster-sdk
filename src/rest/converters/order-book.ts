import type { MarketKind, OrderBook, OrderBookLevel } from '../../common/types';

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
