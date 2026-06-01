import type { MarketTrade } from '../common/futures';
import type { SpotTrade } from '../common/spot';
import type { Trade } from '../common/types';

/** Trade public natif Aster (futures `MarketTrade` ou `SpotTrade`, même cœur positionnel). */
export type TradeNative = MarketTrade | SpotTrade;

/**
 * Convertisseur **bijectif** trade : `toCommon(native) → Trade` / `toNative(trade) → native`.
 * `side` = direction du taker (= opposé du maker) déduite de `isBuyerMaker` ; `maker = null`
 * (Aster expose un trade par marché, pas un rôle de fill). `isBuyerMaker` + `quoteQty`/`baseQty`
 * vont dans `xtras` → bijection totale.
 */
export class TradeConverter {
  toCommon(wire: TradeNative): Trade {
    const { id, price, qty, time, ...rest } = wire;
    return {
      price,
      size: qty,
      side: (rest as { isBuyerMaker: boolean }).isBuyerMaker ? 'sell' : 'buy',
      maker: null,
      time,
      id,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(trade: Trade): TradeNative {
    return {
      id: trade.id as number,
      price: trade.price,
      qty: trade.size,
      time: trade.time,
      ...trade.xtras,
    } as TradeNative;
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

/**
 * Payload WS `aggTrade` Aster (format Binance) — un message par trade agrégé
 * `{e, E, s, a, p, q, f, l, T, m}`. `m` = l'acheteur est-il le maker.
 */
export interface AggTradeWsNative {
  e: string;
  E: number;
  s: string;
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
}

/**
 * Convertisseur WS **unidirectionnel** trade : `toCommon(payload) → Trade`.
 * `side` = taker = opposé du maker (`m=true` ⇒ acheteur maker ⇒ taker vend) ; `maker = null`
 * (trade public). Le hors-cœur (`e/E/s/f/l/m`) va dans `xtras` — rien jeté.
 */
export class TradeWsConverter {
  toCommon(wire: AggTradeWsNative): Trade {
    const { p, q, T, a, ...rest } = wire;
    return {
      price: p,
      size: q,
      side: wire.m ? 'sell' : 'buy',
      maker: null,
      time: T,
      id: a,
      xtras: rest as Record<string, unknown>,
    };
  }
}
