import type { AsterClient } from '../../../common/config';
import type {
  Agent,
  ApproveAgentParams,
  CodeMsg,
  UpdateAgentParams,
} from '../../../common/futures';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildMainTypedRequest, buildSignedRequest } from '../../signing';

/** List the account's API agents (`USER_DATA`, agent-signed). */
export function getAgents(client: AsterClient, label: string): Promise<Agent[]> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<Agent[]>(client, 'futures', '/fapi/v3/agent', body, network);
}

/**
 * Approve an API agent (`PUBLIC`, signé par le **compte principal**, EIP-712 typé
 * dynamique). Pour le flux V3 combiné, voir `registerAndApproveAgent`.
 */
export function approveAgent(
  client: AsterClient,
  params: ApproveAgentParams,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    client,
    'ApproveAgent',
    {
      agentName: params.agentName,
      agentAddress: params.agentAddress,
      ipWhitelist: params.ipWhitelist ?? '',
      expired: params.expired,
      canSpotTrade: params.canSpotTrade,
      canPerpTrade: params.canPerpTrade,
      canWithdraw: params.canWithdraw,
    },
    label,
  );
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/approveAgent', body, network);
}

/** Update an agent's permissions / IP whitelist (`USER_DATA`, main-signed). */
export function updateAgent(
  client: AsterClient,
  params: UpdateAgentParams,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    client,
    'UpdateAgent',
    {
      agentAddress: params.agentAddress,
      ipWhitelist: params.ipWhitelist ?? '',
      canSpotTrade: params.canSpotTrade,
      canPerpTrade: params.canPerpTrade,
      canWithdraw: params.canWithdraw,
    },
    label,
  );
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/updateAgent', body, network);
}

/** Delete an API agent (`USER_DATA`, main-signed). */
export function deleteAgent(
  client: AsterClient,
  agentAddress: string,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(client, 'DelAgent', { agentAddress }, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/agent', body, network, 'DELETE');
}
