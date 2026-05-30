import type { AsterClient } from '../../../common/config';
import type { SpotOrder, SpotOrderQuery } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderRef } from '../trade/payloads';

/** Query a spot order's status (`USER_DATA`). */
export function queryOrderSpot(
  client: AsterClient,
  query: SpotOrderQuery,
  label: string,
): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(query.symbol, query.orderId, query.origClientOrderId);
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpGetSigned<SpotOrder>(client, 'spot', '/api/v3/order', body, network);
}
