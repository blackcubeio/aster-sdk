import { microsecondNonce } from '../../../common/utils';
import { httpGetSigned } from '../../client';
import { assertEvmSigner, buildSignedForm, resolveSigner } from '../../signing';
import type { SubAccount } from '../types';

/**
 * List the master account and its sub-accounts (`USER_DATA`). Contrairement aux autres
 * endpoints sous-comptes, celui-ci est signé par la clé **agent** (msg
 * `nonce&user&signer`).
 */
export function getSubAccountList(label: string): Promise<SubAccount[]> {
  assertEvmSigner(label, 'getSubAccountList');
  const resolved = resolveSigner(label);
  const { body, network } = buildSignedForm(
    { nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
  return httpGetSigned<SubAccount[]>('futures', '/fapi/v3/getSubAccountList', body, network);
}
