import { beforeAll, describe, expect, it } from 'vitest';
import type { Hex, Network } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

// Lectures spot signées réelles (agent API2 / Bot 2, testnet), via la façade. Non destructives.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

let dex: Aster;

describe.skipIf(ready === false)('spot signé — agent (réel) — via façade', () => {
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

  it('spot().getAccountInfo renvoie les balances', async () => {
    const account = (await dex.spot().getAccountInfo()) as {
      canTrade: boolean;
      balances: { asset: string; free: string }[];
    };
    expect(typeof account.canTrade).toBe('boolean');
    expect(Array.isArray(account.balances)).toBe(true);
    for (const balance of account.balances) {
      expect(typeof balance.asset).toBe('string');
      expect(typeof balance.free).toBe('string');
    }
  });

  it('spot().getOpenOrders(ASTERUSDT) renvoie des ordres unifiés (kind spot)', async () => {
    const orders = await dex.spot().getOpenOrders({ name: 'ASTERUSDT' });
    expect(Array.isArray(orders)).toBe(true);
    for (const o of orders) {
      expect(o.kind).toBe('spot');
      expect(['buy', 'sell']).toContain(o.side);
      expect(o.reduceOnly).toBeNull();
    }
  });
});
