import type { GetUserTradesParams } from '../common/types';
import type { UserTrade } from '../common/types';
import { UserTradeConverter, type UserTradeNative } from '../converters/user-trade';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/** Exécutions (fills) du compte au **format unifié** `UserTrade` (Aster `/fapi/v3/userTrades`, **signé**). */
export function getUserTrades(params: GetUserTradesParams, label: string): Promise<UserTrade[]> {
  const converter = new UserTradeConverter();
  const { body, network } = buildSignedRequest(
    {
      symbol: params.name,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  );
  return httpGetSigned<UserTradeNative[]>('futures', '/fapi/v3/userTrades', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
