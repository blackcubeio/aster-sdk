import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { IncomeEntry, IncomeQuery } from '../types';

/** Income history (transfers, realized PnL, funding, commission…) (`USER_DATA`). */
export function getIncome(query: IncomeQuery | undefined, label: string): Promise<IncomeEntry[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<IncomeEntry[]>('futures', '/fapi/v3/income', body, network);
}
