import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { ForceOrdersQuery, OrderDetail } from '../types';

/** User's liquidation / ADL orders (`USER_DATA`). */
export function getForceOrders(
  query: ForceOrdersQuery | undefined,
  label: string,
): Promise<OrderDetail[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<OrderDetail[]>('futures', '/fapi/v3/forceOrders', body, network);
}
