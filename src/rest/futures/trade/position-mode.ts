import type { AsterClient } from '../../../common/config';
import type { CodeMsg, PositionModeResult } from '../../../common/futures';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Set position mode for every symbol: `true` = Hedge Mode, `false` = One-way (`TRADE`). */
export function updatePositionMode(
  client: AsterClient,
  dualSidePosition: boolean,
  label: string,
): Promise<CodeMsg> {
  const { body, network } = buildSignedRequest(client, { dualSidePosition }, label);
  return httpPostForm<CodeMsg>(client, 'futures', '/fapi/v3/positionSide/dual', body, network);
}

/** Get current position mode (`USER_DATA`). */
export function getPositionMode(client: AsterClient, label: string): Promise<PositionModeResult> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<PositionModeResult>(
    client,
    'futures',
    '/fapi/v3/positionSide/dual',
    body,
    network,
  );
}
