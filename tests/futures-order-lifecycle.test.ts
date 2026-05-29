import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import { type Hex, type Network, OrderSide, OrderType, TimeInForce } from '../src/common/types';
import { getOpenOrders } from '../src/rest/futures/account/get-open-orders';
import { cancelOrder } from '../src/rest/futures/trade/cancel-order';
import { createOrder } from '../src/rest/futures/trade/new-order';
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
      const created = await createOrder(
        {
          symbol: 'BTCUSDT',
          side: OrderSide.Buy,
          type: OrderType.Limit,
          timeInForce: TimeInForce.Gtc,
          quantity: '0.001',
          price: '20000',
          newClientOrderId: clientOrderId,
        },
        'trader',
      );
      expect(created.status).toBe('NEW');
      expect(created.orderId).toBeGreaterThan(0);

      const open = await getOpenOrders('BTCUSDT', 'trader');
      expect(open.some((order) => order.orderId === created.orderId)).toBe(true);

      const canceled = await cancelOrder({ symbol: 'BTCUSDT', orderId: created.orderId }, 'trader');
      expect(canceled.status).toBe('CANCELED');

      const after = await getOpenOrders('BTCUSDT', 'trader');
      expect(after.some((order) => order.orderId === created.orderId)).toBe(false);
    }, 30_000);
  },
);
