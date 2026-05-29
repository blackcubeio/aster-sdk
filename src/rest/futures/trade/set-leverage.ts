import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { LeverageResult, SetLeverageParams } from '../types';

/** Change initial leverage for a symbol (`TRADE`). */
export function setLeverage(params: SetLeverageParams, label: string): Promise<LeverageResult> {
  const { body, network } = buildSignedRequest(
    { symbol: params.symbol, leverage: params.leverage },
    label,
  );
  return httpPostForm<LeverageResult>('futures', '/fapi/v3/leverage', body, network);
}
