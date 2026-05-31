import type { AsterClient } from '../../../common/config';
import type { SpotUserTrade, SpotUserTradesParams } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Spot trade history for a symbol/account (`USER_DATA`). */
export function getUserTradesSpot(
  client: AsterClient,
  query: SpotUserTradesParams,
  label: string,
): Promise<SpotUserTrade[]> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<SpotUserTrade[]>(client, 'spot', '/api/v3/userTrades', body, network);
}
