import type { AsterClient } from '../../common/config';
import { httpGet } from '../client';

/** Infos d'échange des marchés de prédiction (symboles, statuts, filtres) — public. */
export function getPredictionExchangeInfo(client: AsterClient, label?: string): Promise<unknown> {
  return httpGet<unknown>(client, 'prediction', '/api/v3/prediction/exchangeInfo', {}, label);
}
