import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderRef } from '../trade/payloads';
import type { SpotOrder, SpotOrderQuery } from '../types';

/** Query a single current open spot order (`USER_DATA`). */
export function getOpenOrderSpot(query: SpotOrderQuery, label: string): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(query.symbol, query.orderId, query.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpGetSigned<SpotOrder>('spot', '/api/v3/openOrder', body, network);
}
