import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotOrder } from '../types';

/** All current open spot orders on a symbol, or all symbols when omitted (`USER_DATA`). */
export function getOpenOrdersSpot(symbol: string | undefined, label: string): Promise<SpotOrder[]> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpGetSigned<SpotOrder[]>('spot', '/api/v3/openOrders', body, network);
}
