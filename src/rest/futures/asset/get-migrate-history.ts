import { microsecondNonce } from '../../../common/utils';
import { httpGetSigned } from '../../client';
import { buildSignedForm, resolveSigner } from '../../signing';
import type { MigrateHistory } from '../types';

/** Status of a migration batch (`USER_DATA`, agent-signed). msg : `batchId&nonce&user&signer`. */
export function getMigrateHistory(batchId: string, label: string): Promise<MigrateHistory> {
  const resolved = resolveSigner(label);
  const { body, network } = buildSignedForm(
    { batchId, nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
  return httpGetSigned<MigrateHistory>(
    'futures',
    '/fapi/v3/asset/migrateUser/history',
    body,
    network,
  );
}
