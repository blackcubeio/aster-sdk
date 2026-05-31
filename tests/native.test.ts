import { describe, expect, it } from 'vitest';
import { Aster } from '../src/dex/aster';

// Surplus spécifique Aster via le namespace `native` — lectures **publiques** sur mainnet réel.
const dex = new Aster();

describe('Aster — namespace native (mainnet réel, public)', () => {
  it('expose toutes les capacités attendues', () => {
    const caps = dex.native;
    for (const c of ['perp', 'account', 'agents', 'builders', 'mmp', 'modes', 'subAccounts']) {
      expect(typeof (caps as Record<string, unknown>)[c]).toBe('function');
    }
    // Miroir : surplus perp (reads marché + ordres avancés) sous native.perp(), PAS sur perp() commun.
    expect(typeof dex.native.perp().placeBatch).toBe('function');
    expect(typeof dex.native.perp().getTicker24hr).toBe('function');
    expect((dex.perp() as unknown as Record<string, unknown>).placeBatch).toBeUndefined();
    // anciens scopes disparus.
    expect((caps as Record<string, unknown>).analytics).toBeUndefined();
    expect((caps as Record<string, unknown>).advancedOrders).toBeUndefined();
    expect((caps as Record<string, unknown>).marketData).toBeUndefined();
  });

  it('native.perp().getTicker24hr() (tous les symboles)', async () => {
    const tickers = (await dex.native.perp().getTicker24hr()) as unknown[];
    expect(Array.isArray(tickers)).toBe(true);
    expect(tickers.length).toBeGreaterThan(0);
  });

  it('native.perp().getAggregateTrades({ symbol }) + getFundingInfo()', async () => {
    const agg = await dex.native.perp().getAggregateTrades({ name: 'BTCUSDT', limit: 3 });
    expect(agg.length).toBeGreaterThan(0);

    const funding = await dex.native.perp().getFundingInfo();
    expect(Array.isArray(funding)).toBe(true);
    expect(funding.length).toBeGreaterThan(0);
  });
});
