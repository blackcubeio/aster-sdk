import { CandleConverter, type CandleNative } from '../../converters/candle';
import type { Kline } from '../types';

type KlineWire = CandleNative;

/**
 * Décode une bougie positionnelle Aster au format unifié via {@link CandleConverter}.
 * Utilisé par les klines mark/index (toujours `kind: 'perp'`). `s`/`i` viennent de la
 * requête car le wire Aster ne les contient pas. (Les bougies « classiques » passent par
 * `getCandles`, qui fetche en direct.)
 */
export function decodeKline(row: KlineWire, s: string, i: string): Kline {
  return new CandleConverter(s, i, 'perp').toCommon(row);
}
