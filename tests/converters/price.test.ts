import { describe, expect, it } from 'vitest';
import type { Price } from '../../src/common/types';
import { PriceConverter, type PriceNative } from '../../src/converters/price';

const WIRE: PriceNative = {
  symbol: 'BTCUSDT',
  markPrice: '74000.0',
  indexPrice: '73990.0',
  estimatedSettlePrice: '73995.0',
  lastFundingRate: '0.0001',
  nextFundingTime: 1_700_003_600_000,
  interestRate: '0.0001',
  time: 1_700_000_000_000,
};

describe('PriceConverter Aster — bijectivité', () => {
  const conv = new PriceConverter();

  it('toCommon mappe le snapshot (mid/oi/vol/prevDay null, reste dans xtras)', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      name: 'BTCUSDT',
      kind: 'perp',
      mark: '74000.0',
      oracle: '73990.0',
      mid: null,
      bid: null,
      ask: null,
      last: null,
      funding: '0.0001',
      openInterest: null,
      volume24h: null,
      prevDayPrice: null,
      time: 1_700_000_000_000,
      xtras: {
        estimatedSettlePrice: '73995.0',
        nextFundingTime: 1_700_003_600_000,
        interestRate: '0.0001',
      },
    } satisfies Price);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });

  it('toCommon(toNative(price)) ≡ price', () => {
    const price = conv.toCommon(WIRE);
    expect(conv.toCommon(conv.toNative(price))).toEqual(price);
  });
});
