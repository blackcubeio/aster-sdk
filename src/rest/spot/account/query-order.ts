import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderRef } from '../trade/payloads';
import type { SpotOrder, SpotOrderQuery } from '../types';

/** Query a spot order's status (`USER_DATA`). */
export function queryOrderSpot(query: SpotOrderQuery, label: string): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(query.symbol, query.orderId, query.origClientOrderId);
  const { body, network } = buildSignedRequest(payload, label);
  return httpGetSigned<SpotOrder>('spot', '/api/v3/order', body, network);
}
