import { AGENT_CHAIN_ID } from '../../../common/constants';
import type { BindSubAccountParams, CodeMsg } from '../../../common/futures';
import type { JsonValue } from '../../../common/types';
import { microsecondNonce, serializeParams } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { assertEvmSigner, buildSignedForm, resolveMainSigner, signMessage } from '../../signing';

/**
 * Bind an existing wallet as a sub-account (`USER_DATA`) — **double signature**. Le
 * sous-compte signe `childAddress&name&nonce&user`, puis le compte principal signe ce
 * message + `childSignature`. Adresses à whitelister côté Aster.
 */
export function bindSubAccount(params: BindSubAccountParams, label: string): Promise<CodeMsg> {
  assertEvmSigner(label, 'bindSubAccount');
  const resolved = resolveMainSigner(label);
  const chainId = AGENT_CHAIN_ID[resolved.network];
  const nonce = microsecondNonce();

  const childOrdered: Record<string, JsonValue | undefined> = {
    childAddress: params.childAddress,
    name: params.name,
    nonce,
    user: resolved.user,
  };
  const childSignature = signMessage(
    serializeParams(childOrdered),
    params.childPrivateKey,
    chainId,
  );

  const { body, network } = buildSignedForm(
    { ...childOrdered, childSignature },
    resolved.mainPrivateKey,
    resolved.network,
  );
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/sub-accounts/bind', body, network);
}
