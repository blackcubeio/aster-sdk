import type { AsterClient } from '../../../common/config';
import type { SpotAccountInfo } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Current spot account information: balances and permissions (`USER_DATA`). */
export function getAccountInfoSpot(client: AsterClient, label: string): Promise<SpotAccountInfo> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<SpotAccountInfo>(client, 'spot', '/api/v3/account', body, network);
}
