import type { SpotTransactionEntry, SpotTransactionQuery } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Spot transaction records (trades, transfers, airdrops, swaps…) (`USER_DATA`). */
export function getTransactionHistorySpot(
  query: SpotTransactionQuery,
  label: string,
): Promise<SpotTransactionEntry[]> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<SpotTransactionEntry[]>('spot', '/api/v3/transactionHistory', body, network);
}
