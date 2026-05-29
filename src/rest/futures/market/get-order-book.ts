import { httpGet } from '../../client';
import type { DepthQuery, OrderBook, PriceLevel } from '../types';

interface OrderBookWire {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: [string, string][];
  asks: [string, string][];
}

/** Order book depth for a symbol. */
export function getOrderBook(query: DepthQuery, label?: string): Promise<OrderBook> {
  return httpGet<OrderBookWire>(
    'futures',
    '/fapi/v3/depth',
    { symbol: query.symbol, limit: query.limit },
    label,
  ).then((wire) => ({
    lastUpdateId: wire.lastUpdateId,
    eventTime: wire.E,
    transactionTime: wire.T,
    bids: wire.bids.map(mapLevel),
    asks: wire.asks.map(mapLevel),
  }));
}

function mapLevel([price, qty]: [string, string]): PriceLevel {
  return { price, qty };
}
