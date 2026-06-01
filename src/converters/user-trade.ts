import type { FuturesUserTrade } from '../common/futures';
import type { SpotUserTrade } from '../common/spot';
import type { UserTrade } from '../common/types';

/** Fill natif Aster (futures `FuturesUserTrade`). */
export type UserTradeNative = FuturesUserTrade;

/**
 * Convertisseur **bijectif** fill : `toCommon(native) → UserTrade` / inverse.
 * `side` dérivé (BUY/SELL ; natif gardé dans xtras) ; positionSide/quoteQty/buyer → `xtras`.
 */
export class UserTradeConverter {
  toCommon(wire: UserTradeNative): UserTrade {
    const {
      id,
      orderId,
      symbol,
      price,
      qty,
      realizedPnl,
      commission,
      commissionAsset,
      maker,
      time,
      ...rest
    } = wire;
    return {
      name: symbol,
      kind: 'perp',
      id: String(id),
      orderId: String(orderId),
      side: (rest.side as string) === 'SELL' ? 'sell' : 'buy',
      price,
      size: qty,
      fee: commission,
      feeAsset: commissionAsset,
      pnl: realizedPnl,
      maker,
      time,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(trade: UserTrade): UserTradeNative {
    return {
      id: Number(trade.id),
      orderId: Number(trade.orderId),
      symbol: trade.name,
      price: trade.price,
      qty: trade.size,
      realizedPnl: trade.pnl as string,
      commission: trade.fee,
      commissionAsset: trade.feeAsset as string,
      maker: trade.maker as boolean,
      time: trade.time,
      ...trade.xtras,
    } as UserTradeNative;
  }
}

/**
 * Convertisseur **unidirectionnel** fill **spot** Aster → `UserTrade` (`kind: 'spot'`).
 * Le spot n'a pas de PnL réalisé (→ `pnl: null`). `quoteQty`/`buyer`/`counterpartyId`… → `xtras`.
 */
export class SpotUserTradeConverter {
  toCommon(wire: SpotUserTrade): UserTrade {
    const { id, orderId, symbol, price, qty, commission, commissionAsset, maker, time, ...rest } =
      wire;
    return {
      name: symbol,
      kind: 'spot',
      id: String(id),
      orderId: String(orderId),
      side: (rest.side as string) === 'SELL' ? 'sell' : 'buy',
      price,
      size: qty,
      fee: commission,
      feeAsset: commissionAsset,
      pnl: null,
      maker,
      time,
      xtras: rest as Record<string, unknown>,
    };
  }
}

// ── WebSocket (unidirectionnel) ───────────────────────────────────────────────

/**
 * Payload WS `ORDER_TRADE_UPDATE` Aster lorsqu'il représente un **fill** (`o.x === 'TRADE'`).
 * Champs de fill dans `o` : `t`=trade id, `l`=qty exécutée, `L`=prix exécuté, `n`=commission,
 * `N`=actif de commission, `rp`=PnL réalisé, `m`=maker, `S`=side, `i`=orderId.
 */
export interface OrderTradeFillWsNative {
  e: string;
  E: number;
  T: number;
  o: {
    s: string;
    S: string;
    i: number;
    t: number;
    l: string;
    L: string;
    n: string;
    N: string;
    rp: string;
    m: boolean;
    x: string;
    T: number;
    [key: string]: unknown;
  };
}

/**
 * Convertisseur WS **unidirectionnel** fill → {@link UserTrade} (démux des `ORDER_TRADE_UPDATE`
 * de type `TRADE`). `price`=`L`, `size`=`l`, `fee`=`n`, `pnl`=`rp`. Le hors-cœur va dans `xtras`.
 */
export class UserTradeWsConverter {
  toCommon(msg: OrderTradeFillWsNative): UserTrade {
    const o = msg.o;
    const { s, S, i, t, l, L, n, N, rp, m, ...rest } = o;
    return {
      name: s,
      kind: 'perp',
      id: String(t),
      orderId: String(i),
      side: S === 'SELL' ? 'sell' : 'buy',
      price: L,
      size: l,
      fee: n,
      feeAsset: N,
      pnl: rp,
      maker: m,
      time: o.T,
      xtras: { ...rest, S, e: msg.e, E: msg.E },
    };
  }
}
