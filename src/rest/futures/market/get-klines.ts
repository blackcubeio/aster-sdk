import { httpGet } from '../../client';
import type { Kline, KlinesQuery } from '../types';

type KlineWire = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

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
  ).then((wire) => wire.map(decodeKline));
}

/** Décode une bougie positionnelle Aster en objet. Partagé par les 3 variantes de klines. */
export function decodeKline(row: KlineWire): Kline {
  return {
    openTime: row[0],
    open: row[1],
    high: row[2],
    low: row[3],
    close: row[4],
    volume: row[5],
    closeTime: row[6],
    quoteVolume: row[7],
    tradeCount: row[8],
    takerBuyBaseVolume: row[9],
    takerBuyQuoteVolume: row[10],
  };
}
