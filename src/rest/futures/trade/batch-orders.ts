import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { BatchOrderResult, NewOrderParams } from '../types';
import { buildOrderPayload } from './payloads';

/**
 * Place up to 5 orders at once (`TRADE`). The result array mirrors the input order; each
 * entry is either a filled `Order` or a per-item `{ code, msg }` error.
 */
export function batchOrders(orders: NewOrderParams[], label: string): Promise<BatchOrderResult[]> {
  const batch = orders.map((order) => buildOrderPayload(order));
  const { body, network } = buildSignedRequest({ batchOrders: batch }, label);
  return httpPostForm<BatchOrderResult[]>('futures', '/fapi/v3/batchOrders', body, network);
}
