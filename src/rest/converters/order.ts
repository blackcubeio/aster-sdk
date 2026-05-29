import type { Order, Side } from '../../common/types';
import type { FuturesOrder } from '../futures/types';

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
