import type { GetOrderBookParams } from '../common/types';
import type { MarketKind, OrderBook } from '../common/types';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';
import { httpGet } from './client';

/** Carnet d'ordres au **format unifié** `OrderBook` (route futures/spot via `kind`). */
export function getOrderBook(params: GetOrderBookParams, label?: string): Promise<OrderBook> {
  const kind = params.kind ?? 'perp';
  const converter = new OrderBookConverter(params.name, kind);
  const [product, path] =
    kind === 'spot'
      ? (['spot', '/api/v3/depth'] as const)
      : (['futures', '/fapi/v3/depth'] as const);
  return httpGet<OrderBookNative>(
    product,
    path,
    { symbol: params.name, limit: params.limit },
    label,
  ).then((wire) => converter.toCommon(wire));
}
