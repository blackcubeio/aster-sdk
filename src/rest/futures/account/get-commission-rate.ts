import type { AsterClient } from '../../../common/config';
import type { CommissionRate } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** User maker/taker commission rate for a symbol (`USER_DATA`). */
export function getCommissionRate(
  client: AsterClient,
  symbol: string,
  label: string,
): Promise<CommissionRate> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpGetSigned<CommissionRate>(client, 'futures', '/fapi/v3/commissionRate', body, network);
}
