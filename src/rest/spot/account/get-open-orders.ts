import type { AsterClient } from '../../../common/config';
import type { SpotOrder } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** All current open spot orders on a symbol, or all symbols when omitted (`USER_DATA`). */
export function getOpenOrdersSpot(
  client: AsterClient,
  symbol: string | undefined,
  label: string,
): Promise<SpotOrder[]> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpGetSigned<SpotOrder[]>(client, 'spot', '/api/v3/openOrders', body, network);
}
