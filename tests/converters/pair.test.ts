import { describe, expect, it } from 'vitest';
import type { Pair } from '../../src/common/types';
import { PairConverter } from '../../src/rest/converters/pair';
import type { FuturesSymbol } from '../../src/rest/futures/types';

// Symbole futures Aster réaliste (cœur + champs hors cœur : pricePrecision, filters, orderTypes…).
const FUTURES = {
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  quantityPrecision: 3,
  status: 'TRADING',
  pricePrecision: 2,
  orderTypes: ['LIMIT', 'MARKET'],
  filters: [
    { filterType: 'PRICE_FILTER', tickSize: '0.10' },
    { filterType: 'LOT_SIZE', stepSize: '0.001' },
    { filterType: 'MIN_NOTIONAL', notional: '5' },
  ],
} as unknown as FuturesSymbol;

describe('PairConverter Aster — bijectivité', () => {
  const conv = new PairConverter();

  it('toCommon extrait le cœur, le reste va dans xtras', () => {
    expect(conv.toCommon(FUTURES, 'perp')).toEqual({
      name: 'BTCUSDT',
      base: 'BTC',
      quote: 'USDT',
      kind: 'perp',
      szDecimals: 3,
      tickSize: '0.10',
      stepSize: '0.001',
      minNotional: '5',
      status: 'TRADING',
      xtras: {
        pricePrecision: 2,
        orderTypes: ['LIMIT', 'MARKET'],
        filters: [
          { filterType: 'PRICE_FILTER', tickSize: '0.10' },
          { filterType: 'LOT_SIZE', stepSize: '0.001' },
          { filterType: 'MIN_NOTIONAL', notional: '5' },
        ],
      },
    } satisfies Pair);
  });

  it('toNative(toCommon(symbol)) ≡ symbol (aucun champ perdu)', () => {
    expect(conv.toNative(conv.toCommon(FUTURES, 'perp'))).toEqual(FUTURES);
  });

  it('toCommon(toNative(pair)) ≡ pair', () => {
    const pair = conv.toCommon(FUTURES, 'perp');
    expect(conv.toCommon(conv.toNative(pair), 'perp')).toEqual(pair);
  });
});
