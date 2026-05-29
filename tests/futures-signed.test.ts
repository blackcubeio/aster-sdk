import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../src/common/config';
import type { Hex, Network } from '../src/common/types';
import { getBalance } from '../src/rest/futures/account/get-balance';
import { privateKeyToAddress } from '../src/rest/signing';
import { readEnv } from './_env';

// Signature agent réelle : lecture USER_DATA non destructive (GET /fapi/v3/balance).
// Nécessite un .env avec le main wallet (EVM_*) et l'API wallet (WALLET_ASTER_API1_*).
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API1_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API1_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'mainnet';
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

  it('getBalance renvoie les soldes du compte (signature agent acceptée)', async () => {
    const balances = await getBalance('trader');
    expect(Array.isArray(balances)).toBe(true);
    for (const entry of balances) {
      expect(typeof entry.asset).toBe('string');
      expect(typeof entry.balance).toBe('string');
    }
  });
});
