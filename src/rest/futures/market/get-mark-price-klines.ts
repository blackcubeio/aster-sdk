import { httpGet } from '../../client';
import type { Kline, KlinesQuery } from '../types';
import { decodeKline } from './get-klines';

type KlineWire = Parameters<typeof decodeKline>[0];

/** Kline/candlestick bars for the mark price of a symbol. */
export function getMarkPriceKlines(query: KlinesQuery, label?: string): Promise<Kline[]> {
  return httpGet<KlineWire[]>(
    'futures',
    '/fapi/v3/markPriceKlines',
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
