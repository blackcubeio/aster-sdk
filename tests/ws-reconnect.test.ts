import { beforeAll, describe, expect, it } from 'vitest';
import { type AsterClient, type WebSocketLike, init } from '../src/common/config';
import { type Hex, KlineInterval } from '../src/common/types';
import { FuturesWsClient } from '../src/ws/futures-client';

/**
 * Robustesse WS (spec commune 4 SDK) — **futures mainnet réel, public, lecture seule**.
 *
 * On injecte un `WebSocketFactory` qui crée de vraies sockets vers le `fstream` mainnet mais en
 * garde la trace : le test peut alors **fermer brutalement** la socket vivante (`socket.close()`)
 * pour simuler une coupure, et **observer** que le client :
 *   1) recrée une nouvelle socket (reconnexion effective via le backoff) ;
 *   2) rejoue l'abonnement (re-subscribe) → les bougies **reprennent** sur la nouvelle socket.
 *
 * Aucun mock réseau (vraie connexion mainnet), aucune écriture, aucune création de ressource.
 */
describe('FuturesWsClient — reconnect + re-subscribe (futures mainnet réel, public)', () => {
  let client: AsterClient;

  beforeAll(() => {
    client = init({
      signers: {
        mn: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'mainnet',
        },
      },
    });
  });

  it('rétablit le flux de bougies après une coupure de socket', async () => {
    const sockets: WebSocketLike[] = [];
    const realFactory = client.webSocket;
    // Vraie socket mainnet, simplement tracée pour pouvoir la fermer depuis le test.
    const trackingClient: AsterClient = {
      ...client,
      webSocket: (url: string) => {
        const socket = realFactory(url);
        sockets.push(socket);
        return socket;
      },
    };

    const ws = new FuturesWsClient(trackingClient, {});
    let candlesBeforeCut = 0;
    let candlesAfterCut = 0;
    let cut = false;

    ws.subscribeKline('BTCUSDT', KlineInterval.OneMinute, () => {
      if (cut === false) {
        candlesBeforeCut += 1;
      } else {
        candlesAfterCut += 1;
      }
    });
    await ws.connect();

    // 1) On attend des bougies sur la socket initiale.
    await new Promise((resolve) => setTimeout(resolve, 8_000));
    expect(candlesBeforeCut).toBeGreaterThan(0);
    expect(sockets.length).toBe(1);

    // 2) Coupure brutale : on ferme la socket vivante → handleClose → scheduleReconnect.
    cut = true;
    sockets[0]?.close();

    // 3) On laisse le backoff (base 500 ms) reconnecter et rejouer l'abonnement.
    await new Promise((resolve) => setTimeout(resolve, 12_000));

    // Reconnexion effective : une 2ᵉ socket a été créée.
    expect(sockets.length).toBeGreaterThanOrEqual(2);
    // Re-subscribe effectif : les bougies reprennent sur la nouvelle socket.
    expect(candlesAfterCut).toBeGreaterThan(0);

    ws.disconnect();
  }, 40_000);
});
