import type { AsterClient } from '../../../common/config';
import type { BatchOrderResult, CancelMultipleOrdersParams } from '../../../common/futures';
import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/**
 * Cancel up to 10 orders on a symbol (`TRADE`). Either `orderIdList` or
 * `origClientOrderIdList` must be provided; each list is JSON-encoded on the wire.
 */
export function cancelMultipleOrders(
  client: AsterClient,
  params: CancelMultipleOrdersParams,
  label: string,
): Promise<BatchOrderResult[]> {
  const payload: JsonObject = { symbol: params.symbol };
  if (params.orderIdList !== undefined) {
    payload.orderIdList = params.orderIdList;
  } else if (params.origClientOrderIdList !== undefined) {
    payload.origClientOrderIdList = params.origClientOrderIdList;
  } else {
    throw new Error('orderIdList ou origClientOrderIdList est requis');
  }
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<BatchOrderResult[]>(
    client,
    'futures',
    '/fapi/v3/batchOrders',
    body,
    network,
    'DELETE',
  );
}
