import { httpGet } from '../../client';
import { CandleConverter, type CandleNative } from '../../converters/candle';
import type { Kline, KlinesQuery } from '../types';

type KlineWire = CandleNative;

/** Kline/candlestick bars for a symbol. */
export function getKlines(query: KlinesQuery, label?: string): Promise<Kline[]> {
  return httpGet<KlineWire[]>(
    'futures',
    '/fapi/v3/klines',
    {
      symbol: query.symbol,
      interval: query.interval,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  ).then((wire) => wire.map((row) => decodeKline(row, query.symbol, query.interval)));
}

/**
 * Décode une bougie positionnelle Aster au format unifié via {@link CandleConverter}.
 * Partagé par les 3 variantes de klines (toujours `kind: 'perp'`). `s`/`i` viennent de la
 * requête car le wire Aster ne les contient pas.
 */
export function decodeKline(row: KlineWire, s: string, i: string): Kline {
  return new CandleConverter(s, i, 'perp').toCommon(row);
}
