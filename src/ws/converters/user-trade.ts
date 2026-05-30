import type { UserTrade } from '../../common/types';

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
