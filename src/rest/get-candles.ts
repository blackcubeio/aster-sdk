import type { KlineInterval, MarketKind } from '../common/types';
import { getKlines } from './futures/market/get-klines';
import type { Kline } from './futures/types';
import { getKlinesSpot } from './spot/market/get-klines';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface GetCandlesParams {
  /** Identifiant de la paire (= `Pair.name`). */
  name: string;
  /** Intervalle (`1m`, `1h`, `1d`…). */
  interval: string;
  /** Début (ms), optionnel. */
  startTime?: number;
  /** Fin (ms), optionnel. */
  endTime?: number;
  /** Type de marché : route vers le produit futures (`perp`) ou spot. Défaut `perp`. */
  kind?: MarketKind;
  /** Nombre max de bougies. */
  limit?: number;
}

/**
 * Bougies au **format unifié** (`getCandles`, même API sur les 3 SDK). `kind` route vers le
 * produit futures (`perp`) ou spot d'Aster. Retour `Kline[]` (shape identique au spot).
 */
export function getCandles(params: GetCandlesParams, label?: string): Promise<Kline[]> {
  const query = {
    symbol: params.name,
    interval: params.interval as KlineInterval,
    startTime: params.startTime,
    endTime: params.endTime,
    limit: params.limit,
  };
  return params.kind === 'spot'
    ? (getKlinesSpot(query, label) as unknown as Promise<Kline[]>)
    : getKlines(query, label);
}
