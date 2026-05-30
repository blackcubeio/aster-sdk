import { beforeAll, describe, expect, it } from 'vitest';
import type { Hex, Network } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

// Signature agent réelle : lectures USER_DATA non destructives, via la façade. On cible un
// agent **stable** : API2 = « PGA Bot 2 » sur testnet (lié au compte, vérifié). `user` est
// l'adresse publique du compte principal.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

let dex: Aster;

describe.skipIf(ready === false)('futures signé — agent (réel) — via façade', () => {
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

  it('helpers().privateKeyToAddress correspond au WALLET_ASTER_API2_PUBLIC_KEY', () => {
    if (AGENT_ADDR !== undefined) {
      expect(
        dex
          .helpers()
          .privateKeyToAddress(AGENT_KEY as Hex)
          .toLowerCase(),
      ).toBe(AGENT_ADDR.toLowerCase());
    }
  });

  it('account().getBalances renvoie les soldes unifiés (signature agent acceptée)', async () => {
    const balances = await dex.account().getBalances();
    expect(Array.isArray(balances)).toBe(true);
    for (const entry of balances) {
      expect(typeof entry.asset).toBe('string');
      expect(typeof entry.total).toBe('string');
      expect(entry.usdValue).toBeNull();
    }
  });

  it('perp().getAccountInfo renvoie assets et positions', async () => {
    const account = (await dex.perp().getAccountInfo()) as {
      totalWalletBalance: string;
      assets: unknown[];
      positions: unknown[];
    };
    expect(typeof account.totalWalletBalance).toBe('string');
    expect(Array.isArray(account.assets)).toBe(true);
    expect(Array.isArray(account.positions)).toBe(true);
  });

  it('perp().getPositions renvoie un tableau de positions unifiées', async () => {
    const positions = await dex.perp().getPositions();
    expect(Array.isArray(positions)).toBe(true);
    for (const p of positions) {
      expect(typeof p.name).toBe('string');
      expect(typeof p.size).toBe('string');
    }
  });

  it('perp().getOpenOrders renvoie un tableau d’ordres unifiés', async () => {
    const orders = await dex.perp().getOpenOrders({ name: 'BTCUSDT' });
    expect(Array.isArray(orders)).toBe(true);
    for (const o of orders) {
      expect(['buy', 'sell']).toContain(o.side);
      expect(typeof o.size).toBe('string');
    }
  });
});
