import type { AsterClient } from '../common/config';
import type { GetBalancesParams } from '../common/types';
import type { Balance } from '../common/types';
import { BalanceConverter, type BalanceNative } from '../converters/balance';
import { httpGetSigned } from './client';
import { buildSignedRequest } from './signing';

/**
 * Soldes par actif au **format unifié** `Balance` (Aster futures `/fapi/v3/balance`, **signé**).
 * `label` (obligatoire ici) sélectionne le signataire/compte.
 */
export function getBalances(
  client: AsterClient,
  _params: GetBalancesParams,
  label: string,
): Promise<Balance[]> {
  const converter = new BalanceConverter();
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<BalanceNative[]>(client, 'futures', '/fapi/v3/balance', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
