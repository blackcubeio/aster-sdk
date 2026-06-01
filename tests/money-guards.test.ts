import { describe, expect, it } from 'vitest';
import type { Hex } from '../src/common/types';
import { Aster } from '../src/dex/aster';

/**
 * Garde-fous **argent réel** : les validations doivent rejeter **AVANT tout appel réseau**
 * (donc sans rien signer, sans rien créer, sans toucher au testnet). On vérifie uniquement les
 * chemins de throw synchrones — purement locaux, non destructifs.
 */
describe('garde-fous argent réel (validation locale, aucun réseau)', () => {
  const dex = new Aster(
    {
      mn: {
        privateKey: `0x${'11'.repeat(32)}` as Hex,
        user: `0x${'00'.repeat(20)}` as Hex,
        network: 'testnet',
      },
    },
    { default: 'mn' },
  );

  it('place(limit) sans price échoue clairement avant le réseau', () => {
    // La garde lève AVANT `placeOrder` → aucun ordre n'est jamais émis vers le testnet.
    expect(() =>
      dex.perp().place({ name: 'BTCUSDT', side: 'buy', type: 'limit', size: '0.001' }),
    ).toThrow(/`price` est requis/);
    expect(() =>
      dex.perp().place({ name: 'BTCUSDT', side: 'buy', type: 'stop', size: '0.001' }),
    ).toThrow(/`price` est requis/);
    expect(() =>
      dex.perp().place({ name: 'BTCUSDT', side: 'buy', type: 'takeProfit', size: '0.001' }),
    ).toThrow(/`price` est requis/);
  });

  it('withdraw sans chainId/asset/fee échoue clairement avant le réseau', () => {
    expect(() => dex.account().withdraw({ amount: '100' })).toThrow(/`chainId`.*requis/);
    expect(() => dex.account().withdraw({ amount: '100', chainId: '56' })).toThrow(
      /`asset`.*requis/,
    );
    expect(() => dex.account().withdraw({ amount: '100', chainId: '56', asset: 'USDT' })).toThrow(
      /`fee`.*requis/,
    );
  });
});
