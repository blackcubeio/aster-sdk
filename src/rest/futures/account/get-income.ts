import type { AsterClient } from '../../../common/config';
import type { IncomeEntry, IncomeQuery } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Income history (transfers, realized PnL, funding, commission…) (`USER_DATA`). */
export function getIncome(
  client: AsterClient,
  query: IncomeQuery | undefined,
  label: string,
): Promise<IncomeEntry[]> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<IncomeEntry[]>(client, 'futures', '/fapi/v3/income', body, network);
}
