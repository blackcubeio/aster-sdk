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
  ).then((wire) => wire.map((row) => decodeSpotKline(row, query.symbol, query.interval)));
}

/**
 * Décode une bougie spot positionnelle (11 colonnes) au format unifié (toujours
 * `kind: 'spot'`). `s`/`i` viennent de la requête (absents du wire).
 */
export function decodeSpotKline(row: KlineWire, s: string, i: string): SpotKline {
  return {
    t: row[0],
    T: row[6],
    s,
    i,
    o: row[1],
    c: row[4],
    h: row[2],
    l: row[3],
    v: row[5],
    n: row[8],
    kind: 'spot',
    qv: row[7],
    tbbv: row[9],
    tbqv: row[10],
  };
}
