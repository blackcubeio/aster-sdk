import { describe, expect, it } from 'vitest';
import { Aster } from '../src/dex/aster';

// Surplus spécifique Aster via le namespace `native` — lectures **publiques** sur mainnet réel.
const dex = new Aster();

describe('Aster — namespace native (mainnet réel, public)', () => {
  it('expose toutes les capacités attendues', () => {
    const caps = dex.native;
    for (const c of [
      'agents',
      'builders',
      'mmp',
      'modes',
      'account',
      'marketData',
      'subAccounts',
    ]) {
      expect(typeof (caps as Record<string, unknown>)[c]).toBe('function');
    }
    // `analytics`→`account` ; surplus ordres (placeBatch/chase/strategy…) sur perp()/spot().
    expect((caps as Record<string, unknown>).analytics).toBeUndefined();
    expect((caps as Record<string, unknown>).advancedOrders).toBeUndefined();
    expect(typeof dex.perp().placeBatch).toBe('function');
  });

  it('native.marketData().getTicker24hr() (tous les symboles)', async () => {
    const tickers = (await dex.native.marketData().getTicker24hr()) as unknown[];
    expect(Array.isArray(tickers)).toBe(true);
    expect(tickers.length).toBeGreaterThan(0);
  });

  it('native.marketData().getAggregateTrades({ symbol }) + fundingInfo()', async () => {
    const agg = await dex.native.marketData().getAggregateTrades({ symbol: 'BTCUSDT', limit: 3 });
    expect(agg.length).toBeGreaterThan(0);

    const funding = await dex.native.marketData().getFundingInfo();
    expect(Array.isArray(funding)).toBe(true);
    expect(funding.length).toBeGreaterThan(0);
  });
});
