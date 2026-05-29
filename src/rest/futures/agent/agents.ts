import { httpGetSigned, httpPostForm } from '../../client';
import { buildMainTypedRequest, buildSignedRequest } from '../../signing';
import type { Agent, ApproveAgentParams, CodeMsg, UpdateAgentParams } from '../types';

/** List the account's API agents (`USER_DATA`, agent-signed). */
export function getAgents(label: string): Promise<Agent[]> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<Agent[]>('futures', '/fapi/v3/agent', body, network);
}

/**
 * Approve an API agent (`PUBLIC`, signé par le **compte principal**, EIP-712 typé
 * dynamique). Pour le flux V3 combiné, voir `registerAndApproveAgent`.
 */
export function approveAgent(params: ApproveAgentParams, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
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
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/approveAgent', body, network);
}

/** Update an agent's permissions / IP whitelist (`USER_DATA`, main-signed). */
export function updateAgent(params: UpdateAgentParams, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
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
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/updateAgent', body, network);
}

/** Delete an API agent (`USER_DATA`, main-signed). */
export function deleteAgent(agentAddress: string, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest('DelAgent', { agentAddress }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/agent', body, network, 'DELETE');
}
