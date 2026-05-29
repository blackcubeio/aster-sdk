import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildOrderRef } from '../trade/payloads';
import type { OrderDetail, OrderQuery } from '../types';

/** Query a single current open order (`USER_DATA`). */
export function getOpenOrder(params: OrderQuery, label: string): Promise<OrderDetail> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpGetSigned<OrderDetail>('futures', '/fapi/v3/openOrder', body, network);
}
