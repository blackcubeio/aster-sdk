import type { FundingRate } from '../common/types';
import { httpGet } from './client';
import { FundingConverter, type FundingRateNative } from '../converters/funding';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetFundingHistoryParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Début (ms). */
  startTime?: number;
  /** Fin (ms). */
  endTime?: number;
  /** Nombre de points. */
  limit?: number;
}

/** Historique du **taux de funding** au format unifié (Aster `/fapi/v3/fundingRate`). */
export function getFundingHistory(
  params: GetFundingHistoryParams,
  label?: string,
): Promise<FundingRate[]> {
  const converter = new FundingConverter();
  return httpGet<FundingRateNative[]>(
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
