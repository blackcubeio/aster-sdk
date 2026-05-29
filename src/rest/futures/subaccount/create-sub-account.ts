import { AGENT_CHAIN_ID } from '../../../common/constants';
import type { JsonValue } from '../../../common/types';
import { microsecondNonce, serializeParams } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { assertEvmSigner, buildSignedForm, resolveMainSigner, signMessage } from '../../signing';
import type { CodeMsg, CreateSubAccountParams } from '../types';

/**
 * Create a sub-account (`TRADE`) — **double signature** : le sous-compte signe d'abord
 * (`childSignature`), puis le compte principal signe le même message **augmenté de
 * `childSignature`**. Les deux en EIP-712 chainId 1666/714.
 */
export function createSubAccount(params: CreateSubAccountParams, label: string): Promise<CodeMsg> {
  assertEvmSigner(label, 'createSubAccount');
  const resolved = resolveMainSigner(label);
  const chainId = AGENT_CHAIN_ID[resolved.network];
  const nonce = microsecondNonce();

  // Étape 1 : le sous-compte signe (sans childSignature).
  const childOrdered: Record<string, JsonValue | undefined> = {
    subAccountName: params.subAccountName,
    subSourceAddr: params.subSourceAddr,
    nonce,
    user: resolved.user,
    signer: resolved.signer,
  };
  const childSignature = signMessage(
    serializeParams(childOrdered),
    params.childPrivateKey,
    chainId,
  );

  // Étape 2 : le compte principal signe le message + childSignature.
  const { body, network } = buildSignedForm(
    { ...childOrdered, childSignature },
    resolved.mainPrivateKey,
    resolved.network,
  );
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/createSubAccount', body, network);
}
