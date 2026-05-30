import type { SpotAllOrdersQuery, SpotOrder } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** All spot account orders (active, canceled, filled) on a symbol (`USER_DATA`). */
export function getAllOrdersSpot(query: SpotAllOrdersQuery, label: string): Promise<SpotOrder[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<SpotOrder[]>('spot', '/api/v3/allOrders', body, network);
}
