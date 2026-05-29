import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CodeMsg } from '../types';

/** Cancel all open orders on a symbol (`TRADE`). */
export function cancelAllOpenOrders(symbol: string, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/allOpenOrders', body, network, 'DELETE');
}
