import type { Candle, KlineInterval, MarketKind } from '../common/types';
import { httpGet } from './client';
import { CandleConverter, type CandleNative } from '../converters/candle';

/** Prix sous-jacent des bougies (perp Aster) : dernier prix, mark price ou index price. */
export type CandlePriceType = 'last' | 'mark' | 'index';

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
  /** Type de marché : futures (`perp`) ou spot. Défaut `perp`. */
  kind?: MarketKind;
  /** Prix sous-jacent (perp uniquement) : `last` (défaut), `mark`, `index`. */
  priceType?: CandlePriceType;
  /** Nombre max de bougies. */
  limit?: number;
}

/** `[product, path, paramKey]` pour un (kind, priceType) donné. */
function endpoint(
  kind: MarketKind,
  priceType: CandlePriceType,
): readonly ['futures' | 'spot', string, 'symbol' | 'pair'] {
  if (kind === 'spot') {
    return ['spot', '/api/v3/klines', 'symbol'];
  }
  if (priceType === 'mark') {
    return ['futures', '/fapi/v3/markPriceKlines', 'symbol'];
  }
  if (priceType === 'index') {
    return ['futures', '/fapi/v3/indexPriceKlines', 'pair'];
  }
  return ['futures', '/fapi/v3/klines', 'symbol'];
}

/**
 * Bougies au **format unifié** `Candle` (`getCandles`, même API sur les 3 SDK).
 * `kind` route futures/spot ; `priceType` (perp) choisit last / mark price / index price.
 * Fetch direct + converter.
 */
export function getCandles(params: GetCandlesParams, label?: string): Promise<Candle[]> {
  const kind = params.kind ?? 'perp';
  const priceType = params.priceType ?? 'last';
  const converter = new CandleConverter(params.name, params.interval, kind);
  const [product, path, paramKey] = endpoint(kind, priceType);
  return httpGet<CandleNative[]>(
    product,
    path,
    {
      [paramKey]: params.name,
      interval: params.interval as KlineInterval,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  ).then((wire) => wire.map((row) => converter.toCommon(row)));
}
