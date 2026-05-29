import { httpGet } from '../../client';
import type { IndexPriceKlinesQuery, Kline } from '../types';
import { decodeKline } from './get-klines';

type KlineWire = Parameters<typeof decodeKline>[0];

/** Kline/candlestick bars for the index price of a pair. */
export function getIndexPriceKlines(
  query: IndexPriceKlinesQuery,
  label?: string,
): Promise<Kline[]> {
  return httpGet<KlineWire[]>(
    'futures',
    '/fapi/v3/indexPriceKlines',
    {
      pair: query.pair,
      interval: query.interval,
      startTime: query.startTime,
      endTime: query.endTime,
      limit: query.limit,
    },
    label,
  ).then((wire) => wire.map((row) => decodeKline(row, query.pair, query.interval)));
}
