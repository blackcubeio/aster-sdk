import type { Trade } from '../../common/types';

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
