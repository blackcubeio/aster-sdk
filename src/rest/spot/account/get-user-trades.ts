import type { SpotUserTrade, SpotUserTradesQuery } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Spot trade history for a symbol/account (`USER_DATA`). */
export function getUserTradesSpot(
  query: SpotUserTradesQuery,
  label: string,
): Promise<SpotUserTrade[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<SpotUserTrade[]>('spot', '/api/v3/userTrades', body, network);
}
