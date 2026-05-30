import type { AsterClient } from '../../../common/config';
import type { SpotCancelOrderParams, SpotOrder } from '../../../common/spot';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderRef } from './payloads';

/** Cancel an active spot order (`TRADE`). */
export function cancelOrderSpot(
  client: AsterClient,
  params: SpotCancelOrderParams,
  label: string,
): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<SpotOrder>(client, 'spot', '/api/v3/order', body, network, 'DELETE');
}
