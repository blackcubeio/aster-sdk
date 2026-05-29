import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { LeverageResult, UpdateLeverageParams } from '../types';

/** Change initial leverage for a symbol (`TRADE`). */
export function updateLeverage(
  params: UpdateLeverageParams,
  label: string,
): Promise<LeverageResult> {
  const { body, network } = buildSignedRequest(
    { symbol: params.symbol, leverage: params.leverage },
    label,
  );
  return httpPostForm<LeverageResult>('futures', '/fapi/v3/leverage', body, network);
}
