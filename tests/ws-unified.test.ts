import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import { KlineInterval, type Hex } from '../src/common/types';
import { UnifiedWsClient } from '../src/ws/unified-client';

// Flux WS unifiés sur le futures mainnet réel (public, label = ciblage réseau seulement).
const MN = 'mn';

describe('UnifiedWsClient Aster (futures mainnet réel, public)', () => {
  beforeAll(() => {
    init({
      signers: {
        [MN]: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'mainnet',
        },
      },
    });
  });
  afterAll(() => resetConfig());

  it(
    'subscribeCandles délivre une Candle unifiée',
    async () => {
      const client = new UnifiedWsClient({ label: MN });
      await client.connect();
      try {
        const candle = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout candles')), 25_000);
          client.subscribeCandles(
            { name: 'BTCUSDT', interval: KlineInterval.OneMinute, kind: 'perp' },
            (received) => {
              clearTimeout(timer);
              resolve(received as unknown as Record<string, unknown>);
            },
          );
        });
        expect(candle.s).toBe('BTCUSDT');
        expect(candle.i).toBe('1m');
        expect(candle.kind).toBe('perp');
        expect(typeof candle.t).toBe('number');
        expect(typeof candle.o).toBe('string');
        // Aster fournit les volumes quote/taker (≠ HL/Pacifica qui sont null).
        expect(typeof candle.qv).toBe('string');
        expect(typeof candle.tbbv).toBe('string');
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );

  it(
    'subscribeTrades délivre un Trade unifié par trade',
    async () => {
      const client = new UnifiedWsClient({ label: MN });
      await client.connect();
      try {
        const trade = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout trades')), 25_000);
          client.subscribeTrades({ name: 'BTCUSDT', kind: 'perp' }, (received) => {
            clearTimeout(timer);
            resolve(received as unknown as Record<string, unknown>);
          });
        });
        expect(typeof trade.price).toBe('string');
        expect(typeof trade.size).toBe('string');
        expect(['buy', 'sell']).toContain(trade.side);
        expect(trade.maker).toBeNull();
        expect(typeof trade.time).toBe('number');
        expect(typeof trade.id).toBe('number');
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );

  it(
    'subscribeBbo délivre un OrderBook (1 niveau par côté)',
    async () => {
      const client = new UnifiedWsClient({ label: MN });
      await client.connect();
      try {
        const book = await new Promise<Record<string, unknown>>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout bbo')), 25_000);
          client.subscribeBbo({ name: 'BTCUSDT', kind: 'perp' }, (received) => {
            clearTimeout(timer);
            resolve(received as unknown as Record<string, unknown>);
          });
        });
        expect(book.name).toBe('BTCUSDT');
        expect(book.kind).toBe('perp');
        const bids = book.bids as Array<{ price: string; n: number | null }>;
        const asks = book.asks as Array<{ price: string }>;
        expect(typeof bids[0].price).toBe('string');
        expect(typeof asks[0].price).toBe('string');
        expect(bids[0].n).toBeNull();
      } finally {
        client.disconnect();
      }
    },
    30_000,
  );
});
