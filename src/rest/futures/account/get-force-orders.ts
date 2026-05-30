import type { AsterClient } from '../../../common/config';
import type { ForceOrdersQuery, OrderDetail } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** User's liquidation / ADL orders (`USER_DATA`). */
export function getForceOrders(
  client: AsterClient,
  query: ForceOrdersQuery | undefined,
  label: string,
): Promise<OrderDetail[]> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<OrderDetail[]>(client, 'futures', '/fapi/v3/forceOrders', body, network);
}
