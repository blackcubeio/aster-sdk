import type { SubAccount } from '../../../common/types';
import { microsecondNonce } from '../../../common/utils';
import { httpGetSigned } from '../../client';
import { SubAccountConverter } from '../../converters/subaccount';
import { assertEvmSigner, buildSignedForm, resolveSigner } from '../../signing';
import type { FuturesSubAccount } from '../types';

const converter = new SubAccountConverter();

/**
 * List the master account and its sub-accounts (`USER_DATA`), au **format unifié**
 * {@link SubAccount}. Contrairement aux autres endpoints sous-comptes, celui-ci est signé
 * par la clé **agent** (msg `nonce&user&signer`).
 */
export async function getSubAccounts(label: string): Promise<SubAccount[]> {
  assertEvmSigner(label, 'getSubAccounts');
  const resolved = resolveSigner(label);
  const { body, network } = buildSignedForm(
    { nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
  const native = await httpGetSigned<FuturesSubAccount[]>(
    'futures',
    '/fapi/v3/getSubAccountList',
    body,
    network,
  );
  return native.map((account) => converter.toCommon(account));
}
