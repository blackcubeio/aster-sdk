import type { AsterClient } from '../../../common/config';
import type { MmpConfig, UpdateMmpParams } from '../../../common/futures';
import type { JsonObject } from '../../../common/types';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Set/replace the market-maker protection config for a symbol (`USER_DATA`). */
export function updateMmp(
  client: AsterClient,
  params: UpdateMmpParams,
  label: string,
): Promise<boolean> {
  const payload: JsonObject = {
    symbol: params.symbol,
    windowTimeInMilliseconds: params.windowTimeInMilliseconds,
    frozenTimeInMilliseconds: params.frozenTimeInMilliseconds,
  };
  if (params.qtyLimit !== undefined) {
    payload.qtyLimit = params.qtyLimit;
  }
  if (params.valueLimit !== undefined) {
    payload.valueLimit = params.valueLimit;
  }
  if (params.deltaLimit !== undefined) {
    payload.deltaLimit = params.deltaLimit;
  }
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<boolean>(client, 'futures', '/fapi/v3/mmp', body, network);
}

/** Get the MMP config, optionally for a single symbol (`USER_DATA`). */
export function getMmp(
  client: AsterClient,
  symbol: string | undefined,
  label: string,
): Promise<MmpConfig[]> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpGetSigned<MmpConfig[]>(client, 'futures', '/fapi/v3/mmp', body, network);
}

/** Delete the MMP config for a symbol (`USER_DATA`). */
export function deleteMmp(client: AsterClient, symbol: string, label: string): Promise<boolean> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpPostForm<boolean>(client, 'futures', '/fapi/v3/mmp', body, network, 'DELETE');
}

/** Reset the MMP frozen state for a symbol (`USER_DATA`). */
export function resetMmp(client: AsterClient, symbol: string, label: string): Promise<boolean> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpPostForm<boolean>(client, 'futures', '/fapi/v3/mmpReset', body, network);
}
