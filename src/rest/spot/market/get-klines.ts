import { httpGet } from '../../client';
import type { SpotKline, SpotKlinesQuery } from '../types';

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
];

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
  ).then((wire) => wire.map(decodeSpotKline));
}

/** Décode une bougie spot positionnelle (11 colonnes) en objet. */
export function decodeSpotKline(row: KlineWire): SpotKline {
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
