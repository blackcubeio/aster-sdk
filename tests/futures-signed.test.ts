import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import type { Hex, Network } from '../src/common/types';
import { getAccountInfo } from '../src/rest/futures/account/get-account-info';
import { getCommissionRate } from '../src/rest/futures/account/get-commission-rate';
import { getOpenOrders } from '../src/rest/futures/account/get-open-orders';
import { getAgents } from '../src/rest/futures/agent/agents';
import { closeListenKey, createListenKey } from '../src/rest/futures/user-stream/listen-key';
import { getBalances } from '../src/rest/get-balances';
import { getPositions } from '../src/rest/get-positions';
import { privateKeyToAddress } from '../src/rest/signing';
import { readEnv } from './_env';

// Signature agent réelle : lectures USER_DATA non destructives. On cible un agent
// **stable** : API2 = « PGA Bot 2 » sur testnet (lié au compte, vérifié). `user` est
// l'adresse publique du compte principal. La clé EVM n'est pas requise pour ces lectures.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

describe.skipIf(ready === false)('futures signé — agent (réel)', () => {
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

  it('l’adresse dérivée de la clé agent correspond au WALLET_ASTER_API1_PUBLIC_KEY', () => {
    if (AGENT_ADDR !== undefined) {
      expect(privateKeyToAddress(AGENT_KEY as Hex).toLowerCase()).toBe(AGENT_ADDR.toLowerCase());
    }
  });

  it('getBalances renvoie les soldes unifiés (signature agent acceptée)', async () => {
    const balances = await getBalances({}, 'trader');
    expect(Array.isArray(balances)).toBe(true);
    for (const entry of balances) {
      expect(typeof entry.asset).toBe('string');
      expect(typeof entry.total).toBe('string');
      expect(entry.usdValue).toBeNull();
    }
  });

  it('getAccountInfo renvoie assets et positions', async () => {
    const account = await getAccountInfo('trader');
    expect(typeof account.totalWalletBalance).toBe('string');
    expect(Array.isArray(account.assets)).toBe(true);
    expect(Array.isArray(account.positions)).toBe(true);
  });

  it('getPositions renvoie un tableau de positions unifiées', async () => {
    const positions = await getPositions({}, 'trader');
    expect(Array.isArray(positions)).toBe(true);
    for (const p of positions) {
      expect(typeof p.name).toBe('string');
      expect(typeof p.size).toBe('string');
    }
  });

  it('getOpenOrders(BTCUSDT) renvoie un tableau', async () => {
    const orders = await getOpenOrders('BTCUSDT', 'trader');
    expect(Array.isArray(orders)).toBe(true);
  });

  it('getCommissionRate renvoie les taux maker/taker', async () => {
    const rate = await getCommissionRate('BTCUSDT', 'trader');
    expect(rate.symbol).toBe('BTCUSDT');
    expect(Number(rate.makerCommissionRate)).toBeGreaterThanOrEqual(0);
    expect(Number(rate.takerCommissionRate)).toBeGreaterThanOrEqual(0);
  });

  it('getAgents renvoie la liste des agents', async () => {
    const agents = await getAgents('trader');
    expect(Array.isArray(agents)).toBe(true);
    for (const agent of agents) {
      expect(typeof agent.agentAddress).toBe('string');
      expect(typeof agent.canPerpTrade).toBe('boolean');
    }
  });

  it('createListenKey puis closeListenKey (cycle user-data stream)', async () => {
    const { listenKey } = await createListenKey('trader');
    expect(typeof listenKey).toBe('string');
    expect(listenKey.length).toBeGreaterThan(0);
    await expect(closeListenKey('trader')).resolves.toBeDefined();
  });
});
