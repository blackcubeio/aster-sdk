import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { NewOrderParams, Order } from '../types';
import { buildOrderPayload } from './payloads';

/**
 * Place a new futures order (`TRADE`, signé par l'agent). Un `newClientOrderId` est
 * généré si absent.
 */
export function createOrder(params: NewOrderParams, label: string): Promise<Order> {
  const { body, network } = buildSignedRequest(buildOrderPayload(params), label);
  return httpPostForm<Order>('futures', '/fapi/v3/order', body, network);
}
