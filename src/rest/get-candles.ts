import type { Candle, KlineInterval, MarketKind } from '../common/types';
import { httpGet } from './client';
import { CandleConverter, type CandleNative } from './converters/candle';

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
 * Bougies au **format unifié** `Candle` (`getCandles`, même API sur les 3 SDK).
 * `kind` route vers le produit futures (`perp`) ou spot d'Aster (fetch direct + converter).
 */
export function getCandles(params: GetCandlesParams, label?: string): Promise<Candle[]> {
  const kind = params.kind ?? 'perp';
  const converter = new CandleConverter(params.name, params.interval, kind);
  const [product, path] =
    kind === 'spot'
      ? (['spot', '/api/v3/klines'] as const)
      : (['futures', '/fapi/v3/klines'] as const);
  return httpGet<CandleNative[]>(
    product,
    path,
    {
      symbol: params.name,
      interval: params.interval as KlineInterval,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  ).then((wire) => wire.map((row) => converter.toCommon(row)));
}
