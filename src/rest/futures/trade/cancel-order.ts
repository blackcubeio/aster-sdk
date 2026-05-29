import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CancelOrderParams, FuturesOrder } from '../types';
import { buildOrderRef } from './payloads';

/** Cancel an active order (`TRADE`). */
export function cancelOrder(params: CancelOrderParams, label: string): Promise<FuturesOrder> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<FuturesOrder>('futures', '/fapi/v3/order', body, network, 'DELETE');
}
