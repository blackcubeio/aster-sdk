import { describe, expect, it } from 'vitest';
import type { FundingRate } from '../../src/common/types';
import { FundingConverter, type FundingRateNative } from '../../src/converters/funding';

/** Clés du cœur unifié (hors xtras) — identiques sur les 3 SDK. */
const FUNDING_CORE_KEYS = ['fundingRate', 'name', 'time'];

const WIRE: FundingRateNative = {
  symbol: 'BTCUSDT',
  fundingRate: '0.0001',
  fundingTime: 1_700_000_000_000,
};

describe('FundingConverter Aster — bijectivité + conformité', () => {
  const conv = new FundingConverter();

  it('toCommon mappe le point de funding', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      name: 'BTCUSDT',
      fundingRate: '0.0001',
      time: 1_700_000_000_000,
    } satisfies FundingRate);
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(FUNDING_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
