import type { AsterClient } from '../common/config';
import type { GetFundingHistoryParams } from '../common/types';
import type { FundingRate } from '../common/types';
import { FundingConverter, type FundingRateNative } from '../converters/funding';
import { httpGet } from './client';

/** Historique du **taux de funding** au format unifié (Aster `/fapi/v3/fundingRate`). */
export function getFundingHistory(
  client: AsterClient,
  params: GetFundingHistoryParams,
  label?: string,
): Promise<FundingRate[]> {
  const converter = new FundingConverter();
  return httpGet<FundingRateNative[]>(
    client,
    'futures',
    '/fapi/v3/fundingRate',
    {
      symbol: params.name,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  ).then((wire) => wire.map((entry) => converter.toCommon(entry)));
}
