import type { AsterClient } from '../../../common/config';
import type { SpotTransactionEntry, SpotTransactionQuery } from '../../../common/spot';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Spot transaction records (trades, transfers, airdrops, swaps…) (`USER_DATA`). */
export function getTransactionHistorySpot(
  client: AsterClient,
  query: SpotTransactionQuery,
  label: string,
): Promise<SpotTransactionEntry[]> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<SpotTransactionEntry[]>(
    client,
    'spot',
    '/api/v3/transactionHistory',
    body,
    network,
  );
}
