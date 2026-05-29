import { httpGet } from '../../client';
import type { SpotDepthQuery, SpotOrderBook, SpotPriceLevel } from '../types';

interface OrderBookWire {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: [string, string][];
  asks: [string, string][];
}

/** Spot order book depth for a symbol. */
export function getOrderBookSpot(query: SpotDepthQuery, label?: string): Promise<SpotOrderBook> {
  return httpGet<OrderBookWire>(
    'spot',
    '/api/v3/depth',
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

function mapLevel([price, qty]: [string, string]): SpotPriceLevel {
  return { price, qty };
}
