import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import type { Hex, Network } from '../src/common/types';
import { cancelOrder } from '../src/rest/cancel-order';
import { getOpenOrders } from '../src/rest/get-open-orders';
import { placeOrder } from '../src/rest/place-order';
import { newClientOrderId } from '../src/rest/signing';
import { readEnv } from './_env';

// Cycle d'ordre réel sur **testnet** (jamais mainnet) avec un agent stable (API2 / Bot 2) :
// place un LIMIT loin du marché → visible dans les open orders → cancel → disparu.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

describe.skipIf(ready === false)(
  'order lifecycle REST (testnet : place → visible → cancel → gone)',
  () => {
    beforeAll(() => {
      init({
        signers: {
          trader: {
            privateKey: AGENT_KEY as Hex,
            user: USER as Hex,
            signer: AGENT_ADDR,
            network: NETWORK,
          },
        },
      });
    });

    afterAll(() => {
      resetConfig();
    });

    it('place un LIMIT loin du marché, le voit, l’annule, puis il a disparu', async () => {
      const clientOrderId = newClientOrderId();
      const created = await placeOrder(
        {
          name: 'BTCUSDT',
          side: 'buy',
          type: 'limit',
          tif: 'gtc',
          size: '0.001',
          price: '20000',
          clientId: clientOrderId,
        },
        'trader',
      );
      expect(created.status).toBe('open');
      expect(Number(created.id)).toBeGreaterThan(0);

      const open = await getOpenOrders({ name: 'BTCUSDT' }, 'trader');
      expect(open.some((order) => order.id === created.id)).toBe(true);

      await cancelOrder({ name: 'BTCUSDT', id: created.id }, 'trader');

      const after = await getOpenOrders({ name: 'BTCUSDT' }, 'trader');
      expect(after.some((order) => order.id === created.id)).toBe(false);
    }, 30_000);
  },
);
