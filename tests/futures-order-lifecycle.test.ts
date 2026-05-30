import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Hex, Network } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

// Cycle d'ordre réel sur **testnet** (jamais mainnet), via la façade, avec un agent stable
// (API2 / Bot 2) : place un LIMIT loin du marché → visible → cancel → disparu.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

let dex: Aster;

describe.skipIf(ready === false)(
  'order lifecycle (testnet : place → visible → cancel → gone) — via façade',
  () => {
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
    afterAll(() => {});

    it('place un LIMIT loin du marché, le voit, l’annule, puis il a disparu', async () => {
      const clientOrderId = globalThis.crypto.randomUUID().replace(/-/g, '');
      const created = await dex.perp().placeOrder({
        name: 'BTCUSDT',
        side: 'buy',
        type: 'limit',
        tif: 'gtc',
        size: '0.001',
        price: '20000',
        clientId: clientOrderId,
      });
      expect(created.status).toBe('open');
      expect(Number(created.id)).toBeGreaterThan(0);

      const open = await dex.perp().getOpenOrders({ name: 'BTCUSDT' });
      expect(open.some((order) => order.id === created.id)).toBe(true);

      await dex.perp().cancelOrder({ name: 'BTCUSDT', id: created.id });

      const after = await dex.perp().getOpenOrders({ name: 'BTCUSDT' });
      expect(after.some((order) => order.id === created.id)).toBe(false);
    }, 30_000);
  },
);
