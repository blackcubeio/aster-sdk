import { describe, expect, it } from 'vitest';
import type { Candle } from '../../src/common/types';
import { CandleConverter, type CandleNative } from '../../src/converters/candle';

// Ligne wire Aster réaliste — 12 colonnes (wire complet, la 12e incluse : rien n'est jeté).
const WIRE: CandleNative = [
  1_700_000_000_000,
  '74000.0',
  '74500.0',
  '73800.0',
  '74250.0',
  '12.345',
  1_700_003_599_999,
  '917000.0',
  321,
  '6.5',
  '482000.0',
  '0',
];

describe('CandleConverter — bijectivité totale', () => {
  const conv = new CandleConverter('BTCUSDT', '1h', 'perp');

  it('toCommon mappe le wire vers le format unifié (extras dans xtras)', () => {
    const candle = conv.toCommon(WIRE);
    expect(candle).toEqual({
      t: 1_700_000_000_000,
      T: 1_700_003_599_999,
      s: 'BTCUSDT',
      i: '1h',
      o: '74000.0',
      c: '74250.0',
      h: '74500.0',
      l: '73800.0',
      v: '12.345',
      n: 321,
      kind: 'perp',
      qv: '917000.0',
      tbbv: '6.5',
      tbqv: '482000.0',
      xtras: { ignore: '0' },
    } satisfies Candle);
  });

  it('toNative(toCommon(row)) ≡ row (aucune colonne perdue)', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });

  it('toCommon(toNative(candle)) ≡ candle', () => {
    const candle = conv.toCommon(WIRE);
    expect(conv.toCommon(conv.toNative(candle))).toEqual(candle);
  });

  it('porte le kind spot', () => {
    const spot = new CandleConverter('ASTERUSDT', '1m', 'spot');
    expect(spot.toCommon(WIRE).kind).toBe('spot');
  });
});
