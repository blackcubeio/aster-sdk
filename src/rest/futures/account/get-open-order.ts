import type { AsterClient } from '../../../common/config';
import type { OrderDetail, OrderQuery } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildOrderRef } from '../trade/payloads';

/** Query a single current open order (`USER_DATA`). */
export function getOpenOrder(
  client: AsterClient,
  params: OrderQuery,
  label: string,
): Promise<OrderDetail> {
  const payload = buildOrderRef(params.symbol, params.orderId, params.origClientOrderId);
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpGetSigned<OrderDetail>(client, 'futures', '/fapi/v3/openOrder', body, network);
}
