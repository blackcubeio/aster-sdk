import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { AccountInfo } from '../types';

/** Current account information: balances, assets and positions (`USER_DATA`). */
export function getAccountInfo(label: string): Promise<AccountInfo> {
  const { body, network } = buildSignedRequest({}, label);
  return httpGetSigned<AccountInfo>('futures', '/fapi/v3/accountWithJoinMargin', body, network);
}
