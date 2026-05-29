import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { OrderDetail } from '../types';

/** All current open orders on a symbol, or on every symbol when omitted (`USER_DATA`). */
export function getOpenOrders(symbol: string | undefined, label: string): Promise<OrderDetail[]> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpGetSigned<OrderDetail[]>('futures', '/fapi/v3/openOrders', body, network);
}
