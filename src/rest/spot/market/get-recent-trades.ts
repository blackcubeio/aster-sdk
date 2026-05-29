import { httpGet } from '../../client';
import type { SpotTrade, SpotTradesQuery } from '../types';

/** Recent spot trades. */
export function getRecentTradesSpot(query: SpotTradesQuery, label?: string): Promise<SpotTrade[]> {
  return httpGet<SpotTrade[]>(
    'spot',
    '/api/v3/trades',
    { symbol: query.symbol, limit: query.limit },
    label,
  );
}
