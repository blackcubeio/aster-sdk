import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { FuturesBalance } from '../types';

/** Futures account balances per asset (`USER_DATA`, signé par l'agent). */
export function getBalance(label: string): Promise<FuturesBalance[]> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<FuturesBalance[]>('futures', '/fapi/v3/balance', body, network);
}
