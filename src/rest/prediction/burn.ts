import type { AsterClient } from '../../common/config';
import { httpPostForm } from '../client';
import { buildSignedRequest } from '../signing';

export interface PredictionBurnParams {
  /** Paire du token YES du marché de prédiction. */
  symbol: string;
  /** Nombre de paires YES+NO à brûler (le compte doit détenir autant de YES que de NO). */
  quantity: string;
  newClientOrderId?: string;
}

/** Brûle des paires YES+NO pour récupérer le quote — signé (`TRADE`). */
export function predictionBurn(
  client: AsterClient,
  params: PredictionBurnParams,
  label: string,
): Promise<unknown> {
  const { body, network } = buildSignedRequest(client, { ...params }, label);
  return httpPostForm<unknown>(client, 'prediction', '/api/v3/prediction/burn', body, network);
}
