import type { AsterClient } from '../../../common/config';
import type {
  UpdateIsolatedMarginParams,
  UpdateIsolatedMarginResult,
} from '../../../common/futures';
import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Add (`type` 1) or reduce (`type` 2) isolated position margin (`TRADE`). */
export function updateIsolatedMargin(
  client: AsterClient,
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
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<UpdateIsolatedMarginResult>(
    client,
    'futures',
    '/fapi/v3/positionMargin',
    body,
    network,
  );
}
