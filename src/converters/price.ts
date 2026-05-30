import type { MarketKind, Price } from '../common/types';

/** Snapshot natif Aster (`/fapi/v3/premiumIndex`). */
export interface PriceNative {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

/**
 * Convertisseur **bijectif** prix : `toCommon(native) → Price` / `toNative(price) → native`.
 * Aster = perp (markPrice). `mark`/`oracle(=index)`/`funding`/`time` mappés ; `mid`/`openInterest`/
 * `volume24h`/`prevDayPrice` absents de ce endpoint (`null`). estimatedSettle/nextFundingTime/
 * interestRate → `xtras` → bijection totale.
 */
export class PriceConverter {
  toCommon(wire: PriceNative): Price {
    return {
      name: wire.symbol,
      kind: 'perp',
      mark: wire.markPrice,
      oracle: wire.indexPrice,
      mid: null,
      bid: null,
      ask: null,
      last: null,
      funding: wire.lastFundingRate,
      openInterest: null,
      volume24h: null,
      prevDayPrice: null,
      time: wire.time,
      xtras: {
        estimatedSettlePrice: wire.estimatedSettlePrice,
        nextFundingTime: wire.nextFundingTime,
        interestRate: wire.interestRate,
      },
    };
  }

  toNative(price: Price): PriceNative {
    const xtras = price.xtras ?? {};
    return {
      symbol: price.name,
      markPrice: price.mark as string,
      indexPrice: price.oracle as string,
      estimatedSettlePrice: xtras.estimatedSettlePrice as string,
      lastFundingRate: price.funding as string,
      nextFundingTime: xtras.nextFundingTime as number,
      interestRate: xtras.interestRate as string,
      time: price.time as number,
    };
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

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
