import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import type { Hex, Network, Order, Position, UserTrade } from '../src/common/types';
import { cancelOrder } from '../src/rest/cancel-order';
import { placeOrder } from '../src/rest/place-order';
import { newClientOrderId } from '../src/rest/signing';
import { UnifiedWsClient } from '../src/ws/unified-client';
import { readEnv } from './_env';

const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

// Flux user-data unifiés sur le testnet réel (LIMIT far-from-market, annulé après).
describe.skipIf(ready === false)('UnifiedWsClient Aster user-data (testnet réel)', () => {
  beforeAll(() => {
    init({
      signers: {
        trader: { privateKey: AGENT_KEY as Hex, user: USER as Hex, signer: AGENT_ADDR, network: NETWORK },
      },
    });
  });
  afterAll(() => resetConfig());

  it(
    'subscribeOrders délivre un Order unifié quand un ordre est placé',
    async () => {
      const clientOrderId = newClientOrderId();
      const orders: Order[] = [];
      const client = new UnifiedWsClient({ label: 'trader' });
      await client.connect();
      try {
        client.subscribeOrders({ user: USER }, (order) => orders.push(order));
        await new Promise((r) => setTimeout(r, 1500));
        const created = await placeOrder(
          { name: 'BTCUSDT', side: 'buy', type: 'limit', tif: 'gtc', size: '0.001', price: '20000', clientId: clientOrderId },
          'trader',
        );
        const order = await waitFor(orders, (o) => o.id === created.id, 20_000);
        expect(order.name).toBe('BTCUSDT');
        expect(order.kind).toBe('perp');
        expect(order.side).toBe('buy');
        expect(order.type).toBe('limit');
        expect(order.tif).toBe('gtc');
        expect(typeof order.price).toBe('string');
      } finally {
        await cancelOrder({ name: 'BTCUSDT', id: orders[0]?.id ?? '0' }, 'trader').catch(() => {});
        client.disconnect();
      }
    },
    40_000,
  );

  it(
    'subscribeUserTrades + subscribePositions sur une position mini ouverte puis refermée',
    async () => {
      const fills: UserTrade[] = [];
      const positions: Position[] = [];
      const client = new UnifiedWsClient({ label: 'trader' });
      await client.connect();
      try {
        client.subscribeUserTrades({ user: USER }, (t) => fills.push(t));
        client.subscribePositions({ user: USER }, (p) => positions.push(p));
        await new Promise((r) => setTimeout(r, 1500));
        await placeOrder({ name: 'BTCUSDT', side: 'buy', type: 'market', size: '0.001' }, 'trader');
        const fill = await waitFor(fills, (t) => t.name === 'BTCUSDT', 20_000);
        expect(fill.kind).toBe('perp');
        expect(typeof fill.id).toBe('string');
        expect(typeof fill.orderId).toBe('string');
        expect(['buy', 'sell']).toContain(fill.side);
        expect(typeof fill.price).toBe('string');
        expect(typeof fill.fee).toBe('string');
        expect(typeof fill.maker).toBe('boolean');

        const pos = await waitFor(positions, (p) => p.name === 'BTCUSDT', 20_000);
        expect(['long', 'short', null]).toContain(pos.side);
        expect(typeof pos.size).toBe('string');
        expect(typeof pos.entryPrice).toBe('string');
        expect(typeof pos.unrealizedPnl).toBe('string');
      } finally {
        await placeOrder(
          { name: 'BTCUSDT', side: 'sell', type: 'market', size: '0.001', reduceOnly: true },
          'trader',
        ).catch(() => {});
        client.disconnect();
      }
    },
    50_000,
  );
});

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
