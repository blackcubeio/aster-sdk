import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotCancelOrderParams, SpotOrder } from '../types';
import { buildSpotOrderRef } from './payloads';

/** Cancel an active spot order (`TRADE`). */
export function cancelOrderSpot(params: SpotCancelOrderParams, label: string): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<SpotOrder>('spot', '/api/v3/order', body, network, 'DELETE');
}
