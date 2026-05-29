import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { UserTrade, UserTradesQuery } from '../types';

/** Trades for a specific symbol and account (`USER_DATA`). */
export function getUserTrades(query: UserTradesQuery, label: string): Promise<UserTrade[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<UserTrade[]>('futures', '/fapi/v3/userTrades', body, network);
}
