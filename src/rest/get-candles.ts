import type { AsterClient } from '../common/config';
import type { CandlePriceType, GetCandlesParams } from '../common/types';
import type { Candle, KlineInterval, MarketKind } from '../common/types';
import { CandleConverter, type CandleNative } from '../converters/candle';
import { httpGet } from './client';

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
export function getCandles(
  client: AsterClient,
  params: GetCandlesParams,
  label?: string,
): Promise<Candle[]> {
  const kind = params.kind ?? 'perp';
  const priceType = params.priceType ?? 'last';
  const converter = new CandleConverter(params.name, params.interval, kind);
  const [product, path, paramKey] = endpoint(kind, priceType);
  return httpGet<CandleNative[]>(
    client,
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
