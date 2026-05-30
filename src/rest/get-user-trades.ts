import type { AsterClient } from '../common/config';
import type { SpotUserTrade } from '../common/spot';
import type { GetUserTradesParams } from '../common/types';
import type { UserTrade } from '../common/types';
import {
  SpotUserTradeConverter,
  UserTradeConverter,
  type UserTradeNative,
} from '../converters/user-trade';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/**
 * Exécutions (fills) du compte au **format unifié** `UserTrade`. `kind` route futures
 * (`/fapi/v3/userTrades`) ou spot (`/api/v3/userTrades`) — les deux signés.
 */
export function getUserTrades(
  client: AsterClient,
  params: GetUserTradesParams,
  label: string,
): Promise<UserTrade[]> {
  const body0 = {
    symbol: params.name,
    startTime: params.startTime,
    endTime: params.endTime,
    limit: params.limit,
  };
  if ((params.kind ?? 'perp') === 'spot') {
    const converter = new SpotUserTradeConverter();
    const { body, network } = buildSignedRequest(client, body0, label);
    return httpGetSigned<SpotUserTrade[]>(client, 'spot', '/api/v3/userTrades', body, network).then(
      (wire) => wire.map((entry) => converter.toCommon(entry)),
    );
  }
  const converter = new UserTradeConverter();
  const { body, network } = buildSignedRequest(client, body0, label);
  return httpGetSigned<UserTradeNative[]>(
    client,
    'futures',
    '/fapi/v3/userTrades',
    body,
    network,
  ).then((wire) => wire.map((entry) => converter.toCommon(entry)));
}
