import type { AsterClient } from '../../../common/config';
import type { SpotOrder, SpotOrderQuery } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import { buildSpotOrderRef } from '../trade/payloads';

/** Query a single current open spot order (`USER_DATA`). */
export function getOpenOrderSpot(
  client: AsterClient,
  query: SpotOrderQuery,
  label: string,
): Promise<SpotOrder> {
  const payload = buildSpotOrderRef(query.symbol, query.orderId, query.origClientOrderId);
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpGetSigned<SpotOrder>(client, 'spot', '/api/v3/openOrder', body, network);
}
