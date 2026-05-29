import { describe, expect, it } from 'vitest';
import { UserTradeConverter, type UserTradeNative } from '../../src/rest/converters/user-trade';

const USER_TRADE_CORE_KEYS = [
  'fee',
  'feeAsset',
  'id',
  'kind',
  'maker',
  'name',
  'orderId',
  'pnl',
  'price',
  'side',
  'size',
  'time',
];

const WIRE = {
  id: 88,
  orderId: 123,
  symbol: 'BTCUSDT',
  side: 'SELL',
  positionSide: 'BOTH',
  price: '74000.0',
  qty: '0.5',
  quoteQty: '37000.0',
  realizedPnl: '12.0',
  commission: '0.5',
  commissionAsset: 'USDT',
  buyer: false,
  maker: true,
  time: 1_700_000_000_000,
} as unknown as UserTradeNative;

describe('UserTradeConverter Aster — bijectivité + conformité', () => {
  const conv = new UserTradeConverter();

  it('toCommon : side dérivé, fee/pnl mappés, natifs dans xtras', () => {
    const t = conv.toCommon(WIRE);
    expect(t.side).toBe('sell');
    expect(t.size).toBe('0.5');
    expect(t.fee).toBe('0.5');
    expect(t.feeAsset).toBe('USDT');
    expect(t.pnl).toBe('12.0');
    expect(t.maker).toBe(true);
    expect(t.orderId).toBe('123');
    expect(t.xtras?.quoteQty).toBe('37000.0');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(USER_TRADE_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
