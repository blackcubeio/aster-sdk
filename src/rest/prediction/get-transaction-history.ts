import type { AsterClient } from '../../common/config';
import { httpGetSigned } from '../client';
import { buildSignedRequest } from '../signing';
import type { PredictionHistoryQuery } from './get-position-histories';

/** Historique des transactions (mint/burn/trade) sur les marchés de prédiction (`USER_DATA`). */
export function getPredictionTransactionHistory(
  client: AsterClient,
  params: PredictionHistoryQuery,
  label: string,
): Promise<unknown> {
  const { body, network } = buildSignedRequest(client, { ...params }, label);
  return httpGetSigned<unknown>(
    client,
    'prediction',
    '/api/v3/prediction/transactionHistory',
    body,
    network,
  );
}
