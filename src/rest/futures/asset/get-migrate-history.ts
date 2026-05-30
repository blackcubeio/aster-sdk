import type { AsterClient } from '../../../common/config';
import type { MigrateHistory } from '../../../common/futures';
import { microsecondNonce } from '../../../common/utils';
import { httpGetSigned } from '../../client';
import { buildSignedForm, resolveSigner } from '../../signing';

/** Status of a migration batch (`USER_DATA`, agent-signed). msg : `batchId&nonce&user&signer`. */
export function getMigrateHistory(
  client: AsterClient,
  batchId: string,
  label: string,
): Promise<MigrateHistory> {
  const resolved = resolveSigner(client, label);
  const { body, network } = buildSignedForm(
    { batchId, nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
  return httpGetSigned<MigrateHistory>(
    client,
    'futures',
    '/fapi/v3/asset/migrateUser/history',
    body,
    network,
  );
}
