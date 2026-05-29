import type { UserTrade } from '../common/types';
import { httpGetSigned } from './client';
import { UserTradeConverter, type UserTradeNative } from './converters/user-trade';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés. `user` ignoré côté Aster (compte = signataire de `label`). */
export interface GetUserTradesParams {
  /** Adresse du compte (HL/Pacifica) ; Aster utilise le signataire de `label`. */
  user?: string;
  /** Filtre sur une paire (requis côté Aster). */
  name?: string;
  /** Début (ms). */
  startTime?: number;
  /** Fin (ms). */
  endTime?: number;
  /** Nombre max. */
  limit?: number;
}

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
