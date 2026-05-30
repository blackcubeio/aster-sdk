import type { FuturesOrder } from '../common/futures';
import type { SpotOrder } from '../common/spot';
import type { Order, Side } from '../common/types';

/** Ordre natif Aster (futures `FuturesOrder`, ou `OrderDetail` qui l'étend). */
export type OrderNative = FuturesOrder;

const TYPE: Record<string, Order['type']> = {
  LIMIT: 'limit',
  MARKET: 'market',
  STOP: 'stop',
  STOP_MARKET: 'stopMarket',
  TAKE_PROFIT: 'takeProfit',
  TAKE_PROFIT_MARKET: 'takeProfitMarket',
  TRAILING_STOP_MARKET: 'trailingStop',
};
const STATUS: Record<string, Order['status']> = {
  NEW: 'open',
  PARTIALLY_FILLED: 'partiallyFilled',
  FILLED: 'filled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};
const TIF: Record<string, Order['tif']> = { GTC: 'gtc', IOC: 'ioc', FOK: 'fok', GTX: 'alo' };

/**
 * Convertisseur **bijectif** ordre : `toCommon(native) → Order` / inverse.
 * `side`/`type`/`status`/`tif` sont des littéraux dérivés ; les **valeurs natives sont conservées
 * dans `xtras`** (avec positionSide, avgPrice, stopPrice…) → `toNative` les restitue. Bijection totale.
 */
export class OrderConverter {
  toCommon(wire: OrderNative): Order {
    const {
      orderId,
      clientOrderId,
      symbol,
      price,
      origQty,
      executedQty,
      reduceOnly,
      updateTime,
      ...rest
    } = wire;
    return {
      name: symbol,
      kind: 'perp',
      id: String(orderId),
      clientId: clientOrderId === '' ? null : clientOrderId,
      side: (rest.side as string) === 'SELL' ? 'sell' : ('buy' as Side),
      type: TYPE[rest.type as string] ?? 'other',
      price,
      size: origQty,
      filled: executedQty,
      status: STATUS[rest.status as string] ?? 'other',
      tif: TIF[rest.timeInForce as string] ?? null,
      reduceOnly,
      time: updateTime,
      xtras: rest as Record<string, unknown>,
    };
  }

  toNative(order: Order): OrderNative {
    return {
      orderId: Number(order.id),
      clientOrderId: order.clientId ?? '',
      symbol: order.name,
      price: order.price as string,
      origQty: order.size,
      executedQty: order.filled,
      reduceOnly: order.reduceOnly as boolean,
      updateTime: order.time,
      ...order.xtras,
    } as unknown as OrderNative;
  }
}

/**
 * Convertisseur **unidirectionnel** ordre **spot** Aster → `Order` (`kind: 'spot'`).
 * `SpotOrder` n'a pas de `reduceOnly`/`positionSide` (→ `reduceOnly: null`). Le reste du natif
 * (avgPrice, cumQty, stopPrice…) va dans `xtras`.
 */
export class SpotOrderConverter {
  toCommon(wire: SpotOrder): Order {
    const { orderId, clientOrderId, symbol, price, origQty, executedQty, updateTime, ...rest } =
      wire;
    return {
      name: symbol,
      kind: 'spot',
      id: String(orderId),
      clientId: clientOrderId === '' ? null : clientOrderId,
      side: (rest.side as string) === 'SELL' ? 'sell' : ('buy' as Side),
      type: TYPE[rest.type as string] ?? 'other',
      price,
      size: origQty,
      filled: executedQty,
      status: STATUS[rest.status as string] ?? 'other',
      tif: TIF[rest.timeInForce as string] ?? null,
      reduceOnly: null,
      time: updateTime,
      xtras: rest as Record<string, unknown>,
    };
  }
}

// ── WebSocket (unidirectionnel) — reutilise les const TYPE/STATUS/TIF REST ci-dessus ──
/**
 * Payload WS `ORDER_TRADE_UPDATE` Aster (format Binance) — `{e, E, T, o}`. L'ordre est dans `o`
 * (clés courtes : `s`=symbole, `c`=clientId, `S`=side, `o`=type, `f`=tif, `q`=taille,
 * `p`=prix, `X`=statut, `i`=orderId, `z`=cumul exécuté, `R`=reduceOnly, `T`=temps).
 */
export interface OrderTradeUpdateWsNative {
  e: string;
  E: number;
  T: number;
  o: {
    s: string;
    c: string;
    S: string;
    o: string;
    f: string;
    q: string;
    p: string;
    X: string;
    i: number;
    z: string;
    R: boolean;
    T: number;
    [key: string]: unknown;
  };
}

/**
 * Convertisseur WS **unidirectionnel** ordre → {@link Order} (démux du flux user-data).
 * Les valeurs natives (S/o/f/X + champs hors cœur + wrapper e/E) vont dans `xtras` — rien jeté.
 */
export class OrderWsConverter {
  toCommon(msg: OrderTradeUpdateWsNative): Order {
    const { s, c, S, o, f, q, p, X, i, z, R, T, ...rest } = msg.o;
    return {
      name: s,
      kind: 'perp',
      id: String(i),
      clientId: c === '' ? null : c,
      side: S === 'SELL' ? 'sell' : 'buy',
      type: TYPE[o] ?? 'other',
      price: p,
      size: q,
      filled: z,
      status: STATUS[X] ?? 'other',
      tif: TIF[f] ?? null,
      reduceOnly: R,
      time: T,
      xtras: { ...rest, S, o, f, X, e: msg.e, E: msg.E, eventTime: msg.T },
    };
  }
}
