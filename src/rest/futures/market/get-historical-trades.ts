import type { AsterClient } from '../../../common/config';
import type { HistoricalTradesParams, MarketTrade } from '../../../common/futures';
import { httpGet } from '../../client';

/** Older market historical trades (`MARKET_DATA`). */
export function getHistoricalTrades(
  client: AsterClient,
  query: HistoricalTradesParams,
  label?: string,
): Promise<MarketTrade[]> {
  return httpGet<MarketTrade[]>(
    client,
    'futures',
    '/fapi/v3/historicalTrades',
    { symbol: query.symbol, limit: query.limit, fromId: query.fromId },
    label,
  );
}
