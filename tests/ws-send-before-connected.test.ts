import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type AsterClient, type WebSocketLike, init } from '../src/common/config';
import { type Hex, KlineInterval } from '../src/common/types';
import { FuturesWsClient } from '../src/ws/futures-client';

/**
 * Régression « Sent before connected » (futures mainnet réel, public, lecture seule).
 *
 * Le batcher n'émet que sur la croyance `open` (positionnée à `onopen`/`onclose`), pas sur l'état RÉEL de la
 * socket. Si `connect()` est rappelé alors qu'une socket est déjà ouverte, `this.socket` est réassigné à une
 * NOUVELLE socket `CONNECTING` sans qu'un `onclose` (donc `setOpen(false)`) soit passé : le batcher se croit
 * ouvert et `send()` partait sur une socket non connectée → `DOMException: Sent before connected`, throw dans
 * un microtask → exception non rattrapée → crash du process (exit 1). On reproduit cet état précis et on vérifie
 * qu'AUCUNE exception ne fuit, et que le client reste fonctionnel (bougies sur la socket finalement ouverte).
 *
 * Aucun mock réseau (vraies sockets mainnet via le seam `WebSocketFactory`), aucune écriture.
 */
describe('FuturesWsClient — pas de « Sent before connected » (futures mainnet réel, public)', () => {
  let client: AsterClient;
  const leaks: unknown[] = [];
  const onUncaught = (error: unknown): void => {
    leaks.push(error);
  };

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

  afterEach(() => {
    process.off('uncaughtException', onUncaught);
    process.off('unhandledRejection', onUncaught);
  });

  it('ne throw pas quand un subscribe survient pendant que la socket courante est CONNECTING', async () => {
    process.on('uncaughtException', onUncaught);
    process.on('unhandledRejection', onUncaught);

    const sockets: WebSocketLike[] = [];
    const realFactory = client.webSocket;
    const trackingClient: AsterClient = {
      ...client,
      webSocket: (url: string) => {
        const socket = realFactory(url);
        sockets.push(socket);
        return socket;
      },
    };

    const ws = new FuturesWsClient(trackingClient, {});
    let candles = 0;
    ws.subscribeKline('BTCUSDT', KlineInterval.OneMinute, () => {
      candles += 1;
    });

    // 1) Première connexion : socket[0] OPEN, le batcher se croit (à juste titre) ouvert.
    await ws.connect();
    expect(sockets.length).toBe(1);

    // 2) On RAPPELLE connect() SANS l'attendre : socket[1] est créée et `this.socket` y pointe (CONNECTING),
    //    mais `open` reste true (aucun onclose). C'est l'état fautif.
    void ws.connect();
    expect(sockets.length).toBe(2);
    expect(sockets[1]?.readyState).toBe(0); // CONNECTING

    // 3) Un nouvel abonnement force flush → pump → rawSend sur socket[1] CONNECTING. AVANT le fix : throw.
    ws.subscribeKline('ETHUSDT', KlineInterval.OneMinute, () => {
      candles += 1;
    });

    // 4) On laisse socket[1] s'ouvrir et le flux reprendre.
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    expect(leaks).toEqual([]); // aucune exception n'a fui (le crash d'origine)
    expect(candles).toBeGreaterThan(0); // client fonctionnel

    ws.disconnect();
    // socket[0] a fuité (écrasée par le 2ᵉ connect sans close) : on la ferme pour ne pas laisser de handle ouvert.
    sockets[0]?.close();
  }, 30_000);
});
