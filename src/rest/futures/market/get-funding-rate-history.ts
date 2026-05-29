import { httpGet } from '../../client';
import type { FundingRateEntry, FundingRateQuery } from '../types';

/** Historical funding rates, ascending. */
export function getFundingRateHistory(
  query: FundingRateQuery = {},
  label?: string,
): Promise<FundingRateEntry[]> {
  return httpGet<FundingRateEntry[]>(
    'futures',
    '/fapi/v3/fundingRate',
    {
      symbol: query.symbol,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  );
}
