import { describe, expect, it } from 'vitest';
import type { OrderBook } from '../../src/common/types';
import { OrderBookConverter, type OrderBookNative } from '../../src/converters/order-book';

const WIRE: OrderBookNative = {
  lastUpdateId: 123456,
  E: 1_700_000_000_000,
  T: 1_700_000_000_050,
  bids: [
    ['74000.0', '1.5'],
    ['73999.0', '2.0'],
  ],
  asks: [['74001.0', '0.5']],
};

describe('OrderBookConverter Aster — bijectivité', () => {
  const conv = new OrderBookConverter('BTCUSDT', 'perp');

  it('toCommon mappe le carnet (n=null, time=T, reste dans xtras)', () => {
    expect(conv.toCommon(WIRE)).toEqual({
      name: 'BTCUSDT',
      kind: 'perp',
      bids: [
        { price: '74000.0', size: '1.5', n: null },
        { price: '73999.0', size: '2.0', n: null },
      ],
      asks: [{ price: '74001.0', size: '0.5', n: null }],
      time: 1_700_000_000_050,
      xtras: { lastUpdateId: 123456, eventTime: 1_700_000_000_000 },
    } satisfies OrderBook);
  });

  it('toNative(toCommon(wire)) ≡ wire (aucun champ perdu)', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });

  it('toCommon(toNative(book)) ≡ book', () => {
    const book = conv.toCommon(WIRE);
    expect(conv.toCommon(conv.toNative(book))).toEqual(book);
  });
});
