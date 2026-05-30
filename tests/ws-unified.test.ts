import { beforeAll, describe, expect, it } from 'vitest';
import { type Hex, KlineInterval } from '../src/common/types';
import { Aster } from '../src/dex/aster';

// Flux WS unifiés sur le futures mainnet réel (public), via la façade dex.ws() (perp).
let dex: Aster;

function once<T>(subscribe: (cb: (v: T) => void) => () => void, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${label}`)), 25_000);
    const off = subscribe((v) => {
      clearTimeout(timer);
      off(); // dernier abonnement retiré → socket fermé (lazy/ref-counting)
      resolve(v);
    });
  });
}

describe('façade ws() Aster (futures mainnet réel, public)', () => {
  beforeAll(() => {
    dex = new Aster(
      {
        mn: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'mainnet',
        },
      },
      { default: 'mn' },
    );
  });

  it('subscribeCandles délivre une Candle unifiée', async () => {
    const c = (await once(
      (cb) => dex.ws().subscribeCandles({ name: 'BTCUSDT', interval: KlineInterval.OneMinute }, cb),
      'candles',
    )) as unknown as Record<string, unknown>;
    expect(c.s).toBe('BTCUSDT');
    expect(c.i).toBe('1m');
    expect(c.kind).toBe('perp');
    expect(typeof c.qv).toBe('string');
    expect(typeof c.tbbv).toBe('string');
  }, 30_000);

  it('subscribeTrades délivre un Trade unifié par trade', async () => {
    const t = (await once(
      (cb) => dex.ws().subscribeTrades({ name: 'BTCUSDT' }, cb),
      'trades',
    )) as unknown as Record<string, unknown>;
    expect(typeof t.price).toBe('string');
    expect(['buy', 'sell']).toContain(t.side);
    expect(t.maker).toBeNull();
    expect(typeof t.id).toBe('number');
  }, 30_000);

  it('subscribeBbo délivre un OrderBook (1 niveau par côté)', async () => {
    const b = (await once(
      (cb) => dex.ws().subscribeBbo({ name: 'BTCUSDT' }, cb),
      'bbo',
    )) as unknown as Record<string, unknown>;
    expect(b.name).toBe('BTCUSDT');
    expect(b.kind).toBe('perp');
    const bids = b.bids as Array<{ price: string; n: number | null }>;
    expect(typeof bids[0]?.price).toBe('string');
    expect(bids[0]?.n).toBeNull();
  }, 30_000);

  it('subscribeOrderBook délivre un OrderBook (L2)', async () => {
    const b = (await once(
      (cb) => dex.ws().subscribeOrderBook({ name: 'BTCUSDT' }, cb),
      'orderbook',
    )) as unknown as Record<string, unknown>;
    expect(b.name).toBe('BTCUSDT');
    expect(b.kind).toBe('perp');
    const bids = b.bids as Array<{ price: string; size: string }>;
    expect(bids.length).toBeGreaterThan(0);
    expect(typeof bids[0]?.price).toBe('string');
  }, 30_000);

  it('subscribePrices délivre un Price[] (mark/oracle/funding)', async () => {
    const prices = (await once((cb) => dex.ws().subscribePrices(cb), 'prices')) as unknown as Array<
      Record<string, unknown>
    >;
    expect(prices.length).toBeGreaterThan(0);
    const btc = prices.find((p) => p.name === 'BTCUSDT');
    expect(btc?.kind).toBe('perp');
    expect(typeof btc?.mark).toBe('string');
    expect(typeof btc?.funding).toBe('string');
    expect(btc?.mid).toBeNull();
  }, 30_000);
});
