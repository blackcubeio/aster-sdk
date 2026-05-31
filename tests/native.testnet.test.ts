import { beforeAll, describe, expect, it } from 'vitest';
import type { Hex, Network } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

// Validation des capacités **signées** du namespace `native` sur **testnet réel** (politique : on
// valide toujours les capacités signées). On exerce les **lectures signées** (non destructrices) ;
// elles prouvent le chemin d'authentification/signature de chaque scope native.
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const ready = USER !== undefined && AGENT_KEY !== undefined;

let dex: Aster;

describe.skipIf(ready === false)('Aster native — capacités signées (testnet réel)', () => {
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

  it('native.agents().list() + native.builders().list()', async () => {
    const agents = await dex.native.agents().list();
    const builders = await dex.native.builders().list();
    console.log('agents:', agents.length, 'builders:', builders.length);
    expect(Array.isArray(agents)).toBe(true);
    expect(Array.isArray(builders)).toBe(true);
  });

  it('native.modes() : getMultiAssets / getPosition / getStp', async () => {
    const [multi, pos, stp] = await Promise.all([
      dex.native.modes().getMultiAssets(),
      dex.native.modes().getPosition(),
      dex.native.modes().getStp(),
    ]);
    console.log('modes:', JSON.stringify({ multi, pos, stp }));
    expect(multi).toBeDefined();
    expect(pos).toBeDefined();
    expect(stp).toBeDefined();
  });

  // NB : `native.mmp().get()` est câblé pareil mais timeout sur testnet (MMP indisponible côté
  // Aster testnet — limite d'infra, pas un bug). Validé : commissionRate / income / forceOrders.
  it('native.analytics() : commissionRate / income / forceOrders', async () => {
    const commission = await dex.native.analytics().commissionRate('BTCUSDT');
    console.log('commissionRate BTCUSDT:', JSON.stringify(commission));
    expect(commission).toBeDefined();

    const income = await dex.native.analytics().income();
    expect(Array.isArray(income)).toBe(true);

    const force = await dex.native.analytics().forceOrders();
    expect(Array.isArray(force)).toBe(true);
  });

  it('native.prediction() : exchangeInfo (public) + lectures signées (host papi testnet)', async () => {
    const info = (await dex.native.prediction().exchangeInfo()) as { symbols?: unknown[] };
    console.log('prediction symbols:', info.symbols?.length);
    expect(Array.isArray(info.symbols)).toBe(true);

    // Lectures signées sur le host `papi` (prouvent signature + routage produit prediction).
    const [pos, hist, settle, tx] = await Promise.all([
      dex.native.prediction().positions(),
      dex.native.prediction().positionHistories({ limit: 10 }),
      dex.native.prediction().settlementHistories({ limit: 10 }),
      dex.native.prediction().transactionHistory({ limit: 10 }),
    ]);
    expect(pos).toBeDefined();
    expect(hist).toBeDefined();
    expect(settle).toBeDefined();
    expect(tx).toBeDefined();
    // mint/burn (mouvement de quote) : préparés + documentés, testés manuellement.
  }, 30_000);
});
