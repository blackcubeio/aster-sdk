import type { MarketKind, OrderBook } from '../common/types';
import { httpGet } from './client';
import { OrderBookConverter, type OrderBookNative } from '../converters/order-book';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetOrderBookParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Profondeur (nombre de niveaux). */
  limit?: number;
}

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
