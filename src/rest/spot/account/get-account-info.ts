import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { SpotAccountInfo } from '../types';

/** Current spot account information: balances and permissions (`USER_DATA`). */
export function getAccountInfoSpot(label: string): Promise<SpotAccountInfo> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<SpotAccountInfo>('spot', '/api/v3/account', body, network);
}
