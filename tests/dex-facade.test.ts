import { describe, expect, it } from 'vitest';
import type { Hex, Network } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const AGENT_KEY = readEnv('WALLET_ASTER_API2_PRIVATE_KEY') as Hex | undefined;
const AGENT_ADDR = readEnv('WALLET_ASTER_API2_PUBLIC_KEY') as Hex | undefined;
const NETWORK = (readEnv('ASTER_NETWORK') as Network | undefined) ?? 'testnet';
const signed = USER !== undefined && AGENT_KEY !== undefined;

describe('Façade Aster (réel)', () => {
  it('perp().getCandles — public, sans signer', async () => {
    const dex = new Aster();
    const candles = await dex.perp().getCandles({ name: 'BTCUSDT', interval: '1m', limit: 5 });
    expect(candles.length).toBeGreaterThan(0);
    expect(candles[0]?.kind).toBe('perp');
    expect(typeof candles[0]?.o).toBe('string');
  }, 20_000);

  it('deux instances Aster parallèles ne partagent aucun état global', async () => {
    // Réseaux différents : prouve l'isolation (plus de singleton).
    const a = new Aster(
      USER !== undefined && AGENT_KEY !== undefined
        ? { x: { privateKey: AGENT_KEY, user: USER, signer: AGENT_ADDR, network: 'testnet' } }
        : {},
    );
    const b = new Aster(); // public mainnet par défaut
    const [pa, pb] = await Promise.all([a.perp().getPrices(), b.perp().getPrices()]);
    expect(pa.length).toBeGreaterThan(0);
    expect(pb.length).toBeGreaterThan(0);
    // Les deux instances répondent indépendamment, sans s'écraser.
    expect(pa[0]?.kind).toBe('perp');
    expect(pb[0]?.kind).toBe('perp');
  }, 25_000);

  it.skipIf(!signed)(
    'account().getBalances — signé testnet',
    async () => {
      const dex = new Aster(
        {
          deskA: {
            privateKey: AGENT_KEY as Hex,
            user: USER as Hex,
            signer: AGENT_ADDR,
            network: NETWORK,
          },
        },
        { default: 'deskA' },
      );
      const balances = await dex.account().getBalances();
      expect(Array.isArray(balances)).toBe(true);
      // Override de compte par argument `as`.
      const same = await dex.account('deskA').getBalances();
      expect(Array.isArray(same)).toBe(true);
    },
    20_000,
  );

  it('ws perp subscribeCandles — lazy connect / auto-unsubscribe', async () => {
    const dex = new Aster();
    const candle = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout ws candles')), 20_000);
      const off = dex.ws().subscribeCandles({ name: 'BTCUSDT', interval: '1m' }, (c) => {
        clearTimeout(timer);
        off(); // dernier abonnement retiré → le socket se ferme tout seul
        resolve(c as unknown as Record<string, unknown>);
      });
    });
    expect(candle.s).toBe('BTCUSDT');
    expect(candle.kind).toBe('perp');
  }, 25_000);
});
