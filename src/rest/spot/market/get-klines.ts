import { httpGet } from '../../client';
import { CandleConverter, type CandleNative } from '../../converters/candle';
import type { SpotKline, SpotKlinesQuery } from '../types';

type KlineWire = CandleNative;

/** Spot kline/candlestick bars for a symbol. */
export function getKlinesSpot(query: SpotKlinesQuery, label?: string): Promise<SpotKline[]> {
  return httpGet<KlineWire[]>(
    'spot',
    '/api/v3/klines',
    {
      symbol: query.symbol,
      interval: query.interval,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  ).then((wire) => wire.map((row) => decodeSpotKline(row, query.symbol, query.interval)));
}

/**
 * Décode une bougie spot positionnelle au format unifié via {@link CandleConverter}
 * (toujours `kind: 'spot'`). `s`/`i` viennent de la requête (absents du wire).
 */
export function decodeSpotKline(row: KlineWire, s: string, i: string): SpotKline {
  return new CandleConverter(s, i, 'spot').toCommon(row);
}
