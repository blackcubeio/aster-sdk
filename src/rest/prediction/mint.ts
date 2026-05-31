import type { AsterClient } from '../../common/config';
import { httpPostForm } from '../client';
import { buildSignedRequest } from '../signing';

export interface PredictionMintParams {
  /** Paire du token YES du marché de prédiction. */
  symbol: string;
  /** Nombre de paires YES+NO à émettre. */
  quantity: string;
  /** Id d'ordre client (optionnel, généré sinon). */
  newClientOrderId?: string;
}

/** Émet des paires de tokens YES+NO (déduit le quote au prix courant) — signé (`TRADE`). */
export function predictionMint(
  client: AsterClient,
  params: PredictionMintParams,
  label: string,
): Promise<unknown> {
  const { body, network } = buildSignedRequest(client, { ...params }, label);
  return httpPostForm<unknown>(client, 'prediction', '/api/v3/prediction/mint', body, network);
}
