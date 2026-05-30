import type { AsterClient } from '../../../common/config';
import type {
  ApproveBuilderParams,
  Builder,
  CodeMsg,
  UpdateBuilderParams,
} from '../../../common/futures';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildMainTypedRequest, buildSignedRequest } from '../../signing';

/** List the account's builders (`USER_DATA`, agent-signed). */
export function getBuilders(client: AsterClient, label: string): Promise<Builder[]> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<Builder[]>(client, 'futures', '/fapi/v3/builder', body, network);
}

/** Approve a builder with a max fee rate (`USER_DATA`, main-signed dynamic-typed). */
export function approveBuilder(
  client: AsterClient,
  params: ApproveBuilderParams,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    client,
    'ApproveBuilder',
    { builder: params.builder, maxFeeRate: params.maxFeeRate, builderName: params.builderName },
    label,
  );
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/approveBuilder', body, network);
}

/** Update a builder's max fee rate (`USER_DATA`, main-signed). */
export function updateBuilder(
  client: AsterClient,
  params: UpdateBuilderParams,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    client,
    'UpdateBuilder',
    { builder: params.builder, maxFeeRate: params.maxFeeRate },
    label,
  );
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/updateBuilder', body, network);
}

/** Delete a builder (`USER_DATA`, main-signed). */
export function deleteBuilder(
  client: AsterClient,
  builder: string,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(client, 'DelBuilder', { builder }, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/builder', body, network, 'DELETE');
}
