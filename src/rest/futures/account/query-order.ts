import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildOrderRef } from '../trade/payloads';
import type { OrderDetail, OrderQuery } from '../types';

/** Check an order's status (`USER_DATA`). `orderId` or `origClientOrderId` required. */
export function queryOrder(params: OrderQuery, label: string): Promise<OrderDetail> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpGetSigned<OrderDetail>('futures', '/fapi/v3/order', body, network);
}
