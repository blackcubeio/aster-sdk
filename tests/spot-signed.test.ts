import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import type { Hex, Network } from '../src/common/types';
import { getAccountInfoSpot } from '../src/rest/spot/account/get-account-info';
import { getOpenOrdersSpot } from '../src/rest/spot/account/get-open-orders';
import { readEnv } from './_env';

// Lectures spot signées réelles (agent API2 / Bot 2, testnet). Non destructives.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

describe.skipIf(ready === false)('spot signé — agent (réel)', () => {
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

  it('getAccountInfoSpot renvoie les balances', async () => {
    const account = await getAccountInfoSpot('trader');
    expect(typeof account.canTrade).toBe('boolean');
    expect(Array.isArray(account.balances)).toBe(true);
    for (const balance of account.balances) {
      expect(typeof balance.asset).toBe('string');
      expect(typeof balance.free).toBe('string');
    }
  });

  it('getOpenOrdersSpot(ASTERUSDT) renvoie un tableau', async () => {
    const orders = await getOpenOrdersSpot('ASTERUSDT', 'trader');
    expect(Array.isArray(orders)).toBe(true);
  });
});
