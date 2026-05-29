import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CodeMsg, PositionModeResult } from '../types';

/** Set position mode for every symbol: `true` = Hedge Mode, `false` = One-way (`TRADE`). */
export function setPositionMode(dualSidePosition: boolean, label: string): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest({ dualSidePosition }, label);
  return httpPostForm<CodeMsg>('futures', '/fapi/v3/positionSide/dual', body, network);
}

/** Get current position mode (`USER_DATA`). */
export function getPositionMode(label: string): Promise<PositionModeResult> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<PositionModeResult>('futures', '/fapi/v3/positionSide/dual', body, network);
}
