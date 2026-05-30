import type { AsterClient } from '../../../common/config';
import type { MigrateUserResult } from '../../../common/futures';
import { microsecondNonce } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { buildSignedForm, resolveMainSigner } from '../../signing';

/**
 * Migrate all positive-balance assets from the source account to the authenticated user
 * (`WITHDRAW`), signé par le **compte principal**. msg : `user&nonce`. La source doit
 * n'avoir ni position ni ordre ouvert.
 */
export function migrateUser(client: AsterClient, label: string): Promise<MigrateUserResult> {
  const resolved = resolveMainSigner(client, label);
  const { body, network } = buildSignedForm(
    { user: resolved.user, nonce: microsecondNonce() },
    resolved.mainPrivateKey,
    resolved.network,
  );
  return httpPostForm<MigrateUserResult>(
    client,
    'futures',
    '/fapi/v3/asset/migrateUser',
    body,
    network,
  );
}
