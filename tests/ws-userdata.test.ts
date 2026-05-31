import { beforeAll, describe, expect, it } from 'vitest';
import type { Hex, Network, Order, Position, UserTrade } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

let dex: Aster;

function waitFor<T>(bucket: T[], pred: (x: T) => boolean, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = setInterval(() => {
      const found = bucket.find(pred);
      if (found !== undefined) {
        clearInterval(tick);
        resolve(found);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(tick);
        reject(new Error('timeout waitFor'));
      }
    }, 500);
  });
}

// Flux user-data unifiés sur le testnet réel, via la façade dex.ws().
describe.skipIf(ready === false)('façade ws() user-data Aster (testnet réel)', () => {
  beforeAll(() => {
    dex = new Aster(
      {
        trader: {
          privateKey: AGENT_KEY as Hex,
          user: USER as Hex,
          signer: AGENT_ADDR,
          network: NETWORK,
        },
      },
      { default: 'trader' },
    );
  });

  it('subscribeOrders délivre un Order unifié quand un ordre est placé (LIMIT far)', async () => {
    const clientOrderId = globalThis.crypto.randomUUID().replace(/-/g, '');
    const orders: Order[] = [];
    const off = dex.ws().subscribeOrders((o) => orders.push(o));
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const created = await dex.perp().place({
        name: 'BTCUSDT',
        side: 'buy',
        type: 'limit',
        tif: 'gtc',
        size: '0.001',
        price: '20000',
        clientId: clientOrderId,
      });
      const order = await waitFor(orders, (o) => o.id === created.id, 20_000);
      expect(order.name).toBe('BTCUSDT');
      expect(order.kind).toBe('perp');
      expect(order.side).toBe('buy');
      expect(order.type).toBe('limit');
      expect(order.tif).toBe('gtc');
      await dex
        .perp()
        .cancel({ name: 'BTCUSDT', id: created.id })
        .catch(() => {});
    } finally {
      off();
    }
  }, 40_000);

  it('subscribeUserTrades + subscribePositions sur une position mini ouverte puis refermée', async () => {
    const fills: UserTrade[] = [];
    const positions: Position[] = [];
    const offT = dex.ws().subscribeUserTrades((t) => fills.push(t));
    const offP = dex.ws().subscribePositions((p) => positions.push(p));
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await dex.perp().place({ name: 'BTCUSDT', side: 'buy', type: 'market', size: '0.001' });
      const fill = await waitFor(fills, (t) => t.name === 'BTCUSDT', 20_000);
      expect(fill.kind).toBe('perp');
      expect(typeof fill.id).toBe('string');
      expect(['buy', 'sell']).toContain(fill.side);
      expect(typeof fill.fee).toBe('string');
      expect(typeof fill.maker).toBe('boolean');

      const pos = await waitFor(positions, (p) => p.name === 'BTCUSDT', 20_000);
      expect(['long', 'short', null]).toContain(pos.side);
      expect(typeof pos.size).toBe('string');
      expect(typeof pos.entryPrice).toBe('string');
    } finally {
      await dex
        .perp()
        .place({
          name: 'BTCUSDT',
          side: 'sell',
          type: 'market',
          size: '0.001',
          reduceOnly: true,
        })
        .catch(() => {});
      offT();
      offP();
    }
  }, 50_000);
});
