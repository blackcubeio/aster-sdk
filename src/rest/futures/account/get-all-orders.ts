import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { AllOrdersQuery, OrderDetail } from '../types';

/** All account orders (active, canceled, filled) on a symbol (`USER_DATA`). */
export function getAllOrders(query: AllOrdersQuery, label: string): Promise<OrderDetail[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<OrderDetail[]>('futures', '/fapi/v3/allOrders', body, network);
}
