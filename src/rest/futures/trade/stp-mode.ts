import type { StpMode } from '../../../common/types';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CodeMsg, StpModeResult } from '../types';

/** Set the account-wide Self-Trade Prevention mode (`TRADE`). */
export function updateStpMode(stpMode: StpMode, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest({ stpMode }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/stpMode', body, network);
}

/** Get the current Self-Trade Prevention mode (`USER_DATA`). */
export function getStpMode(label: string): Promise<StpModeResult> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<StpModeResult>('futures', '/fapi/v3/stpMode', body, network);
}
