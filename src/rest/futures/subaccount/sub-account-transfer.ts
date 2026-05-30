import type { AsterClient } from '../../../common/config';
import type { CodeMsg, SubAccountTransferParams } from '../../../common/futures';
import type { JsonValue } from '../../../common/types';
import { microsecondNonce } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { assertEvmSigner, buildSignedForm, resolveMainSigner } from '../../signing';

/**
 * Transfer between master and sub-accounts (`TRADE`), signé par le **compte principal**.
 * msg ordonné : `toAccountAddress&asset&amount&kindType&nonce&user&signer[&fromAccountAddress]`.
 */
export function subAccountTransfer(
  client: AsterClient,
  params: SubAccountTransferParams,
  label: string,
): Promise<CodeMsg> {
  assertEvmSigner(client, label, 'subAccountTransfer');
  const resolved = resolveMainSigner(client, label);
  const ordered: Record<string, JsonValue | undefined> = {
    toAccountAddress: params.toAccountAddress,
    asset: params.asset,
    amount: params.amount,
    kindType: params.kindType,
    nonce: microsecondNonce(),
    user: resolved.user,
    signer: resolved.signer,
  };
  if (params.fromAccountAddress !== undefined) {
    ordered.fromAccountAddress = params.fromAccountAddress;
  }
  const { body, network } = buildSignedForm(ordered, resolved.mainPrivateKey, resolved.network);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/subAccountTransfer', body, network);
}
