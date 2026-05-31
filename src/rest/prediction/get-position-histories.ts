import type { AsterClient } from '../../common/config';
import { httpGetSigned } from '../client';
import { buildSignedRequest } from '../signing';

export interface PredictionHistoryQuery {
  symbol?: string;
  startTime?: number;
  endTime?: number;
  /** 1–1000, défaut 100. */
  limit?: number;
}

/** Historique des positions de prédiction (`USER_DATA`). */
export function getPredictionPositionHistories(
  client: AsterClient,
  params: PredictionHistoryQuery,
  label: string,
): Promise<unknown> {
  const { body, network } = buildSignedRequest(client, { ...params }, label);
  return httpGetSigned<unknown>(
    client,
    'prediction',
    '/api/v3/prediction/positionHistories',
    body,
    network,
  );
}
