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
  ).then((wire) => wire.map((row) => decodeKline(row, query.symbol, query.interval)));
}

/**
 * Décode une bougie positionnelle Aster au format unifié. Partagé par les 3 variantes de
 * klines (toujours `kind: 'perp'`). `s`/`i` (symbole/intervalle) viennent de la requête car
 * le wire Aster ne les contient pas.
 */
export function decodeKline(row: KlineWire, s: string, i: string): Kline {
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
    kind: 'perp',
    qv: row[7],
    tbbv: row[9],
    tbqv: row[10],
  };
}
