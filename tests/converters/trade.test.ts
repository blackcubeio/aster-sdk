import { describe, expect, it } from 'vitest';
import type { Trade } from '../../src/common/types';
import { TradeConverter, type TradeNative } from '../../src/rest/converters/trade';

/** Clés du cœur unifié (hors xtras) — DOIVENT être identiques sur les 3 SDK. */
export const TRADE_CORE_KEYS = ['id', 'maker', 'price', 'side', 'size', 'time'];

const FUTURES: TradeNative = {
  id: 42,
  price: '74000.0',
  qty: '0.5',
  quoteQty: '37000.0',
  time: 1_700_000_000_000,
  isBuyerMaker: true,
} as TradeNative;

describe('TradeConverter Aster — bijectivité + conformité', () => {
  const conv = new TradeConverter();

  it('toCommon : side=taker (opposé du maker), maker=null, reste dans xtras', () => {
    expect(conv.toCommon(FUTURES)).toEqual({
      price: '74000.0',
      size: '0.5',
      side: 'sell',
      maker: null,
      time: 1_700_000_000_000,
      id: 42,
      xtras: { quoteQty: '37000.0', isBuyerMaker: true },
    } satisfies Trade);
  });

  it('cœur conforme (clés hors xtras)', () => {
    const trade = conv.toCommon(FUTURES);
    const core = Object.keys(trade)
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(TRADE_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(FUTURES))).toEqual(FUTURES);
  });

  it('toCommon(toNative(trade)) ≡ trade', () => {
    const trade = conv.toCommon(FUTURES);
    expect(conv.toCommon(conv.toNative(trade))).toEqual(trade);
  });
});
