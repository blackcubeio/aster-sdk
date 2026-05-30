import type { IncomeEntry, IncomeQuery } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Income history (transfers, realized PnL, funding, commission…) (`USER_DATA`). */
export function getIncome(query: IncomeQuery | undefined, label: string): Promise<IncomeEntry[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<IncomeEntry[]>('futures', '/fapi/v3/income', body, network);
}
