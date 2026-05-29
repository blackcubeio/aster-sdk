import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CodeMsg, UpdateMarginModeParams } from '../types';

/** Switch a symbol between `ISOLATED` and `CROSSED` margin (`TRADE`). */
export function updateMarginMode(params: UpdateMarginModeParams, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(
    { symbol: params.symbol, marginType: params.marginType },
    label,
  );
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/marginType', body, network);
}
