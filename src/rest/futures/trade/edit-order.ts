import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { EditOrderParams, Order } from '../types';
import { buildOrderRef } from './payloads';

/** Modify an active `LIMIT` order's price/quantity (`TRADE`). */
export function editOrder(params: EditOrderParams, label: string): Promise<Order> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  payload.quantity = params.quantity;
  payload.price = params.price;
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<Order>('futures', '/fapi/v3/order', body, network, 'PUT');
}
