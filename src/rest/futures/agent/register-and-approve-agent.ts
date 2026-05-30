import type { AsterClient } from '../../../common/config';
import type { CodeMsg, RegisterAndApproveAgentParams } from '../../../common/futures';
import type { JsonValue } from '../../../common/types';
import { encodeFormComponent, microsecondNonce } from '../../../common/utils';
import { httpPostForm } from '../../client';
import { buildSignedForm, resolveMainSigner } from '../../signing';

/**
 * Register an API agent and grant it permissions in one call (`PUBLIC`, signé par le
 * **compte principal**). msg ordonné :
 * `user&nonce&agentName&agentAddress&expired&signatureChainId&canSpotTrade&canPerpTrade&canWithdraw&ipWhitelist`.
 *
 * `signatureChainId` (défaut 56) indique le **type d'adresse** (56 EVM / 101 Solana) ; il
 * voyage comme champ du message — à ne pas confondre avec le `chainId` du domaine EIP-712
 * (1666/714) utilisé pour signer.
 */
export function registerAndApproveAgent(
  client: AsterClient,
  params: RegisterAndApproveAgentParams,
  label: string,
): Promise<CodeMsg> {
  const resolved = resolveMainSigner(client, label);
  const ordered: Record<string, JsonValue | undefined> = {
    user: resolved.user,
    nonce: microsecondNonce(),
    agentName: params.agentName,
    agentAddress: params.agentAddress,
    expired: params.expired,
    signatureChainId: params.signatureChainId ?? 56,
    canSpotTrade: params.canSpotTrade,
    canPerpTrade: params.canPerpTrade,
    canWithdraw: params.canWithdraw,
    ipWhitelist: params.ipWhitelist ?? '',
  };
  // `agentCode` ne fait pas partie du message signé : on l'appose après la signature.
  const form = buildSignedForm(ordered, resolved.mainPrivateKey, resolved.network);
  const body =
    params.agentCode === undefined
      ? form.body
      : `${form.body}&agentCode=${encodeFormComponent(params.agentCode)}`;
  return httpPostForm<CodeMsg>(
    client,
    'futures',
    '/fapi/v3/registerAndApproveAgent',
    body,
    form.network,
  );
}
