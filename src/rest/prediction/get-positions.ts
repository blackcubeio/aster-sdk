import type { AsterClient } from '../../common/config';
import { httpGetSigned } from '../client';
import { buildSignedRequest } from '../signing';

/** Positions ouvertes sur les marchés de prédiction (`USER_DATA`). `symbol` optionnel. */
export function getPredictionPositions(
  client: AsterClient,
  params: { symbol?: string },
  label: string,
): Promise<unknown> {
  const { body, network } = buildSignedRequest(client, { symbol: params.symbol }, label);
  return httpGetSigned<unknown>(
    client,
    'prediction',
    '/api/v3/prediction/positions',
    body,
    network,
  );
}
