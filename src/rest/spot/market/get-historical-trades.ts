import type { AsterClient } from '../../../common/config';
import type { SpotHistoricalTradesParams, SpotTrade } from '../../../common/spot';
import { httpGet } from '../../client';

/** Older spot historical trades (`MARKET_DATA`). */
export function getHistoricalTradesSpot(
  client: AsterClient,
  query: SpotHistoricalTradesParams,
  label?: string,
): Promise<SpotTrade[]> {
  return httpGet<SpotTrade[]>(
    client,
    'spot',
    '/api/v3/historicalTrades',
    { symbol: query.symbol, limit: query.limit, fromId: query.fromId },
    label,
  );
}
