import type { SpotHistoricalTradesQuery, SpotTrade } from '../../../common/spot';
import { httpGet } from '../../client';

/** Older spot historical trades (`MARKET_DATA`). */
export function getHistoricalTradesSpot(
  query: SpotHistoricalTradesQuery,
  label?: string,
): Promise<SpotTrade[]> {
  return httpGet<SpotTrade[]>(
    'spot',
    '/api/v3/historicalTrades',
    { symbol: query.symbol, limit: query.limit, fromId: query.fromId },
    label,
  );
}
