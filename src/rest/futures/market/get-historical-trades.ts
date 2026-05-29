import { httpGet } from '../../client';
import type { HistoricalTradesQuery, MarketTrade } from '../types';

/** Older market historical trades (`MARKET_DATA`). */
export function getHistoricalTrades(
  query: HistoricalTradesQuery,
  label?: string,
): Promise<MarketTrade[]> {
  return httpGet<MarketTrade[]>(
    'futures',
    '/fapi/v3/historicalTrades',
    { symbol: query.symbol, limit: query.limit, fromId: query.fromId },
    label,
  );
}
