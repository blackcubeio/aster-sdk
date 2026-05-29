import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotUserTrade, SpotUserTradesQuery } from '../types';

/** Spot trade history for a symbol/account (`USER_DATA`). */
export function getUserTradesSpot(
  query: SpotUserTradesQuery,
  label: string,
): Promise<SpotUserTrade[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<SpotUserTrade[]>('spot', '/api/v3/userTrades', body, network);
}
