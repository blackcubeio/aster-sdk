import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { UpdateIsolatedMarginParams, UpdateIsolatedMarginResult } from '../types';

/** Add (`type` 1) or reduce (`type` 2) isolated position margin (`TRADE`). */
export function updateIsolatedMargin(
  params: UpdateIsolatedMarginParams,
  label: string,
): Promise<UpdateIsolatedMarginResult> {
  const payload: JsonObject = {
    symbol: params.symbol,
    amount: params.amount,
    type: params.type,
  };
  if (params.positionSide !== undefined) {
    payload.positionSide = params.positionSide;
  }
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<UpdateIsolatedMarginResult>(
    'futures',
    '/fapi/v3/positionMargin',
    body,
    network,
  );
}
