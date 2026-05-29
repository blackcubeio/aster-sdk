import { httpGetSigned, httpPostForm } from '../../client';
import { buildMainTypedRequest, buildSignedRequest } from '../../signing';
import type { ApproveBuilderParams, Builder, CodeMsg, UpdateBuilderParams } from '../types';

/** List the account's builders (`USER_DATA`, agent-signed). */
export function getBuilders(label: string): Promise<Builder[]> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<Builder[]>('futures', '/fapi/v3/builder', body, network);
}

/** Approve a builder with a max fee rate (`USER_DATA`, main-signed dynamic-typed). */
export function approveBuilder(params: ApproveBuilderParams, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    'ApproveBuilder',
    { builder: params.builder, maxFeeRate: params.maxFeeRate, builderName: params.builderName },
    label,
  );
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/approveBuilder', body, network);
}

/** Update a builder's max fee rate (`USER_DATA`, main-signed). */
export function updateBuilder(params: UpdateBuilderParams, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest(
    'UpdateBuilder',
    { builder: params.builder, maxFeeRate: params.maxFeeRate },
    label,
  );
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/updateBuilder', body, network);
}

/** Delete a builder (`USER_DATA`, main-signed). */
export function deleteBuilder(builder: string, label: string): Promise<CodeMsg> {
  const { body, network } = buildMainTypedRequest('DelBuilder', { builder }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/builder', body, network, 'DELETE');
}
