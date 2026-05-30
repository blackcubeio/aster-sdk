import type { Balance } from '../common/types';
import { httpGetSigned } from './client';
import { BalanceConverter, type BalanceNative } from '../converters/balance';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). `user` ignoré côté Aster (compte = signataire). */
export interface GetBalancesParams {
  /** Adresse du compte (HL/Pacifica) ; Aster utilise le signataire de `label`. */
  user?: string;
}

/**
 * Soldes par actif au **format unifié** `Balance` (Aster futures `/fapi/v3/balance`, **signé**).
 * `label` (obligatoire ici) sélectionne le signataire/compte.
 */
export function getBalances(_params: GetBalancesParams, label: string): Promise<Balance[]> {
  const converter = new BalanceConverter();
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<BalanceNative[]>('futures', '/fapi/v3/balance', body, network).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
