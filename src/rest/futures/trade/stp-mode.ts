import type { AsterClient } from '../../../common/config';
import type { CodeMsg, StpModeResult } from '../../../common/futures';
import type { StpMode } from '../../../common/types';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Set the account-wide Self-Trade Prevention mode (`TRADE`). */
export function updateStpMode(
  client: AsterClient,
  stpMode: StpMode,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(client, { stpMode }, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/stpMode', body, network);
}

/** Get the current Self-Trade Prevention mode (`USER_DATA`). */
export function getStpMode(client: AsterClient, label: string): Promise<StpModeResult> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<StpModeResult>(client, 'futures', '/fapi/v3/stpMode', body, network);
}
