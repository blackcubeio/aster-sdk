import type { AsterClient } from '../../../common/config';
import type { AccountInfo } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Current account information: balances, assets and positions (`USER_DATA`). */
export function getAccountInfo(client: AsterClient, label: string): Promise<AccountInfo> {
  const { body, network } = buildSignedRequest(client, {}, label);
  return httpGetSigned<AccountInfo>(
    client,
    'futures',
    '/fapi/v3/accountWithJoinMargin',
    body,
    network,
  );
}
