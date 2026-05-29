import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import type { Hex } from '../src/common/types';
import { FuturesWsClient } from '../src/ws/futures-client';

// Flux de marché WebSocket réel sur le testnet (fstream.asterdex-testnet.com). Public :
// le label `tn` ne sert qu'à viser le testnet, aucune signature.
const TN = 'tn';

describe('futures WS (testnet réel)', () => {
  beforeAll(() => {
    init({
      signers: {
        [TN]: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'testnet',
        },
      },
    });
  });

  afterAll(() => {
    resetConfig();
  });

  it('reçoit un message bookTicker après souscription', async () => {
    const client = new FuturesWsClient({ label: TN });
    await client.connect();
    try {
      const data = await new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout bookTicker')), 15_000);
        client.subscribeBookTicker('BTCUSDT', (received) => {
          clearTimeout(timer);
          resolve(received);
        });
      });
      expect(data).toBeTruthy();
    } finally {
      client.disconnect();
    }
  }, 20_000);
});
