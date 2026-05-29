import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { EditOrderParams, FuturesOrder } from '../types';
import { buildOrderRef } from './payloads';

/** Modify an active `LIMIT` order's price/quantity (`TRADE`). */
export function editOrder(params: EditOrderParams, label: string): Promise<FuturesOrder> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  payload.quantity = params.quantity;
  payload.price = params.price;
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<FuturesOrder>('futures', '/fapi/v3/order', body, network, 'PUT');
}
