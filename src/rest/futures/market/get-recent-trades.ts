import { httpGet } from '../../client';
import type { Trade, TradesQuery } from '../types';

/** Recent market trades (order-book fills only). */
export function getRecentTrades(query: TradesQuery, label?: string): Promise<Trade[]> {
  return httpGet<Trade[]>(
    'futures',
    '/fapi/v3/trades',
    { symbol: query.symbol, limit: query.limit },
    label,
  );
}
