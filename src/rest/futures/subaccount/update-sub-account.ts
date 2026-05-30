import type { CodeMsg, UpdateSubAccountParams } from '../../../common/futures';
import type { JsonValue } from '../../../common/types';
import { microsecondNonce } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { assertEvmSigner, buildSignedForm, resolveMainSigner } from '../../signing';

/**
 * Rename or freeze/unfreeze a sub-account (`TRADE`), signé par le **compte principal**
 * (`mainPrivateKey`). msg ordonné :
 * `subSourceAddr&nonce&user&signer[&subAccountName][&status]`.
 */
export function updateSubAccount(params: UpdateSubAccountParams, label: string): Promise<CodeMsg> {
  assertEvmSigner(label, 'updateSubAccount');
  const resolved = resolveMainSigner(label);
  const ordered: Record<string, JsonValue | undefined> = {
    subSourceAddr: params.subSourceAddr,
    nonce: microsecondNonce(),
    user: resolved.user,
    signer: resolved.signer,
  };
  if (params.subAccountName !== undefined) {
    ordered.subAccountName = params.subAccountName;
  }
  if (params.status !== undefined) {
    ordered.status = params.status;
  }
  const { body, network } = buildSignedForm(ordered, resolved.mainPrivateKey, resolved.network);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/updateSubAccount', body, network);
}
