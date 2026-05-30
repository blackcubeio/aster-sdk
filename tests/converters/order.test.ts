import { describe, expect, it } from 'vitest';
import { OrderConverter, type OrderNative } from '../../src/converters/order';

const ORDER_CORE_KEYS = [
  'clientId',
  'filled',
  'id',
  'kind',
  'name',
  'price',
  'reduceOnly',
  'side',
  'size',
  'status',
  'tif',
  'time',
  'type',
];

const WIRE = {
  orderId: 123,
  clientOrderId: 'abc',
  symbol: 'BTCUSDT',
  status: 'PARTIALLY_FILLED',
  side: 'SELL',
  positionSide: 'BOTH',
  type: 'LIMIT',
  origType: 'LIMIT',
  timeInForce: 'GTC',
  price: '74000.0',
  avgPrice: '74000.0',
  origQty: '1.0',
  executedQty: '0.3',
  cumQty: '0.3',
  cumQuote: '22200.0',
  reduceOnly: false,
  closePosition: false,
  stopPrice: '0',
  workingType: 'CONTRACT_PRICE',
  priceProtect: false,
  updateTime: 1_700_000_000_000,
} as unknown as OrderNative;

describe('OrderConverter Aster — bijectivité + conformité', () => {
  const conv = new OrderConverter();

  it('toCommon : littéraux unifiés dérivés, natifs dans xtras', () => {
    const o = conv.toCommon(WIRE);
    expect(o.id).toBe('123');
    expect(o.side).toBe('sell');
    expect(o.type).toBe('limit');
    expect(o.status).toBe('partiallyFilled');
    expect(o.tif).toBe('gtc');
    expect(o.size).toBe('1.0');
    expect(o.filled).toBe('0.3');
    expect(o.xtras?.side).toBe('SELL');
  });

  it('cœur conforme', () => {
    const core = Object.keys(conv.toCommon(WIRE))
      .filter((k) => k !== 'xtras')
      .sort();
    expect(core).toEqual(ORDER_CORE_KEYS);
  });

  it('toNative(toCommon(wire)) ≡ wire', () => {
    expect(conv.toNative(conv.toCommon(WIRE))).toEqual(WIRE);
  });
});
