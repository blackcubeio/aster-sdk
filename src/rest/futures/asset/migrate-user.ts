import type { MigrateUserResult } from '../../../common/futures';
import { microsecondNonce } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { buildSignedForm, resolveMainSigner } from '../../signing';

/**
 * Migrate all positive-balance assets from the source account to the authenticated user
 * (`WITHDRAW`), signé par le **compte principal**. msg : `user&nonce`. La source doit
 * n'avoir ni position ni ordre ouvert.
 */
export function migrateUser(label: string): Promise<MigrateUserResult> {
  const resolved = resolveMainSigner(label);
  const { body, network } = buildSignedForm(
    { user: resolved.user, nonce: microsecondNonce() },
    resolved.mainPrivateKey,
    resolved.network,
  );
  return httpPostForm<MigrateUserResult>('futures', '/fapi/v3/asset/migrateUser', body, network);
}
